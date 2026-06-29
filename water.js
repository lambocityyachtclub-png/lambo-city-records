import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let waterMesh;
let waterTime = 0;

export default {
  init(scene) {
    const geo = new THREE.PlaneGeometry(1000, 1000, 30, 30);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x003366,
      roughness: 0.3,
      metalness: 0.6,
      transparent: false,
    });
    waterMesh = new THREE.Mesh(geo, mat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = 0.2;
    scene.add(waterMesh);

    // NEON PURPLE SHIMMER LAYER
    const shimmer = new THREE.Mesh(
      new THREE.PlaneGeometry(1000, 1000),
      new THREE.MeshBasicMaterial({
        color: 0x220044,
        transparent: true,
        opacity: 0.3
      })
    );
    shimmer.rotation.x = -Math.PI / 2;
    shimmer.position.y = 0.22;
    scene.add(shimmer);
  },

  update(delta) {
    if (!waterMesh) return;
    waterTime += delta;
    const pos = waterMesh.geometry.attributes.position;
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i);
      var z = pos.getZ(i);
      pos.setY(i,
        Math.sin(x * 0.05 + waterTime) * 0.25 +
        Math.cos(z * 0.05 + waterTime * 0.8) * 0.25
      );
    }
    pos.needsUpdate = true;
    waterMesh.geometry.computeVertexNormals();
  }
};
