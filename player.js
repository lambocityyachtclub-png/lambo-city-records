import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================================================
   🧍 PLAYER (CINEMATIC PHYSICS CORE)
========================================================= */

const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 1),
  new THREE.MeshStandardMaterial({ color: 0x00ffcc })
);

// Start at dock spawn (cinematic ground focus)
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
   🧠 PHYSICS STATE (IMPORTANT UPGRADE)
========================================================= */

// velocity
const velocity = new THREE.Vector3(0, 0, 0);

// movement tuning (THIS is your “feel system”)
const config = {
  acceleration: 0.12,
  maxSpeed: 1.8,
  friction: 0.86,
  turnSharpness: 0.92
};

/* =========================================================
   🎮 INPUT VECTOR
========================================================= */

const input = new THREE.Vector3(0, 0, 0);

/* =========================================================
   🛹 MAIN UPDATE LOOP
========================================================= */

function updatePlayer() {
  const keys = engine.keys;

  // reset input each frame
  input.set(0, 0, 0);

  // movement input
  if (keys["KeyW"]) input.z -= 1;
  if (keys["KeyS"]) input.z += 1;
  if (keys["KeyA"]) input.x -= 1;
  if (keys["KeyD"]) input.x += 1;

  // normalize diagonal movement
  if (input.length() > 0) input.normalize();

  /* =========================================================
     ⚡ ACCELERATION (REAL FEEL)
  ========================================================= */

  velocity.x += input.x * config.acceleration;
  velocity.z += input.z * config.acceleration;

  // clamp max speed (GTA-style control cap)
  velocity.x = THREE.MathUtils.clamp(velocity.x, -config.maxSpeed, config.maxSpeed);
  velocity.z = THREE.MathUtils.clamp(velocity.z, -config.maxSpeed, config.maxSpeed);

  /* =========================================================
     🌫 FRICTION (GROUND FEEL)
  ========================================================= */

  velocity.x *= config.friction;
  velocity.z *= config.friction;

  /* =========================================================
     📍 APPLY MOVEMENT
  ========================================================= */

  player.position.x += velocity.x;
  player.position.z += velocity.z;

  /* =========================================================
     🎯 ORIENTATION (FUTURE CAMERA LINK HOOK)
  ========================================================= */

  const moveDir = new THREE.Vector3(velocity.x, 0, velocity.z);

  if (moveDir.length() > 0.01) {
    player.rotation.y = THREE.MathUtils.lerp(
      player.rotation.y,
      Math.atan2(velocity.x, velocity.z),
      0.15
    );
  }

  /* =========================================================
     🧠 ENGINE HOOK (FOR CAMERA + ZONES)
  ========================================================= */

  engine.playerVelocity = velocity;
}

engine.updatePlayer = updatePlayer;
