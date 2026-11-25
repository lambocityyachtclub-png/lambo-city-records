// stageMusic.js
// Single owner for HERO's approach audio and performance track.
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
  audio.play().then(() => { pendingPlay = false; }).catch(() => {});
}

function unlockAudio() {
  if (pendingPlay) attemptPlay();
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
  try { audio.currentTime = 0; } catch (error) {}
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

  updateApproach() {
    // Do not preview the performance track before the trigger. The song
    // must begin exactly once, from the beginning, when HERO's entrance starts.
    if (approachActive) stopApproach();
  },

  playFromStart() {
    if (!audio) return;
    approachActive = false;
    trackEnded = false;
    audio.pause();
    audio.loop = false;
    audio.volume = 0.7;
    try { audio.currentTime = 0; } catch (error) {}
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
    try { audio.currentTime = 0; } catch (error) {}
  },

  setVolume(value) {
    if (audio) audio.volume = clampVolume(value);
  },

  isPlaying() {
    return !!audio && !audio.paused;
  },

  hasEnded() {
    return trackEnded;
  },

  // Visual systems read the actual media playback position rather than
  // maintaining independent clocks that drift away from the song.
  getPlaybackClock() {
    return {
      currentTime: audio && Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
      playing: !!audio && !audio.paused && !audio.ended,
    };
  },

  getCurrentTrack() {
    return TRACK;
  },
};
