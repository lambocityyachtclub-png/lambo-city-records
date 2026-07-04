import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
let renderer;
export default {
  init() {
    renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // CAP AT 1x on mobile — biggest single performance win
    renderer.setPixelRatio(1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    document.body.appendChild(renderer.domElement);
    window.addEventListener('resize', function() {
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
    return renderer;
  },
  getRenderer() { return renderer; }
};
