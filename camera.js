import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================================================
   🎥 CINEMATIC CAMERA SYSTEM (GTA-STYLE CORE)
========================================================= */

engine.camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  20000
);

/* =========================================================
   🧠 CAMERA STATE
========================================================= */

const cam = engine.camera;

// target follow position
const offset = new THREE.Vector3(0, 80, 160);

// smooth position buffer
const desiredPosition = new THREE.Vector3();
const currentLookAt = new THREE.Vector3();

// damping strength (feel control)
const config = {
  followSmoothness: 0.06,
  lookSmoothness: 0.08,
  speedZoomFactor: 0.08,
  maxZoomOut: 220,
  minZoom: 120
};

/* =========================================================
   🎯 CAMERA UPDATE LOOP
========================================================= */

function updateCamera() {
  if (!engine.player) return;

  const player = engine.player;
  const velocity = engine.playerVelocity || { x: 0, z: 0 };

  /* =========================================================
     ⚡ SPEED-BASED CAMERA ZOOM (FEEL SYSTEM)
  ========================================================= */

  const speed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2);

  const dynamicOffsetZ = THREE.MathUtils.clamp(
    offset.z + speed * config.speedZoomFactor * 100,
    config.minZoom,
    config.maxZoomOut
  );

  /* =========================================================
     📍 DESIRED CAMERA POSITION
  ========================================================= */

  desiredPosition.set(
    player.position.x,
    player.position.y + offset.y,
    player.position.z + dynamicOffsetZ
  );

  /* =========================================================
     🌊 SMOOTH FOLLOW (FLOATING CINEMATIC FEEL)
  ========================================================= */

  cam.position.x += (desiredPosition.x - cam.position.x) * config.followSmoothness;
  cam.position.y += (desiredPosition.y - cam.position.y) * config.followSmoothness;
  cam.position.z += (desiredPosition.z - cam.position.z) * config.followSmoothness;

  /* =========================================================
     🎯 LOOK AT PLAYER (SMOOTH)
  ========================================================= */

  currentLookAt.lerp(player.position, config.lookSmoothness);

  cam.lookAt(currentLookAt);

  /* =========================================================
     🎬 CINEMATIC DIRECTION BIAS (IMPORTANT)
  ========================================================= */

  if (speed > 0.2) {
    cam.rotation.y += (Math.atan2(velocity.x, velocity.z) - cam.rotation.y) * 0.02;
  }
}

engine.updateCamera = updateCamera;
