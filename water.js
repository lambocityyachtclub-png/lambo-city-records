import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================================================
   🌊 LAMBO CITY OCEAN SYSTEM
========================================================= */

const waterGroup = new THREE.Group();

engine.world.add(waterGroup);

/* =========================================================
   🌊 MAIN OCEAN
========================================================= */

const waterMaterial = new THREE.MeshStandardMaterial({
  color: 0x0b3f70,
  metalness: 0.85,
  roughness: 0.25
});

const ocean = new THREE.Mesh(
  new THREE.PlaneGeometry(12000, 12000, 50, 50),
  waterMaterial
);

ocean.rotation.x = -Math.PI / 2;
ocean.position.set(0, -0.4, 1500);

waterGroup.add(ocean);

/* =========================================================
   🏖 BEACH
========================================================= */

const beach = new THREE.Mesh(
  new THREE.PlaneGeometry(5000, 500),
  new THREE.MeshStandardMaterial({
    color: 0xd4c08d,
    roughness: 1
  })
);

beach.rotation.x = -Math.PI / 2;
beach.position.set(0, 0.02, 300);

waterGroup.add(beach);

/* =========================================================
   🌊 DISTANT HORIZON STRIP
========================================================= */

const horizon = new THREE.Mesh(
  new THREE.PlaneGeometry(15000, 3000),
  new THREE.MeshBasicMaterial({
    color: 0x061521,
    transparent: true,
    opacity: 0.35
  })
);

horizon.position.set(0, 300, 5000);

waterGroup.add(horizon);

/* =========================================================
   🌊 WATER MOTION
========================================================= */

function updateWater() {

  const t = performance.now() * 0.0004;

  ocean.position.y =
    -0.4 +
    Math.sin(t) * 0.12;

  ocean.rotation.z =
    Math.sin(t * 0.5) * 0.001;

}

engine.updateWater = updateWater;

engine.water = waterGroup;
