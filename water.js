import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let waterMesh;
let time = 0;

export default {
  init(scene) {
    // MAIN OCEAN — sits just below ground pads
    var geo = new THREE.PlaneGeometry(600, 600, 20, 20);
    var mat = new THREE.MeshStandardMaterial({
      color: 0x005577,
      roughness: 0.1,
      metalness: 0.8,
    });
    waterMesh = new THREE.Mesh(geo, mat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = -0.3;
    scene.add(waterMesh);

    // TEAL SHIMMER
    var shimmer = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.MeshBasicMaterial({
        color: 0x00bbdd, transparent: true, opacity: 0.15
      })
    );
    shimmer.rotation.x = -Math.PI / 2;
    shimmer.position.y = -0.28;
    scene.add(shimmer);

    // PURPLE NEON REFLECTION
    var reflect = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.MeshBasicMaterial({
        color: 0x440088, transparent: true, opacity: 0.2
      })
    );
    reflect.rotation.x = -Math.PI / 2;
    reflect.position.y = -0.26;
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
        Math.sin(x * 0.05 + time * 0.6) * 0.18 +
        Math.cos(z * 0.05 + time * 0.4) * 0.18
      );
    }
    pos.needsUpdate = true;
    waterMesh.geometry.computeVertexNormals();
  }
};
