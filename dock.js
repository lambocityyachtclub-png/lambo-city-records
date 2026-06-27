import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================================================
   🌉 LAMBO CITY DOCK SYSTEM
========================================================= */

const dockGroup = new THREE.Group();
engine.world.add(dockGroup);

/* =========================================================
   🪵 MAIN BOARDWALK (PLAYER ENTRY PATH)
========================================================= */

const boardwalk = new THREE.Mesh(
  new THREE.BoxGeometry(20, 1, 400),
  new THREE.MeshStandardMaterial({
    color: 0x5a3a1e,
    roughness: 0.9
  })
);

boardwalk.position.set(0, 0.5, 50);
dockGroup.add(boardwalk);

/* =========================================================
   🏠 CABIN ROW SYSTEM (LEFT + RIGHT)
========================================================= */

function createCabin(x, z, isHero = false) {
  const baseColor = isHero ? 0xffd700 : 0x8b5a2b;

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(18, 10, 18),
    new THREE.MeshStandardMaterial({
      color: baseColor
    })
  );

  cabin.position.set(x, 5, z);
  dockGroup.add(cabin);

  // roof
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(13, 8, 4),
    new THREE.MeshStandardMaterial({ color: 0x3b2a1a })
  );

  roof.position.set(x, 11, z);
  roof.rotation.y = Math.PI / 4;
  dockGroup.add(roof);

  return cabin;
}

/* cabin rows */
for (let i = -2; i <= 2; i++) {
  createCabin(-25, i * 30);
  createCabin(25, i * 30);
}

/* HERO MANSION (CENTERPIECE) */
createCabin(0, 140, true);

/* =========================================================
   🎤 ROUND STAGE + JUMBOTRON
========================================================= */

const stagePlatform = new THREE.Mesh(
  new THREE.CylinderGeometry(30, 30, 2, 32),
  new THREE.MeshStandardMaterial({
    color: 0x222222
  })
);

stagePlatform.position.set(0, 1, 220);
dockGroup.add(stagePlatform);

/* jumbotron */
const screen = new THREE.Mesh(
  new THREE.BoxGeometry(40, 20, 2),
  new THREE.MeshStandardMaterial({
    color: 0x111111,
    emissive: 0x00ffff,
    emissiveIntensity: 0.4
  })
);

screen.position.set(0, 12, 200);
dockGroup.add(screen);

/* =========================================================
   🚤 YACHT SPOT (VISIBLE IN WATER)
========================================================= */

const yachtMarker = new THREE.Mesh(
  new THREE.BoxGeometry(30, 10, 80),
  new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.2
  })
);

yachtMarker.position.set(0, 5, 320);
dockGroup.add(yachtMarker);

/* =========================================================
   🌉 SMALL WALKWAY EXTENSION INTO BEACH
========================================================= */

const dockExtension = new THREE.Mesh(
  new THREE.BoxGeometry(12, 1, 120),
  new THREE.MeshStandardMaterial({
    color: 0x3d2b1f
  })
);

dockExtension.position.set(0, 0.5, 260);
dockGroup.add(dockExtension);
