// recordsHQElevator.js
// LAMBO CITY RECORDS HQ — Functional Elevator
//
// Cinematic upgrade:
// - Existing elevator mechanics preserved
// - Existing floor mathematics preserved
// - Adds cinematic travel state for camera.js
// - Beginning of ride shows HERO inside elevator
// - Ride transitions to first-person glass-elevator POV

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";


const ELEVATOR_POSITION = {
  x: 23,
  z: 14.15
};

const ACTIVATION_DISTANCE =
  10.5;

// Keep Floor 2's established ride timing untouched for the Studio.
// Other destinations use a quicker transfer and faster landing-door response.
const TRAVEL_TIME_BY_FLOOR = {
  1: 2.8,
  2: 2.8,
  3: 2.8,
  4: 2.8
};


let scene = null;

let promptEl = null;
let menuEl = null;
let statusEl = null;

let built = false;
let inRange = false;
let menuOpen = false;
let traveling = false;

let travelTimer = 0;
let travelStartedAt = 0;
let selectedFloor = null;
let destinationLoadReady = true;
let destinationLoadError = null;
let failedReturnDoorPending = false;

let travelStartY = 1.3;
let travelTargetY = 1.3;

let currentPlayer = null;
let lastEState = false;

let landingDoorFloor = 1;
let landingDoorProgress = 1;
let landingDoorTarget = 1;
let pendingLandingPlayer = null;
let floor3AutoArrival = null;


// ============================================================
// DOM
// ============================================================

function buildDOM() {

  promptEl =
    document.createElement("div");

  promptEl.style.cssText = `
    position:fixed;
    bottom:160px;
    left:50%;
    transform:translateX(-50%);
    background:rgba(0,0,0,0.88);
    border:1px solid rgba(255,215,0,0.45);
    border-radius:12px;
    padding:11px 22px;
    color:white;
    font-family:Arial,sans-serif;
    font-size:13px;
    font-weight:600;
    letter-spacing:0.4px;
    text-align:center;
    z-index:350;
    cursor:pointer;
    pointer-events:auto;
    display:none;
    box-shadow:
      0 0 25px rgba(255,215,0,0.18),
      0 0 45px rgba(153,0,255,0.12);
  `;

  promptEl.innerHTML = `
    <span style="
      color:#ffd700;
      font-weight:bold;
      margin-right:5px;
    ">[E]</span>
    TAP TO USE ELEVATOR
  `;

  promptEl.addEventListener(
    "click",
    openMenu
  );

  document.body.appendChild(
    promptEl
  );


  // ==========================================================
  // FLOOR MENU
  // ==========================================================

  menuEl =
    document.createElement("div");

  menuEl.style.cssText = `
    position:fixed;
    top:50%;
    left:50%;
    transform:translate(-50%,-50%);
    width:min(88vw,380px);
    background:
      linear-gradient(
        180deg,
        rgba(15,5,35,0.98),
        rgba(5,5,15,0.98)
      );
    border:1px solid rgba(255,215,0,0.45);
    border-radius:18px;
    padding:24px;
    color:white;
    font-family:Arial,sans-serif;
    z-index:500;
    display:none;
    pointer-events:auto;
    box-shadow:
      0 0 60px rgba(153,0,255,0.28),
      0 0 25px rgba(255,215,0,0.12);
    backdrop-filter:blur(12px);
  `;


  menuEl.innerHTML = `
    <div style="
      text-align:center;
      color:#ffd700;
      font-size:9px;
      letter-spacing:4px;
      margin-bottom:7px;
    ">
      LAMBO CITY RECORDS
    </div>

    <div style="
      text-align:center;
      color:white;
      font-size:22px;
      font-weight:bold;
      letter-spacing:2px;
      margin-bottom:4px;
    ">
      ELEVATOR
    </div>

    <div style="
      text-align:center;
      color:#888;
      font-size:10px;
      letter-spacing:1px;
      margin-bottom:20px;
    ">
      SELECT DESTINATION
    </div>

    <div
      id="records-hq-elevator-buttons"
      style="
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:10px;
      "
    ></div>

    <div
      id="records-hq-elevator-status"
      style="
        min-height:18px;
        text-align:center;
        color:#aaa;
        font-size:10px;
        letter-spacing:1px;
        margin-top:16px;
      "
    ></div>

    <button
      id="records-hq-elevator-close"
      style="
        display:block;
        margin:14px auto 0;
        background:rgba(255,255,255,0.07);
        border:1px solid rgba(255,255,255,0.14);
        border-radius:20px;
        color:#aaa;
        padding:8px 25px;
        font-size:10px;
        letter-spacing:2px;
        cursor:pointer;
      "
    >
      CLOSE
    </button>
  `;


  document.body.appendChild(
    menuEl
  );


  const buttonWrap =
    document.getElementById(
      "records-hq-elevator-buttons"
    );


  const floors = [

    {
      id:1,
      label:"FLOOR 1",
      sub:"STUDIO + MERCH"
    },

    {
      id:2,
      label:"FLOOR 2",
      sub:"RECORDING STUDIO"
    },

    {
      id:3,
      label:"FLOOR 3",
      sub:"MEETINGS + EXECUTIVE"
    },

    {
      id:4,
      label:"ROOFTOP",
      sub:"VIP LOUNGE"
    }

  ];


  floors.forEach(
    floor => {

      const button =
        document.createElement(
          "button"
        );

      button.style.cssText = `
        min-height:82px;
        background:
          linear-gradient(
            145deg,
            rgba(153,0,255,0.16),
            rgba(255,0,170,0.08)
          );
        border:1px solid rgba(255,215,0,0.18);
        border-radius:12px;
        color:white;
        cursor:pointer;
        padding:12px 8px;
        font-family:Arial,sans-serif;
      `;


      button.innerHTML = `
        <div style="
          color:#ffd700;
          font-size:13px;
          font-weight:bold;
          letter-spacing:1px;
        ">
          ${floor.label}
        </div>

        <div style="
          color:#888;
          font-size:8px;
          letter-spacing:1px;
          margin-top:6px;
        ">
          ${floor.sub}
        </div>
      `;


      button.addEventListener(
        "click",
        () => {
          selectFloor(
            floor.id
          );
        }
      );


      button.addEventListener(
        "touchstart",
        e => {

          e.preventDefault();

          selectFloor(
            floor.id
          );

        },
        {
          passive:false
        }
      );


      buttonWrap.appendChild(
        button
      );

    }
  );


  const closeButton =
    document.getElementById(
      "records-hq-elevator-close"
    );


  closeButton.addEventListener(
    "click",
    closeMenu
  );


  // ==========================================================
  // KEYBOARD
  // ==========================================================

  window.addEventListener(
    "keydown",
    e => {

      if (!e.key) return;

      const key =
        e.key.toLowerCase();


      if (
        key === "e" &&
        inRange &&
        !menuOpen &&
        !traveling
      ) {

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        openMenu();

        return;
      }


      if (
        e.key === "Escape" &&
        menuOpen &&
        !traveling
      ) {

        closeMenu();

      }

    }
  );


  built = true;

}


