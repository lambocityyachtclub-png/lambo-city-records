import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
let scene;
export default {
  init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a0a2e);
    scene.fog = new THREE.FogExp2(0x1a0a2e, 0.002);
    return scene;
  },
  getScene() { return scene; }
};
