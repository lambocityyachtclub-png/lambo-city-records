import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export const engine = {
  scene: new THREE.Scene(),
  camera: null,
  renderer: null,

  world: new THREE.Group(),

  player: null,
  keys: {},

  systems: [],

  registerSystem(fn) {
    this.systems.push(fn);
  },

  start() {
    const loop = () => {
      requestAnimationFrame(loop);

      for (const sys of this.systems) {
        sys();
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };

    loop();
  }
};

engine.scene.add(engine.world);
