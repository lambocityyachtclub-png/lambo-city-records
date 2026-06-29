import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let scene;

export default {
  init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0520);
    return scene;
  },
  getScene() {
    return scene;
  }
};
