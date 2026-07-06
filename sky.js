import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
export default {
  init(scene) {
    const canvas = document.createElement('canvas');
    canvas.width = 4; canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 1024);
    g.addColorStop(0.00, '#010008');
    g.addColorStop(0.15, '#080318');
    g.addColorStop(0.30, '#200840');
    g.addColorStop(0.45, '#5a0d30');
    g.addColorStop(0.58, '#aa2000');
    g.addColorStop(0.70, '#dd4400');
    g.addColorStop(0.80, '#ff7700');
    g.addColorStop(0.88, '#ff9900');
    g.addColorStop(0.94, '#ffaa00');
    g.addColorStop(1.00, '#003355');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 1024);
    const tex = new THREE.CanvasTexture(canvas);
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(480, 32, 32),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, depthWrite: false })
    ));

    // CLOUDS — layered planes
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xff6633, transparent: true, opacity: 0.08,
      side: THREE.DoubleSide
    });
    for (let i = 0; i < 8; i++) {
      const cloud = new THREE.Mesh(
        new THREE.PlaneGeometry(120 + Math.random()*80, 20 + Math.random()*15),
        cloudMat
      );
      cloud.position.set(
        (Math.random()-0.5)*400,
        60 + Math.random()*80,
        -150 - Math.random()*200
      );
      cloud.rotation.x = -0.1;
      scene.add(cloud);
    }

    // STARS
    const starGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(1400*3);
    let i = 0;
    while (i < 1400) {
      pos[i*3]   = (Math.random()-0.5)*700;
      pos[i*3+1] = Math.random()*300+20;
      pos[i*3+2] = (Math.random()-0.5)*700;
      i++;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(starGeo,
      new THREE.PointsMaterial({ color:0xffffff, size:0.5, transparent:true, opacity:0.85 })
    ));

    // MOON
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(8,16,16),
      new THREE.MeshBasicMaterial({ color:0xfffde8 })
    );
    moon.position.set(-140, 200, -300);
    scene.add(moon);
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(14,16,16),
      new THREE.MeshBasicMaterial({ color:0xffffcc, transparent:true, opacity:0.05 })
    );
    halo.position.copy(moon.position);
    scene.add(halo);
  },
  update() {}
};
