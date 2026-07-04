import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
let scene;
export default {
  init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xff6600);
    scene.fog = new THREE.FogExp2(0xcc3300, 0.004);
    return scene;
  },
  getScene() { return scene; }
};
