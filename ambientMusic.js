// ambientMusic.js
// LAMBO CITY RADIO — plays a playlist of self-hosted tracks, starting as
// soon as the player interacts with the world (browsers block audio
// autoplay before any interaction). Exposes real controls (play, pause,
// toggle, next, current track info) so hud.js's radio widget can display
// and control it directly, instead of being a fake decoration.
//
// "Let's Rage" is reserved as the stage performance track — it's held out
// of the regular rotation and only played via playStageTrack()/
// endStageTrack() (called by stageAudioZone.js when the player enters/
// leaves the stage zone). Once the performance ends the first time, it's
// folded into PLAYLIST so it can come up in normal rotation afterward too.
 
// ---- PLAYLIST: add more songs here later, same shape ----
const PLAYLIST = [
  {
    title: "Bounce To The Oz",
    artist: "Hero",
    url: "https://res.cloudinary.com/z99sdnqv/video/upload/v1788849538/Bounce_To_The_Oz_3_dyjluf.mp3",
  },
  {
    title: "Everybody Get Up",
    artist: "H.E.R.O",
    url: "https://res.cloudinary.com/z99sdnqv/video/upload/v1788849476/H.E.R.O_Everybody_Get_Up_zn8li0.mp3",
  },
  // { title: "Next Song", artist: "Hero", url: "https://..." },
];
 
// Reserved for the stage performance — see comment above.
const STAGE_TRACK = {
  title: "Let's Rage",
  artist: "Hero",
  url: "https://res.cloudinary.com/z99sdnqv/video/upload/v1783884019/Let_s_Rage_qjmowr.mp3",
};
 
let audio, started = false, trackIndex = 0;
let onStageTrack = false, preStageTrackIndex = 0, stageTrackUnlocked = false;
 
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
      if (onStageTrack) {
        start(); // loop the performance track while still in the stage zone
      } else {
        loadTrack(trackIndex + 1);
        start();
      }
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
    return onStageTrack ? STAGE_TRACK : PLAYLIST[trackIndex];
  },
  setVolume(v) {
    if (audio) audio.volume = Math.max(0, Math.min(1, v));
  },
 
  // ---- Stage performance hooks — called by stageAudioZone.js ----
  playStageTrack() {
    if (!audio || onStageTrack) return;
    preStageTrackIndex = trackIndex;
    onStageTrack = true;
    audio.src = STAGE_TRACK.url;
    start();
  },
  endStageTrack() {
    if (!audio || !onStageTrack) return;
    onStageTrack = false;
    if (!stageTrackUnlocked) {
      PLAYLIST.push(STAGE_TRACK); // now part of the regular rotation
      stageTrackUnlocked = true;
    }
    loadTrack(preStageTrackIndex);
    start();
  },
};
