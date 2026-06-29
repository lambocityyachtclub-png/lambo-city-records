import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {
    // soft ambient base light
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    // main cinematic “sun” light
    const sun = new THREE.DirectionalLight(0xffcc88, 1.2);
    sun.position.set(10, 20, 10);

    scene.add(sun);
  },

  update() {
    // later we can animate sun angle for day/night cycle
  }
};
