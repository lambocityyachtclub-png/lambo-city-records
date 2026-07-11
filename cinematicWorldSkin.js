import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
let billboards = [], time = 0;
export default {
  init(scene) {
    // PERF: removed the per-billboard PointLight (4 total). The animated "flicker" effect
    // is preserved — it now animates the border mesh's own emissiveIntensity directly
    // instead of a real-time light, so the visual result is the same at near-zero cost.
    [{x:-70,z:-15,rotY:0.5,accent:0xff0050},{x:70,z:-15,rotY:-0.5,accent:0xff0000},
     {x:-75,z:-50,rotY:0.3,accent:0x1da1f2},{x:75,z:-50,rotY:-0.3,accent:0xe1306c}
    ].forEach(d => {
      const g = new THREE.Group();
      const back = new THREE.Mesh(new THREE.BoxGeometry(14,6,0.4), new THREE.MeshStandardMaterial({color:0x050505}));
      g.add(back);
      const borderMat = new THREE.MeshStandardMaterial({color:d.accent,emissive:d.accent,emissiveIntensity:0.5});
      const border = new THREE.Mesh(new THREE.BoxGeometry(14.5,6.5,0.2), borderMat);
      border.position.z = -0.2; g.add(border);
      [-4.5,4.5].forEach(x => {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,14,6), new THREE.MeshStandardMaterial({color:0x333333}));
        pole.position.set(x,-10,0); g.add(pole);
      });
      g.position.set(d.x,10,d.z);
      g.rotation.y = d.rotY;
      scene.add(g);
      billboards.push({material:borderMat, offset:Math.random()*Math.PI*2});
    });
  },
  update(delta) {
    time += delta;
    billboards.forEach(b => { b.material.emissiveIntensity = 0.6 + Math.sin(time*1.5+b.offset)*0.35; });
  }
};
