import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
export default {
  init(scene) {
    const yacht = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(22,4,9), new THREE.MeshStandardMaterial({color:0xfafafa,roughness:0.2,metalness:0.5}));
    hull.position.y = 2; yacht.add(hull);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(20,0.3,8.5), new THREE.MeshStandardMaterial({color:0xe8e8e8}));
    deck.position.y = 4.15; yacht.add(deck);
    const c1 = new THREE.Mesh(new THREE.BoxGeometry(12,2.5,7), new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.1}));
    c1.position.set(1,5.5,0); yacht.add(c1);
    const c2 = new THREE.Mesh(new THREE.BoxGeometry(7,2,6), new THREE.MeshStandardMaterial({color:0xf0f0f0}));
    c2.position.set(2,7.7,0); yacht.add(c2);
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(4,1.5,5), new THREE.MeshStandardMaterial({color:0xe0e0e0}));
    bridge.position.set(3,9.5,0); yacht.add(bridge);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,14,6), new THREE.MeshStandardMaterial({color:0xcccccc,metalness:0.8}));
    mast.position.set(3,17,0); yacht.add(mast);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(12,1.5,0.15), new THREE.MeshStandardMaterial({color:0xffd700,emissive:0xffd700,emissiveIntensity:2}));
    sign.position.set(0,6,-4.6); yacht.add(sign);
    const neon = new THREE.Mesh(new THREE.BoxGeometry(22,0.2,0.2), new THREE.MeshStandardMaterial({color:0x00ffff,emissive:0x00ffff,emissiveIntensity:3}));
    neon.position.set(0,0.2,4.6); yacht.add(neon);
    [-1,1].forEach(side => {
      for (let i = 0; i < 5; i++) {
        const w = new THREE.Mesh(new THREE.BoxGeometry(1.8,1.0,0.1), new THREE.MeshStandardMaterial({color:0x88ccff,transparent:true,opacity:0.8,emissive:0x224466,emissiveIntensity:0.6}));
        w.position.set(-5+i*2.5,5.5,side*3.55); yacht.add(w);
      }
    });
    const cl = new THREE.PointLight(0x00ffff,4,50);
    cl.position.set(0,4,0); yacht.add(cl);
    const gl = new THREE.PointLight(0xffd700,2,25);
    gl.position.set(0,9,-4); yacht.add(gl);
    yacht.position.set(38,-2,-28);
    yacht.rotation.y = Math.PI/6;
    scene.add(yacht);
  },
  update() {}
};
