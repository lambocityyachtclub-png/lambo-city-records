import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================================================
   🧍 PLAYER SYSTEM
========================================================= */

// create player ONCE
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 1),
  new THREE.MeshStandardMaterial({ color: 0x00ffcc })
);

player.position.set(0, 1, 0);

// register globally
engine.player = player;
engine.world.add(player);

/* =========================================================
   🛹 MOVEMENT SYSTEM
========================================================= */

let vx = 0;
let vz = 0;

function updatePlayer() {
  const keys = engine.keys;

  let ix = 0;
  let iz = 0;

  if (keys["KeyW"]) iz -= 1;
  if (keys["KeyS"]) iz += 1;
  if (keys["KeyA"]) ix -= 1;
  if (keys["KeyD"]) ix += 1;

  const len = Math.hypot(ix, iz);
  if (len > 0) {
    ix /= len;
    iz /= len;
  }

  // acceleration
  vx += ix * 0.09;
  vz += iz * 0.09;

  // clamp speed
  vx = THREE.MathUtils.clamp(vx, -1.5, 1.5);
  vz = THREE.MathUtils.clamp(vz, -1.5, 1.5);

  // friction
  vx *= 0.88;
  vz *= 0.88;

  // apply movement
  player.position.x += vx;
  player.position.z += vz;
}

/* =========================================================
   🔁 REGISTER UPDATE LOOP
========================================================= */

engine.updatePlayer = updatePlayer;
