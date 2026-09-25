import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";

let camera;
let cinTime = 0;


// ============================================================
// RECORDS HQ WORLD BOUNDS
// ============================================================
//
// Actual HQ center:
// X = 28
// Z = 22
//
// Interior is approximately:
// X = 19 → 37
// Z = 14 → 29
//
// Camera is kept inside these boundaries on Floors 1–3.
//

const HQ_MIN_X = 19.7;
const HQ_MAX_X = 36.3;

const HQ_MIN_Z = 14.0;
const HQ_MAX_Z = 28.2;


// ============================================================
// CAMERA SETTINGS
// ============================================================

const WORLD_DISTANCE = 22;
const WORLD_HEIGHT = 13;

const HQ_DISTANCE = 8.0;
const HQ_HEIGHT = 5.2;

const HQ_LOOK_HEIGHT = 1.8;

const HQ_SIDE_OFFSET = 1.15;


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
// NORMAL LAMBO CITY CAMERA
// ============================================================
//
// Existing world camera remains cinematic third-person.
//

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
// GTA-STYLE RECORDS HQ CAMERA
// ============================================================
//
// This is the major change.
//
// NOT first-person.
//
// NOT looking down from above.
//
// NOT looking at the building.
//
// The player remains the visual anchor.
//
// Camera follows from behind/above like a cinematic
// third-person action game.
//

function updateHQCamera(
  player,
  floor
) {

  const yaw =
    player.rotation.y;


  // ----------------------------------------------------------
  // PLAYER FORWARD
  // ----------------------------------------------------------

  const forwardX =
    Math.sin(yaw);

  const forwardZ =
    Math.cos(yaw);


  // ----------------------------------------------------------
  // CAMERA BEHIND PLAYER
  // ----------------------------------------------------------
  //
  // Because the player moves toward -Z when facing forward,
  // this places the camera behind the character.

  let cameraX =
    player.position.x -
    forwardX * HQ_DISTANCE;

  let cameraZ =
    player.position.z -
    forwardZ * HQ_DISTANCE;


  // ----------------------------------------------------------
  // SLIGHT CINEMATIC SHOULDER
  // ----------------------------------------------------------

  const sideX =
    Math.cos(yaw) *
    HQ_SIDE_OFFSET;

  const sideZ =
    -Math.sin(yaw) *
    HQ_SIDE_OFFSET;


  cameraX +=
    sideX;

  cameraZ +=
    sideZ;


  // ----------------------------------------------------------
  // KEEP CAMERA INSIDE HQ
  // ----------------------------------------------------------
  //
  // This is critical.
  //
  // The camera must not drift through the HQ exterior
  // walls simply because the player is near one.

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


  // ----------------------------------------------------------
  // FLOOR-SPECIFIC HEIGHT
  // ----------------------------------------------------------

  let height =
    HQ_HEIGHT;


  if (floor === 2) {

    height =
      5.0;

  }


  if (floor === 3) {

    height =
      5.1;

  }


  // ----------------------------------------------------------
  // CAMERA POSITION
  // ----------------------------------------------------------

  moveCamera(
    cameraX,
    player.position.y + height,
    cameraZ,
    0.10
  );


  // ----------------------------------------------------------
  // LOOK TARGET
  // ----------------------------------------------------------
  //
  // We don't look at the player's feet.
  //
  // We look slightly above the player's chest so the
  // architecture naturally fills the upper frame.

  const lookX =
    player.position.x +
    forwardX * 2.8;

  const lookZ =
    player.position.z +
    forwardZ * 2.8;

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
// ELEVATOR CINEMATIC
// ============================================================
//
// GTA-style elevator sequence:
//
// 1. Exterior/side reveal of HERO
// 2. Camera moves behind HERO
// 3. Camera follows the elevator upward
// 4. HERO remains visible
// 5. World is visible through glass
//
// We do NOT switch to first-person.
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
  // PHASE 2 — GTA THIRD-PERSON ELEVATOR VIEW
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
//
// Rooftop is deliberately more cinematic.
//
// But we don't constantly throw the player miles away.
//
// The default remains GTA-style third-person.
//
// A subtle orbit gives the rooftop a premium feel.
//

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
        70,
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
      // FLOORS 1–3
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
