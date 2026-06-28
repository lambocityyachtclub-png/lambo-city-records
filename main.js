import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

import { engine } from "./engine.js";

import "./scene.js";
import "./world.js";
import "./player.js";
import "./input.js";
import "./npc.js";
import "./cars.js";
import "./water.js";
import "./dock.js";

import { DockCore } from "./cinematicDockCore.js";
import { CinematicFlow } from "./cinematicFlowSystem.js";
import { initWorldSkin } from "./cinematicWorldSkin.js";

/* =========================
   BOOT
========================= */

function boot() {

  console.log("🎬 LAMBO CITY BOOT");

  /* =========================
     1. WORLD FIRST
  ========================= */

  initWorldSkin();

  /* =========================
     2. CINEMATIC SYSTEMS
  ========================= */

  DockCore.init();
  CinematicFlow.init();

  /* =========================
     3. SAFETY WAIT (CRITICAL)
  ========================= */

  requestAnimationFrame(() => {

    /* =========================
       4. ENSURE CAMERA EXISTS
    ========================= */

    if (!engine.camera) {
      engine.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        20000
      );
      engine.camera.position.set(0, 20, 40);
    }

    /* =========================
       5. REGISTER SYSTEMS
    ========================= */

    if (engine.updatePlayer)
      engine.registerSystem(engine.updatePlayer);

    if (engine.updateCamera)
      engine.registerSystem(engine.updateCamera);

    if (engine.updateNPCs)
      engine.registerSystem(engine.updateNPCs);

    if (engine.updateCars)
      engine.registerSystem(engine.updateCars);

    if (CinematicFlow.update)
      engine.registerSystem(() => CinematicFlow.update(engine));

    if (DockCore.update)
      engine.registerSystem(() => DockCore.update(engine));

    /* =========================
       6. START ENGINE
    ========================= */

    engine.start();

    console.log("🎮 LAMBO CITY READY");
  });
}

window.addEventListener("load", boot);
