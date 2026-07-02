import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 1024);
    gradient.addColorStop(0.00, '#020008');
    gradient.addColorStop(0.20, '#0d0428');
    gradient.addColorStop(0.40, '#3d0d5c');
    gradient.addColorStop(0.58, '#8b1a1a');
    gradient.addColorStop(0.72, '#cc4400');
    gradient.addColorStop(0.84, '#ff6600');
    gradient.addColorStop(0.93, '#ff8800');
    gradient.addColorStop(1.00, '#005577');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 4, 1024);

    const tex = new THREE.CanvasTexture(canvas);
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(480, 32, 32),
      new THREE.MeshBasicMaterial({
        map: tex, side: THREE.BackSide, depthWrite: false
      })
    ));

    // STARS
    const starGeo = new THREE.BufferGeometry();
    const count = 1200;
    const pos = new Float32Array(count * 3);
    let i = 0;
    while (i < count) {
      pos[i*3]   = (Math.random()-0.5)*800;
      pos[i*3+1] = Math.random()*300+30;
      pos[i*3+2] = (Math.random()-0.5)*800;
      i++;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(starGeo,
      new THREE.PointsMaterial({ color:0xffffff, size:0.5, transparent:true, opacity:0.8 })
    ));

    // MOON
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(7,16,16),
      new THREE.MeshBasicMaterial({ color: 0xfffde0 })
    );
    moon.position.set(-100, 160, -260);
    scene.add(moon);

    // MOON GLOW
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(13,16,16),
      new THREE.MeshBasicMaterial({ color:0xffffaa, transparent:true, opacity:0.05 })
    );
    halo.position.copy(moon.position);
    scene.add(halo);
  },
  update() {}
};
