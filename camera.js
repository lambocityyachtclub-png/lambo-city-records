// camera.js
// LAMBO CITY
// THIRD-PERSON CINEMATIC CAMERA
//
// CAMERA SYSTEM:
//
// WORLD
// - GTA-style third-person
//
// RECORDS HQ FLOORS 1–3
// - Enclosed third-person
// - Camera remains inside HQ
//
// FLOOR 2 DIGITAL STUDIO
// - Dedicated immersive studio camera
// - Equipment becomes the visual focus
// - No exterior-looking camera angle
// - No first-person
//
// ELEVATOR
// - Special glass cinematic
// - Outside world intentionally visible
//
// ROOFTOP
// - Wider cinematic third-person view
//
// IMPORTANT:
// - Does NOT modify player movement.
// - Does NOT modify collision.
// - Does NOT modify elevator movement.
// - Does NOT modify building architecture.

import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";

let camera;
let cinTime = 0;


// ============================================================
// RECORDS HQ WORLD BOUNDS
// ============================================================

const HQ_MIN_X = 19.7;
const HQ_MAX_X = 36.3;

const HQ_MIN_Z = 14.0;
const HQ_MAX_Z = 28.2;


// ============================================================
// WORLD CAMERA
// ============================================================

const WORLD_DISTANCE = 22;
const WORLD_HEIGHT = 13;


// ============================================================
// STANDARD HQ CAMERA
// ============================================================

const HQ_DISTANCE = 8.0;
const HQ_HEIGHT = 5.2;

const HQ_LOOK_HEIGHT = 1.8;

const HQ_SIDE_OFFSET = 1.15;


// ============================================================
// FLOOR 2 DIGITAL STUDIO CAMERA
// ============================================================
//
// Floor 2 gets its own camera language.
//
// The studio should feel like:
//
// ENTER STUDIO
//      ↓
// HERO becomes the anchor
//      ↓
// EQUIPMENT fills the environment
//      ↓
// MPC / PIANO / BOOTH / CONSOLE / SPEAKERS
//      ↓
// PREMIUM RECORDING SESSION
//
// We deliberately keep the camera closer than the general HQ
// camera and reduce the amount of room/exterior visible.
//
// The elevator remains the exception.
//

const STUDIO_DISTANCE = 5.8;
const STUDIO_HEIGHT = 3.8;

const STUDIO_LOOK_HEIGHT = 1.65;

const STUDIO_SIDE_OFFSET = 0.85;


// Studio camera boundaries.
//
// Slightly tighter than the entire architectural footprint.
// This keeps the camera from hugging exterior edges.

const STUDIO_MIN_X = 20.4;
const STUDIO_MAX_X = 35.6;

const STUDIO_MIN_Z = 15.2;
const STUDIO_MAX_Z = 27.4;


// ============================================================
// FLOOR DETECTION
// ============================================================

function getHQFloor(y) {

  if (y < 8) {
    return 1;
  }

  if (y < 16.2) {
    return 2;
  }

  if (y < 23.8) {
    return 3;
  }

  return 4;
}


// ============================================================
// HQ DETECTION
// ============================================================

function isInsideHQ(player) {

  const x =
    player.position.x;

  const z =
    player.position.z;

  return (
    x >= HQ_MIN_X &&
    x <= HQ_MAX_X &&
    z >= HQ_MIN_Z &&
    z <= HQ_MAX_Z
  );
}


// ============================================================
// SMOOTHING
// ============================================================

function damp(
  current,
  target,
  amount
) {

  return (
    current +
    (target - current) *
    amount
  );
}


// ============================================================
// CAMERA POSITION
// ============================================================

function moveCamera(
  x,
  y,
  z,
  smooth
) {

  camera.position.x =
    damp(
      camera.position.x,
      x,
      smooth
    );

  camera.position.y =
    damp(
      camera.position.y,
      y,
      smooth
    );

  camera.position.z =
    damp(
      camera.position.z,
      z,
      smooth
    );
}


// ============================================================
// NORMAL WORLD CAMERA
// ============================================================

function updateWorldCamera(
  player
) {

  const drift =
    Math.sin(
      cinTime * 0.25
    ) * 1.2;

  moveCamera(
    player.position.x + drift,
    player.position.y + WORLD_HEIGHT,
    player.position.z + WORLD_DISTANCE,
    0.07
  );

  camera.lookAt(
    player.position.x,
    player.position.y + 2,
    player.position.z - 5
  );
}


