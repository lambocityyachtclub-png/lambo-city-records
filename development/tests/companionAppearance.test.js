import test from "node:test";
import assert from "node:assert/strict";
import { resolveCompanionMaterials } from "../../alive/identity/companionAppearance.js";

test("Companion appearance maps saved skin, outfit, and accent to safe material colors", () => {
  const result = resolveCompanionMaterials({
    appearanceProfile: { skinTone: "deep", outfit: "creative", accentColor: "violet" }
  });
  assert.deepEqual(result, { skinTone: 0x5a3528, outfit: 0x253b55, accent: 0x9565c9 });
});

test("missing or unknown appearance values use stable defaults", () => {
  assert.deepEqual(resolveCompanionMaterials({}), {
    skinTone: 0xb87952,
    outfit: 0x1b1b1f,
    accent: 0xffd700
  });
  assert.equal(resolveCompanionMaterials(null), null);
});

test("appearance resolver does not mutate the saved Companion profile", () => {
  const companion = Object.freeze({
    displayName: "Nova",
    appearanceProfile: Object.freeze({ skinTone: "light", outfit: "minimal", accentColor: "silver" })
  });
  const before = JSON.stringify(companion);
  resolveCompanionMaterials(companion);
  assert.equal(JSON.stringify(companion), before);
});
