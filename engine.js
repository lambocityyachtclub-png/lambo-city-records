import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export const engine = {

  /* =====================================================
     CORE
  ===================================================== */

  scene: new THREE.Scene(),
  camera: null,
  renderer: null,

  /* =====================================================
     WORLD ROOT
  ===================================================== */

  world: new THREE.Group(),

  player: null,
  npcs: [],
  cars: [],

  /* =====================================================
     INPUT
  ===================================================== */

  keys: {},

  /* =====================================================
     TIME SYSTEM
  ===================================================== */

  clock: new THREE.Clock(),
  delta: 0,
  elapsed: 0,

  /* =====================================================
     PHYSICS
  ===================================================== */

  playerVelocity: new THREE.Vector3(),

  /* =====================================================
     SYSTEM REGISTRY (IMPORTANT UPGRADE)
  ===================================================== */

  systems: [],

  registerSystem(fn) {
    if (typeof fn === "function") {
      this.systems.push(fn);
    }
  },

  /* =====================================================
     GAME STATE (SINGLE SOURCE OF TRUTH)
  ===================================================== */

  state: {
    phase: "DOCK",
    cinematicPhase: "DOCK",
    weather: "CLEAR",
    timeOfDay: "SUNSET"
  },

  /* =====================================================
     MAIN UPDATE LOOP (ENGINE OWNED)
  ===================================================== */

  start() {

    const loop = () => {

      requestAnimationFrame(loop);

      this.delta = this.clock.getDelta();
      this.elapsed += this.delta;

      /* ================================================
         RUN SYSTEMS (ORDERED CONTROL)
      ================================================ */

      for (const sys of this.systems) {
        if (typeof sys === "function") sys();
      }

      /* ================================================
         RENDER SAFETY CHECK
      ================================================ */

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };

    loop();
  }
};

/* =====================================================
   ATTACH WORLD ONCE
===================================================== */

engine.scene.add(engine.world);
