import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let renderer;
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

function chooseDevicePixelRatio() {
  const dpr = Number(window.devicePixelRatio) || 1;
  const memory = Number(navigator.deviceMemory) || 0;
  const threads = Number(navigator.hardwareConcurrency) || 0;

  // Keep the existing 1.5 ceiling on capable devices. Use a conservative
  // 1.0 ceiling when the browser exposes low-memory/low-core hardware hints.
  const lowCapability = (memory > 0 && memory <= 4) ||
    (threads > 0 && threads <= 4);
  maxPixelRatio = Math.min(dpr, lowCapability ? 1.0 : 1.5);
  minPixelRatio = Math.min(1.0, maxPixelRatio);
  return maxPixelRatio;
}

export default {
  init() {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance"
    });

    currentPixelRatio = chooseDevicePixelRatio();
    renderer.setPixelRatio(currentPixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";
    document.body.appendChild(renderer.domElement);

    window.addEventListener("resize", () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    return renderer;
  },

  // Engine calls system updates every frame. Adjust resolution only after
  // sustained frame-time samples, with a cooldown to avoid quality oscillation.
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
