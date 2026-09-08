// stageMusic.js
// LAMBO CITY GRAND STAGE MUSIC
//
// Dedicated audio controller for HERO's in-world Grand Stage performance.
// This is separate from ambientMusic.js so "Let's Rage" is NOT the normal
// visitor radio track.
//
// The performance always starts the song from 0:00.
//
// Includes an iPad/Safari fallback: if the browser blocks playback when the
// performance begins, the next user interaction attempts playback again.

const TRACK = {
  title: "Let's Rage",
  artist: "HERO",
  url: "https://res.cloudinary.com/z99sdnqv/video/upload/v1783884019/Let_s_Rage_qjmowr.mp3",
};

let audio = null;
let pendingPlay = false;

function clampVolume(value) {
  return Math.max(0, Math.min(1, value));
}

function attemptPlay() {
  if (!audio || !pendingPlay) return;

  audio.play()
    .then(() => {
      pendingPlay = false;
    })
    .catch(() => {
      // Safari/iOS may block playback until the user interacts
      // with the page. Keep pendingPlay=true so the unlock listener
      // can try again.
    });
}

function unlockAudio() {
  if (!pendingPlay) return;
  attemptPlay();
}

export default {
  init() {
    audio = new Audio();

    audio.preload = "auto";
    audio.loop = false;
    audio.volume = 0.7;

    audio.addEventListener("ended", () => {
      pendingPlay = false;
      audio.pause();
      audio.currentTime = 0;
    });

    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);
    window.addEventListener("touchstart", unlockAudio, { passive: true });
  },

  update() {},

  playFromStart() {
    if (!audio) return;

    audio.pause();

    try {
      audio.currentTime = 0;
    } catch (error) {}

    audio.src = TRACK.url;

    pendingPlay = true;

    attemptPlay();
  },

  stop() {
    if (!audio) return;

    pendingPlay = false;
    audio.pause();

    try {
      audio.currentTime = 0;
    } catch (error) {}
  },

  setVolume(value) {
    if (!audio) return;
    audio.volume = clampVolume(value);
  },

  isPlaying() {
    return !!audio && !audio.paused;
  },

  getCurrentTrack() {
    return TRACK;
  },
};
