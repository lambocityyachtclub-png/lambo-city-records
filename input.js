import { engine } from "./engine.js";

/* =========================================================
   🎮 LAMBO CITY INPUT SYSTEM (SCALED CONTROLLER CORE)
========================================================= */

/* RAW KEY STATE */
const keys = {};

/* ACTION MAP (ABSTRACTION LAYER) */
engine.controls = {
  moveForward: false,
  moveBackward: false,
  moveLeft: false,
  moveRight: false,

  sprint: false,
  interact: false,
  jump: false,

  /* FUTURE SYSTEM HOOKS */
  skate: false,
  cameraToggle: false
};

/* =========================================================
   ⌨ KEY DOWN
========================================================= */

window.addEventListener("keydown", (e) => {
  keys[e.code] = true;

  syncControls();
});

/* =========================================================
   ⌨ KEY UP
========================================================= */

window.addEventListener("keyup", (e) => {
  keys[e.code] = false;

  syncControls();
});

/* =========================================================
   🧠 INPUT TRANSLATION LAYER
========================================================= */

function syncControls() {

  engine.controls.moveForward = !!keys["KeyW"];
  engine.controls.moveBackward = !!keys["KeyS"];
  engine.controls.moveLeft = !!keys["KeyA"];
  engine.controls.moveRight = !!keys["KeyD"];

  engine.controls.sprint = !!keys["ShiftLeft"];

  engine.controls.interact = !!keys["KeyE"];

  engine.controls.jump = !!keys["Space"];

  /* FUTURE SYSTEMS */
  engine.controls.skate = !!keys["KeyQ"];
  engine.controls.cameraToggle = !!keys["KeyC"];
}

/* =========================================================
   🧠 DEBUG EXPORT
========================================================= */

engine.keys = keys;
