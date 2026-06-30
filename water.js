import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let waterMesh;
let time = 0;

export default {
  init(scene) {
    var geo = new THREE.PlaneGeometry(600, 600, 20, 20);
    var mat = new THREE.MeshStandardMaterial({
      color: 0x006994,
      roughness: 0.1,
      metalness: 0.8,
      transparent: false,
    });
    waterMesh = new THREE.Mesh(geo, mat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = 0.1;
    scene.add(waterMesh);

    // TEAL SHIMMER
    var shimmer = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.MeshBasicMaterial({
        color: 0x00aacc, transparent: true, opacity: 0.12
      })
    );
    shimmer.rotation.x = -Math.PI / 2;
    shimmer.position.y = 0.12;
    scene.add(shimmer);

    // NEON PURPLE REFLECTION
    var reflect = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.MeshBasicMaterial({
        color: 0x330066, transparent: true, opacity: 0.15
      })
    );
    reflect.rotation.x = -Math.PI / 2;
    reflect.position.y = 0.13;
    scene.add(reflect);
  },

  update(delta) {
    if (!waterMesh) return;
    time += delta;
    var pos = waterMesh.geometry.attributes.position;
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i);
      var z = pos.getZ(i);
      pos.setY(i,
        Math.sin(x * 0.05 + time * 0.6) * 0.2 +
        Math.cos(z * 0.05 + time * 0.4) * 0.2
      );
    }
    pos.needsUpdate = true;
    waterMesh.geometry.computeVertexNormals();
  }
};