// ============================================================
// STANDARD HQ CAMERA
// ============================================================

function updateHQCamera(
  player,
  floor
) {

  const yaw =
    player.rotation.y;

  const forwardX =
    Math.sin(yaw);

  const forwardZ =
    Math.cos(yaw);


  let cameraX =
    player.position.x -
    forwardX * HQ_DISTANCE;

  let cameraZ =
    player.position.z -
    forwardZ * HQ_DISTANCE;


  const sideX =
    Math.cos(yaw) *
    HQ_SIDE_OFFSET;

  const sideZ =
    -Math.sin(yaw) *
    HQ_SIDE_OFFSET;


  cameraX += sideX;
  cameraZ += sideZ;


  cameraX =
    THREE.MathUtils.clamp(
      cameraX,
      HQ_MIN_X,
      HQ_MAX_X
    );

  cameraZ =
    THREE.MathUtils.clamp(
      cameraZ,
      HQ_MIN_Z,
      HQ_MAX_Z
    );


  let height =
    HQ_HEIGHT;


  if (floor === 2) {
    height = 4.8;
  }

  if (floor === 3) {
    height = 5.1;
  }


  moveCamera(
    cameraX,
    player.position.y + height,
    cameraZ,
    0.10
  );


  const lookX =
    player.position.x +
    forwardX * 2.0;

  const lookZ =
    player.position.z +
    forwardZ * 2.0;

  const lookY =
    player.position.y +
    HQ_LOOK_HEIGHT;


  camera.lookAt(
    lookX,
    lookY,
    lookZ
  );
}


// ============================================================
// FLOOR 2 — IMMERSIVE DIGITAL STUDIO CAMERA
// ============================================================
//
// This is intentionally different from the normal HQ camera.
//
// The camera stays close to HERO.
//
// It is designed to make the studio equipment read as premium
// digital real estate.
//
// The player should feel surrounded by:
//
// - MPC
// - illuminated pads
// - piano / keys
// - recording booth
// - mixing console
// - studio displays
// - future monitor speakers
// - professional production hardware
//
// The outside world is NOT the subject here.
//
// The studio is the subject.
//

function updateStudioCamera(
  player
) {

  const yaw =
    player.rotation.y;


  const forwardX =
    Math.sin(yaw);

  const forwardZ =
    Math.cos(yaw);


  // ----------------------------------------------------------
  // CAMERA BEHIND HERO
  // ----------------------------------------------------------

  let cameraX =
    player.position.x -
    forwardX *
    STUDIO_DISTANCE;

  let cameraZ =
    player.position.z -
    forwardZ *
    STUDIO_DISTANCE;


  // ----------------------------------------------------------
  // SUBTLE SHOULDER OFFSET
  // ----------------------------------------------------------

  const sideX =
    Math.cos(yaw) *
    STUDIO_SIDE_OFFSET;

  const sideZ =
    -Math.sin(yaw) *
    STUDIO_SIDE_OFFSET;


  cameraX += sideX;
  cameraZ += sideZ;


  // ----------------------------------------------------------
  // TIGHTER STUDIO CAMERA BOUNDARY
  // ----------------------------------------------------------

  cameraX =
    THREE.MathUtils.clamp(
      cameraX,
      STUDIO_MIN_X,
      STUDIO_MAX_X
    );

  cameraZ =
    THREE.MathUtils.clamp(
      cameraZ,
      STUDIO_MIN_Z,
      STUDIO_MAX_Z
    );


  // ----------------------------------------------------------
  // CAMERA HEIGHT
  // ----------------------------------------------------------
  //
  // Lower than the previous HQ camera.
  //
  // This makes the room feel more like a real recording studio
  // instead of an architectural fly-through.

  const cameraY =
    player.position.y +
    STUDIO_HEIGHT;


  moveCamera(
    cameraX,
    cameraY,
    cameraZ,
    0.12
  );


  // ----------------------------------------------------------
  // LOOK TARGET
  // ----------------------------------------------------------
  //
  // Shorter forward look distance keeps the camera focused on
  // HERO and the equipment immediately around him.
  //
  // We intentionally do NOT look several meters through the
  // building.

  const lookX =
    player.position.x +
    forwardX * 1.4;

  const lookZ =
    player.position.z +
    forwardZ * 1.4;

  const lookY =
    player.position.y +
    STUDIO_LOOK_HEIGHT;


  camera.lookAt(
    lookX,
    lookY,
    lookZ
  );
}


