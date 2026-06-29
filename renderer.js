import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let renderer;

export default {
  init() {
    renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";

    document.body.appendChild(renderer.domElement);

    window.addEventListener("resize", () => {
      // camera handled by engine system
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  },

  render(scene, camera) {
    renderer.render(scene, camera);
  }
};
