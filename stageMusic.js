// stageMusic.js
// LAMBO CITY GRAND STAGE MUSIC
//
// One audio element owns both the distant approach preview and HERO's
// performance. The approach preview fades up with proximity; the actual
// performance deliberately restarts at 0:00 when HERO takes the stage.

const TRACK = {
  title: "HERO - Lets Rage",
  artist: "HERO",
  url: "https://res.cloudinary.com/z99sdnqv/video/upload/v1794623950/Let_s_Rage_Show_Version_hrc7tr.mp3",
};

const APPROACH_START_DISTANCE = 55;
const APPROACH_END_DISTANCE = 22;
const APPROACH_MIN_VOLUME = 0.05;
const APPROACH_MAX_VOLUME = 0.35;

let audio = null;
let pendingPlay = false;
let trackEnded = false;
let approachActive = false;

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
      // Safari/iOS may block playback until the next user interaction.
    });
}

function unlockAudio() {
  if (!pendingPlay) return;
  attemptPlay();
}

function startApproach() {
  if (!audio || approachActive) return;

  audio.pause();
  audio.src = TRACK.url;
  audio.loop = true;
  audio.currentTime = 0;
  audio.volume = APPROACH_MIN_VOLUME;
  trackEnded = false;
  approachActive = true;
  pendingPlay = true;
  attemptPlay();
}

function stopApproach() {
  if (!audio || !approachActive) return;

  approachActive = false;
  pendingPlay = false;
  audio.pause();
  audio.loop = false;
  audio.volume = 0.7;
  try {
    audio.currentTime = 0;
  } catch (error) {}
}

export default {
  init() {
    audio = new Audio();
    audio.preload = "auto";
    audio.loop = false;
    audio.volume = 0.7;

    audio.addEventListener("ended", () => {
      trackEnded = true;
      pendingPlay = false;
      audio.pause();
      audio.currentTime = 0;
    });

    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);
    window.addEventListener("touchstart", unlockAudio, { passive: true });
  },

  update() {},

  updateApproach(distance) {
    if (!audio) return;

    if (distance > APPROACH_START_DISTANCE) {
      stopApproach();
      return;
    }

    // The full performance takes ownership at the existing 22-unit trigger.
    if (distance <= APPROACH_END_DISTANCE) return;

    startApproach();

    const progress = clampVolume(
      (APPROACH_START_DISTANCE - distance) /
      (APPROACH_START_DISTANCE - APPROACH_END_DISTANCE)
    );

    audio.volume = APPROACH_MIN_VOLUME +
      (APPROACH_MAX_VOLUME - APPROACH_MIN_VOLUME) * progress;
  },

  playFromStart() {
    if (!audio) return;

    approachActive = false;
    trackEnded = false;
    audio.pause();
    audio.loop = false;
    audio.volume = 0.7;

    try {
      audio.currentTime = 0;
    } catch (error) {}

    audio.src = TRACK.url;
    pendingPlay = true;
    attemptPlay();
  },

  stop() {
    if (!audio) return;

    approachActive = false;
    trackEnded = false;
    pendingPlay = false;
    audio.pause();
    audio.loop = false;
    audio.volume = 0.7;

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

  hasEnded() {
    return trackEnded;
  },

  getCurrentTrack() {
    return TRACK;
  },
};
