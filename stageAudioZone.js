// stageAudioZone.js
// Crossfades between the city-wide ambient radio (ambientMusic.js) and the
// stage's own video audio (stageScreenMedia.js) based on player proximity
// to the stage. Reuses the same stageScreenOuter mesh + distance-check
// pattern already used by stageVideo.js — no changes to world.js needed.
//
// TEMPORARY: includes a small on-screen debug readout (top-center) showing
// live distance-to-stage and fade value, so we can diagnose without needing
// browser dev tools. Remove once confirmed working.

import AmbientMusic from "./ambientMusic.js";
import StageScreenMedia from "./stageScreenMedia.js";

const FADE_DURATION = 1.5;

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

let debugEl;
function buildDebug() {
  debugEl = document.createElement("div");
  debugEl.style.position = "fixed";
  debugEl.style.top = "90px";
  debugEl.style.left = "50%";
  debugEl.style.transform = "translateX(-50%)";
  debugEl.style.background = "rgba(0,0,0,0.85)";
  debugEl.style.color = "#0f0";
  debugEl.style.fontFamily = "monospace";
  debugEl.style.fontSize = "13px";
  debugEl.style.padding = "6px 12px";
  debugEl.style.borderRadius = "6px";
  debugEl.style.zIndex = "999";
  debugEl.style.pointerEvents = "none";
  debugEl.textContent = "AUDIO ZONE DEBUG: waiting...";
  document.body.appendChild(debugEl);
}

export default {
  init(scene_) {
    scene = scene_;
    buildDebug();
  },

  update(delta, context) {
    if (!scene) return;

    if (externallyPaused) {
      if (debugEl) debugEl.textContent = "AUDIO ZONE DEBUG: paused (modal open)";
      return;
    }

    const player = context.player;
    if (!player) {
      if (debugEl) debugEl.textContent = "AUDIO ZONE DEBUG: no player yet";
      return;
    }

    ZONES.forEach((zone, i) => {
      const state = zoneState[i];
      if (!state.mesh) {
        state.mesh = scene.getObjectByName(zone.meshName);
        if (!state.mesh) {
          if (debugEl) debugEl.textContent = `AUDIO ZONE DEBUG: mesh "${zone.meshName}" NOT FOUND`;
          return;
        }
      }

      const dx = player.position.x - state.mesh.position.x;
      const dz = player.position.z - state.mesh.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const inZone = dist <= zone.radius;

      const target = inZone ? 1 : 0;
      const step = delta / FADE_DURATION;
      if (state.fade < target) state.fade = Math.min(target, state.fade + step);
      else if (state.fade > target) state.fade = Math.max(target, state.fade - step);

      const ambientVol = zone.ambientVolume * (1 - state.fade);
      const stageVol = zone.stageVolume * state.fade;

      AmbientMusic.setVolume(ambientVol);
      StageScreenMedia.setVolume(stageVol);

      if (debugEl) {
        debugEl.textContent =
          `AUDIO ZONE DEBUG: dist=${dist.toFixed(1)} radius=${zone.radius} ` +
          `fade=${state.fade.toFixed(2)} radioVol=${ambientVol.toFixed(2)} stageVol=${stageVol.toFixed(2)}`;
      }
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
