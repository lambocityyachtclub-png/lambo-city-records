/*
 * LAMBO CITY RECORDS — FLOOR 2 STUDIO SESSION CONTROLLER
 *
 * Owns the seated-session lifecycle only:
 * - automatic elevator-to-chair arrival
 * - movement lock while seated
 * - 360-degree touch/mouse camera orbit
 * - explicit end-session transition back to free roam
 *
 * Physical station geometry and individual instrument apps remain
 * owned by their existing modules.
 */

const HQ_X = 28;
const HQ_Z = 22;
const FLOOR_2_Y = 12.2;

// The producer chair is centered in the room. The workstation is
// placed forward (+Z) from this point in the companion layout pass.
const PRODUCER_SEAT = {
  x: HQ_X + 1.1,
  y: FLOOR_2_Y,
  z: HQ_Z - 2.15
};

const ELEVATOR_ARRIVAL_SECONDS = 1.0;
const FLOOR_2_DISCOVERY_KEY = "lambo-city-floor2-discovered-v1";

function readFloor2Discovery() {
  try {
    return localStorage.getItem(FLOOR_2_DISCOVERY_KEY) === "1";
  } catch (_) {
    return false;
  }
}

function saveFloor2Discovery() {
  window.__lamboCityFloor2Discovered = true;
  try {
    localStorage.setItem(FLOOR_2_DISCOVERY_KEY, "1");
  } catch (_) {}
}

let playerSystem = null;
let renderer = null;
let mode = "free";
let arrivalElapsed = 0;
let arrivalStart = null;
let arrivalPlayer = null;
let arrivalRoute = null;
let arrivalRouteLengths = null;
let arrivalRouteLength = 0;
let pointerId = null;
let pointerStartX = 0;
let pointerStartY = 0;
let pointerLastX = 0;
let pointerLastY = 0;
let pointerMoved = false;
let previousTouchAction = "";
let suppressStationClickUntil = 0;
let sessionExitButton = null;

function publishState() {
  window.__lamboCityFloor2SessionMode = mode;
  window.__lamboCityFloor2SessionActive =
    mode === "arrival" || mode === "seated" || mode === "instrument";
  window.__lamboCityFloor2OrbitYaw ??= 0;
  window.__lamboCityFloor2OrbitPitch ??= 0.08;
  window.__lamboCitySuppressStationClickUntil =
    suppressStationClickUntil;
}

function lockInput() {
  const input = window.__lamboCityInput;
  if (!input) return;

  ["w", "a", "s", "d", "shift", "arrowup", "arrowdown", "arrowleft", "arrowright"].forEach(
    key => { input.keys[key] = false; }
  );

  if (input.joystick) {
    input.joystick.x = 0;
    input.joystick.y = 0;
    input.joystick.active = false;
  }
}

function setMode(nextMode) {
  mode = nextMode;
  publishState();
  if (mode !== "free") lockInput();

  const joystick = document.getElementById("lambo-city-joystick");
  const mobileButtons = document.getElementById("lambo-city-mobile-buttons");
  if (joystick) joystick.style.display = mode === "free" ? "" : "none";
  if (mobileButtons) mobileButtons.style.display = mode === "free" ? "flex" : "none";
  if (sessionExitButton) {
    sessionExitButton.style.display = mode === "seated" ? "block" : "none";
  }

  if (renderer?.domElement) {
    if (mode === "seated" || mode === "instrument" || mode === "arrival") {
      renderer.domElement.style.touchAction = "none";
    } else {
      renderer.domElement.style.touchAction = previousTouchAction;
    }
  }
}

function onPointerDown(event) {
  if (mode !== "seated" || pointerId !== null) return;
  if (event.button !== undefined && event.button !== 0) return;

  pointerId = event.pointerId;
  pointerStartX = pointerLastX = event.clientX;
  pointerStartY = pointerLastY = event.clientY;
  pointerMoved = false;

  try {
    renderer.domElement.setPointerCapture(pointerId);
  } catch (_) {}
}

function onPointerMove(event) {
  if (pointerId === null || event.pointerId !== pointerId || mode !== "seated") return;

  const dx = event.clientX - pointerLastX;
  const dy = event.clientY - pointerLastY;
  pointerLastX = event.clientX;
  pointerLastY = event.clientY;

  if (
    Math.abs(event.clientX - pointerStartX) > 5 ||
    Math.abs(event.clientY - pointerStartY) > 5
  ) {
    pointerMoved = true;
  }

  if (!pointerMoved) return;

  event.preventDefault();
  window.__lamboCityFloor2OrbitYaw =
    (window.__lamboCityFloor2OrbitYaw ?? 0) - dx * 0.008;
  window.__lamboCityFloor2OrbitPitch =
    Math.max(
      -0.18,
      Math.min(
        0.34,
        (window.__lamboCityFloor2OrbitPitch ?? 0.08) + dy * 0.004
      )
    );

  suppressStationClickUntil = Date.now() + 280;
  publishState();
}

