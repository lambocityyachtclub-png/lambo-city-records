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

    // CINEMATIC ANGLE (LOOKING DOWN MARINA)
    camera.position.set(15, 12, 25);
    camera.lookAt(0, 2, 0);

    return camera;
  },

  getCamera() {
    return camera;
  }
};
