import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================================================
   🎥 LAMBO CITY — CINEMATIC CAMERA SYSTEM (FINAL CORE)
========================================================= */

engine.camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  20000
);

const cam = engine.camera;

/* =========================================================
   🧠 CAMERA STATE
========================================================= */

const offset = new THREE.Vector3(0, 80, 160);
const desiredPosition = new THREE.Vector3();
const lookTarget = new THREE.Vector3();

/* =========================================================
   ⚙ CONFIG
========================================================= */

const config = {
  followSmooth: 0.06,
  lookSmooth: 0.08,
  maxOffsetZ: 220,
  minOffsetZ: 120
};

/* =========================================================
   🎬 CAMERA UPDATE (CINEMATIC DIRECTOR AWARE)
========================================================= */

function updateCamera() {

  if (!engine.player) return;

  const player = engine.player;

  /* =====================================================
     🎭 CINEMATIC PHASE INPUT
  ===================================================== */

  const phase = engine.state?.cinematicPhase || "DOCK";

  /* =====================================================
     ⚡ SPEED (SAFE FALLBACK)
  ===================================================== */

  const vx = engine.playerVelocity?.x || 0;
  const vz = engine.playerVelocity?.z || 0;

  const speed = Math.sqrt(vx * vx + vz * vz);

  /* =====================================================
     🎯 PHASE-BASED CAMERA BEHAVIOR
  ===================================================== */

  let dynamicOffsetZ = offset.z;

  if (phase === "DOCK") {
    dynamicOffsetZ = offset.z;
  }

  if (phase === "BOARDWALK") {
    dynamicOffsetZ = offset.z + 20;
  }

  if (phase === "STAGE") {
    dynamicOffsetZ = offset.z + 40;
  }

  if (phase === "YACHT") {
    dynamicOffsetZ = offset.z + 80;
  }

  /* =====================================================
     ⚡ SPEED FEEL ADDITION
  ===================================================== */

  dynamicOffsetZ = THREE.MathUtils.clamp(
    dynamicOffsetZ + speed * 80,
    config.minOffsetZ,
    config.maxOffsetZ
  );

  /* =====================================================
     📍 DESIRED POSITION
  ===================================================== */

  desiredPosition.set(
    player.position.x,
    player.position.y + offset.y,
    player.position.z + dynamicOffsetZ
  );

  /* =====================================================
     🌊 SMOOTH FOLLOW
  ===================================================== */

  cam.position.lerp(desiredPosition, config.followSmooth);

  /* =====================================================
     🎯 LOOK AT (CLEAN SYSTEM - NO ROTATION CONFLICT)
  ===================================================== */

  lookTarget.lerp(player.position, config.lookSmooth);
  cam.lookAt(lookTarget);
}

/* =========================================================
   🧠 REGISTER SYSTEM
========================================================= */

engine.updateCamera = updateCamera;