// ============================================================
// OPEN
// ============================================================

function openMenu() {

  if (
    !menuEl ||
    traveling
  ) {

    return;
  }


  if (!inRange) {
    return;
  }


  menuOpen = true;


  if (promptEl) {
    promptEl.style.display =
      "none";
  }


  menuEl.style.display =
    "block";


  setStatus(
    "SELECT YOUR DESTINATION"
  );


  lockPlayerInput(
    true
  );
}


// ============================================================
// CLOSE
// ============================================================

function closeMenu() {

  if (
    !menuEl ||
    traveling
  ) {

    return;
  }


  menuOpen = false;

  menuEl.style.display =
    "none";

  setStatus("");

  lockPlayerInput(
    false
  );
}


// ============================================================
// FLOOR SELECTION
// ============================================================

function selectFloor(
  floor
) {

  if (traveling) {
    return;
  }


  selectedFloor =
    floor;


  // ----------------------------------------------------------
  // EXISTING FLOOR MATH — PRESERVED
  // ----------------------------------------------------------

  const targets = {

    1:1.3,

    2:12.2,

    3:20.2,

    4:26.3

  };


  travelTargetY =
    targets[floor] ??
    1.3;


  startTravel();
}



// ============================================================
// CINEMATIC LANDING DOORS
// ============================================================

