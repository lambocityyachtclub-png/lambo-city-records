import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {
    const geometry = new THREE.PlaneGeometry(500, 500);

    const material = new THREE.MeshStandardMaterial({
      color: 0x006680,
      roughness: 0.25,
      metalness: 0.4
    });

    const water = new THREE.Mesh(geometry, material);

    water.rotation.x = -Math.PI / 2;
    water.position.y = -1;

    scene.add(water);
  },

  update() {}
};
