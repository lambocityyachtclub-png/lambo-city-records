import test from "node:test";
import assert from "node:assert/strict";
import { createVerifiedRemoteContentLoader } from "../content/verifiedRemoteContentLoader.js";

const digest = "a".repeat(64);
function request(overrides = {}) {
  return {
    pack: { id: "lc.remote.test", version: "1.0.0" },
    asset: {
      id: "sample",
      cacheKey: "lc.remote.test:sample",
      integrity: { algorithm: "sha256", digest },
      ...overrides.asset
    },
    source: { kind: "url", locator: "https://cdn.example.test/sample.bin", ...overrides.source }
  };
}

test("resolves HTTPS from an allowlisted origin and verifies bytes before returning", async () => {
  const bytes = new Uint8Array([1, 2, 3]);
  let resolved = 0;
  const loader = createVerifiedRemoteContentLoader({
    allowedOrigins: ["https://cdn.example.test"],
    resolve: async () => { resolved += 1; return bytes; },
    sha256: async value => value.length === 3 ? digest : "b".repeat(64)
  });
  assert.deepEqual(await loader(request()), bytes);
  assert.equal(resolved, 1);
});

test("rejects untrusted origins, non-HTTPS URLs, and missing integrity", async () => {
  const loader = createVerifiedRemoteContentLoader({
    allowedOrigins: ["https://cdn.example.test"],
    resolve: async () => new Uint8Array([1]),
    sha256: async () => digest
  });
  await assert.rejects(loader(request({ source: { locator: "http://cdn.example.test/a" } })), /not allowlisted for HTTPS/);
  await assert.rejects(loader(request({ source: { locator: "https://evil.example.test/a" } })), /not allowlisted for HTTPS/);
  await assert.rejects(loader(request({ asset: { integrity: null } })), /requires a valid SHA-256/);
});

test("rejects tampered content and oversized payloads before caching", async () => {
  let cached = 0;
  const cache = { async get() { return null; }, async set() { cached += 1; }, async delete() {} };
  const tampered = createVerifiedRemoteContentLoader({
    allowedOrigins: ["https://cdn.example.test"],
    resolve: async () => new Uint8Array([9]),
    sha256: async () => "b".repeat(64),
    cache
  });
  await assert.rejects(tampered(request()), /failed SHA-256/);
  const oversized = createVerifiedRemoteContentLoader({
    allowedOrigins: ["https://cdn.example.test"],
    resolve: async () => new Uint8Array([1, 2, 3]),
    sha256: async () => digest,
    maxAssetBytes: 2,
    cache
  });
  await assert.rejects(oversized(request()), /maximum asset size/);
  assert.equal(cached, 0);
});

test("persists verified bytes and serves subsequent requests from cache", async () => {
  const records = new Map();
  let downloads = 0;
  const cache = {
    async get(key) { return records.get(key); },
    async set(key, value) { records.set(key, value); },
    async delete(key) { records.delete(key); }
  };
  const loader = createVerifiedRemoteContentLoader({
    allowedOrigins: ["https://cdn.example.test"],
    resolve: async () => { downloads += 1; return new Uint8Array([4, 5, 6]); },
    sha256: async () => digest,
    cache
  });
  const first = await loader(request());
  const second = await loader(request());
  assert.deepEqual(first, second);
  assert.equal(downloads, 1);
  assert.equal(records.size, 1);
});

test("evicts corrupt persistent cache entries before downloading verified replacement", async () => {
  const records = new Map([["lc.remote.test:sample:sha256:" + digest, new Uint8Array([0])]]);
  let downloads = 0;
  const cache = {
    async get(key) { return records.get(key); },
    async set(key, value) { records.set(key, value); },
    async delete(key) { records.delete(key); }
  };
  const loader = createVerifiedRemoteContentLoader({
    allowedOrigins: ["https://cdn.example.test"],
    resolve: async () => { downloads += 1; return new Uint8Array([7, 8]); },
    sha256: async value => value.length === 2 ? digest : "c".repeat(64),
    cache
  });
  assert.deepEqual(await loader(request()), new Uint8Array([7, 8]));
  assert.equal(downloads, 1);
  assert.deepEqual(records.get("lc.remote.test:sample:sha256:" + digest), new Uint8Array([7, 8]));
});

test("requires explicit host services and accepts only remote catalog requests", async () => {
  assert.throws(() => createVerifiedRemoteContentLoader(), /requires resolve/);
  const loader = createVerifiedRemoteContentLoader({
    allowedOrigins: ["https://cdn.example.test"],
    resolve: async () => new Uint8Array([1]),
    sha256: async () => digest
  });
  await assert.rejects(loader({ source: { kind: "host" }, asset: {} }), /only accepts catalog URL assets/);
});


test("uses verified bytes even when persistent cache writes fail from quota", async () => {
  const events = [];
  const loader = createVerifiedRemoteContentLoader({
    allowedOrigins: ["https://cdn.example.test"],
    resolve: async () => new Uint8Array([1, 2, 3]),
    sha256: async () => digest,
    cache: {
      async get() { return null; },
      async set() { const error = new Error("full"); error.name = "QuotaExceededError"; throw error; },
      async delete() {}
    },
    onCacheError: event => events.push(event)
  });
  assert.deepEqual(await loader(request()), new Uint8Array([1, 2, 3]));
  assert.equal(events.length, 1);
  assert.equal(events[0].operation, "set");
  assert.equal(events[0].quotaExceeded, true);
});

test("continues to remote resolution when cache reads fail", async () => {
  let downloads = 0;
  const loader = createVerifiedRemoteContentLoader({
    allowedOrigins: ["https://cdn.example.test"],
    resolve: async () => { downloads += 1; return new Uint8Array([8, 8]); },
    sha256: async bytes => bytes.length === 2 ? digest : "b".repeat(64),
    cache: {
      async get() { throw new Error("database unavailable"); },
      async set() { throw new Error("still unavailable"); },
      async delete() {}
    }
  });
  assert.deepEqual(await loader(request()), new Uint8Array([8, 8]));
  assert.equal(downloads, 1);
});
