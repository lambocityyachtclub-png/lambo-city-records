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
   🎬 BOOT SEQUENCE (SAFE INIT ORDER)
========================================================= */

function boot() {

  console.log("🎬 LAMBO CITY BOOTING...");

  /* =====================================================
     🎬 CINEMATIC SYSTEMS INIT
  ===================================================== */

  DockCore.init();
  CinematicFlow.init();

  /* =====================================================
     🧠 REGISTER ENGINE SYSTEMS
  ===================================================== */

  if (engine.updatePlayer) engine.registerSystem(engine.updatePlayer);
  if (engine.updateCamera) engine.registerSystem(engine.updateCamera);
  if (engine.updateNPCs) engine.registerSystem(engine.updateNPCs);
  if (engine.updateCars) engine.registerSystem(engine.updateCars);
  if (engine.updateWater) engine.registerSystem(engine.updateWater);

  if (CinematicFlow.update) engine.registerSystem(() => CinematicFlow.update());
  if (DockCore.update) engine.registerSystem(() => DockCore.update());

  /* =====================================================
     🎮 START ENGINE LOOP (ONLY ONCE)
  ===================================================== */

  engine.start();

  console.log("🎮 LAMBO CITY READY");
}

/* =========================================================
   ⏳ SAFE START (WAIT FOR BROWSER READY)
========================================================= */

window.addEventListener("load", boot);
