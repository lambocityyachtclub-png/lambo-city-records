import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let scene;

export default {
  init() {
    scene = new THREE.Scene();
    // FIXED: softer fog, correct sunset orange-blue tone
    scene.fog = new THREE.FogExp2(0x221133, 0.004);
    return scene;
  },
  getScene() {
    return scene;
  }
};
