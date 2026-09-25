import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let camera;
let cinTime = 0;

const HQ_MIN_X = 19;
const HQ_MAX_X = 37;
const HQ_MIN_Z = 12.5;
const HQ_MAX_Z = 29.5;

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

function damp(current, target, amount) {

  return (
    current +
    (target - current) *
    amount
  );
}

function setCameraPosition(
  x,
  y,
  z,
  smooth = 0.08
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

function updateNormalWorldCamera(player) {

  const drift =
    Math.sin(
      cinTime * 0.25
    ) * 1.2;

  setCameraPosition(
    player.position.x + drift,
    player.position.y + 13,
    player.position.z + 22,
    0.06
  );

  camera.lookAt(
    player.position.x,
    player.position.y + 2,
    player.position.z - 5
  );
}


// ============================================================
// RECORDS HQ — TRUE INTERIOR POV
// ============================================================
//
// Floors 1 / 2 / 3 now behave like actual interior spaces.
//
// The camera sits at HERO's eye level instead of above and
// behind the building.
//
// This prevents the exterior HQ structure from dominating
// the player's view.
//

function updateHQInteriorCamera(player) {

  const eyeHeight =
    2.65;

  const forwardX =
    Math.sin(
      player.rotation.y
    );

  const forwardZ =
    Math.cos(
      player.rotation.y
    );

  const eyeX =
    player.position.x;

  const eyeY =
    player.position.y +
    eyeHeight;

  const eyeZ =
    player.position.z;

  setCameraPosition(
    eyeX,
    eyeY,
    eyeZ,
    0.14
  );

  camera.lookAt(
    eyeX +
      forwardX * 9,

    eyeY -
      0.10,

    eyeZ +
      forwardZ * 9
  );
}


// ============================================================
// RECORDS HQ — ROOFTOP CINEMATIC
// ============================================================
//
// The rooftop is intentionally different.
//
// This is where LAMBO CITY is allowed to pull the camera
// away from HERO and reveal the Records HQ as a landmark.
//

function updateRooftopCamera(player) {

  const orbitRadius =
    18;

  const orbit =
    cinTime * 0.10;

  const cameraX =
    player.position.x +
    Math.sin(orbit) *
    orbitRadius;

  const cameraZ =
    player.position.z +
    Math.cos(orbit) *
    orbitRadius;

  const cameraY =
    player.position.y +
    9.5;

  setCameraPosition(
    cameraX,
    cameraY,
    cameraZ,
    0.035
  );

  camera.lookAt(
    player.position.x,
    player.position.y + 2,
    player.position.z
  );
}


// ============================================================
// RECORDS HQ — ELEVATOR CINEMATIC
// ============================================================
//
// PHASE 1:
// Show HERO inside the glass elevator.
//
// PHASE 2:
// Transition into first-person POV.
//
// This creates the feeling of actually riding the elevator
// rather than watching a character teleport between floors.
//

function updateElevatorCamera(player) {

  const progress =
    Number(
      window.__lamboCityElevatorProgress ?? 0
    );


  // ----------------------------------------------------------
  // OPENING CINEMATIC
  // ----------------------------------------------------------
  //
  // Briefly reveal HERO physically inside the elevator.

  if (
    progress < 0.28
  ) {

    setCameraPosition(
      player.position.x + 6.5,
      player.position.y + 4.5,
      player.position.z + 8.5,
      0.09
    );

    camera.lookAt(
      player.position.x,
      player.position.y + 2,
      player.position.z
    );

    return;
  }


  // ----------------------------------------------------------
  // FIRST-PERSON ELEVATOR POV
  // ----------------------------------------------------------
  //
  // HERO's eyes become the camera.
  //
  // The glass elevator becomes the window into LAMBO CITY.

  setCameraPosition(
    player.position.x,
    player.position.y + 2.65,
    player.position.z,
    0.12
  );

  camera.lookAt(
    player.position.x,
    player.position.y + 2.55,
    player.position.z - 8
  );
}


// ============================================================
// EXPORT
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


  update(delta, context) {

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
    // ELEVATOR HAS CAMERA PRIORITY
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
      // FLOORS 1 / 2 / 3
      // ------------------------------------------------------

      updateHQInteriorCamera(
        player
      );

      return;
    }


    // ========================================================
    // NORMAL WORLD
    // ========================================================

    updateNormalWorldCamera(
      player
    );

  },


  getCamera() {

    return camera;

  }

};