function updateLandingDoors(delta) {
  const difference = landingDoorTarget - landingDoorProgress;
  const doorResponse = landingDoorFloor === 2 ? 8 : 20;
  landingDoorProgress += difference * Math.min(1, delta * doorResponse);

  if (Math.abs(landingDoorTarget - landingDoorProgress) < 0.008) {
    landingDoorProgress = landingDoorTarget;
  }

  [1, 2, 3].forEach(floor => {
    const landing = scene?.getObjectByName(
      `recordsHQElevatorLandingDoorF${floor}`
    );
    if (!landing) return;

    const amount = floor === landingDoorFloor
      ? landingDoorProgress
      : 0;
    // HQ-facing doors slide along their own portal axis.
    const left = landing.getObjectByName("doorLeafLeft");
    const right = landing.getObjectByName("doorLeafRight");
    if (left) left.position.x = -(1.05 + amount * 1.15);
    if (right) right.position.x = 1.05 + amount * 1.15;

    // Dock-facing doors use the perpendicular west-side portal.
    const dockLeft = landing.getObjectByName("doorLeafLeftDock");
    const dockRight = landing.getObjectByName("doorLeafRightDock");
    if (dockLeft) dockLeft.position.x = -(1.075 + amount * 1.075);
    if (dockRight) dockRight.position.x = 1.075 + amount * 1.075;

    // Patio-facing doors slide fully clear of the passenger opening.
    const patioLeft = landing.getObjectByName("doorLeafLeftPatio");
    const patioRight = landing.getObjectByName("doorLeafRightPatio");
    if (patioLeft) patioLeft.position.x = -(0.95 + amount * 0.95);
    if (patioRight) patioRight.position.x = 0.95 + amount * 0.95;
  });

  window.__lamboCityElevatorDoorOpen =
    landingDoorProgress > 0.96 && landingDoorTarget > 0.96;
}

function floorNumberFromY(y) {
  if (y >= 16.2) return 3;
  if (y >= 8.0) return 2;
  return 1;
}

// ============================================================
// START TRAVEL
// ============================================================

function startTravel() {

  traveling = true;

  travelTimer = 0;
  travelStartedAt = performance.now();
  destinationLoadReady = false;
  destinationLoadError = null;

  // Stream upper-floor modules during the elevator ride.
  try {
    Promise.resolve(
      window.__lamboCityPrepareFloor?.(selectedFloor)
    ).then(() => {
      destinationLoadReady = true;
    }).catch(error => {
      destinationLoadError = error;
      destinationLoadReady = true;
      console.error("LAMBO CITY destination loading failed:", error);
    });
  } catch (error) {
    destinationLoadError = error;
    destinationLoadReady = true;
    console.error("LAMBO CITY destination loading failed:", error);
  }


  // ----------------------------------------------------------
  // CINEMATIC CAMERA STATE
  // ----------------------------------------------------------

  window.__lamboCityElevatorTraveling =
    true;

  window.__lamboCityElevatorProgress =
    0;


  const player =
    getPlayer();


  if (!player) {

    traveling = false;

    window.__lamboCityElevatorTraveling =
      false;

    closeMenu();

    return;
  }


  travelStartY =
    player.position.y;

  landingDoorFloor = floorNumberFromY(travelStartY);
  landingDoorTarget = 0;
  pendingLandingPlayer = null;


  menuOpen = false;


  if (menuEl) {

    menuEl.style.display =
      "none";

  }


  setStatus("");


  window.__lamboCityPlayerSystem
    ?.setElevatorTravelY
    ?.(
      travelStartY
    );


  setStatus(

    selectedFloor === 4

      ? "TRAVELING TO ROOFTOP..."

      : `TRAVELING TO FLOOR ${selectedFloor}...`

  );


  lockPlayerInput(
    true
  );
}


// ============================================================
// FINISH TRAVEL
// ============================================================

function finishTravel(
  player
) {

  if (!player) {
    return;
  }


  player.position.x =
    ELEVATOR_POSITION.x;

  // Floor 3 begins just inside the elevator. Once the landing doors
  // open, HERO automatically walks into the room and takes the
  // established viewing position in front of the six-person display.
  // Other floors keep the original centered elevator spawn.
  player.position.z =
    selectedFloor === 3
      ? 14.35
      : ELEVATOR_POSITION.z;


  window.__lamboCityPlayerSystem
    ?.setElevatorFloorY
    ?.(
      travelTargetY
    );

  // Floor 3's first-person camera should begin facing into the HQ,
  // not back toward the elevator shaft.
  if (selectedFloor === 3) {
    window.__lamboCityPlayerSystem
      ?.setFacing
      ?.(0);
  }

  traveling = false;
  menuOpen = false;

  // Keep the passenger safely inside the lift while the destination
  // landing doors perform their opening animation. Floor 3 retains the
  // elevator camera until the passenger clears the rear portal.
  window.__lamboCityElevatorLandingFloor = selectedFloor === 3 ? 3 : 0;
  landingDoorFloor = selectedFloor === 4 ? 3 : selectedFloor;
  landingDoorProgress = 0;
  landingDoorTarget = 1;
  pendingLandingPlayer = player;
  floor3AutoArrival = null;

  window.__lamboCityElevatorTraveling = false;
  window.__lamboCityElevatorProgress = 1;
  window.__lamboCityElevatorDoorOpen = false;

  if (menuEl) {
    menuEl.style.display = "none";
  }

  setStatus("ARRIVING...");
  lockPlayerInput(true);
}


