import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 6, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });

    const leafGeo = new THREE.SphereGeometry(1.5, 6, 6);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2ecc71 });

    for (let i = -20; i <= 20; i += 10) {
      const palm = new THREE.Group();

      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 3;

      const leaves = new THREE.Mesh(leafGeo, leafMat);
      leaves.position.y = 7;

      palm.add(trunk);
      palm.add(leaves);

      palm.position.set(i, 0, 12);
      scene.add(palm);
    }
  }
};
