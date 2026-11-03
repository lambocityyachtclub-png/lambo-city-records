// camera.js
// LAMBO CITY
// THIRD-PERSON CINEMATIC CAMERA
//
// WORLD
// - Stable third-person camera
//
// RECORDS HQ
// - Floor 1: elevated immersive retail camera
// - Floor 2: dedicated immersive studio camera
// - Floor 3: first-person character POV with touch / mouse look
// - Rooftop: wider cinematic camera
//
// CAMERA TRANSITION
// - Entering/exiting a building transitions quickly,
//   like walking through a real doorway.
// - Does NOT modify player movement.
// - Does NOT modify collision.
// - Does NOT modify elevator movement.
// - Does NOT modify building architecture.

import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";

let camera;
let cinTime = 0;
let lookDragPointerId = null;
let lookPointerX = 0;
let lookPointerY = 0;
let lookYawOffset = 0;
let lookPitchOffset = 0;
let floor3POVActive = false;
let floor3POVBlend = 0;
let elevatorPOVActive = false;
let elevatorLookYaw = 0;
let elevatorLookPitch = -0.02;
let elevatorLookPointerId = null;
let elevatorLookPointerX = 0;
let elevatorLookPointerY = 0;


// ============================================================
// RECORDS HQ BOUNDS
// ============================================================

const HQ_MIN_X = 19.0;
const HQ_MAX_X = 37.0;

const HQ_MIN_Z = 14.5;
const HQ_MAX_Z = 29.25;


// ============================================================
// FLOOR 1 INTERIOR CAMERA BOUNDS
// ============================================================

const FLOOR1_MIN_X = 20.15;
const FLOOR1_MAX_X = 35.85;

const FLOOR1_MIN_Z = 15.85;
const FLOOR1_MAX_Z = 28.15;


// ============================================================
// WORLD CAMERA
// ============================================================

const WORLD_DISTANCE = 22;
const WORLD_HEIGHT = 13;


// ============================================================
// FLOOR 1 CAMERA
// ============================================================

const FLOOR1_DISTANCE = 5.8;
const FLOOR1_HEIGHT = 4.5;
const FLOOR1_LOOK_HEIGHT = 1.8;
const FLOOR1_SIDE_OFFSET = 0.8;


// ============================================================
// FLOOR 2 STUDIO CAMERA
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
// FAST BUILDING TRANSITION
// ============================================================
//
// When HERO crosses the building threshold, the camera needs
// to react quickly instead of slowly easing between the world
// and interior camera.
//
// This gives the feeling of:
//     outside → doorway → interior
//
// without creating a separate cinematic camera system.
//

const BUILDING_TRANSITION_TIME = 0.30;

let previousInsideHQ = false;
let buildingTransition = 0;


// ============================================================
// DETERMINE HQ FLOOR
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

  const x = player.position.x;
  const z = player.position.z;

  return (
    x >= HQ_MIN_X &&
    x <= HQ_MAX_X &&
    z >= HQ_MIN_Z &&
    z <= HQ_MAX_Z
  );

}


// ============================================================
// CAMERA DAMPING
// ============================================================

function damp(current, target, amount) {

  return current +
    (target - current) *
    amount;

}


// ============================================================
// MOVE CAMERA
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

function updateWorldCamera(player, smooth = 0.07) {

  const drift =
    Math.sin(
      cinTime * 0.25
    ) * 1.2;

  moveCamera(

    player.position.x +
      drift,

    player.position.y +
      WORLD_HEIGHT,

    player.position.z +
      WORLD_DISTANCE,

    smooth

  );

  camera.lookAt(

    player.position.x,

    player.position.y + 2,

    player.position.z - 5

  );

}


// ============================================================
// FLOOR 1 CAMERA
// ============================================================

