import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 1024);
    gradient.addColorStop(0.00, '#020008');
    gradient.addColorStop(0.15, '#0a0428');
    gradient.addColorStop(0.35, '#1a0840');
    gradient.addColorStop(0.52, '#4a1060');
    gradient.addColorStop(0.68, '#8b1a4a');
    gradient.addColorStop(0.80, '#cc3300');
    gradient.addColorStop(0.90, '#ff6600');
    gradient.addColorStop(1.00, '#001833');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 4, 1024);

    const tex = new THREE.CanvasTexture(canvas);
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(500, 32, 32),
      new THREE.MeshBasicMaterial({
        map: tex, side: THREE.BackSide, depthWrite: false
      })
    );
    scene.add(sky);

    // STARS — upper hemisphere only
    const starGeo = new THREE.BufferGeometry();
    const count = 1500;
    const pos = new Float32Array(count * 3);
    let i = 0;
    while (i < count) {
      const x = (Math.random() - 0.5) * 800;
      const y = Math.random() * 300 + 20;
      const z = (Math.random() - 0.5) * 800;
      pos[i * 3]     = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      i++;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        color: 0xffffff, size: 0.5,
        transparent: true, opacity: 0.9
      })
    ));

    // MOON
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(7, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfffde0 })
    );
    moon.position.set(-120, 180, -300);
    scene.add(moon);

    // MOON HALO
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(12, 16, 16),
      new THREE.MeshBasicMaterial({
        color: 0xffffaa, transparent: true, opacity: 0.06
      })
    );
    halo.position.copy(moon.position);
    scene.add(halo);

    // HORIZON GLOW — orange band
    const glowGeo = new THREE.SphereGeometry(498, 32, 8);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff4400, transparent: true,
      opacity: 0.06, side: THREE.BackSide
    });
    scene.add(new THREE.Mesh(glowGeo, glowMat));
  },
  update() {}
};
