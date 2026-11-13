// camera.js
// LAMBO CITY — unified third-person camera controller
//
// One consistent exploration camera for the outdoor world and all
// walkable Records HQ floors. Camera orbit is independent of player
// facing. The elevator uses an exterior tracking angle; it never
// switches to a passenger/first-person view.
//
// Floor 2's seated producer camera remains a dedicated workstation view.

import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";
import Collision from "./collision.js";

let camera = null;
let scene = null;
let canvas = null;
let resizeHandler = null;
let pointerState = null;
let cameraYaw = 0;
let cameraPitch = 0.18;
let cinTime = 0;
let lastOrbitInputAt = 0;
let initialized = false;
let currentMode = "world";

const FOLLOW_DISTANCE = 8.2;
const FOLLOW_HEIGHT = 4.15;
const LOOK_HEIGHT = 1.75;
const FOLLOW_RESPONSE = 5.2;
const ORBIT_SENSITIVITY = 0.006;
const MIN_PITCH = -0.12;
const MAX_PITCH = 0.62;

const HQ_MIN_X = 19.7;
const HQ_MAX_X = 36.3;
const HQ_MIN_Z = 14.0;
const HQ_MAX_Z = 28.2;

function dampFactor(delta, response = FOLLOW_RESPONSE) {
  return 1 - Math.exp(-Math.max(0, delta) * response);
}

function dampAngle(current, target, amount) {
  let difference = (target - current + Math.PI) % (Math.PI * 2);
  if (difference < 0) difference += Math.PI * 2;
  difference -= Math.PI;
  return current + difference * amount;
}

function isInsideHQ(player) {
  return player.position.x >= HQ_MIN_X &&
    player.position.x <= HQ_MAX_X &&
    player.position.z >= HQ_MIN_Z &&
    player.position.z <= HQ_MAX_Z;
}

function getHQFloor(y) {
  if (y < 8) return 1;
  if (y < 16.2) return 2;
  if (y < 23.8) return 3;
  return 4;
}

function attachOrbitControls(renderer) {
  if (canvas || !renderer?.domElement) return;

  canvas = renderer.domElement;
  canvas.style.touchAction = "none";
  canvas.style.cursor = "grab";

  const onPointerDown = event => {
    if (window.__lamboCityFloor2SessionActive &&
        window.__lamboCityFloor2SessionMode === "seated") return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    // Keep the left-side iPad movement joystick dedicated to movement.
    if (event.pointerType !== "mouse" &&
        event.clientX < window.innerWidth * 0.38) return;
    if (event.target?.closest?.("button, input, textarea, select, a")) return;

    pointerState = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      moved: false
    };
    canvas.style.cursor = "grabbing";
    try { canvas.setPointerCapture(event.pointerId); } catch (_) {}
  };

  const onPointerMove = event => {
    if (!pointerState || event.pointerId !== pointerState.id) return;
    const dx = event.clientX - pointerState.x;
    const dy = event.clientY - pointerState.y;
    pointerState.x = event.clientX;
    pointerState.y = event.clientY;

    if (Math.abs(dx) + Math.abs(dy) > 1) pointerState.moved = true;
    cameraYaw -= dx * ORBIT_SENSITIVITY;
    cameraPitch = THREE.MathUtils.clamp(
      cameraPitch + dy * ORBIT_SENSITIVITY,
      MIN_PITCH,
      MAX_PITCH
    );
    lastOrbitInputAt = performance.now();

    if (pointerState.moved) {
      window.__lamboCitySuppressStationClickUntil =
        Date.now() + 220;
    }
  };

  const endPointer = event => {
    if (!pointerState || event.pointerId !== pointerState.id) return;
    pointerState = null;
    canvas.style.cursor = "grab";
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);
  canvas.addEventListener("lostpointercapture", endPointer);

  this._removeOrbitControls = () => {
    canvas?.removeEventListener("pointerdown", onPointerDown);
    canvas?.removeEventListener("pointermove", onPointerMove);
    canvas?.removeEventListener("pointerup", endPointer);
    canvas?.removeEventListener("pointercancel", endPointer);
    canvas?.removeEventListener("lostpointercapture", endPointer);
    if (canvas) canvas.style.cursor = "";
    canvas = null;
  };
}

function keepCameraOutsideWalls(target, desired, cameraY) {
  // Sample the camera boom against the same architectural AABB collision
  // data used by player movement. Stop just before the first wall hit.
  const offset = desired.clone().sub(target);
  const samples = 16;
  let safe = target.clone();

  for (let i = 1; i <= samples; i++) {
    const candidate = target.clone().addScaledVector(offset, i / samples);
    if (Collision.isBlocked(candidate.x, candidate.z, 0.24, cameraY)) {
      break;
    }
    safe.copy(candidate);
  }

  return safe;
}

