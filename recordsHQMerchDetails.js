// recordsHQMerchDetails.js
// LAMBO CITY RECORDS — FLOOR 1 MERCHANDISE EXPERIENCE
//
// Adds a touch-friendly, browse-only collection experience to the
// existing merchandise wall. It does not move or rebuild the wall,
// change the store layout, or imply that checkout is connected.

let promptEl = null;
let modalEl = null;
let detailEl = null;
let sceneRef = null;
let inRange = false;
let modalOpen = false;
let lastEState = false;

const MERCH_POSITION = { x: 36.48, z: 22.4 };
const ACTIVATION_DISTANCE = 5.25;

const COLLECTION = [
  {
    id: "tee",
    category: "APPAREL",
    name: "Signature Tee",
    description: "A clean LAMBO CITY Records signature piece, presented in the house black-and-gold palette.",
    finish: "Black · Gold identity"
  },
  {
    id: "cap",
    category: "HEADWEAR",
    name: "Records Cap",
    description: "A premium headwear concept with a restrained embroidered-style LAMBO CITY mark.",
    finish: "Black · Signature mark"
  },
  {
    id: "vinyl",
    category: "MUSIC",
    name: "LAMBO CITY Vol. 1",
    description: "A collector-style vinyl presentation celebrating the LAMBO CITY music identity.",
    finish: "Collector presentation"
  }
];

function style(element, values) {
  Object.assign(element.style, values);
}

function makeButton(text, parent, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  style(button, {
    border: "1px solid rgba(221,180,104,.65)",
    borderRadius: "999px",
    padding: "12px 20px",
    background: "linear-gradient(135deg,#d9b36b,#9d7438)",
    color: "#17120b",
    font: "700 11px/1.2 Arial,sans-serif",
    letterSpacing: "1.5px",
    cursor: "pointer",
    minHeight: "42px"
  });
  button.addEventListener("click", onClick);
  parent.appendChild(button);
  return button;
}

function buildInterface() {
  promptEl = document.createElement("button");
  promptEl.type = "button";
  promptEl.textContent = "BROWSE THE LAMBO CITY COLLECTION";
  style(promptEl, {
    position: "fixed",
    left: "50%",
    bottom: "112px",
    transform: "translateX(-50%)",
    zIndex: "260",
    display: "none",
    maxWidth: "calc(100vw - 32px)",
    padding: "13px 22px",
    border: "1px solid rgba(225,190,126,.8)",
    borderRadius: "999px",
    background: "rgba(12,12,14,.94)",
    color: "#f4dfb5",
    font: "700 11px/1.3 Arial,sans-serif",
    letterSpacing: "1.5px",
    cursor: "pointer",
    boxShadow: "0 8px 32px rgba(0,0,0,.4)"
  });
  promptEl.addEventListener("click", openModal);
  document.body.appendChild(promptEl);

  modalEl = document.createElement("div");
  style(modalEl, {
    position: "fixed",
    inset: "0",
    zIndex: "650",
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    boxSizing: "border-box",
    background: "rgba(3,4,7,.88)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    color: "#f5f0e8",
    fontFamily: "Arial,sans-serif",
    pointerEvents: "auto"
  });

  const panel = document.createElement("section");
  style(panel, {
    width: "min(920px,100%)",
    maxHeight: "min(760px,90vh)",
    overflowY: "auto",
    boxSizing: "border-box",
    padding: "clamp(20px,4vw,38px)",
    border: "1px solid rgba(211,174,111,.48)",
    borderRadius: "18px",
    background: "linear-gradient(145deg,rgba(28,25,22,.98),rgba(7,9,13,.98))",
    boxShadow: "0 24px 90px rgba(0,0,0,.65)"
  });

  const header = document.createElement("div");
  style(header, {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "12px"
  });

  const brand = document.createElement("div");
  brand.textContent = "LAMBO CITY RECORDS";
  style(brand, {
    color: "#d8b475",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "3px"
  });

  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "CLOSE  ×";
  style(close, {
    border: "1px solid rgba(255,255,255,.2)",
    borderRadius: "999px",
    padding: "10px 15px",
    background: "rgba(255,255,255,.06)",
    color: "#fff",
    font: "700 10px Arial,sans-serif",
    letterSpacing: "1px",
    cursor: "pointer"
  });
  close.addEventListener("click", closeModal);
  header.append(brand, close);

  const heading = document.createElement("h2");
  heading.textContent = "THE HOUSE COLLECTION";
  style(heading, {
    margin: "18px 0 8px",
    color: "#fff",
    fontSize: "clamp(25px,5vw,40px)",
    letterSpacing: "1px",
    lineHeight: "1.05"
  });

  const intro = document.createElement("p");
  intro.textContent = "Explore the LAMBO CITY identity — apparel, headwear and music.";
  style(intro, {
    margin: "0 0 24px",
    color: "rgba(245,240,232,.68)",
    fontSize: "14px",
    lineHeight: "1.6"
  });

  const grid = document.createElement("div");
  style(grid, {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,210px),1fr))",
    gap: "14px"
  });

  COLLECTION.forEach((item, index) => {
    const card = document.createElement("button");
    card.type = "button";
    style(card, {
      textAlign: "left",
      minHeight: "190px",
      padding: "20px",
      border: "1px solid rgba(211,174,111,.28)",
      borderRadius: "13px",
      background: "linear-gradient(155deg,rgba(255,255,255,.075),rgba(255,255,255,.018))",
      color: "#fff",
      cursor: "pointer"
    });

    const number = document.createElement("div");
    number.textContent = "0" + (index + 1);
    style(number, {
      color: "#d8b475",
      fontSize: "11px",
      letterSpacing: "2px",
      marginBottom: "28px"
    });

    const category = document.createElement("div");
    category.textContent = item.category;
    style(category, {
      color: "rgba(245,240,232,.56)",
      fontSize: "10px",
      letterSpacing: "2px",
      marginBottom: "8px"
    });

    const name = document.createElement("div");
    name.textContent = item.name;
    style(name, {
      fontSize: "20px",
      fontWeight: "700",
      marginBottom: "12px"
    });

    const action = document.createElement("div");
    action.textContent = "VIEW DETAILS  →";
    style(action, {
      color: "#d8b475",
      fontSize: "10px",
      fontWeight: "700",
      letterSpacing: "1.5px"
    });

    card.append(number, category, name, action);
    card.addEventListener("click", () => showDetails(item));
    grid.appendChild(card);
  });

  detailEl = document.createElement("div");
  style(detailEl, {
    display: "none",
    marginTop: "18px",
    padding: "18px 20px",
    borderLeft: "2px solid #d8b475",
    background: "rgba(255,255,255,.045)"
  });

  const note = document.createElement("p");
  note.textContent = "COLLECTION PREVIEW · Product purchasing is not connected in this build.";
  style(note, {
    margin: "22px 0 0",
    color: "rgba(245,240,232,.42)",
    fontSize: "10px",
    lineHeight: "1.5",
    letterSpacing: "1px"
  });

  panel.append(header, heading, intro, grid, detailEl, note);
  modalEl.appendChild(panel);
  modalEl.addEventListener("click", event => {
    if (event.target === modalEl) closeModal();
  });
  document.body.appendChild(modalEl);

  window.addEventListener("keydown", onKeyDown);
}

