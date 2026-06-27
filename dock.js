import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================================================
   🌉 LAMBO CITY DOCK SYSTEM (CINEMATIC AAA VERSION)
========================================================= */

/* GLOBAL SCALE */
const SCALE = 2.2;
const DEPTH = 1.8;

const dockGroup = new THREE.Group();
engine.world.add(dockGroup);

/* =========================================================
   🌅 LIGHTING SYSTEM (THIS CHANGES EVERYTHING)
========================================================= */

// SUN DIRECTION (cinematic angle)
const sunLight = new THREE.DirectionalLight(0xfff1d6, 1.2);
sunLight.position.set(200, 300, 100);
engine.world.add(sunLight);

// AMBIENT FILL (ocean bounce feel)
const ambient = new THREE.AmbientLight(0x1a2a3a, 0.6);
engine.world.add(ambient);

// SKY GLOW FEEL
const skyGlow = new THREE.HemisphereLight(0x87ceeb, 0x0a0a0a, 0.8);
engine.world.add(skyGlow);

/* =========================================================
   🪵 MAIN DOCK (PLAYER PATH)
========================================================= */

const boardwalk = new THREE.Mesh(
  new THREE.BoxGeometry(80 * SCALE, 1, 1200 * DEPTH),
  new THREE.MeshStandardMaterial({
    color: 0x5a3a1e,
    roughness: 0.95
  })
);

boardwalk.position.set(0, 0.5, 0);
dockGroup.add(boardwalk);

/* =========================================================
   🎬 CINEMATIC FLOW GUIDANCE (HIDDEN DESIGN SYSTEM)
========================================================= */

function addLightBeacon(x, z, color = 0x00ffff) {
  const beacon = new THREE.PointLight(color, 1.5, 120);
  beacon.position.set(x, 8, z);
  dockGroup.add(beacon);
}

// subtle direction path (player subconscious guidance)
addLightBeacon(0, 200);
addLightBeacon(0, 450);
addLightBeacon(0, 700);
addLightBeacon(0, 900);

/* =========================================================
   🏠 CABIN SYSTEM (IMPROVED MATERIAL FEEL)
========================================================= */

function createCabin(x, z, isHero = false) {
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(30 * SCALE, 22 * SCALE, 30 * SCALE),
    new THREE.MeshStandardMaterial({
      color: isHero ? 0xffd700 : 0x8b5a2b,
      roughness: 0.7,
      metalness: isHero ? 0.3 : 0.1
    })
  );

  cabin.position.set(x, 11 * SCALE, z);
  dockGroup.add(cabin);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(20 * SCALE, 14 * SCALE, 5),
    new THREE.MeshStandardMaterial({ color: 0x2a1d12 })
  );

  roof.position.set(x, 22 * SCALE, z);
  dockGroup.add(roof);

  return cabin;
}

/* CABIN ROWS */
const CABIN_SPACING = 90 * SCALE;

for (let i = -3; i <= 3; i++) {
  createCabin(-60 * SCALE, i * CABIN_SPACING);
  createCabin(60 * SCALE, i * CABIN_SPACING);
}

/* HERO CABIN (STORY FOCUS POINT) */
createCabin(0, 260 * DEPTH, true);

/* =========================================================
   🎤 STAGE (MAIN FOCAL POINT)
========================================================= */

const stagePlatform = new THREE.Mesh(
  new THREE.CylinderGeometry(60 * SCALE, 60 * SCALE, 4, 48),
  new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.6,
    metalness: 0.4
  })
);

stagePlatform.position.set(0, 1, 520 * DEPTH);
dockGroup.add(stagePlatform);

// stage glow light (important emotional anchor)
const stageLight = new THREE.PointLight(0x00ffff, 2, 200);
stageLight.position.set(0, 30, 520 * DEPTH);
dockGroup.add(stageLight);

/* =========================================================
   🚤 YACHT DISTANCE GOAL (WORLD SCALE ANCHOR)
========================================================= */

const yachtMarker = new THREE.Mesh(
  new THREE.BoxGeometry(30 * SCALE, 10 * SCALE, 80 * SCALE),
  new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.15
  })
);

yachtMarker.position.set(0, 5, 900 * DEPTH);
dockGroup.add(yachtMarker);

/* soft ocean beacon */
addLightBeacon(0, 900, 0xffffff);

/* =========================================================
   🌊 CINEMATIC RULE (IMPORTANT DESIGN LOGIC)
========================================================= */

/*
DOCK DESIGN INTENT:
- Player starts here (calm intro)
- Moves toward stage (attention focus)
- Then toward yacht (aspiration)
- Then into city (expansion)

This is your "game narrative spine"
*/

/* =========================================================
   🧠 ENGINE HOOK
========================================================= */

engine.dock = dockGroup;
