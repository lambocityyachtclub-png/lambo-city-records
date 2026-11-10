import test from "node:test";
import assert from "node:assert/strict";
import { createContentPackHostLoader } from "../content/contentPackHostAdapters.js";

function request(kind, locator) {
  return {
    pack: { id: "lc.adapter.test", version: "1.0.0" },
    asset: { id: "adapter-asset", category: kind === "world-recipe" ? "recipe" : "audio" },
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

test("remote URL and generic host assets require explicit host resolvers", async () => {
  const loader = createContentPackHostLoader();
  await assert.rejects(loader(request("url", "https://assets.example.invalid/a.wav")), /Trusted URL asset resolver/);
  await assert.rejects(loader(request("host", "builtin:asset")), /Host asset resolver/);
});
