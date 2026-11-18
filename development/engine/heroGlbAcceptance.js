const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;
const EXPECTED_HEIGHT = 4;
const HEIGHT_TOLERANCE = 0.02;

function fail(code, message) {
  return { code, message };
}

function asBytes(input) {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (ArrayBuffer.isView(input)) {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  }
  throw new TypeError("A GLB ArrayBuffer or Uint8Array is required.");
}

/**
 * Reads the JSON chunk from a binary glTF 2.0 file without third-party packages.
 * This deliberately validates the container and metadata only; it does not
 * replace a renderer-based bounds, material, or visual inspection.
 */
export function readGlbJson(input) {
  const bytes = asBytes(input);
  if (bytes.byteLength < 20) throw new Error("GLB file is too small to contain a header and JSON chunk.");

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== GLB_MAGIC) throw new Error("Invalid GLB magic header.");
  const version = view.getUint32(4, true);
  if (version !== 2) throw new Error(`Unsupported GLB version: ${version}.`);
  const declaredLength = view.getUint32(8, true);
  if (declaredLength !== bytes.byteLength) throw new Error("GLB declared length does not match the supplied bytes.");

  let offset = 12;
  let json = null;
  while (offset + 8 <= declaredLength) {
    const chunkLength = view.getUint32(offset, true);
    const chunkType = view.getUint32(offset + 4, true);
    offset += 8;
    if (chunkLength % 4 !== 0 || offset + chunkLength > declaredLength) {
      throw new Error("GLB contains an invalid chunk length.");
    }
    if (chunkType === JSON_CHUNK) {
      if (json !== null) throw new Error("GLB contains more than one JSON chunk.");
      const text = new TextDecoder().decode(bytes.subarray(offset, offset + chunkLength)).replace(/[\u0000\u0020]+$/g, "");
      json = JSON.parse(text);
    }
    offset += chunkLength;
  }

  if (offset !== declaredLength) throw new Error("GLB chunk table does not end at the declared file length.");
  if (!json || typeof json !== "object") throw new Error("GLB is missing its required JSON chunk.");
  return json;
}

export function validateHeroGlbJson(gltf) {
  const issues = [];
  if (!gltf || typeof gltf !== "object" || Array.isArray(gltf)) {
    return [fail("GLB_JSON_INVALID", "The glTF document must be an object.")];
  }
  if (gltf.asset?.version !== "2.0") {
    issues.push(fail("GLTF_VERSION", "The asset must declare glTF 2.0."));
  }
  if (!Array.isArray(gltf.scenes) || gltf.scenes.length === 0) {
    issues.push(fail("SCENE_MISSING", "The asset must contain at least one scene."));
  }
  if (!Array.isArray(gltf.nodes) || gltf.nodes.length === 0) {
    issues.push(fail("NODES_MISSING", "The asset must contain a humanoid node hierarchy."));
  }
  if (!Array.isArray(gltf.meshes) || gltf.meshes.length === 0 ||
      !gltf.meshes.some(mesh => Array.isArray(mesh.primitives) && mesh.primitives.length > 0)) {
    issues.push(fail("MESH_MISSING", "The asset must contain at least one mesh primitive."));
  }
  if (!Array.isArray(gltf.skins) || !gltf.skins.some(skin => Array.isArray(skin.joints) && skin.joints.length >= 15)) {
    issues.push(fail("HUMANOID_SKIN_MISSING", "The asset must contain a humanoid skin with at least 15 joints."));
  }
  if (!Array.isArray(gltf.animations) || gltf.animations.length === 0) {
    issues.push(fail("ANIMATIONS_MISSING", "The asset must include at least one animation clip."));
  }

  const metadata = gltf.asset?.extras?.lamboCityHero;
  if (!metadata || typeof metadata !== "object") {
    issues.push(fail("HERO_METADATA_MISSING", "The asset must include asset.extras.lamboCityHero acceptance metadata."));
    return issues;
  }

  if (metadata.referenceSpec !== "HERO-3D-REFERENCE-v1") {
    issues.push(fail("REFERENCE_SPEC_MISMATCH", "The model must identify HERO-3D-REFERENCE-v1."));
  }
  if (!Number.isFinite(metadata.heightUnits) ||
      Math.abs(metadata.heightUnits - EXPECTED_HEIGHT) > HEIGHT_TOLERANCE) {
    issues.push(fail("HEIGHT_OUT_OF_TOLERANCE", "Declared total height must be 4.0 Three.js units within 0.02."));
  }
  if (metadata.feetAtGround !== true) {
    issues.push(fail("FEET_NOT_GROUNDED", "The model must be normalized with the feet at Y=0."));
  }
  if (metadata.centeredAtOrigin !== true) {
    issues.push(fail("ORIGIN_NOT_CENTERED", "The model must be centered at X=0 and Z=0."));
  }
  if (metadata.fullBody !== true) {
    issues.push(fail("FULL_BODY_REQUIRED", "The asset must include the complete head-to-toe character."));
  }
  if (metadata.noSeparateProps !== true) {
    issues.push(fail("PROPS_NOT_EXCLUDED", "The HERO model must not include the separately planned skateboard or trophy."));
  }
  if (metadata.visualReferenceReviewed !== true) {
    issues.push(fail("VISUAL_REVIEW_REQUIRED", "A human review against the saved owner reference boards is required."));
  }
  return issues;
}

export function validateHeroGlb(input) {
  try {
    return validateHeroGlbJson(readGlbJson(input));
  } catch (error) {
    return [fail("GLB_CONTAINER_INVALID", error.message || "The GLB container could not be read.")];
  }
}

export const HERO_GLB_ACCEPTANCE = Object.freeze({
  referenceSpec: "HERO-3D-REFERENCE-v1",
  heightUnits: EXPECTED_HEIGHT,
  heightTolerance: HEIGHT_TOLERANCE,
  requiredHumanoidJointCount: 15,
  requiresAnimation: true,
  requiresVisualReview: true
});
