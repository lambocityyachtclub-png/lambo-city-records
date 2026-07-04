import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
export default {
  init(scene) {
    var canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 512;
    var ctx = canvas.getContext('2d');
    var gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0.00, '#080018');
    gradient.addColorStop(0.30, '#2d0a50');
    gradient.addColorStop(0.55, '#8b1a1a');
    gradient.addColorStop(0.75, '#dd4400');
    gradient.addColorStop(0.88, '#ff7700');
    gradient.addColorStop(1.00, '#004466');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 4, 512);
    var tex = new THREE.CanvasTexture(canvas);
    var sky = new THREE.Mesh(
      new THREE.SphereGeometry(450, 32, 32),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, depthWrite: false })
    );
    scene.add(sky);
    // STARS
    var starGeo = new THREE.BufferGeometry();
    var count = 1000;
    var pos = new Float32Array(count * 3);
    var i = 0;
    while (i < count) {
      pos[i*3]   = (Math.random()-0.5)*700;
      pos[i*3+1] = Math.random()*250+40;
      pos[i*3+2] = (Math.random()-0.5)*700;
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
    moon.position.set(-100, 160, -260);
    scene.add(moon);
  },
  update() {}
};
