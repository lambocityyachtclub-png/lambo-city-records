import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================================================
   🧍 LAMBO CITY PLAYER SYSTEM (CINEMATIC PHYSICS CORE)
========================================================= */

const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 1),
  new THREE.MeshStandardMaterial({ color: 0x00ffcc })
);

player.position.set(0, 1, 200);
engine.player = player;

/* =========================================================
   🌍 ATTACH TO WORLD
========================================================= */

function attachPlayer() {
  if (!engine.world) {
    requestAnimationFrame(attachPlayer);
    return;
  }
  engine.world.add(player);
}
attachPlayer();

/* =========================================================
   🧠 PHYSICS STATE (PRIVATE)
========================================================= */

const velocity = new THREE.Vector3();
const input = new THREE.Vector3();

/* =========================================================
   ⚙ CONFIG (FEEL SYSTEM)
========================================================= */

const config = {
  acceleration: 0.12,
  maxSpeed: 1.8,
  friction: 0.86
};

/* =========================================================
   🎮 UPDATE LOOP
========================================================= */

function updatePlayer() {

  const keys = engine.keys;

  /* =====================================================
     🎮 INPUT VECTOR
  ===================================================== */

  input.set(0, 0, 0);

  if (keys["KeyW"]) input.z -= 1;
  if (keys["KeyS"]) input.z += 1;
  if (keys["KeyA"]) input.x -= 1;
  if (keys["KeyD"]) input.x += 1;

  if (input.length() > 0) input.normalize();

  /* =====================================================
     ⚡ ACCELERATION
  ===================================================== */

  velocity.x += input.x * config.acceleration;
  velocity.z += input.z * config.acceleration;

  velocity.x = THREE.MathUtils.clamp(
    velocity.x,
    -config.maxSpeed,
    config.maxSpeed
  );

  velocity.z = THREE.MathUtils.clamp(
    velocity.z,
    -config.maxSpeed,
    config.maxSpeed
  );

  /* =====================================================
     🌫 FRICTION
  ===================================================== */

  velocity.multiplyScalar(config.friction);

  /* =====================================================
     📍 APPLY MOVEMENT
  ===================================================== */

  player.position.add(velocity);

  /* =====================================================
     🎯 ROTATION (MOVEMENT-BASED ORIENTATION)
  ===================================================== */

  const moveDir = velocity.clone();

  if (moveDir.length() > 0.01) {

    const targetRotation = Math.atan2(
      velocity.x,
      velocity.z
    );

    player.rotation.y = THREE.MathUtils.lerp(
      player.rotation.y,
      targetRotation,
      0.15
    );
  }

  /* =====================================================
     🧠 ENGINE OUTPUT (SAFE COPY)
  ===================================================== */

  engine.playerVelocity = velocity.clone();
}

engine.updatePlayer = updatePlayer;
