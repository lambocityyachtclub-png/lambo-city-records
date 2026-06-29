import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let camera;

export default {
  init() {
    camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    // START POSITION — behind spawn point, above dock
    camera.position.set(0, 8, 20);
    camera.lookAt(0, 2, 0);
    return camera;
  },
  update(delta, context) {
    const player = context.player;
    if (!player) return;

    const targetX = player.position.x;
    const targetY = player.position.y + 6;
    const targetZ = player.position.z + 14;

    camera.position.x += (targetX - camera.position.x) * 0.06;
    camera.position.y += (targetY - camera.position.y) * 0.06;
    camera.position.z += (targetZ - camera.position.z) * 0.06;

    camera.lookAt(
      player.position.x,
      player.position.y + 1.5,
      player.position.z
    );
  },
  getCamera() {
    return camera;
  }
};
