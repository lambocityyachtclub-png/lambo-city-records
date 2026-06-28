import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export const engine = {

  // CORE
  scene: new THREE.Scene(),
  camera: null,
  renderer: null,

  // WORLD ROOT
  world: new THREE.Group(),

  // GAME OBJECTS
  player: null,

  // INPUT
  keys: {},

  // SYSTEMS (ORDERED EXECUTION)
  systems: [],

  registerSystem(fn) {
    if (typeof fn === "function") {
      this.systems.push(fn);
    }
  },

  // CLOCK
  clock: new THREE.Clock(),
  delta: 0,
  elapsed: 0,

  // START ENGINE LOOP (ONLY LOOP THAT EXISTS)
  start() {

    const loop = () => {

      requestAnimationFrame(loop);

      this.delta = this.clock.getDelta();
      this.elapsed += this.delta;

      // RUN SYSTEMS SAFELY
      for (const sys of this.systems) {
        try {
          sys(this);
        } catch (e) {
          console.warn("System error:", e);
        }
      }

      // RENDER (ONLY HERE)
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };

    loop();
  }
};

// ATTACH WORLD
engine.scene.add(engine.world);
