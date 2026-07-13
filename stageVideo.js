// stageVideo.js
// Shows a real YouTube video for the stage performance via a simple modal
// overlay, opened when the player is near the stage and presses E (or taps
// the on-screen prompt). This avoids anchoring the iframe to the 3D screen
// mesh entirely — that approach hit a WebKit limitation where iframes nested
// inside CSS 3D transforms don't reliably render on iPad Safari. This version
// uses no 3D transforms at all, so it's guaranteed to render correctly.
// Playback is 100% native user-click, no autoplay — YouTube Content ID /
// royalty tracking stays valid.

import AmbientMusic from "./ambientMusic.js";
import StageAudioZone from "./stageAudioZone.js";

// ---- CONFIG: swap the track here, nothing else needs to change ----
const TRACK = {
  videoId: "9mNaRK-CnQk",
  title: "Track Title",        // ← replace with the actual song title
  artist: "Hero",
  label: "Lambo City Records",
};

const SCREEN_MESH_NAME = "stageScreenOuter"; // must match the .name set in world.js
const ACTIVATION_DISTANCE = 40; // how close the player must be to see the prompt

let scene, screenMesh;
let built = false;
let promptEl, modalEl, modalIframe;
let modalOpen = false;
let inRange = false;

function buildDOM() {
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
  promptEl.style.boxShadow = "0 0 20px rgba(255,0,170,0.25)";
  promptEl.innerHTML =
    `<span style="color:#ff00aa;">[E]</span> Watch ${TRACK.artist} — "${TRACK.title}"`;
  promptEl.addEventListener("click", openModal);
  document.body.appendChild(promptEl);

  const modalEl_ = modalEl = document.createElement("div");
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

  const panel = document.createElement("div");
  panel.style.width = "min(90vw, 960px)";
  panel.style.maxWidth = "960px";

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
  titleEl.textContent = `${TRACK.artist} — "${TRACK.title}" · ${TRACK.label}`;

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕ CLOSE";
  closeBtn.style.background = "linear-gradient(90deg,#9900ff,#ff00aa)";
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

  const videoWrap = document.createElement("div");
  videoWrap.style.position = "relative";
  videoWrap.style.width = "100%";
  videoWrap.style.paddingBottom = "56.25%";
  videoWrap.style.background = "#000";
  videoWrap.style.borderRadius = "8px";
  videoWrap.style.overflow = "hidden";
  videoWrap.style.boxShadow = "0 0 40px rgba(153,0,255,0.3)";

  modalIframe = document.createElement("iframe");
  modalIframe.style.position = "absolute";
  modalIframe.style.top = "0";
  modalIframe.style.left = "0";
  modalIframe.style.width = "100%";
  modalIframe.style.height = "100%";
  modalIframe.style.border = "0";
  modalIframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  modalIframe.allowFullscreen = true;

  videoWrap.appendChild(modalIframe);
  panel.appendChild(header);
  panel.appendChild(videoWrap);
  modalEl.appendChild(panel);

  modalEl.addEventListener("click", (e) => {
    if (e.target === modalEl) closeModal();
  });

  document.body.appendChild(modalEl);

  window.addEventListener("keydown", (e) => {
    if (e.key && e.key.toLowerCase() === "e" && inRange && !modalOpen) {
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
  promptEl.style.display = "none";
  modalIframe.src =
    `https://www.youtube.com/embed/${TRACK.videoId}` +
    `?autoplay=0&controls=1&rel=0&modestbranding=1&playsinline=1`;
  AmbientMusic.pause();
  StageAudioZone.pause();
}

function closeModal() {
  if (!modalEl) return;
  modalOpen = false;
  modalEl.style.display = "none";
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

    if (!screenMesh) {
      screenMesh = scene.getObjectByName(SCREEN_MESH_NAME);
      if (!screenMesh) return;
    }

    if (!built) buildDOM();
    if (modalOpen) return;

    const player = context.player;
    if (!player) return;

    const dx = player.position.x - screenMesh.position.x;
    const dz = player.position.z - screenMesh.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    inRange = dist <= ACTIVATION_DISTANCE;
    promptEl.style.display = inRange ? "block" : "none";
  },

  setTrack(videoId, title, artist, label) {
    TRACK.videoId = videoId;
    if (title) TRACK.title = title;
    if (artist) TRACK.artist = artist;
    if (label) TRACK.label = label;
    if (promptEl) {
      promptEl.innerHTML = `<span style="color:#ff00aa;">[E]</span> Watch ${TRACK.artist} — "${TRACK.title}"`;
    }
  },
};
