import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let water;

export default {
  init(scene) {
    const geometry = new THREE.PlaneGeometry(200, 200);
    const material = new THREE.MeshStandardMaterial({
      color: 0x003344,
      roughness: 0.2,
      metalness: 0.6
    });

    water = new THREE.Mesh(geometry, material);

    water.rotation.x = -Math.PI / 2;
    water.position.y = -1;

    scene.add(water);
  },

  update() {
    // later: wave animation
  }
};
