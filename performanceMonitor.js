// performanceMonitor.js
// LAMBO CITY — lightweight renderer and frame-time diagnostics.
// Enable the optional overlay with ?perf=1. No default HUD or storage.

let renderer = null;
let overlay = null;
let lastSampleAt = 0;
let frames = 0;
let lastFrameAt = 0;
let smoothedFrameMs = 0;
let snapshot = null;

function makeOverlay() {
  const element = document.createElement("div");
  element.id = "lambo-city-performance-monitor";
  element.style.cssText = [
    "position:fixed",
    "top:10px",
    "left:10px",
    "z-index:9999",
    "padding:9px 11px",
    "min-width:190px",
    "border:1px solid rgba(216,180,117,.55)",
    "border-radius:8px",
    "background:rgba(5,8,13,.86)",
    "color:#f4e8d2",
    "font:11px/1.55 ui-monospace, SFMono-Regular, Menlo, monospace",
    "white-space:pre",
    "pointer-events:none",
    "backdrop-filter:blur(8px)"
  ].join(";");
  document.body.appendChild(element);
  return element;
}

function readRendererStats() {
  const info = renderer?.info;
  if (!info) return {};
  return {
    drawCalls: info.render?.calls ?? 0,
    triangles: info.render?.triangles ?? 0,
    geometries: info.memory?.geometries ?? 0,
    textures: info.memory?.textures ?? 0,
    programs: info.programs?.length ?? 0
  };
}

export default {
  init(renderer_) {
    renderer = renderer_;
    lastSampleAt = performance.now();
    lastFrameAt = lastSampleAt;

    const params = new URLSearchParams(window.location.search);
    if (params.get("perf") === "1") overlay = makeOverlay();

    const graphics = window.__lamboCityGraphics || {};
    snapshot = {
      fps: 0,
      frameMs: 0,
      drawCalls: 0,
      triangles: 0,
      geometries: 0,
      textures: 0,
      programs: 0,
      pixelRatio: renderer?.getPixelRatio?.() ?? 1,
      viewport: window.innerWidth + "x" + window.innerHeight,
      deviceMemoryGB: navigator.deviceMemory ?? null,
      hardwareThreads: navigator.hardwareConcurrency ?? null,
      graphicsTier: graphics.tier || "unknown",
      graphicsLabel: graphics.label || "Unspecified"
    };

    window.__lamboCityPerformance = snapshot;
    return snapshot;
  },

  update() {
    if (!renderer || !snapshot) return;

    const now = performance.now();
    const frameMs = Math.max(0, now - lastFrameAt);
    lastFrameAt = now;
    if (frameMs > 0) {
      smoothedFrameMs = smoothedFrameMs
        ? smoothedFrameMs * 0.88 + frameMs * 0.12
        : frameMs;
    }
    frames++;

    if (now - lastSampleAt < 500) return;

    const elapsed = now - lastSampleAt;
    const stats = readRendererStats();
    snapshot.fps = Math.round((frames * 1000) / elapsed);
    snapshot.frameMs = Number(smoothedFrameMs.toFixed(1));
    snapshot.drawCalls = stats.drawCalls ?? 0;
    snapshot.triangles = stats.triangles ?? 0;
    snapshot.geometries = stats.geometries ?? 0;
    snapshot.textures = stats.textures ?? 0;
    snapshot.programs = stats.programs ?? 0;
    snapshot.pixelRatio = renderer.getPixelRatio();
    snapshot.viewport = window.innerWidth + "x" + window.innerHeight;

    if (overlay) {
      overlay.textContent = [
        "LAMBO CITY  /  PERF",
        "QUALITY      " + snapshot.graphicsTier.toUpperCase(),
        "FPS          " + snapshot.fps,
        "FRAME        " + snapshot.frameMs + " ms",
        "DRAW CALLS   " + snapshot.drawCalls,
        "TRIANGLES    " + snapshot.triangles.toLocaleString(),
        "GEOMETRIES   " + snapshot.geometries,
        "TEXTURES     " + snapshot.textures,
        "PROGRAMS     " + snapshot.programs,
        "PIXEL RATIO  " + snapshot.pixelRatio,
        "VIEWPORT     " + snapshot.viewport
      ].join("\n");
    }

    frames = 0;
    lastSampleAt = now;
  }
};
