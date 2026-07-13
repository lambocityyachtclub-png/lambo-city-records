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

const ZONES = [
  {
    meshName: "stageScreenOuter",
    radius: 45,
    ambientVolume: 0.6,
    stageVolume: 0.7,
  },
];

let scene, externallyPaused = false;
const zoneState = ZONES.map(() => ({ mesh: null, fade: 0 }));

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
        if (!state.mesh) return;
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

  pause() {
    externallyPaused = true;
    StageScreenMedia.setVolume(0);
  },
  resume() {
    externallyPaused = false;
  },

  isInAnyZone() {
    return zoneState.some(s => s.fade > 0.5);
  },
};
