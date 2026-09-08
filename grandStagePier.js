import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {
    const pier = new THREE.Mesh(
      new THREE.CylinderGeometry(30, 30, 1, 32),
      new THREE.MeshStandardMaterial({
        color: 0x17131c,
        roughness: 0.7,
        metalness: 0.25
      })
    );

    pier.position.set(0, 0.45, -74);
    pier.receiveShadow = true;
    pier.name = "grandStageCircularPier";

    scene.add(pier);
  },

  update() {}
};
