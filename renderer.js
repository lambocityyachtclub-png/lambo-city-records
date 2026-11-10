import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import DeviceGraphics from "./deviceGraphics.js";

let renderer;
let resizeHandler;

export default {
  init() {
    const graphics = DeviceGraphics.getProfile();
    renderer = new THREE.WebGLRenderer({
      antialias: graphics.antialias,
      powerPreference: "high-performance"
    });

    DeviceGraphics.applyRendererProfile(renderer);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";
    document.body.appendChild(renderer.domElement);

    // Reapply the selected device tier on orientation and viewport changes.
    if (resizeHandler) window.removeEventListener("resize", resizeHandler);
    resizeHandler = () => DeviceGraphics.applyRendererProfile(renderer);
    window.addEventListener("resize", resizeHandler, { passive: true });

    return renderer;
  },
  getRenderer() { return renderer; }
};
