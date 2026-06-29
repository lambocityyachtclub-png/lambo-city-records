import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {
    const group = new THREE.Group();

    // MAIN DOCK
    const dock = new THREE.Mesh(
      new THREE.BoxGeometry(40, 1, 10),
      new THREE.MeshStandardMaterial({ color: 0x3b2a1a })
    );

    dock.position.y = 0;
    group.add(dock);

    // SIDE POSTS (cinematic rhythm)
    const postGeo = new THREE.CylinderGeometry(0.2, 0.2, 3, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

    for (let i = -18; i <= 18; i += 6) {
      const p1 = new THREE.Mesh(postGeo, postMat);
      p1.position.set(i, 1.5, 5);

      const p2 = new THREE.Mesh(postGeo, postMat);
      p2.position.set(i, 1.5, -5);

      group.add(p1);
      group.add(p2);
    }

    scene.add(group);
  }
};
