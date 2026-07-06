import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
let waterMesh, time=0, frame=0;
export default {
  init(scene) {
    const geo = new THREE.PlaneGeometry(800,800,12,12);
    const mat = new THREE.MeshStandardMaterial({
      color:0x007799, roughness:0.05, metalness:0.95,
      emissive:0x003344, emissiveIntensity:0.4
    });
    waterMesh = new THREE.Mesh(geo, mat);
    waterMesh.rotation.x = -Math.PI/2;
    waterMesh.position.y = 0.3;
    scene.add(waterMesh);

    // TEAL SHIMMER
    const shimmer = new THREE.Mesh(
      new THREE.PlaneGeometry(800,800),
      new THREE.MeshBasicMaterial({
        color:0x00ddff, transparent:true, opacity:0.18
      })
    );
    shimmer.rotation.x = -Math.PI/2;
    shimmer.position.y = 0.32;
    scene.add(shimmer);

    // PURPLE REFLECTION
    const reflect = new THREE.Mesh(
      new THREE.PlaneGeometry(800,800),
      new THREE.MeshBasicMaterial({
        color:0x6600cc, transparent:true, opacity:0.1
      })
    );
    reflect.rotation.x = -Math.PI/2;
    reflect.position.y = 0.33;
    scene.add(reflect);
  },
  update(delta) {
    if (!waterMesh) return;
    frame++;
    if (frame%3!==0) return;
    time += delta;
    const pos = waterMesh.geometry.attributes.position;
    for (let i=0; i<pos.count; i++) {
      const x=pos.getX(i), z=pos.getZ(i);
      pos.setY(i,
        Math.sin(x*0.04+time*0.5)*0.18 +
        Math.cos(z*0.04+time*0.35)*0.18
      );
    }
    pos.needsUpdate = true;
    waterMesh.geometry.computeVertexNormals();
  }
};
