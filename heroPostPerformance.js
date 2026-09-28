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


// Records HQ exterior/front area.
// HERO approaches the HQ from the boardwalk side.
const HQ_DESTINATION =
  new THREE.Vector3(
    28,
    1.3,
    30
  );


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

}


// ------------------------------------------------------------
// UPDATE WALK
// ------------------------------------------------------------

function updateWalking(delta) {

  if (!hero) {
    return;
  }


  time += delta;


  const dx =
    HQ_DESTINATION.x -
    hero.position.x;

  const dz =
    HQ_DESTINATION.z -
    hero.position.z;


  const distance =
    Math.sqrt(
      dx * dx +
      dz * dz
    );


  if (
    distance <= ARRIVAL_DISTANCE
  ) {

    hero.position.x =
      HQ_DESTINATION.x;

    hero.position.z =
      HQ_DESTINATION.z;

    hero.position.y =
      HQ_DESTINATION.y;

    faceTarget(
      HQ_DESTINATION
    );

    active = false;

    arrived = true;

    return;

  }


  const nx =
    dx / distance;

  const nz =
    dz / distance;


  const step =
    Math.min(
      HERO_SPEED * delta,
      distance
    );


  hero.position.x +=
    nx * step;

  hero.position.z +=
    nz * step;


  /*
    Small natural walking motion.
    This is intentionally subtle.
  */

  hero.position.y =
    1.3 +
    Math.abs(
      Math.sin(
        time * 8
      )
    ) *
    0.035;


  faceTarget(
    HQ_DESTINATION
  );

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

      hero.position.y =
        1.3;

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

    hero = null;

  }

};
