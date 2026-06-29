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

    return camera;
  },

  update(delta, context) {
    const player = context.player;

    if (!player) return;

    // TARGET POSITION (behind player)
    const targetX = player.position.x;
    const targetY = player.position.y + 6;
    const targetZ = player.position.z + 10;

    // SMOOTH FOLLOW (LERP STYLE)
    camera.position.x += (targetX - camera.position.x) * 0.08;
    camera.position.y += (targetY - camera.position.y) * 0.08;
    camera.position.z += (targetZ - camera.position.z) * 0.08;

    camera.lookAt(player.position);
  },

  getCamera() {
    return camera;
  }
};