// ============================================================
// PLAYER
// ============================================================

function getPlayer() {

  return currentPlayer;

}


// ============================================================
// INPUT LOCK
// ============================================================

function lockPlayerInput(
  locked
) {

  const input =
    window.__lamboCityInput;


  if (!input) {
    return;
  }


  if (locked) {

    input.keys["w"] =
      false;

    input.keys["a"] =
      false;

    input.keys["s"] =
      false;

    input.keys["d"] =
      false;

    input.keys["shift"] =
      false;


    if (input.joystick) {

      input.joystick.x =
        0;

      input.joystick.y =
        0;

      input.joystick.active =
        false;

    }

  }

}


// ============================================================
// STATUS
// ============================================================

function setStatus(
  message
) {

  statusEl =
    document.getElementById(
      "records-hq-elevator-status"
    );


  if (statusEl) {

    statusEl.textContent =
      message;

  }

}


// ============================================================
// EXPORT
// ============================================================

export default {

  init(scene_) {

    scene =
      scene_;


    if (!built) {

      buildDOM();

    }


    window.__lamboCityElevatorReady =
      true;

  },


  update(
    delta,
    context
  ) {

    if (!scene) {
      return;
    }


    if (!built) {

      buildDOM();

    }


    const player =
      context.player;


    if (!player) {
      return;
    }


    if (
      context.systems?.player
    ) {

      window.__lamboCityPlayerSystem =
        context.systems.player;

    }


    currentPlayer = player;

    // Release the Floor 3 landing-camera hold only after HERO has
    // physically crossed the rear elevator portal into the HQ.
    if (
      window.__lamboCityElevatorLandingFloor === 3 &&
      player.position.z >= 14.7
    ) {
      window.__lamboCityElevatorLandingFloor = 0;
    }

    updateLandingDoors(delta);

    if (failedReturnDoorPending && landingDoorProgress >= 0.995) {
      failedReturnDoorPending = false;
      lockPlayerInput(false);
      setStatus("");
    }

    // Only release the passenger after the landing doors are fully open.
    if (pendingLandingPlayer && landingDoorProgress >= 0.995) {
      const arrivedPlayer = pendingLandingPlayer;
      pendingLandingPlayer = null;

      if (selectedFloor === 2) {
        window.__lamboCityBeginFloor2Session?.(arrivedPlayer);
      } else if (selectedFloor === 3) {
        // Smooth, hands-free arrival from the lift into the conference room.
        // The route is deliberately clear of the table and six participant seats.
        floor3AutoArrival = {
          player: arrivedPlayer,
          startX: arrivedPlayer.position.x,
          startZ: arrivedPlayer.position.z,
          targetX: 28,
          targetZ: 19.60,
          elapsed: 0,
          duration: 2.6
        };
        setStatus("WELCOME TO THE EXECUTIVE ROOM");
      } else {
        lockPlayerInput(false);
        setStatus("");
      }
    }

    if (floor3AutoArrival) {
      const arrival = floor3AutoArrival;
      arrival.elapsed = Math.min(arrival.duration, arrival.elapsed + Math.max(0, delta));
      const linear = arrival.elapsed / arrival.duration;
      const eased = linear * linear * (3 - 2 * linear);
      arrival.player.position.x = THREE.MathUtils.lerp(arrival.startX, arrival.targetX, eased);
      arrival.player.position.z = THREE.MathUtils.lerp(arrival.startZ, arrival.targetZ, eased);

      if (linear >= 1) {
        arrival.player.position.x = arrival.targetX;
        arrival.player.position.z = arrival.targetZ;
        floor3AutoArrival = null;
        lockPlayerInput(false);
        setStatus("");
      }
    }

    if (
      context.systems &&
      context.systems.input
    ) {

      window.__lamboCityInput =
        context.systems.input;

    }


    // ========================================================
    // ELEVATOR TRAVEL
    // ========================================================

    if (traveling) {

      // Use elapsed wall-clock time, not the engine's capped frame delta.
      // This keeps the elevator's duration consistent when rendering dips.
      travelTimer = Math.max(0, (performance.now() - travelStartedAt) / 1000);

      const travelDuration = TRAVEL_TIME_BY_FLOOR[selectedFloor] ?? 1.9;
      const progress = Math.min(1, travelTimer / travelDuration);


      // ------------------------------------------------------
      // SHARE CINEMATIC PROGRESS
      // ------------------------------------------------------

      window.__lamboCityElevatorTraveling =
        true;

      window.__lamboCityElevatorProgress =
        progress;


      const eased =
        progress < 0.5

          ? 2 *
            progress *
            progress

          : 1 -
            Math.pow(
              -2 *
                progress +
                2,
              2
            ) /
            2;


      const travelY =
        THREE.MathUtils.lerp(
          travelStartY,
          travelTargetY,
          eased
        );


      window.__lamboCityPlayerSystem
        ?.setElevatorTravelY
        ?.(
          travelY
        );


      player.position.y =
        travelY;


      window.__lamboCityElevatorInRange =
        true;

      window.__lamboCityElevatorOpen =
        true;


      if (progress >= 1) {
        if (!destinationLoadReady) {
          setStatus("PREPARING DESTINATION...");
          return;
        }

        if (destinationLoadError) {
          // Fail safely: keep the passenger on the departure floor.
          traveling = false;
          player.position.y = travelStartY;
          window.__lamboCityPlayerSystem
            ?.setElevatorTravelY
            ?. (travelStartY);
          window.__lamboCityElevatorTraveling = false;
          window.__lamboCityElevatorProgress = 0;
          landingDoorFloor = floorNumberFromY(travelStartY);
          landingDoorProgress = 0;
          landingDoorTarget = 1;
          failedReturnDoorPending = true;
          setStatus("DESTINATION UNAVAILABLE — RETURNING TO DEPARTURE FLOOR");
          return;
        }

        finishTravel(player);
      }


      return;
    }


    // ========================================================
    // ELEVATOR RANGE
    // ========================================================

    const dx =
      player.position.x -
      ELEVATOR_POSITION.x;

    const dz =
      player.position.z -
      ELEVATOR_POSITION.z;

    const dist =
      Math.sqrt(dx * dx + dz * dz);

    // The doors begin opening as the character approaches either
    // portal. The interaction prompt appears only after the player
    // has crossed the threshold and is physically inside the cabin.
    const nearElevator =
      dist <= ACTIVATION_DISTANCE + 1.0;

    inRange =
      player.position.x >= ELEVATOR_POSITION.x - 1.85 &&
      player.position.x <= ELEVATOR_POSITION.x + 1.85 &&
      player.position.z >= ELEVATOR_POSITION.z - 1.55 &&
      player.position.z <= ELEVATOR_POSITION.z + 1.15;

    if (nearElevator && !traveling && !pendingLandingPlayer) {
      landingDoorFloor = floorNumberFromY(player.position.y);
      landingDoorTarget = 1;
    }


    // ========================================================
    // SHARE STATE
    // ========================================================

    window.__lamboCityElevatorInRange =
      inRange;


    window.__lamboCityElevatorOpen =
      menuOpen ||
      traveling;


    // ========================================================
    // MOBILE / IPAD E
    // ========================================================

    const input =
      window.__lamboCityInput;


    const ePressed =
      !!input?.keys?.["e"];


    if (
      ePressed &&
      !lastEState &&
      inRange &&
      !menuOpen &&
      !traveling
    ) {

      openMenu();

      input.keys["e"] =
        false;

    }


    lastEState =
      ePressed;


    // ========================================================
    // PROMPT
    // ========================================================

    if (menuOpen) {

      if (promptEl) {

        promptEl.style.display =
          "none";

      }

      return;
    }


    if (promptEl) {

      promptEl.style.display =
        inRange
          ? "block"
          : "none";

    }

  },


  isOpen() {

    return (
      menuOpen ||
      traveling
    );

  },


  isInRange() {

    return inRange;

  }

};
