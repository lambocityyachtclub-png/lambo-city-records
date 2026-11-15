// visualEngineAtmosphere.js
// LAMBO CITY Visual Engine 2.0 — reversible fog / atmospheric presets.
//
// This module does not add lights, meshes, or post-processing. The existing
// sunset sky and world layout remain untouched unless a preset is requested.

const PRESETS = Object.freeze({
  cinematic: Object.freeze({ color: 0x110822, density: 0.0018 }),
  clear: Object.freeze({ color: 0x160d25, density: 0.0009 }),
  sunsetHaze: Object.freeze({ color: 0x351326, density: 0.00135 }),
  deepAtmosphere: Object.freeze({ color: 0x100b20, density: 0.0023 })
});

let scene = null;
let baseline = null;
let activePreset = "baseline";
let transition = null;

function applyFog(color, density) {
  if (!scene?.fog) {
    return { success: false, error: "This scene does not have fog enabled." };
  }

  scene.fog.color.setHex(color);
  if (typeof scene.fog.density === "number") {
    scene.fog.density = density;
  }

  return { success: true, status: getStatus() };
}

function getStatus() {
  return {
    activePreset,
    availablePresets: ["baseline", ...Object.keys(PRESETS)],
    fogEnabled: Boolean(scene?.fog),
    fogColor: scene?.fog?.color?.getHexString?.() ?? null,
    fogDensity: scene?.fog?.density ?? null,
    transition: transition ? {
      targetPreset: transition.targetPreset,
      duration: transition.duration,
      elapsed: transition.elapsed
    } : null
  };
}

const controls = {
  getStatus,

  transitionTo(name, duration = 2) {
    if (!scene?.fog || !baseline) {
      return { success: false, error: "Scene fog baseline is unavailable." };
    }
    const target = name === "baseline" ? baseline : PRESETS[name];
    if (!target) {
      return { success: false, error: "Unknown atmosphere preset." };
    }
    const seconds = Number(duration);
    if (!Number.isFinite(seconds)) {
      return { success: false, error: "Transition duration must be a finite number." };
    }
    const safeDuration = Math.max(0.1, Math.min(30, seconds));
    const targetColor = name === "baseline"
      ? target.color.clone()
      : scene.fog.color.clone().setHex(target.color);

    transition = {
      targetPreset: name,
      fromColor: scene.fog.color.clone(),
      toColor: targetColor,
      fromDensity: scene.fog.density,
      toDensity: target.density,
      duration: safeDuration,
      elapsed: 0
    };
    activePreset = "transitioning";
    return { success: true, status: getStatus() };
  },

  setPreset(name) {
    transition = null;
    if (name === "baseline") {
      if (!baseline || !scene?.fog) {
        return { success: false, error: "Baseline fog settings are unavailable." };
      }
      scene.fog.color.copy(baseline.color);
      if (typeof scene.fog.density === "number") {
        scene.fog.density = baseline.density;
      }
      activePreset = "baseline";
      return { success: true, status: getStatus() };
    }

    const preset = PRESETS[name];
    if (!preset) {
      return { success: false, error: "Unknown atmosphere preset.", status: getStatus() };
    }

    const result = applyFog(preset.color, preset.density);
    if (!result.success) return result;
    activePreset = name;
    return { success: true, status: getStatus() };
  }
};

export default {
  init(scene_) {
    scene = scene_ || null;
    transition = null;
    baseline = scene?.fog ? {
      color: scene.fog.color.clone(),
      density: scene.fog.density
    } : null;
    activePreset = "baseline";
    window.__lamboCityAtmosphere = controls;
    return controls;
  },

  update(delta) {
    if (!transition || !scene?.fog) return;

    const safeDelta = Math.max(0, Math.min(Number(delta) || 0, 0.1));
    transition.elapsed = Math.min(
      transition.duration,
      transition.elapsed + safeDelta
    );
    const progress = transition.elapsed / transition.duration;

    scene.fog.color.lerpColors(
      transition.fromColor,
      transition.toColor,
      progress
    );
    if (typeof scene.fog.density === "number") {
      scene.fog.density =
        transition.fromDensity +
        (transition.toDensity - transition.fromDensity) * progress;
    }

    if (progress >= 1) {
      activePreset = transition.targetPreset;
      scene.fog.color.copy(transition.toColor);
      if (typeof scene.fog.density === "number") {
        scene.fog.density = transition.toDensity;
      }
      transition = null;
    }
  }
};