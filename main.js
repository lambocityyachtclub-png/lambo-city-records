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
requestAnimationFrame(() => {

  DockCore.init();
  CinematicFlow.init();

});

/* =========================================================
   DEBUG
========================================================= */

console.log("MAIN JS LOADED");
console.log(engine);

/* =========================================================
   LIGHTING
========================================================= */

const ambient = new THREE.AmbientLight(
  0xffffff,
  0.8
);

engine.scene.add(ambient);

const sun = new THREE.DirectionalLight(
  0xffffff,
  2
);

sun.position.set(100, 150, 100);

engine.scene.add(sun);

/* =========================================================
   CAMERA
========================================================= */

engine.camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  7000
);

engine.camera.position.set(0, 120, 400);

/* =========================================================
   RENDERER
========================================================= */

engine.renderer = new THREE.WebGLRenderer({
  antialias: true
});

engine.renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

engine.renderer.setPixelRatio(
  Math.min(window.devicePixelRatio, 2)
);

engine.renderer.outputColorSpace =
  THREE.SRGBColorSpace;

engine.renderer.toneMapping =
  THREE.ACESFilmicToneMapping;

engine.renderer.toneMappingExposure = 1.3;

document.body.style.margin = "0";
document.body.style.overflow = "hidden";

document.body.appendChild(
  engine.renderer.domElement
);

/* =========================================================
   CAMERA FOLLOW
========================================================= */

const camTarget = new THREE.Vector3();

/* =========================================================
   MAIN LOOP
========================================================= */

function animate() {
  requestAnimationFrame(animate);

  if (engine.updatePlayer)
  engine.updatePlayer();

if (engine.updateNPCs)
  engine.updateNPCs();

if (engine.updateCars)
  engine.updateCars();

if (engine.updateWater)
  engine.updateWater();

  if (CinematicFlow.update)
  CinematicFlow.update();
  
  if (engine.player) {
    camTarget.copy(engine.player.position);

    engine.camera.position.x +=
      (engine.player.position.x -
        engine.camera.position.x) * 0.05;

    engine.camera.position.z +=
      (engine.player.position.z + 18 -
        engine.camera.position.z) * 0.05;

    engine.camera.position.y +=
      (10 -
        engine.camera.position.y) * 0.05;

    engine.camera.lookAt(camTarget);
  }

  engine.renderer.render(
    engine.scene,
    engine.camera
  );
}

animate();

/* =========================================================
   RESIZE
========================================================= */

window.addEventListener("resize", () => {
  engine.camera.aspect =
    window.innerWidth /
    window.innerHeight;

  engine.camera.updateProjectionMatrix();

  engine.renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );
});