function updateFloor1Camera(
  player,
  smooth = 0.10
) {

  const yaw =
    player.rotation.y;

  const forwardX =
    Math.sin(yaw);

  const forwardZ =
    Math.cos(yaw);


  // ----------------------------------------------------------
  // CAMERA POSITION
  // ----------------------------------------------------------

  let cameraX =
    player.position.x -
    forwardX *
    FLOOR1_DISTANCE;

  let cameraZ =
    player.position.z -
    forwardZ *
    FLOOR1_DISTANCE;


  // Slight shoulder offset.

  const sideX =
    Math.cos(yaw) *
    FLOOR1_SIDE_OFFSET;

  const sideZ =
    -Math.sin(yaw) *
    FLOOR1_SIDE_OFFSET;


  cameraX += sideX;
  cameraZ += sideZ;


  // ----------------------------------------------------------
  // HARD INTERIOR BOUNDS
  // ----------------------------------------------------------

  cameraX =
    THREE.MathUtils.clamp(
      cameraX,
      FLOOR1_MIN_X,
      FLOOR1_MAX_X
    );

  cameraZ =
    THREE.MathUtils.clamp(
      cameraZ,
      FLOOR1_MIN_Z,
      FLOOR1_MAX_Z
    );


  // ----------------------------------------------------------
  // CAMERA HEIGHT
  // ----------------------------------------------------------

  const cameraY =
    player.position.y +
    FLOOR1_HEIGHT;


  moveCamera(

    cameraX,

    cameraY,

    cameraZ,

    smooth

  );


  // ----------------------------------------------------------
  // LOOK TARGET
  // ----------------------------------------------------------

  let lookX =
    player.position.x +
    forwardX * 1.8;

  let lookZ =
    player.position.z +
    forwardZ * 1.8;


  lookX =
    THREE.MathUtils.clamp(
      lookX,
      FLOOR1_MIN_X,
      FLOOR1_MAX_X
    );

  lookZ =
    THREE.MathUtils.clamp(
      lookZ,
      FLOOR1_MIN_Z,
      FLOOR1_MAX_Z
    );


  const lookY =
    player.position.y +
    FLOOR1_LOOK_HEIGHT;


  camera.lookAt(

    lookX,
    lookY,
    lookZ

  );

}


// ============================================================
// FLOOR 2 STUDIO CAMERA
// ============================================================

function updateStudioCamera(
  player,
  smooth = 0.12
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

    smooth

  );


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
// FLOOR 2 — CINEMATIC ELEVATOR-TO-STUDIO ARRIVAL CAMERA
// ============================================================

function updateStudioArrivalCamera(player, smooth = 0.48) {
  const yaw = player.rotation.y;
  const forwardX = Math.sin(yaw);
  const forwardZ = Math.cos(yaw);
  const rightX = Math.cos(yaw);
  const rightZ = -Math.sin(yaw);

  // Keep one steady, close follow angle for the entire entrance.
  // No side-orbit or forward camera sweep: the camera stays within
  // the studio footprint while HERO follows the existing path.
  let cameraX =
    player.position.x - forwardX * 3.1 + rightX * 0.45;
  let cameraZ =
    player.position.z - forwardZ * 3.1 + rightZ * 0.45;

  cameraX = THREE.MathUtils.clamp(cameraX, 21.25, 34.75);
  cameraZ = THREE.MathUtils.clamp(cameraZ, 16.0, 26.5);

  if (progress >= 1) {
    // Hold a wider, slightly elevated view from inside the room so
    // the player can take in the complete studio before the seated view.
    moveCamera(
      28.0,
      player.position.y + 3.65,
      26.55,
      0.20
    );
    camera.lookAt(
      28.0,
      player.position.y + 1.45,
      21.15
    );
    return;
  }

  const cameraY = player.position.y + 2.45;
  moveCamera(cameraX, cameraY, cameraZ, smooth);

  camera.lookAt(
    player.position.x + forwardX * 0.45,
    player.position.y + 1.3,
    player.position.z + forwardZ * 0.45
  );
}


// ============================================================
// FLOOR 2 — SEATED 360-DEGREE STUDIO CAMERA
// ============================================================