// ============================================================
// ELEVATOR CINEMATIC
// ============================================================
//
// The elevator is intentionally different.
//
// This is the one place where:
//
// GLASS
// CITY
// MARINA
// HQ EXTERIOR
//
// are allowed to become part of the camera experience.
//
// We preserve this behavior.
//

function updateElevatorCamera(
  player
) {

  const progress =
    Number(
      window.__lamboCityElevatorProgress ??
      0
    );


  // ----------------------------------------------------------
  // PHASE 1 — HERO INSIDE ELEVATOR
  // ----------------------------------------------------------

  if (
    progress < 0.30
  ) {

    const revealX =
      player.position.x + 5.5;

    const revealY =
      player.position.y + 4.0;

    const revealZ =
      player.position.z + 6.5;


    moveCamera(
      revealX,
      revealY,
      revealZ,
      0.075
    );


    camera.lookAt(
      player.position.x,
      player.position.y + 2,
      player.position.z
    );


    return;
  }


  // ----------------------------------------------------------
  // PHASE 2 — THIRD-PERSON ELEVATOR VIEW
  // ----------------------------------------------------------

  const yaw =
    player.rotation.y;


  const forwardX =
    Math.sin(yaw);

  const forwardZ =
    Math.cos(yaw);


  const cameraDistance =
    5.0;


  const cameraX =
    player.position.x -
    forwardX *
    cameraDistance;


  const cameraZ =
    player.position.z -
    forwardZ *
    cameraDistance;


  moveCamera(
    cameraX,
    player.position.y + 4.0,
    cameraZ,
    0.10
  );


  camera.lookAt(
    player.position.x +
      forwardX * 1.5,

    player.position.y + 2.0,

    player.position.z +
      forwardZ * 1.5
  );
}


// ============================================================
// ROOFTOP CAMERA
// ============================================================

function updateRooftopCamera(
  player
) {

  const yaw =
    player.rotation.y;


  const forwardX =
    Math.sin(yaw);

  const forwardZ =
    Math.cos(yaw);


  const distance =
    9.5;


  const cinematicDrift =
    Math.sin(
      cinTime * 0.18
    ) * 1.2;


  const cameraX =
    player.position.x -
    forwardX * distance +
    cinematicDrift;


  const cameraZ =
    player.position.z -
    forwardZ * distance;


  moveCamera(
    cameraX,
    player.position.y + 6.0,
    cameraZ,
    0.055
  );


  camera.lookAt(
    player.position.x,
    player.position.y + 2,
    player.position.z
  );
}


// ============================================================
// INITIALIZATION
// ============================================================

export default {

  init() {

    camera =
      new THREE.PerspectiveCamera(
        68,
        window.innerWidth /
          window.innerHeight,
        0.05,
        2000
      );


    camera.position.set(
      0,
      16,
      30
    );


    camera.lookAt(
      0,
      2,
      0
    );


    window.addEventListener(
      "resize",
      () => {

        camera.aspect =
          window.innerWidth /
          window.innerHeight;

        camera.updateProjectionMatrix();

      }
    );


    return camera;

  },


  // ==========================================================
  // UPDATE
  // ==========================================================

  update(
    delta,
    context
  ) {

    const player =
      context.player;


    if (
      !player ||
      !camera
    ) {

      return;

    }


    cinTime += delta;


    // ========================================================
    // ELEVATOR
    // ========================================================

    if (
      window.__lamboCityElevatorTraveling
    ) {

      updateElevatorCamera(
        player
      );

      return;

    }


    // ========================================================
    // RECORDS HQ
    // ========================================================

    if (
      isInsideHQ(player)
    ) {

      const floor =
        getHQFloor(
          player.position.y
        );


      // ------------------------------------------------------
      // ROOFTOP
      // ------------------------------------------------------

      if (
        floor === 4
      ) {

        updateRooftopCamera(
          player
        );

        return;

      }


      // ------------------------------------------------------
      // FLOOR 2 DIGITAL STUDIO
      // ------------------------------------------------------

      if (
        floor === 2
      ) {

        updateStudioCamera(
          player
        );

        return;

      }


      // ------------------------------------------------------
      // FLOORS 1 AND 3
      // ------------------------------------------------------

      updateHQCamera(
        player,
        floor
      );

      return;

    }


    // ========================================================
    // NORMAL WORLD
    // ========================================================

    updateWorldCamera(
      player
    );

  },


  getCamera() {

    return camera;

  }

};
