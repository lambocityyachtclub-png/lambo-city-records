// ambientMusic.js
// LAMBO CITY RADIO — plays a playlist of self-hosted tracks, starting as
// soon as the player interacts with the world (browsers block audio
// autoplay before any interaction). Exposes real controls (play, pause,
// toggle, next, current track info) so hud.js's radio widget can display
// and control it directly, instead of being a fake decoration.

// ---- PLAYLIST: add more songs here later, same shape ----
const PLAYLIST = [
  {
    title: "Let's Rage",
    artist: "Hero",
    url: "https://res.cloudinary.com/z99sdnqv/video/upload/v1783884019/Let_s_Rage_qjmowr.mp3",
  },
  // { title: "Next Song", artist: "Hero", url: "https://..." },
];

let audio, started = false, trackIndex = 0;

function loadTrack(index) {
  trackIndex = ((index % PLAYLIST.length) + PLAYLIST.length) % PLAYLIST.length;
  audio.src = PLAYLIST[trackIndex].url;
}

function start() {
  if (!audio) return;
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
    audio = new Audio();
    audio.volume = 0.6;
    audio.addEventListener("ended", () => {
      loadTrack(trackIndex + 1);
      start();
    });

    loadTrack(0);
    start();

    window.addEventListener("pointerdown", unlockOnce);
    window.addEventListener("keydown", unlockOnce);
  },
  update() {},

  pause() {
    if (audio) audio.pause();
  },
  resume() {
    if (audio) start();
  },
  togglePlay() {
    if (!audio) return;
    if (audio.paused) start();
    else audio.pause();
  },
  next() {
    loadTrack(trackIndex + 1);
    start();
  },
  isPlaying() {
    return !!audio && !audio.paused;
  },
  getCurrentTrack() {
    return PLAYLIST[trackIndex];
  },
  setVolume(v) {
    if (audio) audio.volume = Math.max(0, Math.min(1, v));
  },
};
