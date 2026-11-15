// visualEngine.js
// LAMBO CITY Visual Engine 2.0 — centralized rendering quality manager.
//
// Safe foundation: this module manages resolution and adaptive quality only.
// It deliberately does not alter geometry, materials, lights, camera,
// navigation, Studio, or gameplay. Adaptive scaling is opt-in.

const QUALITY_PROFILES = Object.freeze({
  performance: Object.freeze({ maxPixelRatio: 1.0 }),
  balanced: Object.freeze({ maxPixelRatio: 1.5 }),
  high: Object.freeze({ maxPixelRatio: 1.75 })
});

const MIN_PIXEL_RATIO = 0.85;
const LOW_FPS_THRESHOLD = 44;
const HIGH_FPS_THRESHOLD = 57;

let renderer = null;
let quality = "balanced";
let adaptiveEnabled = false;
let currentPixelRatio = 1;
let lowFpsSeconds = 0;
let highFpsSeconds = 0;
let adjustmentCooldown = 0;
let initialized = false;
let contextLost = false;
let resizeHandler = null;
let contextLostHandler = null;
let contextRestoredHandler = null;

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
  if (!renderer || contextLost) return currentPixelRatio;

  currentPixelRatio = clampPixelRatio(value);
  renderer.setPixelRatio(currentPixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  return currentPixelRatio;
}

function handleResize() {
  if (!renderer) return;
  // Keep the active DPR profile applied after orientation and viewport changes.
  applyPixelRatio(currentPixelRatio);
}

function getStatus() {
  return {
    initialized,
    contextLost,
    quality,
    adaptiveEnabled,
    devicePixelRatio: getDevicePixelRatio(),
    pixelRatio: currentPixelRatio,
    maxPixelRatio: getPixelRatioLimit(),
    minPixelRatio: MIN_PIXEL_RATIO,
    fpsThresholds: {
      lower: LOW_FPS_THRESHOLD,
      upper: HIGH_FPS_THRESHOLD
    },
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
  },

  reset() {
    quality = "balanced";
    adaptiveEnabled = false;
    lowFpsSeconds = 0;
    highFpsSeconds = 0;
    adjustmentCooldown = 0;
    applyPixelRatio(getPixelRatioLimit());

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

    if (resizeHandler) {
      window.removeEventListener("resize", resizeHandler);
    }
    if (contextLostHandler && renderer.domElement) {
      renderer.domElement.removeEventListener("webglcontextlost", contextLostHandler);
    }
    if (contextRestoredHandler && renderer.domElement) {
      renderer.domElement.removeEventListener("webglcontextrestored", contextRestoredHandler);
    }

    quality = "balanced";
    adaptiveEnabled = false;
    contextLost = false;
    applyPixelRatio(getPixelRatioLimit());

    resizeHandler = handleResize;
    window.addEventListener("resize", resizeHandler, { passive: true });

    contextLostHandler = event => {
      // Do not silently reload or mutate the world if Safari loses the GPU context.
      event.preventDefault();
      contextLost = true;
      console.warn("[LAMBO CITY Visual Engine] WebGL context lost.");
    };
    contextRestoredHandler = () => {
      contextLost = false;
      applyPixelRatio(getPixelRatioLimit());
      console.info("[LAMBO CITY Visual Engine] WebGL context restored.");
    };

    renderer.domElement.addEventListener("webglcontextlost", contextLostHandler, false);
    renderer.domElement.addEventListener("webglcontextrestored", contextRestoredHandler, false);

    initialized = true;
    window.__lamboCityVisualEngine = publicControls;

    return publicControls;
  },

  update(delta) {
    if (!renderer || !adaptiveEnabled || contextLost) return;

    const fps = Number(window.__lamboCityPerformance?.fps) || 0;
    if (fps <= 0) return;

    const safeDelta = Math.max(0, Math.min(Number(delta) || 0, 0.05));
    adjustmentCooldown = Math.max(0, adjustmentCooldown - safeDelta);

    if (fps < LOW_FPS_THRESHOLD) {
      lowFpsSeconds += safeDelta;
      highFpsSeconds = 0;
    } else if (fps > HIGH_FPS_THRESHOLD) {
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
