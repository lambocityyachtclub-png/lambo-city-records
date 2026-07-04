import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
let waterMesh, time = 0, frame = 0;
export default {
  init(scene) {
    const geo = new THREE.PlaneGeometry(600, 600, 8, 8);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x0088aa, roughness: 0.0, metalness: 1.0,
      emissive: 0x004466, emissiveIntensity: 0.5
    });
    waterMesh = new THREE.Mesh(geo, mat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = 0.45;
    scene.add(waterMesh);
    const shimmer = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.MeshBasicMaterial({ color: 0x00ddff, transparent: true, opacity: 0.2 })
    );
    shimmer.rotation.x = -Math.PI / 2;
    shimmer.position.y = 0.46;
    scene.add(shimmer);
  },
  update(delta) {
    if (!waterMesh) return;
    frame++;
    if (frame % 3 !== 0) return;
    time += delta;
    const pos = waterMesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      pos.setY(i, Math.sin(x*0.05+time*0.5)*0.15 + Math.cos(z*0.05+time*0.3)*0.15);
    }
    pos.needsUpdate = true;
    waterMesh.geometry.computeVertexNormals();
  }
};
