// visualEngineMaterials.js
// LAMBO CITY Visual Engine 2.0 — opt-in texture filtering controls.
//
// No material replacement and no default visual changes. Texture anisotropy
// is changed only when explicitly requested through the public controls.

let scene = null;
let renderer = null;

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
    currentMaximum: values.length ? Math.max(...values) : null
  };
}

const controls = {
  getReport: getTextureReport,

  setTextureAnisotropy(requestedLevel = 1) {
    const maximum = renderer?.capabilities?.getMaxAnisotropy?.() ?? 1;
    const level = Math.max(1, Math.min(maximum, Number(requestedLevel) || 1));
    const textures = collectTextures();

    textures.forEach(texture => {
      if (texture.anisotropy !== level) {
        texture.anisotropy = level;
        texture.needsUpdate = true;
      }
    });

    return { success: true, appliedLevel: level, ...getTextureReport() };
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