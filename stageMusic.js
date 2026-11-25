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
  try {
    const request = audio.play();
    Promise.resolve(request).then(() => {
      pendingPlay = false;
    }).catch(error => {
      // Keep the request queued. iOS Safari may reject playback until a
      // fresh user gesture; the capture-phase listeners below retry it.
      pendingPlay = true;
      console.warn("[LAMBO CITY] Stage audio is waiting for an allowed playback gesture.", error);
    });
  } catch (error) {
    pendingPlay = true;
    console.warn("[LAMBO CITY] Stage audio playback could not start yet.", error);
  }
}

function unlockAudio() {
  // Called synchronously from a real pointer, touch, or keyboard gesture.
  // Do not require pendingPlay to have existed before the first gesture.
  if (pendingPlay) attemptPlay();
}

function startApproach() {
  if (!audio || approachActive) return;
  audio.pause();
  audio.src = TRACK.url;
  audio.loop = true;
  audio.currentTime = 0;
  audio.volume = APPROACH_MIN_VOLUME;
  audio.load();
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
    audio.addEventListener("canplay", attemptPlay);
    audio.addEventListener("loadeddata", attemptPlay);
    // Capture phase sees the player's first interaction even when a HUD
    // control stops bubbling. touchend is included for iPad Safari.
    window.addEventListener("pointerdown", unlockAudio, true);
    window.addEventListener("touchend", unlockAudio, true);
    window.addEventListener("keydown", unlockAudio, true);
  },

  update() {},

  updateApproach(distance) {
    if (!audio) return;
    if (distance > APPROACH_START_DISTANCE) {
      stopApproach();
      return;
    }
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
    try { audio.currentTime = 0; } catch (error) {}
    audio.src = TRACK.url;
    audio.load();
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
