import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {
    const yacht = new THREE.Group();

    const hull = new THREE.Mesh(
      new THREE.BoxGeometry(10, 2, 3),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );

    hull.position.y = 1;
    yacht.add(hull);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(4, 2, 2),
      new THREE.MeshStandardMaterial({ color: 0xdddddd })
    );

    cabin.position.set(0, 3, 0);
    yacht.add(cabin);

    yacht.position.set(0, 0, -25);

    scene.add(yacht);
  }
};
