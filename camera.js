// camera.js
// LAMBO CITY
// THIRD-PERSON CINEMATIC CAMERA
//
// CAMERA PHILOSOPHY:
//
// HERO determines direction.
// CAMERA follows HERO.
//
// WORLD
// - Third-person
// - Camera stays behind HERO
// - Camera follows HERO's heading
//
// RECORDS HQ
// - Enclosed third-person
//
// FLOOR 2
// - Dedicated immersive studio camera
// - Existing behavior preserved
//
// ELEVATOR
// - Special glass cinematic
//
// ROOFTOP
// - Cinematic third-person
//

import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";


let camera;
let cinTime = 0;


// ============================================================
// RECORDS HQ BOUNDS
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
const WORLD_LOOK_AHEAD = 5;


// ============================================================
// STANDARD HQ CAMERA
// ============================================================

const HQ_DISTANCE = 8.0;
const HQ_HEIGHT = 5.2;
const HQ_LOOK_HEIGHT = 1.8;
const HQ_SIDE_OFFSET = 1.15;


// ============================================================
// FLOOR 2 STUDIO
// ============================================================

const STUDIO_DISTANCE = 5.8;
const STUDIO_HEIGHT = 3.8;
const STUDIO_LOOK_HEIGHT = 1.65;
const STUDIO_SIDE_OFFSET = 0.85;

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
// WORLD CAMERA
// ============================================================
//
// THIS IS THE IMPORTANT CHANGE.
//
// Instead of:
//
// camera = player.z + fixed distance
//
// we use HERO'S actual heading.
//
// HERO forward:
//
//   X = sin(yaw)
//   Z = cos(yaw)
//
// Camera:
//
//   behind HERO
//
// This means:
//
// HERO walks toward docks
//        ↓
// HERO faces docks
//        ↓
// camera moves behind HERO
//        ↓
// dock view appears ahead
//
// HERO turns around
//        ↓
// camera follows around
//        ↓
// HQ/stores view appears ahead
//

function updateWorldCamera(player) {

  const yaw =
    player.rotation.y;

  const forwardX =
    Math.sin(yaw);

  const forwardZ =
    Math.cos(yaw);


  // Camera sits behind HERO.

  const cameraX =
    player.position.x -
    forwardX *
    WORLD_DISTANCE;

  const cameraZ =
    player.position.z -
    forwardZ *
    WORLD_DISTANCE;


  // Keep the existing subtle cinematic drift,
  // but make it follow HERO's heading.

  const drift =
    Math.sin(
      cinTime * 0.25
    ) * 1.2;


  const driftX =
    Math.cos(yaw) *
    drift;

  const driftZ =
    -Math.sin(yaw) *
    drift;


  moveCamera(
    cameraX + driftX,
    player.position.y +
      WORLD_HEIGHT,
    cameraZ + driftZ,
    0.07
  );


  // Look slightly ahead of HERO.

  camera.lookAt(
    player.position.x +
      forwardX *
      WORLD_LOOK_AHEAD,

    player.position.y + 2,

    player.position.z +
      forwardZ *
      WORLD_LOOK_AHEAD
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
    forwardX *
    HQ_DISTANCE;

  let cameraZ =
    player.position.z -
    forwardZ *
    HQ_DISTANCE;


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
    player.position.y +
      height,
    cameraZ,
    0.10
  );


  camera.lookAt(
    player.position.x +
      forwardX * 2.0,

    player.position.y +
      HQ_LOOK_HEIGHT,

    player.position.z +
      forwardZ * 2.0
  );

}


// ============================================================
// FLOOR 2 STUDIO
// ============================================================

function updateStudioCamera(
  player
) {

  const yaw =
    player.rotation.y;

  const forwardX =
    Math.sin(yaw);

  const forwardZ =
    Math.cos(yaw);


  let cameraX =
    player.position.x -
    forwardX *
    STUDIO_DISTANCE;

  let cameraZ =
    player.position.z -
    forwardZ *
    STUDIO_DISTANCE;


  const sideX =
    Math.cos(yaw) *
    STUDIO_SIDE_OFFSET;

  const sideZ =
    -Math.sin(yaw) *
    STUDIO_SIDE_OFFSET;


  cameraX += sideX;
  cameraZ += sideZ;


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


  const cameraY =
    player.position.y +
    STUDIO_HEIGHT;


  moveCamera(
    cameraX,
    cameraY,
    cameraZ,
    0.12
  );


  camera.lookAt(
    player.position.x +
      forwardX * 1.4,

    player.position.y +
      STUDIO_LOOK_HEIGHT,

    player.position.z +
      forwardZ * 1.4
  );

}


// ============================================================
// ELEVATOR CINEMATIC
// ============================================================

function updateElevatorCamera(
  player
) {

  const progress =
    Number(
      window.__lamboCityElevatorProgress ??
      0
    );


  if (progress < 0.30) {

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
// ROOFTOP
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


      if (
        floor === 4
      ) {

        updateRooftopCamera(
          player
        );

        return;

      }


      if (
        floor === 2
      ) {

        updateStudioCamera(
          player
        );

        return;

      }


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
