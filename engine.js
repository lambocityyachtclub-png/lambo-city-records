import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export const engine = {

  scene: new THREE.Scene(),
  camera: null,
  renderer: null,

  world: new THREE.Group(),

  player: null,
  keys: {},

  clock: new THREE.Clock(),

  systems: [],

  playerVelocity: new THREE.Vector3(),

  state: {
    phase: "DOCK"
  },

  registerSystem(fn) {
    this.systems.push(fn);
  },

  start() {

    const loop = () => {

      requestAnimationFrame(loop);

      // run systems
      for (const sys of this.systems) {
        sys();
      }

      // SAFETY RENDER CHECK
      if (!this.renderer || !this.scene || !this.camera) return;

      this.renderer.render(this.scene, this.camera);
    };

    loop();
  }
};

engine.scene.add(engine.world);
