import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let scene;

export default {
  init() {
    scene = new THREE.Scene();

    // 🔥 FORCE BACKGROUND COLOR
    scene.background = new THREE.Color(0x003344);

    // 🔥 FORCE VISIBLE OBJECT
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );

    cube.position.set(0, 1, 0);
    scene.add(cube);

    this._scene = scene;
  },

  getScene() {
    return this._scene;
  }
};
