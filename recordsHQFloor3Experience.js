// recordsHQFloor3Experience.js
// LAMBO CITY RECORDS — FLOOR 3 EXECUTIVE EXPERIENCE
//
// Touch-friendly room directory and executive briefing interface.
// Uses the existing Floor 3 room positions; it does not move geometry,
// alter the elevator, change collision, or connect external services.

const HQ_X = 28;
const HQ_Z = 22;
const ACTIVATION_DISTANCE = 3.8;

const ROOMS = [
  {
    id: "meeting",
    name: "Executive Meeting Room",
    localX: 0,
    localZ: 0.15,
    eyebrow: "STRATEGY • LEADERSHIP",
    title: "The Executive Table",
    description: "A private setting for leadership conversations, planning sessions and decisions shaping the next chapter of LAMBO CITY.",
    points: ["Leadership discussions", "Project and milestone reviews", "Private working sessions"]
  },
  {
    id: "presentation",
    name: "Presentation Suite",
    localX: 0,
    localZ: -5.65,
    eyebrow: "PRESENT • ALIGN • BUILD",
    title: "The Presentation Suite",
    description: "A dedicated room for presenting the LAMBO CITY vision, reviewing creative direction and aligning the team around upcoming work.",
    points: ["Brand and world vision", "Creative direction", "Project walkthroughs"]
  },
  {
    id: "boardroom",
    name: "Glass Boardroom",
    localX: -6,
    localZ: 0,
    eyebrow: "PRIVATE • EXECUTIVE",
    title: "The Boardroom",
    description: "A focused glass-walled meeting space designed for smaller executive conversations and confidential planning.",
    points: ["Executive reviews", "Private discussions", "Planning and evaluation"]
  },
  {
    id: "lounge",
    name: "Executive Lounge",
    localX: 5,
    localZ: -2,
    eyebrow: "HOSPITALITY • CONNECTION",
    title: "The Executive Lounge",
    description: "A relaxed setting for hosting guests, continuing conversations and taking a pause between sessions.",
    points: ["Guest hospitality", "Informal conversations", "A quieter place to reset"]
  },
  {
    id: "office",
    name: "Executive Office",
    localX: 5,
    localZ: 3.9,
    eyebrow: "PRIVATE • FOCUS",
    title: "The Executive Office",
    description: "A private workspace within Records HQ for focused planning and reviewing the details behind the operation.",
    points: ["Private work sessions", "Planning and review", "Executive workspace"]
  }
];

let promptEl = null;
let modalEl = null;
let activeRoom = null;
let modalOpen = false;
let lastEState = false;

function setStyles(element, styles) {
  Object.assign(element.style, styles);
}

function makeText(tag, content, styles = {}) {
  const element = document.createElement(tag);
  element.textContent = content;
  setStyles(element, styles);
  return element;
}

