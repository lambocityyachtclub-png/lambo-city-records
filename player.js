import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================================================
   🧍 PLAYER (CINEMATIC PHYSICS CORE - CLEAN VERSION)
========================================================= */

const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 1),
  new THREE.MeshStandardMaterial({ color: 0x00ffcc })
);

// spawn
player.position.set(0, 1, 200);
engine.player = player;

/* =========================================================
   🌍 ADD TO WORLD (SAFE - NO RACE CONDITION LOOP)
========================================================= */

engine.world.add(player);

/* =========================================================
   🧠 PHYSICS STATE
========================================================= */

const velocity = new THREE.Vector3();
const input = new THREE.Vector3();

/* =========================================================
   ⚙ CONFIG (FEEL TUNING)
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

  if (!engine.keys) return;

  const keys = engine.keys;

  /* =========================
     INPUT
  ========================= */

  input.set(0, 0, 0);

  if (keys["KeyW"]) input.z -= 1;
  if (keys["KeyS"]) input.z += 1;
  if (keys["KeyA"]) input.x -= 1;
  if (keys["KeyD"]) input.x += 1;

  if (input.lengthSq() > 0) input.normalize();

  /* =========================
     ACCELERATION
  ========================= */

  velocity.x += input.x * config.acceleration;
  velocity.z += input.z * config.acceleration;

  /* clamp speed */
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

  /* =========================
     FRICTION
  ========================= */

  velocity.multiplyScalar(config.friction);

  /* =========================
     APPLY MOVEMENT
  ========================= */

  player.position.x += velocity.x;
  player.position.z += velocity.z;

  /* =========================
     ROTATION (CINEMATIC FEEL)
  ========================= */

  if (velocity.lengthSq() > 0.001) {

    const targetRotation = Math.atan2(velocity.x, velocity.z);

    player.rotation.y = THREE.MathUtils.lerp(
      player.rotation.y,
      targetRotation,
      0.15
    );
  }

  /* =========================
     OUTPUT TO ENGINE
  ========================= */

  engine.playerVelocity.copy(velocity);
}

engine.updatePlayer = updatePlayer;
