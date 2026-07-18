// stageAudioZone.js
// Crossfades between the city-wide ambient radio (ambientMusic.js) and the
// stage's own video audio (stageScreenMedia.js) based on player proximity
// to the stage. Reuses the same stageScreenOuter mesh + distance-check
// pattern already used by stageVideo.js — no changes to world.js needed.
//
// Structured as a list of zones (one today) so additional stages — or a
// future Broadcast Hub audio source — can be added later without changing
// this file's public API (init/update + the status getter below).

import AmbientMusic from "./ambientMusic.js";
import StageScreenMedia from "./stageScreenMedia.js";

const FADE_DURATION = 1.5; // seconds — matches the "1 to 2 seconds" spec

// Each zone: a stage's screen mesh name, its activation radius, and the
// ambient/stage volume levels to fade between. Add more entries here later
// for additional stages — nothing else in this file needs to change.
const ZONES = [
  {
    meshName: "stageScreenOuter",
    radius: 45,
    ambientVolume: 0.6,
    stageVolume: 0.7,
  },
];

let scene, externallyPaused = false;
const zoneState = ZONES.map(() => ({ mesh: null, fade: 0 })); // fade: 0=radio, 1=stage

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

      const target = inZone ? 1 : 0;
      const step = delta / FADE_DURATION;
      if (state.fade < target) state.fade = Math.min(target, state.fade + step);
      else if (state.fade > target) state.fade = Math.max(target, state.fade - step);

      AmbientMusic.setVolume(zone.ambientVolume * (1 - state.fade));
      StageScreenMedia.setVolume(zone.stageVolume * state.fade);
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
    // next update() tick fades back to the correct level automatically
  },

  // Read-only status, useful later for debugging or a HUD indicator
  isInAnyZone() {
    return zoneState.some(s => s.fade > 0.5);
  },
};
