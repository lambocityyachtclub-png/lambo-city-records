import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let scene;

export default {
  init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x003344);

    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.MeshStandardMaterial({ color: 0xff0000 })
    );

    cube.position.set(0, 1, 0);
    scene.add(cube);

    return scene; // 🔥 CRITICAL
  },

  getScene() {
    return scene;
  }
};

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {
    const marker = new THREE.Mesh(
      new THREE.BoxGeometry(3, 3, 3),
      new THREE.MeshBasicMaterial({ color: 0xffff00 })
    );

    marker.position.set(0, 10, 0);

    scene.add(marker);

    console.log("CANARY ADDED");
  }
};
