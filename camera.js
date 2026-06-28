import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================================================
   🎥 LAMBO CITY THIRD PERSON CAMERA
========================================================= */

export function initCameraSystem() {

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    20000
  );

  engine.camera = camera;

  camera.position.set(0, 8, 18);

  const desired = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();

  engine.updateCamera = function () {

    if (!engine.player) return;

    const player = engine.player;

    // Behind the player
    desired.set(
      player.position.x,
      player.position.y + 6,
      player.position.z + 18
    );

    camera.position.lerp(desired, 0.08);

    lookTarget.set(
      player.position.x,
      player.position.y + 3,
      player.position.z
    );

    camera.lookAt(lookTarget);
  };
}
