import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import DeviceGraphics from "./deviceGraphics.js";

let renderer;
let resizeHandler;
let currentPixelRatio = 1;
let maxPixelRatio = 1.5;
let minPixelRatio = 1;
let sampleElapsed = 0;
let sampleFrameTime = 0;
let sampleFrames = 0;
let lastQualityChange = 0;

function applyPixelRatio(nextRatio) {
  if (!renderer) return;
  const bounded = Math.max(minPixelRatio, Math.min(maxPixelRatio, nextRatio));
  const rounded = Math.round(bounded * 100) / 100;
  if (Math.abs(rounded - currentPixelRatio) < 0.01) return;

  currentPixelRatio = rounded;
  renderer.setPixelRatio(currentPixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function syncDeviceProfile(preserveCurrent = false) {
  const applied = DeviceGraphics.applyRendererProfile(renderer, { preserveCurrent });
  currentPixelRatio = applied.currentPixelRatio;
  maxPixelRatio = applied.effectiveMaxPixelRatio;
  minPixelRatio = applied.effectiveMinPixelRatio;
  return applied;
}

export default {
  init() {
    const graphics = DeviceGraphics.getProfile();
    renderer = new THREE.WebGLRenderer({
      antialias: graphics.antialias,
      powerPreference: "high-performance"
    });

    syncDeviceProfile();
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";
    document.body.appendChild(renderer.domElement);

    if (resizeHandler) window.removeEventListener("resize", resizeHandler);
    resizeHandler = () => syncDeviceProfile(true);
    window.addEventListener("resize", resizeHandler, { passive: true });

    sampleElapsed = 0;
    sampleFrameTime = 0;
    sampleFrames = 0;
    lastQualityChange = performance.now();

    return renderer;
  },

  // Preserve the existing sustained-frame-time adaptation inside the selected device tier.
  update(delta) {
    if (!renderer || !Number.isFinite(delta) || delta <= 0) return;

    const frameMs = Math.min(delta, 0.1) * 1000;
    sampleFrameTime += frameMs;
    sampleFrames += 1;
    sampleElapsed += delta;

    if (sampleElapsed < 2) return;

    const averageFrameMs = sampleFrames
      ? sampleFrameTime / sampleFrames
      : 0;
    const now = performance.now();

    if (now - lastQualityChange >= 4000) {
      if (averageFrameMs > 22 && currentPixelRatio > minPixelRatio) {
        applyPixelRatio(currentPixelRatio - 0.1);
        lastQualityChange = now;
      } else if (
        averageFrameMs < 17.5 &&
        currentPixelRatio < maxPixelRatio
      ) {
        applyPixelRatio(currentPixelRatio + 0.05);
        lastQualityChange = now;
      }
    }

    sampleElapsed = 0;
    sampleFrameTime = 0;
    sampleFrames = 0;
  },

  getRenderer() {
    return renderer;
  }
};
