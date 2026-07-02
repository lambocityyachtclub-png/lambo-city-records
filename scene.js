import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let scene;

export default {
  init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000d1a);
    scene.fog = new THREE.FogExp2(0x000d1a, 0.0025);
    return scene;
  },
  getScene() { return scene; }
};
