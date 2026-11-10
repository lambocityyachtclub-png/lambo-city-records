import test from "node:test";
import assert from "node:assert/strict";
import { createContentPackRuntime } from "../content/contentPackRuntime.js";

const digest = "a".repeat(64);
function manifest(kind, locator, assetOverrides = {}) {
  return {
    id: "lc.runtime.integration",
    version: "1.0.0",
    category: kind === "world-recipe" ? "recipe" : "audio",
    source: { license: "owner-provided" },
    assets: [{
      id: "runtime-asset",
      category: kind === "world-recipe" ? "recipe" : "audio",
      sizeBytes: 3,
      source: { kind, locator, license: "owner-provided" },
      ...(kind === "url" ? { integrity: { algorithm: "sha256", digest } } : {}),
      ...assetOverrides
    }]
  };
}

test("composition root builds metadata services without eager storage or network activity", () => {
  let opened = 0;
  const runtime = createContentPackRuntime({
    appVersion: "1.0.0",
    studioAudioAssetStore: { async get() { opened += 1; return null; } },
    resolveRemote: async () => { opened += 1; return new Uint8Array([1, 2, 3]); },
    sha256: async () => digest,
    allowedUrlOrigins: ["https://cdn.example.test"],
    remoteCache: {
      async get() { return null; },
      async set() {},
      async delete() {}
    }
  });
  assert.equal(opened, 0);
  assert.deepEqual(runtime.getServiceStatus(), {
    studioAudioStore: true,
    worldRecipeResolver: false,
    remoteDelivery: true,
    persistentRemoteCache: true,
    genericHostResolver: false
  });
});

test("composes catalog, remote resolver, SHA-256 verification, and persistent cache", async () => {
  const records = new Map();
  let downloads = 0;
  const runtime = createContentPackRuntime({
    allowedUrlOrigins: ["https://cdn.example.test"],
    resolveRemote: async () => { downloads += 1; return new Uint8Array([1, 2, 3]); },
    sha256: async bytes => bytes.length === 3 ? digest : "b".repeat(64),
    remoteCache: {
      async get(key) { return records.get(key); },
      async set(key, value) { records.set(key, value); },
      async delete(key) { records.delete(key); }
    }
  });
  runtime.register(manifest("url", "https://cdn.example.test/audio.bin"));
  assert.deepEqual(await runtime.loadAsset("lc.runtime.integration", "runtime-asset"), new Uint8Array([1, 2, 3]));
  assert.deepEqual(await runtime.loadAsset("lc.runtime.integration", "runtime-asset"), new Uint8Array([1, 2, 3]));
  assert.equal(downloads, 1);
  assert.equal(records.size, 1);
});

test("composes Studio and World adapters through one catalog runtime", async () => {
  const blob = new Blob(["studio"], { type: "audio/wav" });
  const recipe = { id: "district-one" };
  const studio = createContentPackRuntime({
    studioAudioAssetStore: { async get(id) { return { id, blob }; } }
  });
  studio.register(manifest("studio-audio-store", "asset:take-one", { sizeBytes: blob.size }));
  assert.equal((await studio.loadAsset("lc.runtime.integration", "runtime-asset")).blob, blob);

  const world = createContentPackRuntime({
    resolveWorldRecipe: async id => id === recipe.id ? recipe : null,
    validateDistrict: value => ({ valid: value === recipe })
  });
  world.register(manifest("world-recipe", "recipe:district-one"));
  assert.equal(await world.loadAsset("lc.runtime.integration", "runtime-asset"), recipe);
});

test("fails closed when remote delivery is only partially configured", () => {
  assert.throws(() => createContentPackRuntime({
    allowedUrlOrigins: ["https://cdn.example.test"],
    resolveRemote: async () => new Uint8Array([1])
  }), /requires both resolveRemote and sha256/);
});


