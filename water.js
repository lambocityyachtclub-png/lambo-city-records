import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let waterMesh;
let time = 0;

export default {
  init(scene) {
    const geo = new THREE.PlaneGeometry(800, 800, 80, 80);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x006994,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85,
    });
    waterMesh = new THREE.Mesh(geo, mat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = -0.5;
    scene.add(waterMesh);

    // NEON WATER REFLECTION PLANE
    const reflectGeo = new THREE.PlaneGeometry(800, 800);
    const reflectMat = new THREE.MeshBasicMaterial({
      color: 0x9900ff,
      transparent: true,
      opacity: 0.04,
    });
    const reflect = new THREE.Mesh(reflectGeo, reflectMat);
    reflect.rotation.x = -Math.PI / 2;
    reflect.position.y = -0.4;
    scene.add(reflect);
  },
  update(delta) {
    if (!waterMesh) return;
    time += delta;
    const pos = waterMesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, Math.sin(x * 0.05 + time) * 0.3 + Math.cos(z * 0.05 + time) * 0.3);
    }
    pos.needsUpdate = true;
    waterMesh.geometry.computeVertexNormals();
  }
};
