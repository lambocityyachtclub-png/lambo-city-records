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

  // SYSTEMS
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

  start() {
    const loop = () => {
      requestAnimationFrame(loop);

      this.delta = this.clock.getDelta();
      this.elapsed += this.delta;

      // 1. RUN SYSTEMS (game logic, animation, etc.)
      for (const sys of this.systems) {
        try {
          sys(this);
        } catch (e) {
          console.warn("System error:", e);
        }
      }

      // 2. CAMERA UPDATE (IMPORTANT: BEFORE RENDER)
      if (this.updateCamera) {
        this.updateCamera(this);
      }

      // 3. RENDER
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };

    loop();
  }
};

// ATTACH WORLD ROOT
engine.scene.add(engine.world);