function runtimeFakeIndexedDB() {
  const records = new Map();
  let opens = 0;
  let closes = 0;
  const db = {
    objectStoreNames: { contains: () => true },
    close() { closes += 1; },
    transaction() {
      const tx = {};
      tx.objectStore = () => ({
        get(key) {
          const req = {};
          queueMicrotask(() => { req.result = records.get(key) || null; req.onsuccess?.(); tx.oncomplete?.(); });
          return req;
        },
        put(record) {
          const req = {};
          queueMicrotask(() => { records.set(record.key, { ...record, bytes: record.bytes.slice(0) }); req.onsuccess?.(); tx.oncomplete?.(); });
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
    get opens() { return opens; },
    get closes() { return closes; },
    open() {
      opens += 1;
      const req = {};
      queueMicrotask(() => { req.result = db; req.onupgradeneeded?.(); req.onsuccess?.(); });
      return req;
    }
  };
}

test("composes opt-in IndexedDB persistence lazily through the shared content runtime", async () => {
  const indexedDB = runtimeFakeIndexedDB();
  let downloads = 0;
  const runtime = createContentPackRuntime({
    allowedUrlOrigins: ["https://cdn.example.test"],
    resolveRemote: async () => { downloads += 1; return new Uint8Array([3, 2, 1]); },
    sha256: async bytes => bytes.length === 3 ? digest : "b".repeat(64),
    indexedDBCache: { indexedDB, databaseName: "lc-test-cache" }
  });
  assert.equal(indexedDB.opens, 0);
  runtime.register(manifest("url", "https://cdn.example.test/audio.bin"));
  assert.deepEqual(await runtime.loadAsset("lc.runtime.integration", "runtime-asset"), new Uint8Array([3, 2, 1]));
  assert.equal(indexedDB.opens, 1);
  assert.deepEqual(await runtime.loadAsset("lc.runtime.integration", "runtime-asset"), new Uint8Array([3, 2, 1]));
  assert.equal(downloads, 1);
  assert.equal(indexedDB.records.size, 1);
  await runtime.dispose();
  await runtime.close();
  assert.equal(indexedDB.closes, 1);
  assert.throws(
    () => runtime.loadAsset("lc.runtime.integration", "runtime-asset"),
    /has been disposed/
  );
});


test("one opt-in runtime serves existing Studio audio and validated World recipes together", async () => {
  const blob = new Blob(["shared-studio-take"], { type: "audio/wav" });
  const recipe = { id: "district-shoreline", revision: 3 };
  const runtime = createContentPackRuntime({
    studioAudioAssetStore: {
      async get(id) {
        return id === "take-shared-01"
          ? { id, projectId: "project-01", trackName: "vocal", blob }
          : null;
      }
    },
    resolveWorldRecipe: async id => id === recipe.id ? recipe : null,
    validateDistrict: value => ({
      valid: value === recipe && value.revision === 3
    })
  });

  const studioPack = manifest("studio-audio-store", "asset:take-shared-01");
  studioPack.id = "lc.studio.shared-audio";
  studioPack.assets[0].id = "studio-take-01";
  studioPack.assets[0].sizeBytes = blob.size;

  const worldPack = manifest("world-recipe", "recipe:district-shoreline");
  worldPack.id = "lc.world.shoreline";
  worldPack.assets[0].id = "shoreline-recipe";

  runtime.register(studioPack);
  runtime.register(worldPack);

  assert.deepEqual(runtime.getServiceStatus(), {
    studioAudioStore: true,
    worldRecipeResolver: true,
    remoteDelivery: false,
    persistentRemoteCache: false,
    genericHostResolver: false
  });

  const loadedTake = await runtime.loadAsset("lc.studio.shared-audio", "studio-take-01");
  const loadedRecipe = await runtime.loadAsset("lc.world.shoreline", "shoreline-recipe");

  assert.equal(loadedTake.id, "take-shared-01");
  assert.equal(loadedTake.blob, blob);
  assert.equal(loadedRecipe, recipe);
});


test("disposal rejects in-flight asset results and guards the public catalog view", async () => {
  let resolveHostAsset;
  const runtime = createContentPackRuntime({
    resolveHostAsset: () => new Promise(resolve => { resolveHostAsset = resolve; })
  });
  runtime.register(manifest("host", "builtin:pending"));
  const pending = runtime.loadAsset("lc.runtime.integration", "runtime-asset");

  assert.equal(typeof resolveHostAsset, "function");
  await runtime.dispose();
  resolveHostAsset({ id: "late-host-asset" });

  await assert.rejects(
    pending,
    /disposed while an asset was loading/
  );
  assert.equal(runtime.getSnapshot().cachedAssetCount, 0);
  assert.throws(
    () => runtime.catalog.loadAsset("lc.runtime.integration", "runtime-asset"),
    /has been disposed/
  );
  assert.throws(
    () => runtime.catalog.register(manifest("host", "builtin:late")),
    /has been disposed/
  );
});