function onWheel(event) {
  if (mode !== "seated" || !event.deltaX) return;
  event.preventDefault();
  window.__lamboCityFloor2OrbitYaw =
    (window.__lamboCityFloor2OrbitYaw ?? 0) + event.deltaX * 0.006;
  suppressStationClickUntil = Date.now() + 320;
  publishState();
}

function onPointerUp(event) {
  if (pointerId === null || event.pointerId !== pointerId) return;

  if (pointerMoved) {
    suppressStationClickUntil = Date.now() + 320;
    publishState();
  }

  try {
    renderer.domElement.releasePointerCapture(pointerId);
  } catch (_) {}

  pointerId = null;
  pointerMoved = false;
}

function attachOrbitControls() {
  if (!renderer?.domElement || renderer.domElement.__lcStudioOrbitBound) return;

  const canvas = renderer.domElement;
  previousTouchAction = canvas.style.touchAction || "";
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove, { passive: false });
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.__lcStudioOrbitBound = true;
}

function detachOrbitControls() {
  if (!renderer?.domElement || !renderer.domElement.__lcStudioOrbitBound) return;

  const canvas = renderer.domElement;
  canvas.removeEventListener("pointerdown", onPointerDown);
  canvas.removeEventListener("pointermove", onPointerMove);
  canvas.removeEventListener("pointerup", onPointerUp);
  canvas.removeEventListener("pointercancel", onPointerUp);
  canvas.removeEventListener("wheel", onWheel);
  canvas.style.touchAction = previousTouchAction;
  delete canvas.__lcStudioOrbitBound;
  pointerId = null;
}

