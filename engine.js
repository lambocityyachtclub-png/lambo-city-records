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

  /* =========================================================
     🎥 CAMERA SAFETY (FIXES YOUR “STEEL SCREEN” ISSUE)
  ========================================================= */
  ensureCamera() {
    if (!this.camera) {
      this.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        20000
      );

      this.camera.position.set(0, 20, 40);
      this.scene.add(this.camera);
    }
  },

  /* =========================================================
     🎮 ENGINE LOOP
  ========================================================= */
  start() {

    const loop = () => {

      requestAnimationFrame(loop);

      this.delta = this.clock.getDelta();
      this.elapsed += this.delta;

      // ✅ ALWAYS ENSURE CAMERA EXISTS
      this.ensureCamera();

      // RUN SYSTEMS
      for (const sys of this.systems) {
        try {
          sys(this);
        } catch (e) {
          console.warn("System error:", e);
        }
      }

      // RENDER
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };

    loop();
  }
};

// ATTACH WORLD
engine.scene.add(engine.world);
