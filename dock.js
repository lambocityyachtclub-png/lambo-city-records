import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================================================
   🌉 LAMBO CITY DOCK SYSTEM (CINEMATIC VERSION)
========================================================= */

/* GLOBAL CINEMATIC SCALE */
const SCALE = 2.2;
const DEPTH = 1.8;

const dockGroup = new THREE.Group();
engine.world.add(dockGroup);

/* =========================================================
   🪵 MAIN BOARDWALK (PLAYER ENTRY PATH)
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
   🏠 CABIN ROW SYSTEM (LEFT + RIGHT)
========================================================= */

function createCabin(x, z, isHero = false) {
  const baseColor = isHero ? 0xffd700 : 0x8b5a2b;

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(30 * SCALE, 22 * SCALE, 30 * SCALE),
    new THREE.MeshStandardMaterial({
      color: baseColor
    })
  );

  cabin.position.set(x, 11 * SCALE, z);
  dockGroup.add(cabin);

  // roof
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(20 * SCALE, 14 * SCALE, 5),
    new THREE.MeshStandardMaterial({ color: 0x3b2a1a })
  );

  roof.position.set(x, 22 * SCALE, z);
  roof.rotation.y = Math.PI / 4;
  dockGroup.add(roof);

  return cabin;
}

/* CABIN STREET WALLS */
const CABIN_SPACING = 90 * SCALE;

for (let i = -3; i <= 3; i++) {
  createCabin(-60 * SCALE, i * CABIN_SPACING);
  createCabin(60 * SCALE, i * CABIN_SPACING);
}

/* HERO MANSION */
createCabin(0, 260 * DEPTH, true);

/* =========================================================
   🎤 ROUND STAGE + JUMBOTRON
========================================================= */

const stagePlatform = new THREE.Mesh(
  new THREE.CylinderGeometry(60 * SCALE, 60 * SCALE, 4, 48),
  new THREE.MeshStandardMaterial({
    color: 0x222222
  })
);

stagePlatform.position.set(0, 1, 520 * DEPTH);
dockGroup.add(stagePlatform);

/* jumbotron */
const screen = new THREE.Mesh(
  new THREE.BoxGeometry(40 * SCALE, 20 * SCALE, 2),
  new THREE.MeshStandardMaterial({
    color: 0x111111,
    emissive: 0x00ffff,
    emissiveIntensity: 0.4
  })
);

screen.position.set(0, 25, 480 * DEPTH);
dockGroup.add(screen);

/* =========================================================
   🚤 YACHT SPOT (DISTANT GOAL)
========================================================= */

const yachtMarker = new THREE.Mesh(
  new THREE.BoxGeometry(30 * SCALE, 10 * SCALE, 80 * SCALE),
  new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.2
  })
);

yachtMarker.position.set(0, 5, 900 * DEPTH);
dockGroup.add(yachtMarker);

/* =========================================================
   🌉 WALKWAY EXTENSION
========================================================= */

const dockExtension = new THREE.Mesh(
  new THREE.BoxGeometry(20 * SCALE, 1, 200 * DEPTH),
  new THREE.MeshStandardMaterial({
    color: 0x3d2b1f
  })
);

dockExtension.position.set(0, 0.5, 320 * DEPTH);
dockGroup.add(dockExtension);