export default {
  init(scene, context) {
    this.scene = scene;
    playerSystem = context?.systems?.player || null;
    renderer = context?.renderer || null;
    attachOrbitControls();

    sessionExitButton = document.createElement("button");
    sessionExitButton.id = "lc-floor2-end-session";
    sessionExitButton.type = "button";
    sessionExitButton.textContent = "END SESSION";
    sessionExitButton.style.cssText = "display:none;position:fixed;top:16px;right:16px;z-index:9000;min-height:42px;padding:10px 15px;border:1px solid rgba(230,187,105,.8);border-radius:8px;background:rgba(12,14,20,.88);color:#f1d49c;font:700 11px Arial,sans-serif;letter-spacing:1px;touch-action:manipulation";
    sessionExitButton.addEventListener("click", () => this.endSession());
    document.body.appendChild(sessionExitButton);

    window.__lamboCityFloor2Discovered =
      readFloor2Discovery() || window.__lamboCityFloor2Discovered === true;

    window.__lamboCityBeginFloor2Session = player => {
      this.beginArrival(player);
    };
    window.__lamboCityEnterFloor2CockpitDirect = player => {
      return this.enterCockpitDirect(player);
    };
    window.__lamboCityEndFloor2Session = () => {
      this.endSession();
    };
    window.__lamboCityReturnToFloor2Room = () => {
      this.returnToRoom();
    };
    window.__lamboCityOpenFloor2Instrument = () => {
      this.openInstrument();
    };

    publishState();
  },

  enterCockpitDirect(player) {
    if (
      !player ||
      !window.__lamboCityFloor2Discovered ||
      mode !== "free"
    ) {
      return false;
    }

    // The discovery walk is complete. Phone re-entry places HERO
    // directly in the established producer seat without replaying
    // the elevator ride or the first-visit arrival walk.
    playerSystem?.setElevatorFloorY?.(FLOOR_2_Y);
    playerSystem?.clearElevatorControl?.();
    player.position.set(
      PRODUCER_SEAT.x,
      FLOOR_2_Y,
      PRODUCER_SEAT.z
    );
    playerSystem?.setFacing?.(Math.PI);
    playerSystem?.setStudioSeatedPose?.(true);

    arrivalPlayer = player;
    arrivalStart = null;
    arrivalRoute = null;
    arrivalRouteLengths = null;
    arrivalRouteLength = 0;
    window.__lamboCityFloor2OrbitYaw = 0;
    window.__lamboCityFloor2OrbitPitch = 0.08;
    window.__lamboCityFloor2ArrivalProgress = 1;
    window.__lamboCityElevatorTraveling = false;
    window.__lamboCityElevatorLandingFloor = 0;
    window.__lamboCityElevatorInRange = false;
    window.__lamboCityElevatorOpen = false;
    window.__lamboCityElevatorDoorOpen = false;
    setMode("seated");
    return true;
  },

  beginArrival(player) {
    if (!player || mode !== "free") return;

    arrivalPlayer = player;
    arrivalStart = {
      x: player.position.x,
      y: player.position.y,
      z: player.position.z,
      rotationY: player.rotation.y
    };
    arrivalElapsed = 0;

    // Build the fixed elevator-to-chair route once per arrival.
    // Its segment lengths do not change while the character walks.
    arrivalRoute = [
      { x: arrivalStart.x, z: arrivalStart.z },
      { x: arrivalStart.x, z: PRODUCER_SEAT.z },
      { x: PRODUCER_SEAT.x - 3.9, z: PRODUCER_SEAT.z },
      { x: PRODUCER_SEAT.x, z: PRODUCER_SEAT.z }
    ];
    arrivalRouteLengths = [];
    arrivalRouteLength = 0;
    for (let i = 0; i < arrivalRoute.length - 1; i++) {
      const dx = arrivalRoute[i + 1].x - arrivalRoute[i].x;
      const dz = arrivalRoute[i + 1].z - arrivalRoute[i].z;
      const length = Math.hypot(dx, dz);
      arrivalRouteLengths.push(length);
      arrivalRouteLength += length;
    }

    window.__lamboCityFloor2OrbitYaw = 0;
    window.__lamboCityFloor2OrbitPitch = 0.08;
    window.__lamboCityFloor2ArrivalProgress = 0;
    setMode("arrival");
  },

  returnToRoom() {
    if (mode === "instrument") setMode("seated");
  },

  endSession() {
    if (mode === "free") return;

    if (arrivalPlayer) {
      arrivalPlayer.position.set(
        PRODUCER_SEAT.x,
        PRODUCER_SEAT.y,
        PRODUCER_SEAT.z
      );
    }

    playerSystem?.setStudioSeatedPose?.(false);
    arrivalPlayer = null;
    arrivalStart = null;
    arrivalRoute = null;
    arrivalRouteLengths = null;
    arrivalRouteLength = 0;
    window.__lamboCityFloor2ArrivalProgress = 0;
    setMode("free");
  },

  openInstrument() {
    if (mode === "seated") setMode("instrument");
  },

  update(delta, context) {
    playerSystem = context.systems?.player || playerSystem;
    renderer = context.renderer || renderer;

    if (mode === "arrival" && arrivalPlayer && arrivalStart) {
      arrivalElapsed += delta;
      const t = Math.min(1, arrivalElapsed / ELEVATOR_ARRIVAL_SECONDS);
      window.__lamboCityFloor2ArrivalProgress = t;
      const eased = t; // steady walking pace from elevator to cockpit

      // Follow the precomputed path around the desk without crossing it.
      let remaining = arrivalRouteLength * eased;
      let segment = 0;
      while (
        segment < arrivalRouteLengths.length - 1 &&
        remaining > arrivalRouteLengths[segment]
      ) {
        remaining -= arrivalRouteLengths[segment];
        segment++;
      }

      const segmentProgress = arrivalRouteLengths[segment] > 0
        ? Math.min(1, remaining / arrivalRouteLengths[segment])
        : 1;
      const from = arrivalRoute[segment];
      const to = arrivalRoute[segment + 1];

      arrivalPlayer.position.set(
        from.x + (to.x - from.x) * segmentProgress,
        PRODUCER_SEAT.y,
        from.z + (to.z - from.z) * segmentProgress
      );

      // Face the current leg of the path, then turn toward the desk
      // as the character settles into the producer chair.
      const travelX = to.x - from.x;
      const travelZ = to.z - from.z;
      const travelYaw = Math.atan2(travelX, travelZ);
      const turnProgress = Math.max(0, Math.min(1, (t - 0.88) / 0.12));
      const smoothTurn = turnProgress * turnProgress * (3 - 2 * turnProgress);
      const yawDelta = Math.atan2(
        Math.sin(Math.PI - travelYaw),
        Math.cos(Math.PI - travelYaw)
      );
      arrivalPlayer.rotation.y = travelYaw + yawDelta * smoothTurn;

      if (t >= 1) {
        playerSystem?.setStudioSeatedPose?.(true);
        saveFloor2Discovery();
        setMode("seated");
      }
    }

    if (mode !== "free") lockInput();
  },

  isActive() {
    return mode === "arrival" || mode === "seated" || mode === "instrument";
  },

  getMode() {
    return mode;
  },

  destroy() {
    detachOrbitControls();
    delete window.__lamboCityBeginFloor2Session;
    delete window.__lamboCityEnterFloor2CockpitDirect;
    delete window.__lamboCityEndFloor2Session;
    delete window.__lamboCityReturnToFloor2Room;
    delete window.__lamboCityOpenFloor2Instrument;
    sessionExitButton?.remove();
    sessionExitButton = null;
    mode = "free";
    publishState();
  }
};
