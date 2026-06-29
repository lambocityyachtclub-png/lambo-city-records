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
    const player = context.player?.getPlayer?.();
    if (!player) return;

    // THIRD PERSON FOLLOW CAMERA
    camera.position.x = player.position.x;
    camera.position.z = player.position.z + 10;
    camera.position.y = 6;

    camera.lookAt(player.position);
  },

  getCamera() {
    return camera;
  }
};
