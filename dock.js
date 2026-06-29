import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let dockGroup;

export default {
  init(scene) {
    dockGroup = new THREE.Group();

    const dock = new THREE.Mesh(
      new THREE.BoxGeometry(20, 1, 6),
      new THREE.MeshStandardMaterial({
        color: 0x5a3a1a,
        roughness: 1
      })
    );

    dock.position.y = 0;
    dockGroup.add(dock);

    const postGeo = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

    for (let i = -8; i <= 8; i += 4) {
      const p1 = new THREE.Mesh(postGeo, postMat);
      p1.position.set(i, 1, 3);

      const p2 = new THREE.Mesh(postGeo, postMat);
      p2.position.set(i, 1, -3);

      dockGroup.add(p1);
      dockGroup.add(p2);
    }

    scene.add(dockGroup);
  },

  update() {}
};
