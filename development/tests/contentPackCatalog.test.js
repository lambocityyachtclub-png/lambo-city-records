import test from "node:test";
import assert from "node:assert/strict";
import { createContentPackCatalog, validateContentPackManifest } from "../content/contentPackCatalog.js";

function pack(overrides = {}) {
  return {
    id: "lc.core.audio",
    version: "1.2.0",
    category: "audio",
    source: { publisher: "LAMBO CITY Records", license: "owner-provided" },
    compatibility: { minAppVersion: "1.0.0", maxAppVersion: "3.0.0" },
    performanceBudget: { maxAssetBytes: 1000000, maxTotalBytes: 2000000 },
    assets: [{
      id: "kick-01",
      category: "audio",
      sizeBytes: 2048,
      loadStrategy: "on-demand",
      source: { kind: "studio-audio-store", locator: "asset:kick-01", license: "owner-provided" }
    }],
    ...overrides
  };
}

test("validates and normalizes a versioned content pack", () => {
  const result = validateContentPackManifest(pack());
  assert.equal(result.id, "lc.core.audio");
  assert.equal(result.assets[0].cacheKey, "lc.core.audio:kick-01");
  assert.equal(result.assets[0].source.kind, "studio-audio-store");
  assert.ok(Object.isFrozen(result.assets));
});

test("rejects invalid categories, duplicate assets, missing licensing, and budget overflow", () => {
  assert.throws(() => validateContentPackManifest(pack({ category: "unknown" })), /unsupported pack category/);
  assert.throws(() => validateContentPackManifest(pack({ assets: [
    pack().assets[0], pack().assets[0]
  ] })), /unique within a pack/);
  assert.throws(() => validateContentPackManifest(pack({ source: { publisher: "x" } })), /pack source license/);
  assert.throws(() => validateContentPackManifest(pack({ performanceBudget: { maxTotalBytes: 100 } })), /maxTotalBytes/);
});

test("requires valid SHA-256 integrity metadata for remote URL assets", () => {
  const remote = pack({ assets: [{
    id: "remote-audio", category: "audio", sizeBytes: 128,
    source: { kind: "url", locator: "https://cdn.example.invalid/audio.wav", license: "licensed" }
  }] });
  assert.throws(() => validateContentPackManifest(remote), /must declare SHA-256 integrity/);
  remote.assets[0].integrity = { algorithm: "sha256", digest: "not-a-hash" };
  assert.throws(() => validateContentPackManifest(remote), /integrity must contain a SHA-256 hex digest/);
});

test("enforces application compatibility at registration", () => {
  const catalog = createContentPackCatalog({ appVersion: "1.5.0" });
  catalog.register(pack());
  assert.throws(() => catalog.register(pack({ id: "lc.future", compatibility: { minAppVersion: "2.0.0" } })), /requires app version/);
});

test("resolves dependency order and validates semantic version ranges", () => {
  const catalog = createContentPackCatalog();
  catalog.register(pack({ id: "lc.base", dependencies: [] }));
  catalog.register(pack({ id: "lc.instruments", dependencies: [{ id: "lc.base", versionRange: "^1.2.0" }] }));
  assert.deepEqual(catalog.resolvePackOrder("lc.instruments"), ["lc.base", "lc.instruments"]);
});

test("rejects missing, incompatible, and cyclic pack dependencies", () => {
  const missing = createContentPackCatalog();
  missing.register(pack({ id: "lc.child", dependencies: [{ id: "lc.missing" }] }));
  assert.throws(() => missing.resolvePackOrder("lc.child"), /missing dependency/);

  const incompatible = createContentPackCatalog();
  incompatible.register(pack({ id: "lc.base", version: "2.0.0" }));
  incompatible.register(pack({ id: "lc.child", dependencies: [{ id: "lc.base", versionRange: "^1.0.0" }] }));
  assert.throws(() => incompatible.resolvePackOrder("lc.child"), /requires lc.base/);

  const cyclic = createContentPackCatalog();
  cyclic.register(pack({ id: "lc.a", dependencies: [{ id: "lc.b" }] }));
  cyclic.register(pack({ id: "lc.b", dependencies: [{ id: "lc.a" }] }));
  assert.throws(() => cyclic.resolvePackOrder("lc.a"), /dependency cycle/);
});

test("does not load assets until explicitly requested and caches successful results", async () => {
  let calls = 0;
  const catalog = createContentPackCatalog({
    loader: async ({ asset }) => { calls += 1; return { id: asset.id, audio: true }; }
  });
  catalog.register(pack());
  assert.equal(calls, 0);
  const first = await catalog.loadAsset("lc.core.audio", "kick-01");
  const second = await catalog.loadAsset("lc.core.audio", "kick-01");
  assert.equal(first, second);
  assert.equal(calls, 1);
  assert.equal(catalog.getSnapshot().cachedAssetCount, 1);
});

test("deduplicates concurrent loads and retries after a failed load", async () => {
  let calls = 0;
  let shouldFail = true;
  const catalog = createContentPackCatalog({
    loader: async () => {
      calls += 1;
      if (shouldFail) throw new Error("temporary host failure");
      return { ok: true };
    }
  });
  catalog.register(pack());
  const results = await Promise.allSettled([
    catalog.loadAsset("lc.core.audio", "kick-01"),
    catalog.loadAsset("lc.core.audio", "kick-01")
  ]);
  assert.equal(results.filter(item => item.status === "rejected").length, 2);
  assert.equal(calls, 1);
  shouldFail = false;
  assert.deepEqual(await catalog.loadAsset("lc.core.audio", "kick-01"), { ok: true });
  assert.equal(calls, 2);
});

