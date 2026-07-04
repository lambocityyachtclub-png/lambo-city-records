import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
let camera;
let cinTime = 0;
export default {
  init() {
    camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 16, 30);
    camera.lookAt(0, 2, 0);
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    });
    return camera;
  },
  update(delta, context) {
    const player = context.player;
    if (!player) return;
    cinTime += delta;
    const drift = Math.sin(cinTime * 0.25) * 1.2;
    const tx = player.position.x + drift;
    const ty = player.position.y + 13;
    const tz = player.position.z + 22;
    camera.position.x += (tx - camera.position.x) * 0.06;
    camera.position.y += (ty - camera.position.y) * 0.06;
    camera.position.z += (tz - camera.position.z) * 0.06;
    camera.lookAt(player.position.x, player.position.y + 2, player.position.z - 5);
  },
  getCamera() { return camera; }
};
