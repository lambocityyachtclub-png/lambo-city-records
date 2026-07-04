import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
export default {
  init(scene) {
    var canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 1024;
    var ctx = canvas.getContext('2d');
    var gradient = ctx.createLinearGradient(0, 0, 0, 1024);
    gradient.addColorStop(0.00, '#020008');
    gradient.addColorStop(0.22, '#0d0428');
    gradient.addColorStop(0.42, '#4a0d6e');
    gradient.addColorStop(0.58, '#9e1a2a');
    gradient.addColorStop(0.70, '#cc3300');
    gradient.addColorStop(0.80, '#ee6600');
    gradient.addColorStop(0.89, '#ff9900');
    gradient.addColorStop(0.95, '#ffaa00');
    gradient.addColorStop(1.00, '#004466');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 4, 1024);
    var tex = new THREE.CanvasTexture(canvas);
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(450, 32, 32),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, depthWrite: false })
    ));
    // STARS
    var starGeo = new THREE.BufferGeometry();
    var count = 1200;
    var pos = new Float32Array(count * 3);
    var i = 0;
    while (i < count) {
      pos[i*3]   = (Math.random()-0.5)*700;
      pos[i*3+1] = Math.random()*280+30;
      pos[i*3+2] = (Math.random()-0.5)*700;
      i++;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(starGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, transparent: true, opacity: 0.8 })
    ));
    // MOON
    var moon = new THREE.Mesh(
      new THREE.SphereGeometry(7, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfffde0 })
    );
    moon.position.set(-120, 180, -280);
    scene.add(moon);
  },
  update() {}
};
