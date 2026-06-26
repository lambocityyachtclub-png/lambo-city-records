import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================================================
   🎬 CAMERA SETUP
========================================================= */

engine.camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  7000
);

engine.camera.position.set(0, 10, 18);

/* =========================================================
   🎥 RENDERER SETUP
========================================================= */

engine.renderer = new THREE.WebGLRenderer({ antialias: true });

engine.renderer.setSize(window.innerWidth, window.innerHeight);
engine.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

engine.renderer.outputColorSpace = THREE.SRGBColorSpace;
engine.renderer.toneMapping = THREE.ACESFilmicToneMapping;
engine.renderer.toneMappingExposure = 1.3;

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(engine.renderer.domElement);

/* =========================================================
   🎮 GAME LOOP (ONLY RESPONSIBILITY)
========================================================= */

const camTarget = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);

 if (engine.updatePlayer) engine.updatePlayer();
   
   // follow player if exists
  if (engine.player) {
    camTarget.copy(engine.player.position);

    engine.camera.position.x +=
      (engine.player.position.x + 0 - engine.camera.position.x) * 0.05;

    engine.camera.position.z +=
      (engine.player.position.z + 18 - engine.camera.position.z) * 0.05;

    engine.camera.position.y +=
      (10 - engine.camera.position.y) * 0.05;

    engine.camera.lookAt(camTarget);
  }

  engine.renderer.render(engine.scene, engine.camera);
}

animate();

/* =========================================================
   🪟 RESIZE HANDLER
========================================================= */

window.addEventListener("resize", () => {
  engine.camera.aspect = window.innerWidth / window.innerHeight;
  engine.camera.updateProjectionMatrix();

  engine.renderer.setSize(window.innerWidth, window.innerHeight);
});
