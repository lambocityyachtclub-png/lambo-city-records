import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
let waterMesh;
let time = 0;
let frameCount = 0;
export default {
  init(scene) {
    // LOW POLY — big performance gain
    var geo = new THREE.PlaneGeometry(600, 600, 8, 8);
    var mat = new THREE.MeshStandardMaterial({
      color: 0x0088aa,
      roughness: 0.0,
      metalness: 1.0,
      emissive: 0x004466,
      emissiveIntensity: 0.5,
    });
    waterMesh = new THREE.Mesh(geo, mat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = 0.45;
    scene.add(waterMesh);

    var shimmer = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.MeshBasicMaterial({
        color: 0x00ddff, transparent: true, opacity: 0.2
      })
    );
    shimmer.rotation.x = -Math.PI / 2;
    shimmer.position.y = 0.46;
    scene.add(shimmer);
  },
  update(delta) {
    if (!waterMesh) return;
    // ONLY UPDATE EVERY 3 FRAMES
    frameCount++;
    if (frameCount % 3 !== 0) return;
    time += delta;
    var pos = waterMesh.geometry.attributes.position;
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i);
      var z = pos.getZ(i);
      pos.setY(i,
        Math.sin(x * 0.05 + time * 0.5) * 0.15 +
        Math.cos(z * 0.05 + time * 0.3) * 0.15
      );
    }
    pos.needsUpdate = true;
    waterMesh.geometry.computeVertexNormals();
  }
};