function updateStudioSessionCamera(player, smooth = 0.22) {
  const yaw = Number(window.__lamboCityFloor2OrbitYaw ?? 0);
  const radius = 4.15;

  // The camera orbits the fixed producer-chair position, not the
  // player's changing facing direction. The radius is deliberately
  // smaller than the room's narrowest clearance so a full 360 stays
  // inside the studio instead of passing through the walls.
  let cameraX = player.position.x + Math.sin(yaw) * radius;
  let cameraZ = player.position.z + Math.cos(yaw) * radius;

  cameraX = THREE.MathUtils.clamp(cameraX, 20.75, 35.25);
  cameraZ = THREE.MathUtils.clamp(cameraZ, 15.55, 27.05);

  // Match Floor 3's steady, level camera treatment.
  const cameraY = player.position.y + 2.9;
  moveCamera(cameraX, cameraY, cameraZ, smooth);

  // Fixed focal point on the producer's workstation; no pitch input.
  camera.lookAt(
    player.position.x,
    player.position.y + 1.7,
    player.position.z - 1.15
  );
}


// ============================================================
// ELEVATOR CAMERA
// ============================================================

function updateElevatorCamera(player, delta = 0.016) {
  if (!elevatorPOVActive) {
    elevatorLookYaw = 0;
    elevatorLookPitch = -0.02;
    elevatorPOVActive = true;
  }

  const input = window.__lamboCityInput;
  const turnSpeed = 1.7 * Math.max(0, delta);
  if (input?.keys?.arrowleft) elevatorLookYaw -= turnSpeed;
  if (input?.keys?.arrowright) elevatorLookYaw += turnSpeed;
  if (input?.keys?.arrowup) elevatorLookPitch += turnSpeed;
  if (input?.keys?.arrowdown) elevatorLookPitch -= turnSpeed;
  elevatorLookPitch = THREE.MathUtils.clamp(
    elevatorLookPitch,
    -0.72,
    0.72
  );
  window.__lamboCityElevatorLookYaw = elevatorLookYaw;

  // Eye-level first-person view: HERO can explore the cabin and look
  // through its panoramic glass while the elevator is moving.
  player.visible = false;
  camera.position.set(
    player.position.x,
    player.position.y + 1.62,
    player.position.z
  );

  const horizontal = Math.cos(elevatorLookPitch);
  camera.lookAt(
    camera.position.x + Math.sin(elevatorLookYaw) * horizontal,
    camera.position.y + Math.sin(elevatorLookPitch),
    camera.position.z - Math.cos(elevatorLookYaw) * horizontal
  );
}

// ============================================================
// ROOFTOP CAMERA
// ============================================================

function updateRooftopCamera(player) {

  const yaw =
    player.rotation.y;

  const forwardX =
    Math.sin(yaw);

  const forwardZ =
    Math.cos(yaw);


  const distance = 9.5;


  const cinematicDrift =
    Math.sin(
      cinTime * 0.18
    ) * 1.2;


  const cameraX =
    player.position.x -
    forwardX *
    distance +
    cinematicDrift;

  const cameraZ =
    player.position.z -
    forwardZ *
    distance;


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
 // FLOOR 3 FIRST-PERSON LOOK CONTROLS
 // Drag open screen space to look around. The movement joystick
 // and interface controls are excluded from camera input.
 // ============================================================

function installFloor3LookControls() {
  if (window.__lamboCityFloor3LookControlsReady) return;
  window.__lamboCityFloor3LookControlsReady = true;

  window.addEventListener("pointerdown", event => {
    if (event.button !== undefined && event.button !== 0) return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest("#lambo-city-joystick, #lambo-city-mobile-buttons, #hud, #lambo-phone, button, a, input, textarea, select, [role='button']")) return;

    lookDragPointerId = event.pointerId;
    lookPointerX = event.clientX;
    lookPointerY = event.clientY;
  });

  window.addEventListener("pointermove", event => {
    if (lookDragPointerId !== event.pointerId) return;
    const dx = event.clientX - lookPointerX;
    lookPointerX = event.clientX;
    lookPointerY = event.clientY;

    // Floor 3 rotates around the six-person display; vertical drag
    // does not move the fixed screen focal point.
    lookYawOffset += dx * 0.0042;
    event.preventDefault();
  }, { passive: false });

  const releaseLook = event => {
    if (lookDragPointerId === event.pointerId) lookDragPointerId = null;
  };
  window.addEventListener("pointerup", releaseLook);
  window.addEventListener("pointercancel", releaseLook);
  window.addEventListener("blur", () => {
    lookDragPointerId = null;
  });
}

