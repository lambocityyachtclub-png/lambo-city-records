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

  console.log("LAMBO CITY BOOT");

  // WORLD STYLE FIRST
  initWorldSkin();
  initCameraSystem();
   
  // CINEMATIC SYSTEMS
  DockCore.init();
  CinematicFlow.init();

  // REGISTER GAME SYSTEMS
  if (engine.updatePlayer) engine.registerSystem(engine.updatePlayer);
  if (engine.updateCamera) engine.registerSystem(engine.updateCamera);
  if (engine.updateNPCs) engine.registerSystem(engine.updateNPCs);
  if (engine.updateCars) engine.registerSystem(engine.updateCars);

  if (CinematicFlow.update)
    engine.registerSystem(() => CinematicFlow.update(engine));

  if (DockCore.update)
    engine.registerSystem(() => DockCore.update(engine));

  // START ENGINE
  engine.start();

  console.log("LAMBO CITY READY");
}

window.addEventListener("load", boot);
