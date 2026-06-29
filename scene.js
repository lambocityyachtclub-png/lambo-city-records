import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let scene;

export default {
  init() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xff6030, 0.008);
    return scene;
  },
  getScene() {
    return scene;
  }
};
