// visualEngineMaterials.js
// LAMBO CITY Visual Engine 2.0 — opt-in texture filtering controls.
//
// No material replacement and no default visual changes. Texture anisotropy
// is changed only when explicitly requested through the public controls.

let scene = null;
let renderer = null;
const materialBaselines = new WeakMap();
const textureBaselines = new Map();

const MATERIAL_PRESETS = Object.freeze({
  polished: Object.freeze({ roughness: 0.18, metalness: 0.72 }),
  satin: Object.freeze({ roughness: 0.38, metalness: 0.35 }),
  matte: Object.freeze({ roughness: 0.82, metalness: 0.05 }),
  chrome: Object.freeze({ roughness: 0.08, metalness: 0.95 })
});

function collectTextures() {
  const textures = new Set();
  if (!scene) return textures;

  scene.traverse(object => {
    const list = Array.isArray(object.material)
      ? object.material
      : object.material ? [object.material] : [];

    list.forEach(material => {
      Object.keys(material).forEach(key => {
        const value = material[key];
        if (value?.isTexture) textures.add(value);
      });
    });
  });

  return textures;
}

function getTextureReport() {
  const textures = [...collectTextures()];
  const values = textures.map(texture => Number(texture.anisotropy) || 1);
  return {
    textureCount: textures.length,
    maxSupportedAnisotropy: renderer?.capabilities?.getMaxAnisotropy?.() ?? 1,
    currentMinimum: values.length ? Math.min(...values) : null,
    currentMaximum: values.length ? Math.max(...values) : null,
    trackedTextureBaselines: textureBaselines.size
  };
}

const controls = {
  getReport: getTextureReport,

  applyMaterialPresetToObject(root, presetName) {
    if (!root || typeof root.traverse !== "function") {
      return { success: false, error: "Provide a Three.js object or group." };
    }
    let applied = 0;
    let skipped = 0;
    const seen = new Set();
    root.traverse(object => {
      const list = Array.isArray(object.material)
        ? object.material
        : object.material ? [object.material] : [];
      list.forEach(material => {
        if (seen.has(material)) return;
        seen.add(material);
        const result = controls.setMaterialPreset(material, presetName);
        if (result.success) applied++;
        else skipped++;
      });
    });
    return { success: applied > 0, applied, skipped };
  },

  restoreObjectMaterials(root) {
    if (!root || typeof root.traverse !== "function") {
      return { success: false, error: "Provide a Three.js object or group." };
    }
    let restored = 0;
    const seen = new Set();
    root.traverse(object => {
      const list = Array.isArray(object.material)
        ? object.material
        : object.material ? [object.material] : [];
      list.forEach(material => {
        if (seen.has(material)) return;
        seen.add(material);
        if (controls.restoreMaterial(material).success) restored++;
      });
    });
    return { success: restored > 0, restored };
  },

  setMaterialPreset(material, presetName) {
    const preset = MATERIAL_PRESETS[presetName];
    if (!material || !preset) {
      return { success: false, error: "Provide a material and choose polished, satin, matte, or chrome." };
    }
    if (typeof material.roughness !== "number" && typeof material.metalness !== "number") {
      return { success: false, error: "This material does not support roughness or metalness controls." };
    }
    if (!materialBaselines.has(material)) {
      materialBaselines.set(material, {
        roughness: material.roughness,
        metalness: material.metalness
      });
    }
    if (typeof material.roughness === "number") material.roughness = preset.roughness;
    if (typeof material.metalness === "number") material.metalness = preset.metalness;
    material.needsUpdate = true;
    return {
      success: true,
      preset: presetName,
      roughness: material.roughness ?? null,
      metalness: material.metalness ?? null
    };
  },

  restoreMaterial(material) {
    const baseline = material && materialBaselines.get(material);
    if (!baseline) return { success: false, error: "No saved material baseline exists." };
    if (typeof baseline.roughness === "number") material.roughness = baseline.roughness;
    if (typeof baseline.metalness === "number") material.metalness = baseline.metalness;
    material.needsUpdate = true;
    materialBaselines.delete(material);
    return { success: true };
  },

  setTextureAnisotropy(requestedLevel = 1) {
    const maximum = renderer?.capabilities?.getMaxAnisotropy?.() ?? 1;
    const level = Math.max(1, Math.min(maximum, Number(requestedLevel) || 1));
    const textures = collectTextures();

    textures.forEach(texture => {
      if (!textureBaselines.has(texture)) textureBaselines.set(texture, texture.anisotropy);
      if (texture.anisotropy !== level) {
        texture.anisotropy = level;
        texture.needsUpdate = true;
      }
    });

    return { success: true, appliedLevel: level, ...getTextureReport() };
  },

  restoreTextureAnisotropy() {
    let restored = 0;
    textureBaselines.forEach((baseline, texture) => {
      if (texture.anisotropy !== baseline) {
        texture.anisotropy = baseline;
        texture.needsUpdate = true;
      }
      restored++;
    });
    textureBaselines.clear();
    return { success: true, restored, ...getTextureReport() };
  }
};

export default {
  init(scene_, context = {}) {
    scene = scene_ || null;
    renderer = context.renderer || null;
    window.__lamboCityVisualMaterials = controls;
    return controls;
  },

  update() {
    // Deliberately idle; texture scans happen only on explicit API calls.
  }
};