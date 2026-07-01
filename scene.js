import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let scene;

export default {
  init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x001833);
    scene.fog = new THREE.FogExp2(0x001833, 0.003);
    return scene;
  },
  getScene() { return scene; }
};
