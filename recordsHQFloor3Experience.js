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
    name: "Executive Conference Room",
    localX: 1.2,
    localZ: 0.4,
    eyebrow: "STRATEGY • LEADERSHIP",
    title: "The Executive Conference Suite",
    description: "A private setting for leadership conversations, planning sessions and decisions shaping the next chapter of LAMBO CITY.",
    points: ["Six-seat conference table", "Expanded six-participant display wall", "Team decisions and project reviews"]
  },
  {
    id: "lounge",
    name: "Executive Lounge",
    localX: 6.3,
    localZ: -2,
    eyebrow: "HOSPITALITY • CONNECTION",
    title: "The Executive Lounge",
    description: "A relaxed setting for hosting guests, continuing conversations and taking a pause between sessions.",
    points: ["Guest hospitality", "Informal conversations", "A quieter place to reset"]
  },
  {
    id: "office",
    name: "Executive Office",
    localX: 7,
    localZ: -4.6,
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

  const sessionModes = [
    { id: "team", name: "TEAM MEETING", detail: "Internal updates, decisions and milestone reviews.", agenda: ["Opening updates", "Current priorities", "Decisions and next actions"] },
    { id: "artist", name: "ARTIST SESSION", detail: "Private conversations with artists and creative collaborators.", agenda: ["Introductions and creative goals", "Music and project direction", "Collaboration next steps"] },
    { id: "production", name: "PRODUCTION REVIEW", detail: "Beat, recording, arrangement and creative-production discussions.", agenda: ["Review the current production", "Creative notes and revisions", "Delivery milestones"] },
    { id: "engineering", name: "ENGINEERING SESSION", detail: "Recording, mixing, mastering and technical workflow reviews.", agenda: ["Technical requirements", "Audio and workflow review", "Engineering action items"] },
    { id: "partners", name: "PARTNER MEETING", detail: "Business development with invited industry partners and advisors.", agenda: ["Purpose and introductions", "Opportunity overview", "Partnership follow-up"] },
    { id: "live", name: "LIVE PRESENTATION", detail: "A structured presentation or livestream-style team briefing.", agenda: ["Welcome and context", "Main presentation", "Questions and closing"] }
  ];
  let selectedMode = sessionModes[0];
  let sessionPrepared = false;

  const sessionDivider = document.createElement("div");
  setStyles(sessionDivider, {
    height: "1px",
    margin: "30px 0 22px",
    background: "linear-gradient(90deg,rgba(216,180,117,.7),rgba(216,180,117,0))"
  });
  const clubroomLabel = makeText("div", "LAMBO CITY EXECUTIVE CLUBROOM", {
    color: "#d8b475",
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "2.2px"
  });
  const clubroomIntro = makeText("p", "An exclusive meeting destination for the LAMBO CITY team, artists, producers, engineers and invited business partners. Choose the purpose of your session and prepare a focused agenda.", {
    margin: "10px 0 18px",
    color: "rgba(245,240,232,.72)",
    fontSize: "13px",
    lineHeight: "1.65"
  });
  const modeTitle = makeText("div", "CHOOSE YOUR SESSION", {
    marginBottom: "12px",
    color: "rgba(245,240,232,.56)",
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "2px"
  });
  const modeGrid = document.createElement("div");
  setStyles(modeGrid, {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,190px),1fr))",
    gap: "9px"
  });

  const modeDetail = makeText("p", "", {
    minHeight: "42px",
    margin: "15px 0 10px",
    color: "rgba(245,240,232,.72)",
    fontSize: "12px",
    lineHeight: "1.6"
  });
  const agendaTitle = makeText("div", "SUGGESTED AGENDA", {
    margin: "14px 0 8px",
    color: "#d8b475",
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "1.8px"
  });
  const agendaList = document.createElement("div");
  const prepareButton = document.createElement("button");
  prepareButton.type = "button";
  prepareButton.textContent = "PREPARE SESSION PLAN";
  setStyles(prepareButton, {
    width: "100%",
    minHeight: "48px",
    marginTop: "18px",
    padding: "12px 18px",
    border: "1px solid rgba(225,190,126,.78)",
    borderRadius: "9px",
    background: "linear-gradient(110deg,rgba(128,91,43,.42),rgba(42,34,25,.72))",
    color: "#f4dfb5",
    font: "700 11px Arial,sans-serif",
    letterSpacing: "1.4px",
    cursor: "pointer"
  });
  const sessionStatus = makeText("div", "SESSION PLANNER READY  •  NO CALL HAS BEEN STARTED", {
    marginTop: "12px",
    padding: "11px 12px",
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: "8px",
    background: "rgba(255,255,255,.035)",
    color: "rgba(245,240,232,.56)",
    fontSize: "10px",
    lineHeight: "1.5",
    letterSpacing: ".7px"
  });

  function renderSessionMode(mode) {
    selectedMode = mode;
    sessionPrepared = false;
    modeGrid.querySelectorAll("button").forEach(button => {
      const active = button.dataset.mode === mode.id;
      button.style.borderColor = active ? "rgba(225,190,126,.9)" : "rgba(211,174,111,.25)";
      button.style.background = active ? "rgba(151,111,54,.2)" : "rgba(255,255,255,.045)";
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    modeDetail.textContent = mode.detail;
    agendaList.replaceChildren();
    mode.agenda.forEach((item, index) => {
      const line = makeText("div", "0" + (index + 1) + "   " + item, {
        padding: "9px 0",
        borderBottom: "1px solid rgba(255,255,255,.07)",
        color: "rgba(245,240,232,.8)",
        fontSize: "12px",
        lineHeight: "1.5"
      });
      agendaList.appendChild(line);
    });
    sessionStatus.textContent = "SESSION PLANNER READY  •  " + mode.name + " SELECTED";
    prepareButton.textContent = "PREPARE " + mode.name + " PLAN";
  }

  sessionModes.forEach(mode => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.mode = mode.id;
    button.textContent = mode.name;
    setStyles(button, {
      minHeight: "48px",
      padding: "11px 12px",
      border: "1px solid rgba(211,174,111,.25)",
      borderRadius: "9px",
      background: "rgba(255,255,255,.045)",
      color: "#eee5d6",
      font: "700 10px/1.4 Arial,sans-serif",
      letterSpacing: ".8px",
      textAlign: "left",
      cursor: "pointer"
    });
    button.addEventListener("click", () => renderSessionMode(mode));
    modeGrid.appendChild(button);
  });

  prepareButton.addEventListener("click", () => {
    sessionPrepared = true;
    sessionStatus.textContent = "LOCAL SESSION PLAN PREPARED  •  " + selectedMode.name + "  •  AGENDA READY";
    prepareButton.textContent = "SESSION PLAN PREPARED";
  });

  renderSessionMode(selectedMode);

  const connectionNote = makeText("p", "PRIVATE VIDEO, MICROPHONE, INVITATIONS AND LIVESTREAM CONNECTIONS ARE NOT ACTIVE YET. This first build prepares the meeting experience locally; live participant communication will be added through a dedicated real-time service.", {
    margin: "16px 0 0",
    color: "rgba(245,240,232,.42)",
    fontSize: "10px",
    lineHeight: "1.65",
    letterSpacing: ".25px"
  });

  const note = makeText("p", "FLOOR DIRECTORY  •  Select a room above to review its purpose. Meeting plans are local previews; invitations and scheduling are not connected.", {
    margin: "22px 0 0",
    color: "rgba(245,240,232,.38)",
    fontSize: "10px",
    lineHeight: "1.6",
    letterSpacing: ".5px"
  });

  panel.append(header, clubroomLabel, clubroomIntro, sessionDivider, modeTitle, modeGrid, modeDetail, agendaTitle, agendaList, prepareButton, sessionStatus, connectionNote, divider, eyebrow, title, description, listTitle, points, directoryTitle, directory, note);
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
