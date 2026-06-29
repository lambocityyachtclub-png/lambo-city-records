import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {
    const dock = new THREE.Mesh(
      new THREE.BoxGeometry(30, 1, 8),
      new THREE.MeshStandardMaterial({ color: 0x3b2a1a })
    );

    dock.position.y = 0;
    scene.add(dock);
  },

  update() {}
};
