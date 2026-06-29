import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let waterMesh;
let waterTime = 0;

export default {
  init(scene) {
    // MAIN OCEAN
    const geo = new THREE.PlaneGeometry(1000, 1000, 40, 40);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x003366,
      roughness: 0.2,
      metalness: 0.6,
      transparent: true,
      opacity: 0.9
    });
    waterMesh = new THREE.Mesh(geo, mat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = -0.8;
    scene.add(waterMesh);

    // NEON REFLECTION LAYER
    const refGeo = new THREE.PlaneGeometry(1000, 1000);
    const refMat = new THREE.MeshBasicMaterial({
      color: 0x6600cc,
      transparent: true,
      opacity: 0.06
    });
    const ref = new THREE.Mesh(refGeo, refMat);
    ref.rotation.x = -Math.PI / 2;
    ref.position.y = -0.75;
    scene.add(ref);
  },

  update(delta) {
    if (!waterMesh) return;
    waterTime += delta;
    const pos = waterMesh.geometry.attributes.position;
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i);
      var z = pos.getZ(i);
      pos.setY(i, Math.sin(x * 0.08 + waterTime * 0.8) * 0.25 +
                   Math.cos(z * 0.08 + waterTime * 0.6) * 0.25);
    }
    pos.needsUpdate = true;
    waterMesh.geometry.computeVertexNormals();
  }
};
