import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
let scene;
export default {
  init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0520);
    scene.fog = new THREE.FogExp2(0x110822, 0.0018);
    return scene;
  },
  getScene() { return scene; }
};
