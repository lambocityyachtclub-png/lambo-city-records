import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================================================
   🌍 LAMBO CITY — WORLD CORE SYSTEM (AAA FOUNDATION)
========================================================= */

const world = new THREE.Group();
engine.world = world; 

/* =========================================================
   🌊 MAIN GROUND PLANE (BASE WORLD ANCHOR)
========================================================= */

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(8000, 8000),
  new THREE.MeshStandardMaterial({
    color: 0x0f0f10,
    roughness: 1.0,
    metalness: 0.0
  })
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;

world.add(ground);

/* =========================================================
   🧭 WORLD ORIENTATION SYSTEM (IMPORTANT)
========================================================= */

// forward direction = toward yacht / ocean
world.userData.forward = new THREE.Vector3(0, 0, -1);

// dock center anchor (spawn reference)
world.userData.spawnPoint = new THREE.Vector3(0, 1, 200);

/* =========================================================
   🌊 OCEAN BASE ZONE (VISUAL HORIZON ANCHOR)
========================================================= */

const oceanPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(12000, 12000),
  new THREE.MeshStandardMaterial({
    color: 0x061521,
    roughness: 1.0,
    metalness: 0.0
  })
);

oceanPlane.rotation.x = -Math.PI / 2;
oceanPlane.position.z = -3000;

world.add(oceanPlane);

/* =========================================================
   🌫 DISTANCE FOG FEEDBACK ZONES (VISUAL DEPTH HELP)
========================================================= */

function addDistanceMarker(z, size = 200, opacity = 0.05) {
  const marker = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity
    })
  );

  marker.rotation.x = -Math.PI / 2;
  marker.position.set(0, 0.1, z);

  world.add(marker);
}

// invisible depth structure (helps brain perceive scale)
addDistanceMarker(200);
addDistanceMarker(600);
addDistanceMarker(1200);
addDistanceMarker(2000);

/* =========================================================
   🧠 WORLD REGISTRY (FUTURE ZONE SYSTEM FOUNDATION)
========================================================= */

world.userData.zones = {
  dock: { startZ: 0, endZ: 400 },
  boardwalk: { startZ: 400, endZ: 800 },
  city: { startZ: 800, endZ: 2000 },
  ocean: { startZ: 2000, endZ: 5000 }
};

/* =========================================================
   🎯 SPAWN SYSTEM HOOK
========================================================= */

world.userData.spawn = function () {
  return new THREE.Vector3(0, 1, 200);
};

/* =========================================================
   🧠 ENGINE ATTACH
========================================================= */

engine.world = world;
