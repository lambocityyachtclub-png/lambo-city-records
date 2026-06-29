import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {
    // FORCE SCENE BACKGROUND TO DARK
    scene.background = new THREE.Color(0x003366);

    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 1024);
    gradient.addColorStop(0.00, '#050510');
    gradient.addColorStop(0.20, '#0d0830');
    gradient.addColorStop(0.45, '#6b1a6b');
    gradient.addColorStop(0.65, '#cc3300');
    gradient.addColorStop(0.80, '#ff6600');
    gradient.addColorStop(1.00, '#003366'); // MATCH WATER at horizon
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 4, 1024);

    const tex = new THREE.CanvasTexture(canvas);

    // SMALLER SPHERE so water shows beyond it
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(500, 32, 32),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, depthWrite: false })
    );
    scene.add(sky);

    // STARS
    const starGeo = new THREE.BufferGeometry();
    const count = 2000;
    const pos = new Float32Array(count * 3);
    var i = 0;
    while (i < count) {
      const x = (Math.random() - 0.5) * 800;
      const y = Math.random() * 300 + 30;
      const z = (Math.random() - 0.5) * 800;
      pos[i * 3]     = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      i++;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.6, transparent: true, opacity: 0.9 })
    ));

    // MOON
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(7, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfffde0 })
    );
    moon.position.set(-100, 160, -280);
    scene.add(moon);
  },
  update() {}
};
