// stageAudioZone.js
// LAMBO CITY GRAND STAGE AUDIO ZONE
//
// The Grand Stage uses stageMusic.js for HERO's live in-world performance.
// StageScreenMedia remains visual-only and must NOT become an audio source.
//
// This system keeps the existing stage proximity logic and public API so
// stageVideo.js can still pause/resume the zone while the HQ video modal
// is open.

import AmbientMusic from "./ambientMusic.js";

const FADE_DURATION = 1.5;

const ZONES = [
  {
    meshName: "stageScreenOuter",
    radius: 45,
    ambientVolume: 0.6,
  },
];

let scene = null;
let externallyPaused = false;

const zoneState = ZONES.map(() => ({
  mesh: null,
  fade: 0,
}));

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

      if (state.fade < target) {
        state.fade = Math.min(target, state.fade + step);
      } else if (state.fade > target) {
        state.fade = Math.max(target, state.fade - step);
      }

      // Fade the normal city radio down as the visitor approaches
      // the Grand Stage.
      //
      // stageMusic.js owns HERO's actual performance audio.
      AmbientMusic.setVolume(
        zone.ambientVolume * (1 - state.fade)
      );
    });
  },

  // Used by stageVideo.js while the HQ YouTube performance is open.
  pause() {
    externallyPaused = true;
    AmbientMusic.setVolume(0);
  },

  resume() {
    externallyPaused = false;

    // The next update() tick restores the correct ambient volume.
  },

  isInAnyZone() {
    return zoneState.some((state) => state.fade > 0.5);
  },
};
