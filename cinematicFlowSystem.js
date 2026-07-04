import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
let lights = [], time = 0;
export default {
  init(scene) {
    [0xff00ff,0x00ffff,0xffff00,0xff4400,0x00ff88].forEach((color,i) => {
      const spot = new THREE.SpotLight(color,10,140,Math.PI/14,0.5);
      spot.position.set(-20+i*10,30,-58);
      spot.target.position.set(0,0,-75);
      scene.add(spot); scene.add(spot.target);
      lights.push(spot);
    });
    const sl = new THREE.PointLight(0x9900ff,5,55);
    sl.position.set(0,10,-76); scene.add(sl); lights.push(sl);
    const nm = new THREE.MeshStandardMaterial({color:0x9900ff,emissive:0x9900ff,emissiveIntensity:2});
    [-12,-6,0,6,12].forEach(x => {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.15,0.05,18),nm);
      s.position.set(x,1.55,-70); scene.add(s);
    });
  },
  update(delta) {
    time += delta;
    lights.forEach((l,i) => {
      if (l.target) {
        l.target.position.x = Math.sin(time*0.7+i*1.2)*14;
        l.target.updateMatrixWorld();
        l.intensity = 8+Math.sin(time*2+i)*3;
      } else { l.intensity = 4+Math.sin(time*3)*2; }
    });
  }
};
