import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export const engine = {
  scene: new THREE.Scene(),
  camera: null,
  renderer: null,
  world: new THREE.Group(),

  systems: [],

  clock: new THREE.Clock(),
  delta: 0,
  elapsed: 0,

  updateCamera: null,

  start() {
    const loop = () => {
      requestAnimationFrame(loop);

      this.delta = this.clock.getDelta();
      this.elapsed += this.delta;

      for (const sys of this.systems) {
        sys(this);
      }

      if (this.updateCamera) {
        this.updateCamera();
      }

      // 🔥 HARD GUARANTEE RENDER TARGETS
      if (this.scene && this.camera && this.renderer) {
        this.renderer.render(this.scene, this.camera);
      }
    };

    loop();
  }
};
