import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
let jetSkis = [], time = 0;
export default {
  init(scene) {
    // PERF: removed the per-jet-ski and per-buoy PointLights. Both already have their
    // own bright emissive materials (neon strip emissiveIntensity 3, buoy 0.6), so the
    // visual glow is unchanged — only the expensive real-time cast light is gone.
    [{x:18,z:-8,rot:-0.3},{x:22,z:-22,rot:0.2},{x:20,z:-38,rot:-0.1},{x:-20,z:-30,rot:0.4}].forEach(d => {
      const js = new THREE.Group();
      const hull = new THREE.Mesh(new THREE.BoxGeometry(4,0.8,1.8), new THREE.MeshStandardMaterial({color:0x111111,metalness:0.8,roughness:0.2}));
      hull.position.y = 0.4; js.add(hull);
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.8,0.5,1.4), new THREE.MeshStandardMaterial({color:0x1a1a1a}));
      seat.position.set(0,1.0,0); js.add(seat);
      const neon = new THREE.Mesh(new THREE.BoxGeometry(4.1,0.08,0.08), new THREE.MeshStandardMaterial({color:0x00ffff,emissive:0x00ffff,emissiveIntensity:3.5}));
      neon.position.set(0,0.15,0.95); js.add(neon);
      js.position.set(d.x,-0.2,d.z);
      js.rotation.y = d.rot;
      scene.add(js); jetSkis.push(js);
    });
    [-22,22].forEach(x => {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.7,8,8), new THREE.MeshStandardMaterial({color:0xff4400,emissive:0xff2200,emissiveIntensity:1.0}));
      b.position.set(x,0.3,-22); scene.add(b);
    });
  },
  update(delta) {
    time += delta;
    jetSkis.forEach((js,i) => {
      js.position.y = -0.2 + Math.sin(time*0.8+i)*0.12;
      js.rotation.z = Math.sin(time*0.5+i)*0.04;
    });
  }
};
