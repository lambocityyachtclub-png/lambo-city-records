import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
export default {
  init(scene) {
    const canvas = document.createElement('canvas');
    canvas.width = 4; canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 1024);
    g.addColorStop(0.00, '#020008');
    g.addColorStop(0.22, '#0d0428');
    g.addColorStop(0.42, '#4a0d6e');
    g.addColorStop(0.58, '#9e1a2a');
    g.addColorStop(0.70, '#cc3300');
    g.addColorStop(0.80, '#ee6600');
    g.addColorStop(0.89, '#ff9900');
    g.addColorStop(1.00, '#004466');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 1024);
    const tex = new THREE.CanvasTexture(canvas);
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(480, 32, 32),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, depthWrite: false })
    ));
    const starGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(1200 * 3);
    let i = 0;
    while (i < 1200) {
      pos[i*3]   = (Math.random()-0.5)*700;
      pos[i*3+1] = Math.random()*280+30;
      pos[i*3+2] = (Math.random()-0.5)*700;
      i++;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, transparent: true, opacity: 0.8 })));
    const moon = new THREE.Mesh(new THREE.SphereGeometry(7,16,16), new THREE.MeshBasicMaterial({ color: 0xfffde0 }));
    moon.position.set(-120, 180, -280);
    scene.add(moon);
  },
  update() {}
};