function updateFloor3POVCamera(player, delta = 0.016) {
  player.visible = false;

  if (camera.fov !== 72) {
    camera.fov = 72;
    camera.updateProjectionMatrix();
  }

  // The six-person display is the permanent focal point. The camera
  // moves around it in a level 360-degree circle, keeping the same
  // viewing height and radius instead of following player movement.
  const focus = new THREE.Vector3(28, 22.23, 27.53);
  const orbitRadius = 2.73;
  const orbitHeight = 1.20;
  const yaw = lookYawOffset;
  const targetPosition = new THREE.Vector3(
    focus.x + Math.sin(yaw) * orbitRadius,
    focus.y + orbitHeight,
    focus.z - Math.cos(yaw) * orbitRadius
  );

  if (!floor3POVActive) {
    floor3POVActive = true;
    floor3POVBlend = 0;
  }

  floor3POVBlend = Math.min(1, floor3POVBlend + delta / 0.45);
  if (floor3POVBlend < 1) {
    const blend = floor3POVBlend * floor3POVBlend * (3 - 2 * floor3POVBlend);
    camera.position.lerp(targetPosition, blend);
  } else {
    camera.position.copy(targetPosition);
  }

  camera.lookAt(focus);
}


function installElevatorLookControls() {
  if (window.__lamboCityElevatorLookControlsReady) return;
  window.__lamboCityElevatorLookControlsReady = true;

  window.addEventListener("pointerdown", event => {
    if (!window.__lamboCityElevatorPOV) return;
    if (event.button !== undefined && event.button !== 0) return;

    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest(
      "#lambo-city-joystick, #lambo-city-mobile-buttons, #records-hq-elevator-buttons, #records-hq-elevator-close, button, a, input, textarea, select, [role='button']"
    )) return;

    elevatorLookPointerId = event.pointerId;
    elevatorLookPointerX = event.clientX;
    elevatorLookPointerY = event.clientY;
  });

  window.addEventListener("pointermove", event => {
    if (
      elevatorLookPointerId !== event.pointerId ||
      !window.__lamboCityElevatorPOV
    ) return;

    const dx = event.clientX - elevatorLookPointerX;
    const dy = event.clientY - elevatorLookPointerY;
    elevatorLookPointerX = event.clientX;
    elevatorLookPointerY = event.clientY;

    elevatorLookYaw -= dx * 0.0045;
    elevatorLookPitch = THREE.MathUtils.clamp(
      elevatorLookPitch - dy * 0.0035,
      -0.72,
      0.72
    );
    event.preventDefault();
  }, { passive: false });

  const release = event => {
    if (elevatorLookPointerId === event.pointerId) {
      elevatorLookPointerId = null;
    }
  };
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);
  window.addEventListener("blur", () => {
    elevatorLookPointerId = null;
  });
}

// ============================================================
// CAMERA SYSTEM
// ============================================================

