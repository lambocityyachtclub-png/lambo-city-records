// stageVideo.js
// LAMBO CITY Records HQ — official YouTube performance viewer.
//
// IMPORTANT:
// - This system is NO LONGER connected to the Grand Stage.
// - There is NO E prompt at the Grand Stage.
// - The official YouTube performance is available ONLY at Records HQ.
// - Playback is user-initiated, so YouTube can handle playback/Content ID
//   normally.
//
// HQ position is locked to the existing Records HQ architecture:
// x = 28, z = 22.
//
// No changes to world.js or recordsHQ.js are required.
import AmbientMusic from "./ambientMusic.js";
import StageAudioZone from "./stageAudioZone.js";
// ---- OFFICIAL PERFORMANCE ----
const TRACK = {
  videoId: "9mNaRK-CnQk",
  title: "Let's Rage",
  artist: "HERO",
  label: "Lambo City Records",
};
// Records HQ is locked at x: 28, z: 22.
const HQ_POSITION = {
  x: 28,
  z: 22,
};
// How close the player must be to Records HQ to get the E prompt.
const ACTIVATION_DISTANCE = 16;
let scene;
let built = false;
let promptEl;
let modalEl;
let modalIframe;
let modalOpen = false;
let inRange = false;
function buildDOM() {
  // ------------------------------------------------------------
  // HQ INTERACTION PROMPT
  // ------------------------------------------------------------
  promptEl = document.createElement("div");
  promptEl.style.position = "fixed";
  promptEl.style.bottom = "160px";
  promptEl.style.left = "50%";
  promptEl.style.transform = "translateX(-50%)";
  promptEl.style.background = "rgba(0,0,0,0.85)";
  promptEl.style.border = "1px solid rgba(255,0,170,0.4)";
  promptEl.style.borderRadius = "12px";
  promptEl.style.padding = "10px 20px";
  promptEl.style.color = "white";
  promptEl.style.fontFamily = "sans-serif";
  promptEl.style.fontSize = "13px";
  promptEl.style.fontWeight = "600";
  promptEl.style.textAlign = "center";
  promptEl.style.zIndex = "250";
  promptEl.style.cursor = "pointer";
  promptEl.style.pointerEvents = "auto";
  promptEl.style.display = "none";
  promptEl.style.boxShadow =
    "0 0 20px rgba(255,0,170,0.25)";
  promptEl.innerHTML =
    `<span style="color:#ff00aa;">[E]</span> ` +
    `Watch ${TRACK.artist} — "${TRACK.title}"`;
  promptEl.addEventListener("click", openModal);
  document.body.appendChild(promptEl);
  // ------------------------------------------------------------
  // VIDEO MODAL
  // ------------------------------------------------------------
  modalEl = document.createElement("div");
  modalEl.style.position = "fixed";
  modalEl.style.top = "0";
  modalEl.style.left = "0";
  modalEl.style.width = "100%";
  modalEl.style.height = "100%";
  modalEl.style.background = "rgba(0,0,0,0.88)";
  modalEl.style.zIndex = "400";
  modalEl.style.display = "none";
  modalEl.style.alignItems = "center";
  modalEl.style.justifyContent = "center";
  modalEl.style.flexDirection = "column";
  modalEl.style.pointerEvents = "auto";
  // ------------------------------------------------------------
  // MODAL PANEL
  // ------------------------------------------------------------
  const panel = document.createElement("div");
  panel.style.width = "min(90vw, 960px)";
  panel.style.maxWidth = "960px";
  // ------------------------------------------------------------
  // HEADER
  // ------------------------------------------------------------
  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.style.alignItems = "center";
  header.style.marginBottom = "10px";
  const titleEl = document.createElement("div");
  titleEl.style.color = "#fff";
  titleEl.style.fontFamily = "sans-serif";
  titleEl.style.fontSize = "14px";
  titleEl.style.fontWeight = "600";
  titleEl.textContent =
    `${TRACK.artist} — "${TRACK.title}" · ${TRACK.label}`;
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕ CLOSE";
  closeBtn.style.background =
    "linear-gradient(90deg,#9900ff,#ff00aa)";
  closeBtn.style.border = "none";
  closeBtn.style.borderRadius = "20px";
  closeBtn.style.color = "white";
  closeBtn.style.padding = "8px 18px";
  closeBtn.style.fontSize = "12px";
  closeBtn.style.letterSpacing = "1px";
  closeBtn.style.cursor = "pointer";
  closeBtn.addEventListener("click", closeModal);
  header.appendChild(titleEl);
  header.appendChild(closeBtn);
  // ------------------------------------------------------------
  // VIDEO CONTAINER
  // ------------------------------------------------------------
  const videoWrap = document.createElement("div");
  videoWrap.style.position = "relative";
  videoWrap.style.width = "100%";
  videoWrap.style.paddingBottom = "56.25%";
  videoWrap.style.background = "#000";
  videoWrap.style.borderRadius = "8px";
  videoWrap.style.overflow = "hidden";
  videoWrap.style.boxShadow =
    "0 0 40px rgba(153,0,255,0.3)";
  // ------------------------------------------------------------
  // YOUTUBE IFRAME
  // ------------------------------------------------------------
  modalIframe = document.createElement("iframe");
  modalIframe.style.position = "absolute";
  modalIframe.style.top = "0";
  modalIframe.style.left = "0";
  modalIframe.style.width = "100%";
  modalIframe.style.height = "100%";
  modalIframe.style.border = "0";
  modalIframe.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; " +
    "gyroscope; picture-in-picture; web-share";
  modalIframe.allowFullscreen = true;
  videoWrap.appendChild(modalIframe);
  panel.appendChild(header);
  panel.appendChild(videoWrap);
  modalEl.appendChild(panel);
  // Clicking outside the video closes the modal.
  modalEl.addEventListener("click", (e) => {
    if (e.target === modalEl) {
      closeModal();
    }
  });
  document.body.appendChild(modalEl);
  // ------------------------------------------------------------
  // KEYBOARD CONTROLS
  // ------------------------------------------------------------
  window.addEventListener("keydown", (e) => {
    if (!e.key) return;
    const key = e.key.toLowerCase();
    // E only works while standing near Records HQ.
    if (key === "e" && inRange && !modalOpen) {
      openModal();
    }
    if (e.key === "Escape" && modalOpen) {
      closeModal();
    }
  });
  built = true;
}
function openModal() {
  if (!modalEl) return;
  modalOpen = true;
  modalEl.style.display = "flex";
  if (promptEl) {
    promptEl.style.display = "none";
  }
  // User explicitly opened the video, so autoplay inside the
  // YouTube iframe is allowed to begin normally.
  modalIframe.src =
    `https://www.youtube.com/embed/${TRACK.videoId}` +
    `?autoplay=1` +
    `&controls=1` +
    `&rel=0` +
    `&modestbranding=1` +
    `&playsinline=1`;
  // Stop the city radio while the official video is playing.
  AmbientMusic.pause();
  // Keep the existing StageAudioZone API intact.
  StageAudioZone.pause();
}
function closeModal() {
  if (!modalEl) return;
  modalOpen = false;
  modalEl.style.display = "none";
  // Destroy the iframe source so YouTube stops immediately.
  modalIframe.src = "";
  AmbientMusic.resume();
  StageAudioZone.resume();
}
export default {
  init(scene_) {
    scene = scene_;
  },
  update(delta, context) {
    if (!scene) return;
    if (!built) {
      buildDOM();
    }
    if (modalOpen) {
      return;
    }
    const player = context.player;
    if (!player) {
      return;
    }
    // ------------------------------------------------------------
    // RECORDS HQ DISTANCE CHECK
    // ------------------------------------------------------------
    const dx =
      player.position.x - HQ_POSITION.x;
    const dz =
      player.position.z - HQ_POSITION.z;
    const dist =
      Math.sqrt(dx * dx + dz * dz);
    inRange =
      dist <= ACTIVATION_DISTANCE;
    // ONLY Records HQ can show this prompt.
    promptEl.style.display =
      inRange ? "block" : "none";
  },
  setTrack(videoId, title, artist, label) {
    TRACK.videoId = videoId;
    if (title) {
      TRACK.title = title;
    }
    if (artist) {
      TRACK.artist = artist;
    }
    if (label) {
      TRACK.label = label;
    }
    if (promptEl) {
      promptEl.innerHTML =
        `<span style="color:#ff00aa;">[E]</span> ` +
        `Watch ${TRACK.artist} — "${TRACK.title}"`;
    }
  },
};
