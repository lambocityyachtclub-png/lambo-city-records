import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
export default {
  init(scene) {
    const tm = new THREE.MeshStandardMaterial({color:0x6b4226,roughness:1});
    const lm = new THREE.MeshStandardMaterial({color:0x1a5c2a,roughness:0.8});
    const lm2= new THREE.MeshStandardMaterial({color:0x0d3d1a,roughness:0.8});
    [{x:-16,z:5,h:10,lean:0.08},{x:-20,z:-10,h:12,lean:0.12},{x:-17,z:-25,h:9,lean:0.06},{x:-22,z:-42,h:13,lean:0.10},{x:-16,z:-58,h:11,lean:0.08},
     {x:16,z:5,h:10,lean:-0.08},{x:20,z:-10,h:12,lean:-0.12},{x:17,z:-25,h:9,lean:-0.06},{x:22,z:-42,h:13,lean:-0.10},{x:16,z:-58,h:11,lean:-0.08},
     {x:-14,z:-65,h:8,lean:0.05},{x:14,z:-65,h:8,lean:-0.05}
    ].forEach(p => {
      const palm = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.4,p.h,8),tm);
      trunk.position.y = p.h/2; trunk.rotation.z = p.lean; palm.add(trunk);
      const ox = Math.sin(p.lean)*p.h*0.5;
      [0,0.7,1.3].forEach((yo,i) => {
        const l = new THREE.Mesh(new THREE.SphereGeometry(2.4-i*0.4,7,5),i===0?lm:lm2);
        l.position.set(ox,p.h+yo,0); l.scale.set(1,0.5,1); palm.add(l);
      });
      palm.position.set(p.x,0.5,p.z); scene.add(palm);
    });
  },
  update() {}
};
