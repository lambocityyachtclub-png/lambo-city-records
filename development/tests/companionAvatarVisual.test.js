import test from "node:test";
import assert from "node:assert/strict";
import { resolveCompanionAvatarDesign } from "../../alive/identity/companionAvatarVisual.js";

test("avatar design resolves all saved visual choices", () => {
  const design = resolveCompanionAvatarDesign({
    characterForm: "stylized",
    appearanceProfile: {
      skinTone: "deep",
      hairStyle: "braids",
      hairColor: "auburn",
      eyeColor: "green",
      outfit: "creative",
      accentColor: "violet"
    }
  });
  assert.deepEqual(design, {
    form: "stylized",
    skin: 0x5a3528,
    hair: 0x783b27,
    eyes: 0x4f8766,
    hairStyle: "braids",
    outfit: 0x253b55,
    accent: 0x9565c9
  });
});

test("unknown or missing visual choices resolve to stable defaults", () => {
  assert.deepEqual(resolveCompanionAvatarDesign(null), {
    form: "digital-human",
    skin: 0xb87952,
    hair: 0x171411,
    eyes: 0x59331f,
    hairStyle: "short",
    outfit: 0x1b1b1f,
    accent: 0xffd700
  });
  assert.equal(resolveCompanionAvatarDesign({ appearanceProfile: { hairStyle: "invented" } }).hairStyle, "short");
});

test("avatar design resolution does not mutate saved identity data", () => {
  const companion = Object.freeze({
    characterForm: "digital-human",
    appearanceProfile: Object.freeze({
      skinTone: "light", hairStyle: "curly", hairColor: "silver",
      eyeColor: "gray", outfit: "minimal", accentColor: "silver"
    })
  });
  const before = JSON.stringify(companion);
  resolveCompanionAvatarDesign(companion);
  assert.equal(JSON.stringify(companion), before);
});