function buildInterface() {
  promptEl = document.createElement("button");
  promptEl.type = "button";
  promptEl.textContent = "EXPLORE EXECUTIVE FLOOR";
  setStyles(promptEl, {
    position: "fixed",
    left: "50%",
    bottom: "112px",
    transform: "translateX(-50%)",
    zIndex: "270",
    display: "none",
    maxWidth: "calc(100vw - 32px)",
    minHeight: "46px",
    padding: "13px 22px",
    border: "1px solid rgba(225,190,126,.78)",
    borderRadius: "999px",
    background: "rgba(12,12,14,.95)",
    color: "#f4dfb5",
    font: "700 11px/1.3 Arial,sans-serif",
    letterSpacing: "1.5px",
    cursor: "pointer",
    boxShadow: "0 8px 32px rgba(0,0,0,.4)"
  });
  promptEl.addEventListener("click", openModal);
  document.body.appendChild(promptEl);

  modalEl = document.createElement("div");
  setStyles(modalEl, {
    position: "fixed",
    inset: "0",
    zIndex: "680",
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    padding: "18px",
    boxSizing: "border-box",
    background: "rgba(3,4,7,.88)",
    backdropFilter: "blur(13px)",
    WebkitBackdropFilter: "blur(13px)",
    color: "#f5f0e8",
    fontFamily: "Arial,sans-serif",
    pointerEvents: "auto"
  });

  const panel = document.createElement("section");
  setStyles(panel, {
    width: "min(760px,100%)",
    maxHeight: "min(760px,90vh)",
    overflowY: "auto",
    boxSizing: "border-box",
    padding: "clamp(22px,4vw,40px)",
    border: "1px solid rgba(211,174,111,.48)",
    borderRadius: "18px",
    background: "linear-gradient(145deg,rgba(28,25,22,.99),rgba(7,9,13,.99))",
    boxShadow: "0 24px 90px rgba(0,0,0,.68)"
  });

  const header = document.createElement("div");
  setStyles(header, {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px"
  });
  header.appendChild(makeText("div", "LAMBO CITY RECORDS  /  FLOOR 03", {
    color: "#d8b475",
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "2.2px"
  }));

  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "CLOSE  ×";
  setStyles(close, {
    border: "1px solid rgba(255,255,255,.22)",
    borderRadius: "999px",
    padding: "10px 14px",
    background: "rgba(255,255,255,.06)",
    color: "#fff",
    font: "700 10px Arial,sans-serif",
    letterSpacing: "1px",
    cursor: "pointer",
    minHeight: "38px"
  });
  close.addEventListener("click", closeModal);
  header.appendChild(close);

  const eyebrow = makeText("div", "", {
    marginTop: "30px",
    color: "#d8b475",
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "2.2px"
  });
  const title = makeText("h2", "", {
    margin: "10px 0 12px",
    color: "#fff",
    fontSize: "clamp(27px,5vw,42px)",
    lineHeight: "1.05",
    letterSpacing: ".3px"
  });
  const description = makeText("p", "", {
    margin: "0",
    color: "rgba(245,240,232,.72)",
    fontSize: "14px",
    lineHeight: "1.7"
  });

  const divider = document.createElement("div");
  setStyles(divider, {
    height: "1px",
    margin: "24px 0",
    background: "linear-gradient(90deg,rgba(216,180,117,.7),rgba(216,180,117,0))"
  });

  const listTitle = makeText("div", "ROOM PURPOSE", {
    color: "#d8b475",
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "2px",
    marginBottom: "12px"
  });
  const points = document.createElement("div");
  const directoryTitle = makeText("div", "FLOOR DIRECTORY", {
    marginTop: "28px",
    marginBottom: "12px",
    color: "rgba(245,240,232,.48)",
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "2px"
  });
  const directory = document.createElement("div");
  setStyles(directory, {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,190px),1fr))",
    gap: "9px"
  });

  ROOMS.forEach(room => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = room.name;
    setStyles(button, {
      minHeight: "44px",
      padding: "10px 12px",
      border: "1px solid rgba(211,174,111,.25)",
      borderRadius: "9px",
      background: "rgba(255,255,255,.045)",
      color: "#eee5d6",
      font: "600 11px/1.4 Arial,sans-serif",
      textAlign: "left",
      cursor: "pointer"
    });
    button.addEventListener("click", () => renderRoom(room));
    directory.appendChild(button);
  });

  const note = makeText("p", "INTERACTIVE FLOOR DIRECTORY  •  Room selection is a local experience preview; scheduling and external services are not connected.", {
    margin: "22px 0 0",
    color: "rgba(245,240,232,.38)",
    fontSize: "10px",
    lineHeight: "1.6",
    letterSpacing: ".5px"
  });

  panel.append(header, eyebrow, title, description, divider, listTitle, points, directoryTitle, directory, note);
  modalEl.appendChild(panel);
  modalEl.addEventListener("click", event => {
    if (event.target === modalEl) closeModal();
  });
  document.body.appendChild(modalEl);

  window.addEventListener("keydown", event => {
    if (event.key === "Escape" && modalOpen) closeModal();
  });

  modalEl._roomElements = { eyebrow, title, description, points };
}

function renderRoom(room) {
  if (!modalEl) return;
  activeRoom = room;
  const { eyebrow, title, description, points } = modalEl._roomElements;
  eyebrow.textContent = room.eyebrow;
  title.textContent = room.title;
  description.textContent = room.description;
  points.replaceChildren();
  room.points.forEach((point, index) => {
    const row = document.createElement("div");
    setStyles(row, {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "11px 0",
      borderBottom: "1px solid rgba(255,255,255,.08)",
      color: "rgba(245,240,232,.82)",
      fontSize: "13px"
    });
    row.appendChild(makeText("span", "0" + (index + 1), {
      color: "#d8b475",
      fontSize: "10px",
      fontWeight: "700",
      letterSpacing: "1px"
    }));
    row.appendChild(makeText("span", point));
    points.appendChild(row);
  });
}

function openModal() {
  if (!activeRoom || !modalEl) return;
  renderRoom(activeRoom);
  modalOpen = true;
  modalEl.style.display = "flex";
  if (promptEl) promptEl.style.display = "none";
}

function closeModal() {
  modalOpen = false;
  if (modalEl) modalEl.style.display = "none";
}

export default {
  init() {
    if (!promptEl) buildInterface();
    return null;
  },

  update(delta, context) {
    const player = context && context.player;
    if (!player || !player.position) return;

    const px = player.position.x;
    const pz = player.position.z;
    let nearest = null;
    let nearestDistance = Infinity;

    for (const room of ROOMS) {
      const dx = px - (HQ_X + room.localX);
      const dz = pz - (HQ_Z + room.localZ);
      const distance = Math.hypot(dx, dz);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = room;
      }
    }

    activeRoom = nearestDistance <= ACTIVATION_DISTANCE ? nearest : null;
    const inRange = !!activeRoom;

    if (promptEl) {
      promptEl.textContent = activeRoom
        ? "EXPLORE  /  " + activeRoom.name.toUpperCase()
        : "EXPLORE EXECUTIVE FLOOR";
      promptEl.style.display = inRange && !modalOpen ? "block" : "none";
    }

    const input = window.__lamboCityInput;
    const ePressed = !!(input && input.keys && input.keys.e);
    if (ePressed && !lastEState && inRange && !modalOpen) {
      openModal();
      if (input && input.keys) input.keys.e = false;
    }
    lastEState = ePressed;

    if (!inRange && modalOpen) closeModal();
  }
};
