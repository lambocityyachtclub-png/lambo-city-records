// visualEngineColor.js
// LAMBO CITY Visual Engine 2.0 — reversible renderer color/exposure controls.
//
// Existing ACES Filmic tone mapping and exposure are captured as the baseline.
// No color changes are applied during initialization.

const EXPOSURE_MIN = 0.75;
const EXPOSURE_MAX = 1.35;

let renderer = null;
let baseline = null;

function getStatus() {
  return {
    toneMapping: renderer?.toneMapping ?? null,
    toneMappingExposure: renderer?.toneMappingExposure ?? null,
    baseline: baseline ? { ...baseline } : null,
    exposureRange: { min: EXPOSURE_MIN, max: EXPOSURE_MAX },
    supportedToneMappings: [
      "none", "linear", "reinhard", "cineon", "aces"
    ]
  };
}

const TONE_MAPPINGS = Object.freeze({
  none: 0,
  linear: 1,
  reinhard: 2,
  cineon: 3,
  aces: 4
});

const controls = {
  getStatus,

  setExposure(value) {
    if (!renderer) return { success: false, error: "Renderer unavailable." };
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return { success: false, error: "Exposure must be a finite number." };
    }
    renderer.toneMappingExposure = Math.max(EXPOSURE_MIN, Math.min(EXPOSURE_MAX, number));
    return { success: true, status: getStatus() };
  },

  setToneMapping(name) {
    if (!renderer) return { success: false, error: "Renderer unavailable." };
    if (!Object.prototype.hasOwnProperty.call(TONE_MAPPINGS, name)) {
      return { success: false, error: "Choose none, linear, reinhard, cineon, or aces." };
    }
    renderer.toneMapping = TONE_MAPPINGS[name];
    return { success: true, status: getStatus() };
  },

  restoreBaseline() {
    if (!renderer || !baseline) {
      return { success: false, error: "Renderer baseline is unavailable." };
    }
    renderer.toneMapping = baseline.toneMapping;
    renderer.toneMappingExposure = baseline.toneMappingExposure;
    return { success: true, status: getStatus() };
  }
};

export default {
  init(scene, context = {}) {
    renderer = context.renderer || null;
    baseline = renderer ? {
      toneMapping: renderer.toneMapping,
      toneMappingExposure: renderer.toneMappingExposure
    } : null;
    window.__lamboCityVisualColor = controls;
    return controls;
  },

  update() {
    // No per-frame work.
  }
};