function isNearExistingCharacter(player, npcSystem) {
  const targets = npcSystem?.getCameraTargets?.() || [];
  return targets.some(target => {
    if (!target?.position) return false;
    const dx = player.position.x - target.position.x;
    const dz = player.position.z - target.position.z;
    return dx * dx + dz * dz <= 10.5 * 10.5;
  });
}

function isNearBuilding(player) {
  // These centers match the existing Records HQ and marina storefronts.
  const buildings = [
    { x: 28, z: 22, radius: 17 },
    { x: -20, z: 31, radius: 15 },
    { x: -32, z: 31, radius: 15 },
    { x: -44, z: 31, radius: 15 }
  ];
  return buildings.some(building => {
    const dx = player.position.x - building.x;
    const dz = player.position.z - building.z;
    return dx * dx + dz * dz <= building.radius * building.radius;
  });
}

function updateExplorationCamera(player, delta, moving, insideHQ, npcSystem, hasMoved) {
  const now = performance.now();

  // When the player walks for a while, gently settle behind their
  // travel direction. Manual orbit remains independent and takes priority.
  if (moving && now - lastOrbitInputAt > 1500) {
    cameraYaw = dampAngle(
      cameraYaw,
      player.rotation.y + Math.PI,
      dampFactor(delta, 1.35)
    );
  }

  // Start with a high, wide marina view. Once the player begins exploring,
  // return to the familiar closer framing near existing characters/buildings.
  const closeFraming = insideHQ ||
    (hasMoved && (isNearExistingCharacter(player, npcSystem) ||
      isNearBuilding(player)));
  const startupWideView = !insideHQ && !hasMoved && !closeFraming;
  const distance = insideHQ ? 6.7 :
    closeFraming ? FOLLOW_DISTANCE : startupWideView ? 17.0 : 15.5;
  const cameraHeight = insideHQ ? 3.25 :
    closeFraming ? 3.4 : startupWideView ? 8.0 : 7.2;

  const target = new THREE.Vector3(
    player.position.x,
    player.position.y + LOOK_HEIGHT,
    player.position.z
  );

  const horizontal = Math.cos(cameraPitch) * distance;
  const desired = new THREE.Vector3(
    target.x + Math.sin(cameraYaw) * horizontal,
    player.position.y + cameraHeight + Math.sin(cameraPitch) * distance,
    target.z + Math.cos(cameraYaw) * horizontal
  );

  const t = dampFactor(delta, closeFraming ? FOLLOW_RESPONSE : 2.8);
  camera.position.lerp(desired, t);

  // Keep the marina/stage in the forward composition while wide;
  // restore the existing look-ahead when near a person or building.
  const lookAhead = closeFraming ? 8.0 : 13.5;
  const lookTarget = target.clone().add(new THREE.Vector3(
    Math.sin(player.rotation.y) * lookAhead,
    0,
    Math.cos(player.rotation.y) * lookAhead
  ));
  camera.lookAt(lookTarget);
}

function updateElevatorExteriorCamera(player, delta) {
  // Exterior three-quarter tracking shot: the cabin travels vertically
  // through frame while the camera remains outside the passenger space.
  // Anchor the camera to the building-side exterior of the lift shaft,
  // not to the passenger. This prevents the camera from entering the
  // cabin when HERO steps inside or while the lift is moving.
  const target = new THREE.Vector3(
    23,
    player.position.y + 2.0,
    14.15
  );
  const desired = new THREE.Vector3(
    30.4,
    player.position.y + 4.2,
    22.35
  );
  camera.position.lerp(desired, dampFactor(delta, 3.8));
  camera.lookAt(target);
}

function updateStudioArrivalCamera(player, delta) {
  // Restore the original Floor 2 elevator-to-cockpit camera move:
  // a natural third-person follow that keeps HERO and the room visible.
  // Keep the camera boom inside the actual Floor 2 room so it cannot
  // slip outside the room perimeter and look through the floor slab.
  const ROOM_MIN_X = 19.65;
  const ROOM_MAX_X = 36.35;
  const ROOM_MIN_Z = 15.45;
  const ROOM_MAX_Z = 28.05;
  const yaw = player.rotation.y;
  const back = 9.2;

  const cameraX = THREE.MathUtils.clamp(
    player.position.x - Math.sin(yaw) * back,
    ROOM_MIN_X + 0.9,
    ROOM_MAX_X - 0.9
  );
  const cameraZ = THREE.MathUtils.clamp(
    player.position.z - Math.cos(yaw) * back,
    ROOM_MIN_Z + 0.9,
    ROOM_MAX_Z - 0.9
  );

  const desired = new THREE.Vector3(
    cameraX,
    // Raise the arrival viewpoint while staying just below the lowest
    // Floor 2 acoustic soffit. The current lower framing exposes the
    // elevator shaft and the level below during the walk-out.
    Math.min(player.position.y + 5.55, 17.78),
    cameraZ
  );

  // Keep the same smooth follow response from the earlier sequence.
  camera.position.lerp(desired, dampFactor(delta, 8.5));
  camera.lookAt(
    player.position.x,
    player.position.y + LOOK_HEIGHT,
    player.position.z
  );
}