function showDetails(item) {
  if (!detailEl) return;
  detailEl.replaceChildren();

  const category = document.createElement("div");
  category.textContent = item.category;
  style(category, {
    color: "#d8b475",
    fontSize: "10px",
    letterSpacing: "2px",
    marginBottom: "8px"
  });

  const title = document.createElement("h3");
  title.textContent = item.name;
  style(title, {
    margin: "0 0 8px",
    color: "#fff",
    fontSize: "22px"
  });

  const description = document.createElement("p");
  description.textContent = item.description;
  style(description, {
    margin: "0 0 8px",
    color: "rgba(245,240,232,.78)",
    fontSize: "13px",
    lineHeight: "1.6"
  });

  const finish = document.createElement("div");
  finish.textContent = item.finish;
  style(finish, {
    color: "#d8b475",
    fontSize: "11px",
    letterSpacing: "1px"
  });

  detailEl.append(category, title, description, finish);
  detailEl.style.display = "block";
}

function openModal() {
  if (!inRange || !modalEl) return;
  modalOpen = true;
  modalEl.style.display = "flex";
  if (promptEl) promptEl.style.display = "none";
  window.__lamboCityMerchOpen = true;
}

function closeModal() {
  modalOpen = false;
  if (modalEl) modalEl.style.display = "none";
  window.__lamboCityMerchOpen = false;
}

function onKeyDown(event) {
  if (event.key === "Escape" && modalOpen) {
    closeModal();
    return;
  }
  if (event.key && event.key.toLowerCase() === "e" && inRange && !lastEState && !modalOpen) {
    event.preventDefault();
    openModal();
  }
}

export default {
  init() {
    if (!promptEl) buildInterface();
    return null;
  },

  update(delta, context) {
    const player = context && context.player;
    if (!player || !player.position) return;

    const dx = player.position.x - MERCH_POSITION.x;
    const dz = player.position.z - MERCH_POSITION.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    inRange = distance <= ACTIVATION_DISTANCE;
    window.__lamboCityMerchInRange = inRange;

    const input = window.__lamboCityInput;
    const ePressed = !!(input && input.keys && input.keys.e);

    if (ePressed && !lastEState && inRange && !modalOpen) {
      openModal();
      if (input && input.keys) input.keys.e = false;
    }
    lastEState = ePressed;

    if (promptEl) {
      promptEl.style.display = inRange && !modalOpen ? "block" : "none";
    }

    if (!inRange && modalOpen) closeModal();
  }
};
