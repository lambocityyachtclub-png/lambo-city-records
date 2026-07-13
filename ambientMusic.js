// ambientMusic.js
// Plays a looping background track as soon as the player starts interacting
// with the world. Browsers (especially iPad Safari) block audio with sound
// from autoplaying before any user interaction, so this starts on the very
// first tap/keypress if a direct autoplay attempt is blocked — which for a
// game happens almost immediately.

const TRACK_URL = "https://res.cloudinary.com/z99sdnqv/video/upload/v1783884019/Let_s_Rage_qjmowr.mp3";

let audio, started = false;

function start() {
  if (started || !audio) return;
  audio.play().then(() => { started = true; }).catch(() => {
    // still blocked — next interaction will try again via the listeners below
  });
}

function unlockOnce() {
  start();
  if (started) {
    window.removeEventListener("pointerdown", unlockOnce);
    window.removeEventListener("keydown", unlockOnce);
  }
}

export default {
  init() {
    audio = new Audio(TRACK_URL);
    audio.loop = true;
    audio.volume = 0.6;

    // Try immediately — some browsers (often desktop) allow this right away
    start();

    // Fallback: wait for the first tap/click/key press anywhere on the page
    window.addEventListener("pointerdown", unlockOnce);
    window.addEventListener("keydown", unlockOnce);
  },
  update() {},
  pause() {
    if (audio) audio.pause();
  },
  resume() {
    if (audio && started) audio.play().catch(() => {});
  },
};