test("loads a declared fallback asset when the primary host load fails", async () => {
  const catalog = createContentPackCatalog({
    loader: async ({ asset }) => {
      if (asset.id === "primary") throw new Error("missing remote asset");
      return { id: asset.id };
    }
  });
  catalog.register(pack({ id: "lc.fallback", assets: [{
    id: "backup", category: "audio", sizeBytes: 20,
    source: { kind: "host", locator: "builtin:backup", license: "owner-provided" }
  }] }));
  catalog.register(pack({ id: "lc.primary", assets: [{
    id: "primary", category: "audio", sizeBytes: 20,
    source: { kind: "url", locator: "https://assets.example.invalid/primary.wav", license: "owner-provided" },
    integrity: { algorithm: "sha256", digest: "a".repeat(64) },
    fallback: { packId: "lc.fallback", assetId: "backup" }
  }] }));
  assert.deepEqual(await catalog.loadAsset("lc.primary", "primary"), { id: "backup" });
});

test("requires an injected loader for loading but still supports metadata discovery", async () => {
  const catalog = createContentPackCatalog();
  catalog.register(pack());
  assert.equal(catalog.listPacks().length, 1);
  await assert.rejects(catalog.loadAsset("lc.core.audio", "kick-01"), /no host loader/);
});


test("rejects duplicate cache keys within and across content packs", () => {
  const catalog = createContentPackCatalog();
  catalog.register(pack({
    id: "lc.cache.owner",
    assets: [{
      id: "asset-one",
      category: "audio",
      sizeBytes: 10,
      cacheKey: "shared-audio-key",
      source: { kind: "host", locator: "builtin:one", license: "owner-provided" }
    }]
  }));

  assert.throws(() => catalog.register(pack({
    id: "lc.cache.collision",
    assets: [{
      id: "asset-two",
      category: "audio",
      sizeBytes: 10,
      cacheKey: "shared-audio-key",
      source: { kind: "host", locator: "builtin:two", license: "owner-provided" }
    }]
  })), /cacheKey shared-audio-key is already assigned/);

  assert.throws(() => catalog.register(pack({
    id: "lc.cache.internal-collision",
    assets: [
      {
        id: "asset-a",
        category: "audio",
        sizeBytes: 10,
        cacheKey: "same-key",
        source: { kind: "host", locator: "builtin:a", license: "owner-provided" }
      },
      {
        id: "asset-b",
        category: "audio",
        sizeBytes: 10,
        cacheKey: "same-key",
        source: { kind: "host", locator: "builtin:b", license: "owner-provided" }
      }
    ]
  })), /duplicate cacheKey same-key within pack/);
});


test("enforces declared byte budgets against loaded buffers and Studio blobs", async () => {
  const catalog = createContentPackCatalog({
    loader: async ({ asset }) => asset.id === "buffered"
      ? new Uint8Array([1, 2, 3])
      : asset.id === "studio-blob"
        ? { id: asset.id, blob: { size: 3, async arrayBuffer() { return new ArrayBuffer(3); } } }
        : { id: asset.id, recipeData: "this JSON payload is larger than its declared budget" }
  });
  catalog.register(pack({
    id: "lc.actual-size",
    performanceBudget: { maxAssetBytes: 2, maxTotalBytes: 6 },
    assets: [
      {
        id: "buffered",
        category: "audio",
        sizeBytes: 2,
        source: { kind: "host", locator: "builtin:buffered", license: "owner-provided" }
      },
      {
        id: "studio-blob",
        category: "audio",
        sizeBytes: 2,
        source: { kind: "studio-audio-store", locator: "asset:studio-blob", license: "owner-provided" }
      },
      {
        id: "json-recipe",
        category: "recipe",
        sizeBytes: 2,
        source: { kind: "host", locator: "builtin:json-recipe", license: "owner-provided" }
      }
    ]
  }));

  await assert.rejects(
    catalog.loadAsset("lc.actual-size", "buffered"),
    /loaded 3 bytes, exceeding its declared sizeBytes budget of 2/
  );
  await assert.rejects(
    catalog.loadAsset("lc.actual-size", "studio-blob"),
    /loaded 3 bytes, exceeding its declared sizeBytes budget of 2/
  );
  await assert.rejects(
    catalog.loadAsset("lc.actual-size", "json-recipe"),
    /exceeding its declared sizeBytes budget of 2/
  );
  assert.equal(catalog.getSnapshot().cachedAssetCount, 0);
});


test("does not trust a custom file-like object's reported size", async () => {
  const catalog = createContentPackCatalog({
    loader: async () => ({
      size: 1,
      async arrayBuffer() { return new ArrayBuffer(1024); }
    })
  });
  catalog.register(pack({
    id: "lc.untrusted-file-size",
    assets: [{
      id: "fake-file",
      category: "audio",
      sizeBytes: 8,
      source: { kind: "host", locator: "builtin:fake-file", license: "owner-provided" }
    }]
  }));

  await assert.rejects(
    catalog.loadAsset("lc.untrusted-file-size", "fake-file"),
    /Custom file-like host assets must expose an explicit measured sizeBytes value/
  );
  assert.equal(catalog.getSnapshot().cachedAssetCount, 0);
});
