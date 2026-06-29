import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(500, 500),
      new THREE.MeshStandardMaterial({
        color: 0x004466,
        roughness: 0.2,
        metalness: 0.4
      })
    );

    water.rotation.x = -Math.PI / 2;
    water.position.y = -1;

    scene.add(water);
  }
};
