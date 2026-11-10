import test from "node:test";
import assert from "node:assert/strict";
import { createContentPackHostLoader } from "../content/contentPackHostAdapters.js";
import { createVerifiedRemoteContentLoader } from "../content/verifiedRemoteContentLoader.js";

function request(kind, locator) {
  return {
    pack: { id: "lc.adapter.test", version: "1.0.0" },
    asset: {
      id: "adapter-asset",
      category: kind === "world-recipe" ? "recipe" : "audio",
      ...(kind === "url" ? { integrity: { algorithm: "sha256", digest: "a".repeat(64) } } : {})
    },
    source: { kind, locator, license: "owner-provided" }
  };
}

test("Studio adapter retrieves an existing audio record without opening a new database", async () => {
  const blob = new Blob(["audio"], { type: "audio/wav" });
  const loader = createContentPackHostLoader({
    studioAudioAssetStore: {
      async get(id) { return { id, blob, projectId: "project-1", trackName: "beat" }; }
    }
  });
  const record = await loader(request("studio-audio-store", "asset:take-001"));
  assert.equal(record.id, "take-001");
  assert.equal(record.blob, blob);
});

test("Studio adapter rejects missing and malformed audio records", async () => {
  const loader = createContentPackHostLoader({ studioAudioAssetStore: { async get() { return null; } } });
  await assert.rejects(loader(request("studio-audio-store", "asset:missing")), /not found/);
  await assert.rejects(loader(request("studio-audio-store", "take-without-prefix")), /must use asset:/);
});

test("World adapter resolves a recipe and requires schema validation before returning it", async () => {
  const recipe = { id: "district-test", type: "test-district" };
  let validated = 0;
  const loader = createContentPackHostLoader({
    resolveWorldRecipe: async id => id === recipe.id ? recipe : null,
    validateDistrict: value => { validated += 1; return { valid: value === recipe }; }
  });
  assert.equal(await loader(request("world-recipe", "recipe:district-test")), recipe);
  assert.equal(validated, 1);
});

test("World adapter refuses invalid recipes and incomplete configuration", async () => {
  const loader = createContentPackHostLoader({
    resolveWorldRecipe: async () => ({ id: "bad" }),
    validateDistrict: () => ({ valid: false })
  });
  await assert.rejects(loader(request("world-recipe", "recipe:bad")), /failed district validation/);
  const incomplete = createContentPackHostLoader({ resolveWorldRecipe: async () => ({}) });
  await assert.rejects(incomplete(request("world-recipe", "recipe:bad")), /must both be configured/);
});

test("remote URL assets require allowlisted HTTPS and successful integrity verification", async () => {
  let verified = 0;
  const loader = createContentPackHostLoader({
    allowedUrlOrigins: ["https://assets.example.invalid"],
    resolveUrlAsset: async ({ url }) => ({ url, bytes: new Uint8Array([1, 2, 3]) }),
    verifyUrlIntegrity: async ({ integrity, value }) => {
      verified += 1;
      return integrity.algorithm === "sha256" && value.bytes.length === 3;
    }
  });
  const result = await loader(request("url", "https://assets.example.invalid/a.wav"));
  assert.equal(result.url, "https://assets.example.invalid/a.wav");
  assert.equal(verified, 1);
  await assert.rejects(loader(request("url", "http://assets.example.invalid/a.wav")), /not allowlisted for HTTPS/);
  await assert.rejects(loader(request("url", "https://untrusted.example.invalid/a.wav")), /not allowlisted for HTTPS/);
  await assert.rejects(loader(request("url", "https://user:secret@assets.example.invalid/a.wav")), /must not contain embedded credentials/);
});

test("remote URL assets fail closed when integrity verification fails or is not configured", async () => {
  const options = {
    allowedUrlOrigins: ["https://assets.example.invalid"],
    resolveUrlAsset: async () => ({ bytes: new Uint8Array([1]) }),
    verifyUrlIntegrity: async () => false
  };
  const loader = createContentPackHostLoader(options);
  await assert.rejects(loader(request("url", "https://assets.example.invalid/a.wav")), /failed SHA-256 integrity verification/);
  assert.throws(() => createContentPackHostLoader({
    allowedUrlOrigins: ["https://assets.example.invalid"],
    resolveUrlAsset: async () => ({})
  }), /requires a SHA-256 integrity verifier/);
});

test("generic host assets require an explicit host resolver", async () => {
  const loader = createContentPackHostLoader();
  await assert.rejects(loader(request("host", "builtin:asset")), /Host asset resolver/);
});


test("composes verified remote delivery and persistent cache behind the catalog host adapter", async () => {
  const digest = "a".repeat(64);
  const records = new Map();
  let downloads = 0;
  const verifiedLoader = createVerifiedRemoteContentLoader({
    allowedOrigins: ["https://assets.example.invalid"],
    resolve: async () => { downloads += 1; return new Uint8Array([2, 4, 6]); },
    sha256: async bytes => bytes.length === 3 ? digest : "b".repeat(64),
    cache: {
      async get(key) { return records.get(key); },
      async set(key, value) { records.set(key, value); },
      async delete(key) { records.delete(key); }
    }
  });
  const hostLoader = createContentPackHostLoader({
    allowedUrlOrigins: ["https://assets.example.invalid"],
    resolveUrlAsset: verifiedLoader,
    verifyUrlIntegrity: async ({ integrity, value }) =>
      integrity.digest === digest && value instanceof Uint8Array && value.length === 3
  });
  const first = await hostLoader(request("url", "https://assets.example.invalid/asset.bin"));
  const second = await hostLoader(request("url", "https://assets.example.invalid/asset.bin"));
  assert.deepEqual(first, new Uint8Array([2, 4, 6]));
  assert.deepEqual(second, first);
  assert.equal(downloads, 1);
  assert.equal(records.size, 1);
});
