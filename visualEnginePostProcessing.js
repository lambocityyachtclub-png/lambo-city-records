// visualEnginePostProcessing.js
// LAMBO CITY Visual Engine 2.0 — optional, dynamically loaded bloom.
//
// The default renderer path remains unchanged. EffectComposer and bloom modules
// are imported only after an explicit enableBloom() request.

let scene = null;
let camera = null;
let renderer = null;
let composer = null;
let bloomPass = null;
let outputPass = null;
let resizeHandler = null;
let lastPixelRatio = 0;
let loading = false;

const DEFAULTS = Object.freeze({
  strength: 0.35,
  radius: 0.3,
  threshold: 0.88
});

function clamp(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.max(min, Math.min(max, number))
    : fallback;
}

function getStatus() {
  return {
    enabled: Boolean(composer && bloomPass),
    loading,
    modulesLoaded: Boolean(composer),
    pixelRatio: lastPixelRatio || renderer?.getPixelRatio?.() || null,
    settings: bloomPass ? {
      strength: bloomPass.strength,
      radius: bloomPass.radius,
      threshold: bloomPass.threshold
    } : null,
    defaults: { ...DEFAULTS },
    defaultPathUnchanged: !composer
  };
}

function resizeComposer() {
  if (!composer || !renderer) return;
  const pixelRatio = renderer.getPixelRatio();
  composer.setPixelRatio?.(pixelRatio);
  composer.setSize(window.innerWidth, window.innerHeight);
  lastPixelRatio = pixelRatio;
}

function disposeComposer() {
  if (resizeHandler) {
    window.removeEventListener("resize", resizeHandler);
    resizeHandler = null;
  }
  bloomPass?.dispose?.();
  outputPass?.dispose?.();
  composer?.dispose?.();
  composer = null;
  bloomPass = null;
  outputPass = null;
  lastPixelRatio = 0;
}

const controls = {
  getStatus,

  async enableBloom(options = {}) {
    if (!scene || !camera || !renderer) {
      return { success: false, error: "Scene, camera, or renderer is unavailable." };
    }
    if (loading) {
      return { success: false, error: "Bloom modules are already loading." };
    }
    if (composer && bloomPass) {
      return controls.setBloom(options);
    }

    loading = true;
    try {
      const [THREE, composerModule, renderPassModule, bloomModule, outputModule] = await Promise.all([
        import("https://esm.sh/three@0.160.0"),
        import("https://esm.sh/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js"),
        import("https://esm.sh/three@0.160.0/examples/jsm/postprocessing/RenderPass.js"),
        import("https://esm.sh/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js"),
        import("https://esm.sh/three@0.160.0/examples/jsm/postprocessing/OutputPass.js")
      ]);

      const EffectComposer = composerModule.EffectComposer;
      const RenderPass = renderPassModule.RenderPass;
      const UnrealBloomPass = bloomModule.UnrealBloomPass;
      const OutputPass = outputModule.OutputPass;

      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        clamp(options.strength, 0, 2, DEFAULTS.strength),
        clamp(options.radius, 0, 1, DEFAULTS.radius),
        clamp(options.threshold, 0, 1, DEFAULTS.threshold)
      );
      composer.addPass(bloomPass);
      outputPass = new OutputPass();
      composer.addPass(outputPass);
      resizeComposer();

      resizeHandler = resizeComposer;
      window.addEventListener("resize", resizeHandler, { passive: true });

      return { success: true, status: getStatus() };
    } catch (error) {
      console.warn("[LAMBO CITY Visual Engine] Optional bloom could not be enabled.", error);
      disposeComposer();
      return {
        success: false,
        error: "Optional bloom modules could not be loaded. The standard renderer remains active.",
        status: getStatus()
      };
    } finally {
      loading = false;
    }
  },

  setBloom(options = {}) {
    if (!bloomPass) {
      return { success: false, error: "Enable bloom before changing its settings." };
    }
    bloomPass.strength = clamp(options.strength, 0, 2, bloomPass.strength);
    bloomPass.radius = clamp(options.radius, 0, 1, bloomPass.radius);
    bloomPass.threshold = clamp(options.threshold, 0, 1, bloomPass.threshold);
    return { success: true, status: getStatus() };
  },

  disableBloom() {
    disposeComposer();
    return { success: true, status: getStatus() };
  },

  render() {
    if (!composer || !bloomPass) return false;

    try {
      const pixelRatio = renderer.getPixelRatio();
      if (pixelRatio !== lastPixelRatio) resizeComposer();
      composer.render();
      return true;
    } catch (error) {
      console.warn("[LAMBO CITY Visual Engine] Bloom render failed; returning to the standard renderer.", error);
      disposeComposer();
      return false;
    }
  }
};

export default {
  init(scene_, context = {}) {
    disposeComposer();
    scene = scene_ || null;
    camera = context.camera || null;
    renderer = context.renderer || null;
    window.__lamboCityVisualPostProcessing = controls;
    return controls;
  },

  update() {
    // The composer renders only when explicitly enabled.
  }
};
