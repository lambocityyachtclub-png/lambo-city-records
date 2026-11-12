import test from "node:test";
import assert from "node:assert/strict";
import { createIndexedDbContentCache } from "../content/indexedDbContentCache.js";

function fakeIndexedDB(options = {}) {
  const records = new Map();
  let opens = 0;
  let transactions = 0;
  let closed = false;
  const db = {
    objectStoreNames: { contains: name => name === "assets" },
    createObjectStore() {},
    close() { closed = true; },
    transaction(_name, mode) {
      transactions += 1;
      const tx = { error: null };
      tx.objectStore = () => ({
        get(key) {
          const req = {};
          queueMicrotask(() => { req.result = records.get(key) || null; req.onsuccess?.(); tx.oncomplete?.(); });
          return req;
        },
        put(record) {
          const req = {};
          queueMicrotask(() => {
            if (options.quota) {
              const error = new Error("Storage full");
              error.name = "QuotaExceededError";
              req.error = error; req.onerror?.(); tx.error = error; tx.onabort?.(); return;
            }
            records.set(record.key, { ...record, bytes: record.bytes.slice(0) });
            req.result = record.key; req.onsuccess?.(); tx.oncomplete?.();
          });
          return req;
        },
        delete(key) {
          const req = {};
          queueMicrotask(() => { records.delete(key); req.onsuccess?.(); tx.oncomplete?.(); });
          return req;
        }
      });
      return tx;
    }
  };
  return {
    records,
    stats: () => ({ opens, transactions, closed }),
    open() {
      opens += 1;
      const req = {};
      queueMicrotask(() => {
        req.result = db;
        req.onupgradeneeded?.();
        req.onsuccess?.();
      });
      return req;
    }
  };
}

test("opens IndexedDB lazily and round-trips copied binary records", async () => {
  const idb = fakeIndexedDB();
  const cache = createIndexedDbContentCache({ indexedDB: idb, databaseName: "test-cache" });
  assert.equal(idb.stats().opens, 0);
  const bytes = new Uint8Array([1, 3, 5]);
  await cache.set("asset-a", bytes);
  bytes[0] = 99;
  const read = await cache.get("asset-a");
  assert.deepEqual(read, new Uint8Array([1, 3, 5]));
  assert.equal(idb.stats().opens, 1);
  assert.equal(idb.stats().transactions, 2);
});

test("returns cache misses and deletes invalid stored values", async () => {
  const idb = fakeIndexedDB();
  const cache = createIndexedDbContentCache({ indexedDB: idb });
  assert.equal(await cache.get("missing"), null);
  idb.records.set("bad", { key: "bad", bytes: "not-binary" });
  assert.equal(await cache.get("bad"), null);
  assert.equal(idb.records.has("bad"), false);
});

test("rejects oversized entries and reports quota errors clearly", async () => {
  const events = [];
  const tooSmall = createIndexedDbContentCache({
    indexedDB: fakeIndexedDB(), maxEntryBytes: 2,
    onError: event => events.push(event)
  });
  await assert.rejects(tooSmall.set("big", new Uint8Array([1, 2, 3])), /entry limit/);

  const quota = createIndexedDbContentCache({
    indexedDB: fakeIndexedDB({ quota: true }),
    onError: event => events.push(event)
  });
  await assert.rejects(quota.set("full", new Uint8Array([1])), error =>
    error.name === "QuotaExceededError" && error.code === "CONTENT_CACHE_QUOTA"
  );
  assert.ok(events.some(event => event.quotaExceeded));
});

test("closes the database and refuses later operations", async () => {
  const idb = fakeIndexedDB();
  const cache = createIndexedDbContentCache({ indexedDB: idb });
  await cache.get("first");
  await cache.close();
  assert.equal(idb.stats().closed, true);
  await assert.rejects(cache.get("after-close"), /closed/);
});

test("requires an injected IndexedDB factory and valid configuration", () => {
  assert.throws(() => createIndexedDbContentCache(), /requires an IndexedDB factory/);
  assert.throws(() => createIndexedDbContentCache({ indexedDB: fakeIndexedDB(), maxEntryBytes: -1 }), /non-negative/);
});
