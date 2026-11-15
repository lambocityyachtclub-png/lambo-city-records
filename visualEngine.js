// visualEngine.js
// LAMBO CITY Visual Engine 2.0 — rendering quality foundation.
//
// This module centralizes renderer quality controls without rebuilding
// scene objects or changing the established world, camera, lighting,
// materials, navigation, or gameplay.
//
// Default behavior intentionally matches renderer.js's existing 1.5
// device-pixel-ratio ceiling. Adaptive quality is opt-in.

const QUALITY_PROFILES = Object.freeze({
  performance: Object.freeze({ maxPixelRatio: 1.0 }),
  balanced: Object.freeze({ maxPixelRatio: 1.5 }),
  high: Object.freeze({ maxPixelRatio: 1.75 })
});

const MIN_PIXEL_RATIO = 0.85;

let renderer = null;
let quality = "balanced";
let adaptiveEnabled = false;
let currentPixelRatio = 1;
let lowFpsSeconds = 0;
let highFpsSeconds = 0;
let adjustmentCooldown = 0;
let initialized = false;

function getDevicePixelRatio() {
  return Math.max(1, Number(window.devicePixelRatio) || 1);
}

function getPixelRatioLimit() {
  return QUALITY_PROFILES[quality].maxPixelRatio;
}

function clampPixelRatio(value) {
  return Math.max(
    MIN_PIXEL_RATIO,
    Math.min(getDevicePixelRatio(), getPixelRatioLimit(), value)
  );
}

function applyPixelRatio(value) {
  if (!renderer) return currentPixelRatio;

  currentPixelRatio = clampPixelRatio(value);
  renderer.setPixelRatio(currentPixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  return currentPixelRatio;
}

function getStatus() {
  return {
    initialized,
    quality,
    adaptiveEnabled,
    devicePixelRatio: getDevicePixelRatio(),
    pixelRatio: currentPixelRatio,
    maxPixelRatio: getPixelRatioLimit(),
    minPixelRatio: MIN_PIXEL_RATIO,
    profiles: Object.keys(QUALITY_PROFILES)
  };
}

const publicControls = {
  getStatus,

  setQuality(nextQuality) {
    if (!Object.prototype.hasOwnProperty.call(QUALITY_PROFILES, nextQuality)) {
      return {
        success: false,
        error: "Unknown quality profile. Choose performance, balanced, or high.",
        status: getStatus()
      };
    }

    quality = nextQuality;
    lowFpsSeconds = 0;
    highFpsSeconds = 0;
    applyPixelRatio(getPixelRatioLimit());

    return { success: true, status: getStatus() };
  },

  setAdaptiveEnabled(enabled) {
    adaptiveEnabled = Boolean(enabled);
    lowFpsSeconds = 0;
    highFpsSeconds = 0;
    adjustmentCooldown = 0;

    return { success: true, status: getStatus() };
  }
};

export default {
  init(scene, context = {}) {
    renderer = context.renderer || null;
    if (!renderer) {
      console.warn("[LAMBO CITY Visual Engine] Renderer unavailable; controls remain inactive.");
      return publicControls;
    }

    // Preserve the existing renderer's visual defaults. Balanced is capped
    // at the same 1.5 DPR already used by renderer.js.
    quality = "balanced";
    applyPixelRatio(getPixelRatioLimit());

    initialized = true;
    window.__lamboCityVisualEngine = publicControls;

    return publicControls;
  },

  update(delta) {
    if (!renderer || !adaptiveEnabled) return;

    const fps = Number(window.__lamboCityPerformance?.fps) || 0;
    if (fps <= 0) return;

    const safeDelta = Math.max(0, Math.min(Number(delta) || 0, 0.05));
    adjustmentCooldown = Math.max(0, adjustmentCooldown - safeDelta);

    if (fps < 44) {
      lowFpsSeconds += safeDelta;
      highFpsSeconds = 0;
    } else if (fps > 57) {
      highFpsSeconds += safeDelta;
      lowFpsSeconds = 0;
    } else {
      lowFpsSeconds = 0;
      highFpsSeconds = 0;
    }

    if (adjustmentCooldown > 0) return;

    if (lowFpsSeconds >= 4) {
      applyPixelRatio(currentPixelRatio - 0.15);
      lowFpsSeconds = 0;
      adjustmentCooldown = 5;
      return;
    }

    if (highFpsSeconds >= 12 && currentPixelRatio < getPixelRatioLimit()) {
      applyPixelRatio(currentPixelRatio + 0.05);
      highFpsSeconds = 0;
      adjustmentCooldown = 8;
    }
  }
};