export default {

  init() {

    installFloor3LookControls();
    installElevatorLookControls();

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


    if (!player || !camera) {
      return;
    }


    cinTime += delta;

    // The active camera mode selects the lens and avatar visibility below.

    // --------------------------------------------------------
    // DETECT BUILDING ENTRY / EXIT
    // --------------------------------------------------------

    const insideHQ =
      isInsideHQ(player);

    const currentHQFloor = insideHQ
      ? getHQFloor(player.position.y)
      : 0;

    // Keep the elevator camera until the passenger clears the rear
    // portal; only then enter the Floor 3 first-person view.
    const floor3POVReady =
      currentHQFloor === 3 &&
      player.position.z >= 14.7 &&
      window.__lamboCityFloor3ArrivalComplete !== false;

    const elevatorPOV = !!window.__lamboCityElevatorPOV;
    player.visible = elevatorPOV ? false : !floor3POVReady;

    const targetFov = elevatorPOV ? 76 : floor3POVReady ? 72 : 68;
    if (camera.fov !== targetFov) {
      camera.fov = targetFov;
      camera.updateProjectionMatrix();
    }

    if (window.__lamboCityElevatorTraveling || !floor3POVReady) {
      if (floor3POVActive) {
        lookYawOffset = 0;
        lookPitchOffset = 0;
      }
      floor3POVActive = false;
      floor3POVBlend = 0;
    }

    if (
      insideHQ !==
      previousInsideHQ
    ) {

      // Start a short, fast doorway transition.

      buildingTransition =
        BUILDING_TRANSITION_TIME;

      previousInsideHQ =
        insideHQ;

    }


    // --------------------------------------------------------
    // FAST TRANSITION TIMER
    // --------------------------------------------------------

    if (buildingTransition > 0) {

      buildingTransition =
        Math.max(
          0,
          buildingTransition -
          delta
        );

    }


    // --------------------------------------------------------
    // CAMERA SMOOTHING
    // --------------------------------------------------------
    //
    // Normal gameplay keeps the existing smooth camera.
    //
    // During the doorway transition we increase the response
    // substantially so the interior perspective arrives quickly.

    const transitionActive =
      buildingTransition > 0;


    const worldSmooth =
      transitionActive
        ? 0.30
        : 0.07;

    const interiorSmooth =
      transitionActive
        ? 0.30
        : 0.10;


    // --------------------------------------------------------
    // ELEVATOR / FLOOR 3 LANDING THRESHOLD
    // --------------------------------------------------------
    // The elevator sits just outside the HQ camera bounds. Keep the
    // passenger in the glass-lift view while the doors open and until
    // they physically cross the rear portal; never snap back to the
    // distant world camera during this handoff.

    const floor2LandingPending =
      window.__lamboCityElevatorLandingFloor === 2 &&
      player.position.z < 15.2;

    const floor3LandingPending =
      window.__lamboCityElevatorLandingFloor === 3 &&
      player.position.z < 14.7;

    if (
      elevatorPOV ||
      window.__lamboCityElevatorTraveling ||
      floor2LandingPending ||
      floor3LandingPending
    ) {
      updateElevatorCamera(player, delta);
      return;
    }

    elevatorPOVActive = false;
    elevatorLookPointerId = null;
    window.__lamboCityElevatorLookYaw = 0;


    // --------------------------------------------------------
    // RECORDS HQ
    // --------------------------------------------------------

    if (
      insideHQ
    ) {

      const floor =
        getHQFloor(
          player.position.y
        );


      // ------------------------------------------------------
      // ROOFTOP
      // ------------------------------------------------------

      if (floor === 4) {

        updateRooftopCamera(
          player
        );

        return;

      }


      // ------------------------------------------------------
      // FLOOR 2 STUDIO
      // ------------------------------------------------------

      if (floor === 2) {

        if (
          window.__lamboCityFloor2SessionActive &&
          window.__lamboCityFloor2SessionMode === "arrival"
        ) {
          updateStudioArrivalCamera(player, 0.48);
        } else if (window.__lamboCityFloor2SessionActive) {
          updateStudioSessionCamera(player, 0.24);
        } else {
          updateStudioCamera(player, interiorSmooth);
        }

        return;

      }


      // ------------------------------------------------------
      // FLOOR 1
      // ------------------------------------------------------

      if (floor === 1) {

        updateFloor1Camera(
          player,
          interiorSmooth
        );

        return;

      }


      // ------------------------------------------------------
      // FLOOR 3 — ELEVATOR THRESHOLD → CHARACTER EYE-LEVEL POV
      // ------------------------------------------------------

      if (!floor3POVReady) {
        updateElevatorCamera(player);
      } else {
        updateFloor3POVCamera(player, delta);
      }

      return;

    }


    // --------------------------------------------------------
    // NORMAL WORLD
    // --------------------------------------------------------

    updateWorldCamera(
      player,
      worldSmooth
    );

  },


  getCamera() {

    return camera;

  }

};
