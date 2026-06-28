import { initWorldSkin } from "./cinematicWorldSkin.js";

import "./scene.js";
import "./world.js";
import "./player.js";
import "./input.js";
import "./npc.js";
import "./cars.js";
import "./water.js";
import "./dock.js";

import { engine } from "./engine.js";
import { DockCore } from "./cinematicDockCore.js";
import { CinematicFlow } from "./cinematicFlowSystem.js";

/* =========================================================
   🎬 BOOT SEQUENCE
========================================================= */

function boot() {

  console.log("🎬 LAMBO CITY BOOTING...");

  /* =====================================================
     🌍 WORLD VISUAL LAYER
  ===================================================== */

  initWorldSkin();

  /* =====================================================
     🎬 CINEMATIC SYSTEMS
  ===================================================== */

  DockCore.init();
  CinematicFlow.init();

  /* =====================================================
     ⏳ WAIT 1 FRAME FOR SYSTEMS TO ATTACH
  ===================================================== */

  requestAnimationFrame(() => {

    /* =====================================================
       🧠 REGISTER SYSTEMS
    ===================================================== */

    if (engine.updatePlayer) engine.registerSystem(engine.updatePlayer);
    if (engine.updateCamera) engine.registerSystem(engine.updateCamera);
    if (engine.updateNPCs) engine.registerSystem(engine.updateNPCs);
    if (engine.updateCars) engine.registerSystem(engine.updateCars);
    if (engine.updateWater) engine.registerSystem(engine.updateWater);

    if (CinematicFlow.update)
      engine.registerSystem(() => CinematicFlow.update());

    if (DockCore.update)
      engine.registerSystem(() => DockCore.update());

    /* =====================================================
       🎮 START ENGINE (ONLY ONCE)
    ===================================================== */

    engine.start();

    console.log("🎮 LAMBO CITY READY");
  });
}

/* =========================================================
   ⏳ SAFE START
========================================================= */

window.addEventListener("load", boot);
