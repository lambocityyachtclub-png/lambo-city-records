import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffcc88, 1.5);
    sun.position.set(20, 30, 10);

    scene.add(sun);
  },

  update() {}
};
