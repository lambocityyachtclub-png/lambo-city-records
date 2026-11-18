import test from "node:test";
import assert from "node:assert/strict";
import {
  HERO_GLB_ACCEPTANCE,
  readGlbJson,
  validateHeroGlb,
  validateHeroGlbJson
} from "../engine/heroGlbAcceptance.js";

function makeHeroGltf(overrides = {}) {
  return {
    asset: {
      version: "2.0",
      extras: {
        lamboCityHero: {
          referenceSpec: "HERO-3D-REFERENCE-v1",
          heightUnits: 4,
          feetAtGround: true,
          centeredAtOrigin: true,
          fullBody: true,
          noSeparateProps: true,
          visualReferenceReviewed: true
        }
      }
    },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: "HERO_Root", children: [1] }, { name: "HERO_Mesh", mesh: 0, skin: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    skins: [{ joints: Array.from({ length: 18 }, (_, index) => index) }],
    animations: [{ name: "Idle", samplers: [], channels: [] }],
    ...overrides
  };
}

function makeGlb(document) {
  const json = new TextEncoder().encode(JSON.stringify(document));
  const paddedLength = Math.ceil(json.length / 4) * 4;
  const totalLength = 12 + 8 + paddedLength;
  const bytes = new Uint8Array(totalLength);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, totalLength, true);
  view.setUint32(12, paddedLength, true);
  view.setUint32(16, 0x4e4f534a, true);
  bytes.fill(0x20, 20, totalLength);
  bytes.set(json, 20);
  return bytes;
}

test("HERO GLB acceptance target fixes the approved four-unit specification", () => {
  assert.equal(HERO_GLB_ACCEPTANCE.referenceSpec, "HERO-3D-REFERENCE-v1");
  assert.equal(HERO_GLB_ACCEPTANCE.heightUnits, 4);
  assert.equal(HERO_GLB_ACCEPTANCE.requiresAnimation, true);
});

test("valid GLB 2.0 container and humanoid asset pass metadata acceptance", () => {
  const glb = makeGlb(makeHeroGltf());
  assert.equal(readGlbJson(glb).asset.version, "2.0");
  assert.deepEqual(validateHeroGlb(glb), []);
});

test("rejects malformed magic, version, length, and absent JSON", () => {
  const valid = makeGlb(makeHeroGltf());
  const badMagic = valid.slice();
  new DataView(badMagic.buffer).setUint32(0, 0, true);
  assert.equal(validateHeroGlb(badMagic)[0].code, "GLB_CONTAINER_INVALID");

  const badVersion = valid.slice();
  new DataView(badVersion.buffer).setUint32(4, 1, true);
  assert.equal(validateHeroGlb(badVersion)[0].code, "GLB_CONTAINER_INVALID");

  const badLength = valid.slice();
  new DataView(badLength.buffer).setUint32(8, badLength.length + 4, true);
  assert.equal(validateHeroGlb(badLength)[0].code, "GLB_CONTAINER_INVALID");

  const missingJson = new Uint8Array(20);
  const view = new DataView(missingJson.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, 20, true);
  view.setUint32(12, 0, true);
  view.setUint32(16, 0x004e4942, true);
  assert.equal(validateHeroGlb(missingJson)[0].code, "GLB_CONTAINER_INVALID");
});

test("rejects missing scene, mesh, humanoid skin, or animation", () => {
  const cases = [
    [{ scenes: [] }, "SCENE_MISSING"],
    [{ meshes: [] }, "MESH_MISSING"],
    [{ skins: [] }, "HUMANOID_SKIN_MISSING"],
    [{ animations: [] }, "ANIMATIONS_MISSING"]
  ];
  for (const [overrides, expected] of cases) {
    const codes = validateHeroGlbJson(makeHeroGltf(overrides)).map(issue => issue.code);
    assert.ok(codes.includes(expected), "Expected " + expected);
  }
});

test("rejects wrong height, ground/origin, incomplete body, props, and missing visual sign-off", () => {
  const invalidMetadata = {
    referenceSpec: "old-spec",
    heightUnits: 3.8,
    feetAtGround: false,
    centeredAtOrigin: false,
    fullBody: false,
    noSeparateProps: false,
    visualReferenceReviewed: false
  };
  const issues = validateHeroGlbJson(makeHeroGltf({
    asset: { version: "2.0", extras: { lamboCityHero: invalidMetadata } }
  }));
  const codes = issues.map(issue => issue.code);
  for (const expected of [
    "REFERENCE_SPEC_MISMATCH",
    "HEIGHT_OUT_OF_TOLERANCE",
    "FEET_NOT_GROUNDED",
    "ORIGIN_NOT_CENTERED",
    "FULL_BODY_REQUIRED",
    "PROPS_NOT_EXCLUDED",
    "VISUAL_REVIEW_REQUIRED"
  ]) {
    assert.ok(codes.includes(expected), "Expected " + expected);
  }
});

test("does not silently accept missing or malformed HERO acceptance metadata", () => {
  const missing = makeHeroGltf({
    asset: { version: "2.0" }
  });
  assert.ok(validateHeroGlbJson(missing).some(issue => issue.code === "HERO_METADATA_MISSING"));
  assert.ok(validateHeroGlbJson(null).some(issue => issue.code === "GLB_JSON_INVALID"));
});
