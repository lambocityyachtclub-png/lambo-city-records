import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export const engine = {
  scene: new THREE.Scene(),
  camera: null,
  renderer: null,

  world: new THREE.Group(),

  clock: new THREE.Clock(),
  delta: 0,
  elapsed: 0,

  updateCamera: null,

  start() {
    const loop = () => {
      requestAnimationFrame(loop);

      this.delta = this.clock.getDelta();
      this.elapsed += this.delta;

      if (this.updateCamera) this.updateCamera();

      // 🔥 CRITICAL: render WORLD, not scene
      this.renderer.render(this.world, this.camera);
    };

    loop();
  }
};
