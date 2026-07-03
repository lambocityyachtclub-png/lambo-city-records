import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
let camera;
let cinTime = 0;
export default {
  init() {
    camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 12, 28);
    camera.lookAt(0, 2, 0);
    window.addEventListener('resize', function() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    });
    return camera;
  },
  update(delta, context) {
    var player = context.player;
    if (!player) return;
    cinTime += delta;
    var drift = Math.sin(cinTime * 0.25) * 1.5;
    var targetX = player.position.x + drift;
    var targetY = player.position.y + 9;
    var targetZ = player.position.z + 20;
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (targetY - camera.position.y) * 0.05;
    camera.position.z += (targetZ - camera.position.z) * 0.05;
    camera.lookAt(player.position.x, player.position.y + 2, player.position.z);
  },
  getCamera() { return camera; }
};
