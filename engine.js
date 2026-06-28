import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export const engine = {

  /* =====================================================
     CORE
  ===================================================== */

  scene: new THREE.Scene(),
  camera: null,
  renderer: null,

  /* =====================================================
     WORLD
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
     TIMING
  ===================================================== */

  clock: new THREE.Clock(),
  delta: 0,
  elapsed: 0,

  /* =====================================================
     PLAYER DATA
  ===================================================== */

  playerVelocity: new THREE.Vector3(),

  /* =====================================================
     UPDATE SYSTEMS
  ===================================================== */

  updatePlayer: null,
  updateCamera: null,
  updateNPCs: null,
  updateCars: null,
  updateWorld: null,

  /* =====================================================
     GAME STATE
  ===================================================== */

  state: {
    district: "DOCK",
    zone: "DOCK",
    weather: "CLEAR",
    timeOfDay: "SUNSET"
  }
};

/* =====================================================
   ATTACH WORLD ONCE
===================================================== */

engine.scene.add(engine.world);
