// stageAudioZone.js
// Plays "Let's Rage" — the reserved stage performance track in
// ambientMusic.js — while the player is near the stage, based on
// proximity to the stageScreenOuter mesh. Reuses the same distance-check
// pattern already used by stageVideo.js — no changes to world.js needed.
//
// stageScreenMedia.js's jumbotron loop stays visual-only/muted, as its own
// header comment already says it should be; this file no longer unmutes it.
//
// Structured as a list of zones (one today) so additional stages — or a
// future Broadcast Hub audio source — can be added later without changing
// this file's public API (init/update + the status getter below).
 
import AmbientMusic from "./ambientMusic.js";
import StageScreenMedia from "./stageScreenMedia.js";
 
const FADE_DURATION = 1.5; // seconds — matches the "1 to 2 seconds" spec
 
// Each zone: a stage's screen mesh name and its activation radius. Add
// more entries here later for additional stages — nothing else in this
// file needs to change.
const ZONES = [
  {
    meshName: "stageScreenOuter",
    radius: 45,
    ambientVolume: 0.6,
  },
];
 
let scene, externallyPaused = false;
const zoneState = ZONES.map(() => ({ mesh: null, fade: 0, inZone: false })); // fade: 0=outside, 1=inside
 
export default {
  init(scene_) {
    scene = scene_;
  },
 
  update(delta, context) {
    if (!scene || externallyPaused) return;
 
    const player = context.player;
    if (!player) return;
 
    ZONES.forEach((zone, i) => {
      const state = zoneState[i];
      if (!state.mesh) {
        state.mesh = scene.getObjectByName(zone.meshName);
        if (!state.mesh) return; // world.js hasn't built the stage yet
      }
 
      const dx = player.position.x - state.mesh.position.x;
      const dz = player.position.z - state.mesh.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const inZone = dist <= zone.radius;
 
      if (inZone && !state.inZone) {
        AmbientMusic.playStageTrack(); // entering — the performance starts
      } else if (!inZone && state.inZone) {
        AmbientMusic.endStageTrack(); // leaving — performance ends, track unlocked
      }
      state.inZone = inZone;
 
      const target = inZone ? 1 : 0;
      const step = delta / FADE_DURATION;
      if (state.fade < target) state.fade = Math.min(target, state.fade + step);
      else if (state.fade > target) state.fade = Math.max(target, state.fade - step);
 
      AmbientMusic.setVolume(zone.ambientVolume);
      StageScreenMedia.setVolume(0); // jumbotron loop stays visual-only
    });
  },
 
  // Called by stageVideo.js while the royalty-tracked modal is open, so this
  // system doesn't fight with it over volume.
  pause() {
    externallyPaused = true;
    StageScreenMedia.setVolume(0);
  },
  resume() {
    externallyPaused = false;
    // next update() tick resumes automatically
  },
 
  // Read-only status, useful later for debugging or a HUD indicator
  isInAnyZone() {
    return zoneState.some(s => s.fade > 0.5);
  },
};
