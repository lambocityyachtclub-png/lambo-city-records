// heroPostPerformance.js
// LAMBO CITY
// HERO — POST-PERFORMANCE WORLD PRESENCE
//
// Purpose:
// - Takes over after HERO finishes his stage performance.
// - HERO independently walks from the stage toward Records HQ.
// - Player remains completely independent.
// - Does NOT modify player movement.
// - Does NOT modify camera.
// - Does NOT modify collision.
// - Does NOT modify elevator behavior.
//
// Phase 1:
// Performance
//     ↓
// Stage Exit
//     ↓
// HERO walks toward Records HQ
//     ↓
// HERO arrives and remains there


import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";


const STAGE_RIGHT =
  new THREE.Vector3(
    19,
    1.3,
    -74
  );


// HERO follows the real connected pedestrian route:
// stage roundabout -> central timber dock -> HQ elevator walkway.
// These waypoints stay on the existing built surfaces; no straight-line
// shortcut across the marina water is permitted.
const ROUTE = [
  new THREE.Vector3(0, 1.3, -35),
  new THREE.Vector3(0, 1.3, 13.75),
  new THREE.Vector3(20.1, 1.3, 13.75),
  // Step onto the existing Records HQ elevator landing.
  new THREE.Vector3(23, 1.3, 14.15)
];

const HQ_DESTINATION = ROUTE[ROUTE.length - 1];


// HERO walking speed.
// Deliberately slower than the player so
// the movement reads as an NPC walk.
const HERO_SPEED = 4.5;


// Distance at which HERO is considered
// to have reached the HQ.
const ARRIVAL_DISTANCE = 2.5;


let hero = null;

let active = false;

let arrived = false;

let time = 0;
let walkStartY = 1.3;
let routeIndex = 0;
const GROUND_TRANSITION_DURATION = 1.25;


// ------------------------------------------------------------
// DISTANCE
// ------------------------------------------------------------

function distanceXZ(a, b) {

  const dx =
    a.position.x -
    b.x;

  const dz =
    a.position.z -
    b.z;

  return Math.sqrt(
    dx * dx +
    dz * dz
  );

}


// ------------------------------------------------------------
// FACE HERO TOWARD TARGET
// ------------------------------------------------------------

function faceTarget(target) {

  if (!hero) {
    return;
  }


  const dx =
    target.x -
    hero.position.x;

  const dz =
    target.z -
    hero.position.z;


  if (
    Math.abs(dx) < 0.001 &&
    Math.abs(dz) < 0.001
  ) {

    return;

  }


  hero.rotation.y =
    Math.atan2(
      dx,
      dz
    );

}


// ------------------------------------------------------------
// START
// ------------------------------------------------------------

function begin() {

  if (!hero) {
    return;
  }


  active = true;

  arrived = false;

  time = 0;
  routeIndex = 0;
  walkStartY = hero.position.y;

}


// ------------------------------------------------------------
// UPDATE WALK
// ------------------------------------------------------------

function updateWalking(delta) {

  if (!hero) {
    return;
  }

  time += delta;

  const target = ROUTE[routeIndex] || HQ_DESTINATION;
  const dx = target.x - hero.position.x;
  const dz = target.z - hero.position.z;
  const distance = Math.sqrt(dx * dx + dz * dz);

  if (distance <= 0.45) {
    hero.position.x = target.x;
    hero.position.z = target.z;

    if (routeIndex < ROUTE.length - 1) {
      routeIndex += 1;
      return;
    }

    hero.position.y = HQ_DESTINATION.y;
    faceTarget(HQ_DESTINATION);
    active = false;
    arrived = true;
    return;
  }

  const step = Math.min(HERO_SPEED * delta, distance);
  hero.position.x += (dx / distance) * step;
  hero.position.z += (dz / distance) * step;

  // Blend naturally from the lower stair landing to dock height.
  const groundBlend = Math.min(1, time / GROUND_TRANSITION_DURATION);
  const smoothGroundBlend = groundBlend * groundBlend * (3 - 2 * groundBlend);
  hero.position.y =
    THREE.MathUtils.lerp(walkStartY, HQ_DESTINATION.y, smoothGroundBlend) +
    Math.abs(Math.sin(time * 8)) * 0.025;

  faceTarget(target);
}

// ------------------------------------------------------------
// SYSTEM
// ------------------------------------------------------------

export default {

  init(scene) {

    /*
      HERO is supplied by the existing NPC system.
      We intentionally do not create another HERO.
    */

    this.scene =
      scene;

  },


  update(delta, context) {

    const npc =
      context.systems?.npc;

    if (!npc) {
      return;
    }


    /*
      Get the existing HERO.
    */

    if (!hero) {

      hero =
        npc.getHero?.();

    }


    if (!hero) {
      return;
    }


    /*
      Existing heroPerformance.js exposes
      getState().
    */

    const performance =
      context.systems?.heroPerformance;


    if (!performance) {
      return;
    }


    const state =
      performance.getState?.();


    /*
      Only begin once the existing performance
      has completely finished.
    */

    if (
      !active &&
      !arrived &&
      state === "COMPLETE"
    ) {

      /*
        Make sure HERO begins from his actual
        stage-exit position.
      */

      // Preserve the exact stair-landing height. begin() records it and
      // blends HERO onto the normal boardwalk level while he walks away.
      begin();

    }


    if (active) {

      updateWalking(
        delta
      );

    }

  },


  reset() {

    active = false;

    arrived = false;

    time = 0;
    walkStartY = 1.3;
    routeIndex = 0;

    hero = null;

  }

};
