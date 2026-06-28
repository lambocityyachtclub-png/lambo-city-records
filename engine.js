import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export const engine = {
  scene: null,
  camera: null,
  renderer: null,

  world: new THREE.Group(),

  player: null,

  keys: {},

  systems: [],

  clock: new THREE.Clock(),
  delta: 0,
  elapsed: 0,

  registerSystem(fn) {
    this.systems.push(fn);
  },

  start() {
    const loop = () => {
      requestAnimationFrame(loop);

      this.delta = this.clock.getDelta();
      this.elapsed += this.delta;

      for (const sys of this.systems) {
        sys(this);
      }

      if (this.updateCamera) {
        this.updateCamera(this);
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };

    loop();
  }
};