function updateStudioSessionCamera(player, delta) {
  const yaw = Number(window.__lamboCityFloor2OrbitYaw ?? 0);
  const pitch = THREE.MathUtils.clamp(
    Number(window.__lamboCityFloor2OrbitPitch ?? 0.08),
    -0.12,
    0.18
  );

  // Keep the seated 360 view inside the actual Floor 2 studio volume.
  // The previous camera height rose above the acoustic ceiling, and its
  // 5.25-unit orbit could carry the view beyond the room perimeter.
  const radius = 3.65;
  // Floor 2's raised acoustic ceiling sits below the Floor 3 slab.
  // Keep the full 360 orbit inside the room's actual interior volume,
  // not merely inside the larger HQ building footprint.
  const ROOM_MIN_X = 19.65;
  const ROOM_MAX_X = 36.35;
  const ROOM_MIN_Z = 15.45;
  const ROOM_MAX_Z = 28.05;
  const ROOM_CEILING_Y = 17.85;

  const desired = new THREE.Vector3(
    THREE.MathUtils.clamp(
      player.position.x + Math.sin(yaw) * radius,
      ROOM_MIN_X,
      ROOM_MAX_X
    ),
    THREE.MathUtils.clamp(
      player.position.y + 2.35 + pitch * 1.2,
      player.position.y + 1.55,
      ROOM_CEILING_Y
    ),
    THREE.MathUtils.clamp(
      player.position.z + Math.cos(yaw) * radius,
      ROOM_MIN_Z,
      ROOM_MAX_Z
    )
  );

  camera.position.lerp(desired, dampFactor(delta, 4.5));
  // Clamp after interpolation as well, so a camera arriving from the
  // elevator/arrival view can never drift above or outside the studio.
  camera.position.x = THREE.MathUtils.clamp(
    camera.position.x, ROOM_MIN_X, ROOM_MAX_X
  );
  camera.position.y = THREE.MathUtils.clamp(
    camera.position.y, player.position.y + 1.55, ROOM_CEILING_Y
  );
  camera.position.z = THREE.MathUtils.clamp(
    camera.position.z, ROOM_MIN_Z, ROOM_MAX_Z
  );
  camera.lookAt(
    player.position.x,
    player.position.y + 1.55 + pitch * 0.25,
    player.position.z - 1.0
  );
}

export default {
  init() {
    camera = new THREE.PerspectiveCamera(
      62,
      window.innerWidth / window.innerHeight,
      0.05,
      2000
    );
    camera.position.set(0, 8, 14);
    camera.lookAt(0, 1.7, 0);

    if (!initialized) {
      resizeHandler = () => {
        if (!camera) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", resizeHandler);
      initialized = true;
    }
    return camera;
  },

  update(delta, context) {
    const player = context?.player;
    if (!player || !camera) return;

    scene = context.scene || scene;
    cinTime += delta;
    attachOrbitControls(context.renderer);

    const insideHQ = isInsideHQ(player);
    const floor = insideHQ ? getHQFloor(player.position.y) : 0;
    const seatedStudio =
      floor === 2 &&
      window.__lamboCityFloor2SessionActive &&
      window.__lamboCityFloor2SessionMode === "seated";

    const floor2Arrival =
      floor === 2 &&
      window.__lamboCityFloor2SessionActive &&
      window.__lamboCityFloor2SessionMode === "arrival";

    if (floor2Arrival) {
      currentMode = "studio-arrival";
      updateStudioArrivalCamera(player, delta);
      return;
    }


    if (seatedStudio) {
      currentMode = "studio-seated";
      updateStudioSessionCamera(player, delta);
      return;
    }

    if (
      window.__lamboCityElevatorTraveling ||
      window.__lamboCityElevatorInRange ||
      window.__lamboCityElevatorLandingFloor === 2 ||
      window.__lamboCityElevatorLandingFloor === 3
    ) {
      currentMode = "elevator-exterior";
      updateElevatorExteriorCamera(player, delta);
      return;
    }

    currentMode = insideHQ ? "interior-third-person" : "world-third-person";

    const moving =
      !!window.__lamboCityFloor2SessionActive === false &&
      (Math.abs(player.position.x - (this._lastX ?? player.position.x)) > 0.001 ||
       Math.abs(player.position.z - (this._lastZ ?? player.position.z)) > 0.001);

    this._lastX = player.position.x;
    this._lastZ = player.position.z;

    this._hasMovedSinceStart = this._hasMovedSinceStart || moving;
    updateExplorationCamera(
      player,
      delta,
      moving,
      insideHQ,
      context.systems?.npc,
      this._hasMovedSinceStart
    );
  },

  getCamera() {
    return camera;
  },

  getMode() {
    return currentMode;
  }
};
