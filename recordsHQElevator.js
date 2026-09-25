// recordsHQElevator.js
// LAMBO CITY RECORDS HQ — Functional Elevator
//
// Phase 1:
// - Uses the existing glass elevator created by recordsHQFoundation.js
// - Does NOT modify the HQ foundation
// - Does NOT create new elevator geometry
// - Provides Floor 1 / Floor 2 / Floor 3 / Rooftop selection
// - Owns the E interaction while the player is inside the elevator zone
// - Compatible with keyboard + existing mobile/iPad E input
//
// INTERACTION RULE:
// Elevator interaction takes priority over the Records HQ
// Music + Video interaction while the player is standing
// inside the elevator activation zone.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const ELEVATOR_POSITION = {
  x: 23,
  z: 14.15
};

const ACTIVATION_DISTANCE = 3.2;
const TRAVEL_TIME = 1.25;

let scene = null;

let promptEl = null;
let menuEl = null;
let statusEl = null;

let built = false;
let inRange = false;
let menuOpen = false;
let traveling = false;

let travelTimer = 0;
let selectedFloor = null;

let travelStartY = 1.3;
let travelTargetY = 1.3;

let currentPlayer = null;
let lastEState = false;

function buildDOM() {
  // ------------------------------------------------------------
  // INTERACTION PROMPT
  // ------------------------------------------------------------

  promptEl = document.createElement("div");

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
    USE ELEVATOR
  `;

  promptEl.addEventListener("click", openMenu);

  document.body.appendChild(promptEl);

  // ------------------------------------------------------------
  // FLOOR SELECTION MENU
  // ------------------------------------------------------------

  menuEl = document.createElement("div");

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

    <div id="records-hq-elevator-buttons"
      style="
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:10px;
      ">
    </div>

    <div id="records-hq-elevator-status"
      style="
        min-height:18px;
        text-align:center;
        color:#aaa;
        font-size:10px;
        letter-spacing:1px;
        margin-top:16px;
      ">
    </div>

    <button id="records-hq-elevator-close"
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
      ">
      CLOSE
    </button>
  `;

  document.body.appendChild(menuEl);

  const buttonWrap =
    document.getElementById(
      "records-hq-elevator-buttons"
    );

  const floors = [
    {
      id: 1,
      label: "FLOOR 1",
      sub: "STUDIO + MERCH"
    },
    {
      id: 2,
      label: "FLOOR 2",
      sub: "RECORDS LEVEL"
    },
    {
      id: 3,
      label: "FLOOR 3",
      sub: "EXECUTIVE LEVEL"
    },
    {
      id: 4,
      label: "ROOFTOP",
      sub: "SKY DECK"
    }
  ];

  floors.forEach(floor => {
    const button = document.createElement("button");

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

    button.addEventListener("click", () => {
      selectFloor(floor.id);
    });

    button.addEventListener(
      "touchstart",
      e => {
        e.preventDefault();
        selectFloor(floor.id);
      },
      { passive:false }
    );

    buttonWrap.appendChild(button);
  });

  const closeButton =
    document.getElementById(
      "records-hq-elevator-close"
    );

  closeButton.addEventListener(
    "click",
    closeMenu
  );

  // ------------------------------------------------------------
  // KEYBOARD
  // ------------------------------------------------------------

  window.addEventListener("keydown", e => {
    if (!e.key) return;

    const key = e.key.toLowerCase();

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
  });

  built = true;
}

// --------------------------------------------------------------
// OPEN MENU
// --------------------------------------------------------------

function openMenu() {
  if (!menuEl || traveling) return;

  if (!inRange) return;

  menuOpen = true;

  if (promptEl) {
    promptEl.style.display = "none";
  }

  menuEl.style.display = "block";

  setStatus(
    "SELECT YOUR DESTINATION"
  );

  lockPlayerInput(true);
}

// --------------------------------------------------------------
// CLOSE MENU
// --------------------------------------------------------------

function closeMenu() {
  if (!menuEl || traveling) return;

  menuOpen = false;

  menuEl.style.display = "none";

  setStatus("");

  lockPlayerInput(false);
}

// --------------------------------------------------------------
// FLOOR SELECTION
// --------------------------------------------------------------

function selectFloor(floor) {
  if (traveling) return;

  selectedFloor = floor;

  const targets = {
    1: 1.3,
    2: 12.2,
    3: 20.2,
    4: 26.3
  };

  travelTargetY =
    targets[floor] ?? 1.3;

  startTravel();
}

// --------------------------------------------------------------
// START TRAVEL
// --------------------------------------------------------------

