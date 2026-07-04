import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
export default {
  init(scene) {
    [{x:-28,z:8,color:0xffcc00,rot:0.2},{x:-32,z:-14,color:0xffffff,rot:0.1},
     {x:28,z:8,color:0x111111,rot:-0.2},{x:32,z:-14,color:0xff2200,rot:-0.1}
    ].forEach(d => {
      const car = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(5,1.1,2.5), new THREE.MeshStandardMaterial({color:d.color,metalness:0.9,roughness:0.1}));
      body.position.y = 0.55; car.add(body);
      const cab = new THREE.Mesh(new THREE.BoxGeometry(2.8,0.9,2.2), new THREE.MeshStandardMaterial({color:d.color,metalness:0.9,roughness:0.1}));
      cab.position.set(-0.2,1.5,0); car.add(cab);
      const wm = new THREE.MeshStandardMaterial({color:0x111111});
      const rm = new THREE.MeshStandardMaterial({color:0xcccccc,metalness:1});
      [[1.6,1.3],[1.6,-1.3],[-1.6,1.3],[-1.6,-1.3]].forEach(w => {
        const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.4,0.35,10),wm);
        wh.rotation.z = Math.PI/2; wh.position.set(w[0],0.4,w[1]); car.add(wh);
        const ri = new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.18,0.36,8),rm);
        ri.rotation.z = Math.PI/2; ri.position.set(w[0],0.4,w[1]); car.add(ri);
      });
      const ng = new THREE.Mesh(new THREE.BoxGeometry(5,0.05,2.5), new THREE.MeshStandardMaterial({color:0x9900ff,emissive:0x9900ff,emissiveIntensity:2}));
      ng.position.y = 0.05; car.add(ng);
      const gl = new THREE.PointLight(0x9900ff,1.5,6);
      gl.position.set(0,0.3,0); car.add(gl);
      car.position.set(d.x,0.65,d.z);
      car.rotation.y = d.rot;
      scene.add(car);
    });
  },
  update() {}
};
