import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 1024);
    gradient.addColorStop(0.00, '#050510'); // deep night
    gradient.addColorStop(0.25, '#0d0830'); // dark purple
    gradient.addColorStop(0.50, '#6b1a6b'); // purple sunset
    gradient.addColorStop(0.70, '#cc3300'); // deep orange
    gradient.addColorStop(0.85, '#ff6600'); // orange
    gradient.addColorStop(1.00, '#ff9900'); // horizon gold
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 4, 1024);

    const tex = new THREE.CanvasTexture(canvas);
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(600, 32, 32),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide })
    );
    scene.add(sky);

    // STARS — only upper hemisphere
    const starGeo = new THREE.BufferGeometry();
    const count = 2000;
    const pos = new Float32Array(count * 3);
    let i = 0;
    while (i < count) {
      const x = (Math.random() - 0.5) * 1000;
      const y = Math.random() * 400 + 50; // only above horizon
      const z = (Math.random() - 0.5) * 1000;
      pos[i * 3]     = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      i++;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, transparent: true, opacity: 0.8 })
    ));

    // MOON
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(8, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfffde0 })
    );
    moon.position.set(-120, 180, -300);
    scene.add(moon);

    // MOON GLOW
    const moonGlow = new THREE.Mesh(
      new THREE.SphereGeometry(14, 16, 16),
      new THREE.MeshBasicMaterial({
        color: 0xffffaa,
        transparent: true,
        opacity: 0.08
      })
    );
    moonGlow.position.copy(moon.position);
    scene.add(moonGlow);
  },
  update() {}
};