function startTravel() {
  traveling = true;
  travelTimer = 0;

  const player = getPlayer();

  if (!player) {
    traveling = false;
    closeMenu();
    return;
  }

  travelStartY =
    player.position.y;

  setStatus(
    selectedFloor === 4
      ? "TRAVELING TO ROOFTOP..."
      : `TRAVELING TO FLOOR ${selectedFloor}...`
  );

  lockPlayerInput(true);
}

// --------------------------------------------------------------
// FINISH TRAVEL
// --------------------------------------------------------------

function finishTravel(player) {
  if (!player) return;

  player.position.x =
    ELEVATOR_POSITION.x;

  player.position.z =
    ELEVATOR_POSITION.z;

  traveling = false;
  menuOpen = false;

  if (menuEl) {
    menuEl.style.display = "none";
  }

  setStatus("");

  lockPlayerInput(false);
}

// --------------------------------------------------------------
// PLAYER
// --------------------------------------------------------------

function getPlayer() {
  return currentPlayer;
}

// --------------------------------------------------------------
// INPUT LOCK
// --------------------------------------------------------------

function lockPlayerInput(locked) {
  const input =
    window.__lamboCityInput;

  if (!input) return;

  if (locked) {
    input.keys["w"] = false;
    input.keys["a"] = false;
    input.keys["s"] = false;
    input.keys["d"] = false;
    input.keys["shift"] = false;

    if (input.joystick) {
      input.joystick.x = 0;
      input.joystick.y = 0;
      input.joystick.active = false;
    }
  }
}

// --------------------------------------------------------------
// STATUS
// --------------------------------------------------------------

function setStatus(message) {
  statusEl =
    document.getElementById(
      "records-hq-elevator-status"
    );

  if (statusEl) {
    statusEl.textContent = message;
  }
}

// --------------------------------------------------------------
// EXPORT
// --------------------------------------------------------------

export default {

  init(scene_) {
    scene = scene_;

    // Build immediately so the elevator's interaction state
    // exists independently of the video system.
    if (!built) {
      buildDOM();
    }

    window.__lamboCityElevatorReady = true;
  },

  update(delta, context) {
    if (!scene) return;

    if (!built) {
      buildDOM();
    }

    const player =
      context.player;

    if (!player) return;

    currentPlayer = player;

    // Existing input system.
    if (
      context.systems &&
      context.systems.input
    ) {
      window.__lamboCityInput =
        context.systems.input;
    }

    // ----------------------------------------------------------
    // ELEVATOR TRAVEL
    // ----------------------------------------------------------

    if (traveling) {
      travelTimer += delta;

      const progress =
        Math.min(
          1,
          travelTimer / TRAVEL_TIME
        );

      const eased =
        progress < 0.5
          ? 2 * progress * progress
          : 1 -
            Math.pow(
              -2 * progress + 2,
              2
            ) / 2;

      player.position.y =
        THREE.MathUtils.lerp(
          travelStartY,
          travelTargetY,
          eased
        );

      // Elevator owns interaction while traveling.
      window.__lamboCityElevatorInRange = true;
      window.__lamboCityElevatorOpen = true;

      if (progress >= 1) {
        finishTravel(player);
      }

      return;
    }

    // ----------------------------------------------------------
    // ELEVATOR RANGE
    // ----------------------------------------------------------

    const dx =
      player.position.x -
      ELEVATOR_POSITION.x;

    const dz =
      player.position.z -
      ELEVATOR_POSITION.z;

    const dist =
      Math.sqrt(
        dx * dx +
        dz * dz
      );

    inRange =
      dist <= ACTIVATION_DISTANCE;

    // ----------------------------------------------------------
    // SHARE INTERACTION STATE
    // ----------------------------------------------------------
    //
    // stageVideo.js reads these values.
    //
    // This creates a clean interaction boundary without
    // rebuilding or duplicating either system.

    window.__lamboCityElevatorInRange =
      inRange;

    window.__lamboCityElevatorOpen =
      menuOpen || traveling;

    // ----------------------------------------------------------
    // MOBILE / IPAD E BUTTON
    // ----------------------------------------------------------
    //
    // input.js already exposes the E interaction as
    // input.keys["e"].
    //
    // Detect only the rising edge so holding E does not
    // repeatedly open the menu.

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

      // Consume the shared E press.
      input.keys["e"] = false;
    }

    lastEState = ePressed;

    // ----------------------------------------------------------
    // PROMPT
    // ----------------------------------------------------------

    if (menuOpen) {
      if (promptEl) {
        promptEl.style.display = "none";
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
    return menuOpen || traveling;
  },

  isInRange() {
    return inRange;
  }
};
