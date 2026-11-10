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
  studio.register(manifest("studio-audio-store", "asset:take-one"));
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
