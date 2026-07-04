import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
export default {
  init(scene) {
    var canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 1024;
    var ctx = canvas.getContext('2d');
    var gradient = ctx.createLinearGradient(0, 0, 0, 1024);
    gradient.addColorStop(0.00, '#020010');
    gradient.addColorStop(0.18, '#0a0428');
    gradient.addColorStop(0.35, '#3a0d55');
    gradient.addColorStop(0.50, '#7a1530');
    gradient.addColorStop(0.62, '#cc2200');
    gradient.addColorStop(0.74, '#ee5500');
    gradient.addColorStop(0.84, '#ff8800');
    gradient.addColorStop(0.92, '#ffaa00');
    gradient.addColorStop(1.00, '#003355');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 4, 1024);

    var tex = new THREE.CanvasTexture(canvas);
    var sky = new THREE.Mesh(
      new THREE.SphereGeometry(450, 32, 32),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, depthWrite: false })
    );
    scene.add(sky);

    // STARS — upper only
    var starGeo = new THREE.BufferGeometry();
    var count = 1000;
    var pos = new Float32Array(count * 3);
    var i = 0;
    while (i < count) {
      pos[i*3]   = (Math.random()-0.5) * 700;
      pos[i*3+1] = Math.random() * 250 + 50;
      pos[i*3+2] = (Math.random()-0.5) * 700;
      i++;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(starGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, transparent: true, opacity: 0.7 })
    ));

    // MOON
    var moon = new THREE.Mesh(
      new THREE.SphereGeometry(7, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfffde0 })
    );
    moon.position.set(-120, 180, -280);
    scene.add(moon);

    // MOON GLOW
    var halo = new THREE.Mesh(
      new THREE.SphereGeometry(13, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0.06 })
    );
    halo.position.copy(moon.position);
    scene.add(halo);

    // HORIZON GLOW — warm orange band at waterline
    var horizonGeo = new THREE.SphereGeometry(440, 32, 8);
    var horizonMat = new THREE.MeshBasicMaterial({
      color: 0xff6600, transparent: true, opacity: 0.12, side: THREE.BackSide
    });
    scene.add(new THREE.Mesh(horizonGeo, horizonMat));
  },
  update() {}
};
