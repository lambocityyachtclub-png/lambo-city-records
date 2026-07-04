import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
export default {
  init(scene) {
    const woodMat  = new THREE.MeshStandardMaterial({ color: 0x8b5e3c, roughness: 0.9 });
    const plankMat = new THREE.MeshStandardMaterial({ color: 0xa0693a, roughness: 0.85 });
    const postMat  = new THREE.MeshStandardMaterial({ color: 0x5c3d1e, roughness: 1 });
    const railMat  = new THREE.MeshStandardMaterial({ color: 0x3a2510, roughness: 0.8 });
    const Y = 1.0;
    const base = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 100), woodMat);
    base.position.set(0, Y, -20);
    scene.add(base);
    for (let z = -65; z < 35; z += 2) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(13.5, 0.15, 1.2), plankMat);
      p.position.set(0, Y+0.28, z);
      scene.add(p);
    }
    [-6,6].forEach(x => {
      for (let z = -65; z < 35; z += 8) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,8,8), postMat);
        post.position.set(x, Y-3.5, z);
        scene.add(post);
      }
    });
    [-6.2,6.2].forEach(x => {
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.12,0.6,100), railMat);
      r.position.set(x, Y+0.6, -20);
      scene.add(r);
    });
    for (let z = -60; z < 30; z += 8) {
      [-5.5,5.5].forEach(x => {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,2.5,6), new THREE.MeshStandardMaterial({color:0x222222}));
        pole.position.set(x, Y+1.5, z);
        scene.add(pole);
        const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.4,0.5,0.4), new THREE.MeshStandardMaterial({color:0xffcc44,emissive:0xffaa00,emissiveIntensity:2.5}));
        lantern.position.set(x, Y+2.9, z);
        scene.add(lantern);
        const glow = new THREE.PointLight(0xffaa33, 2.5, 9);
        glow.position.set(x, Y+2.9, z);
        scene.add(glow);
      });
    }
  },
  update() {}
};
