import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import StageMusic from "./stageMusic.js";
import AmbientMusic from "./ambientMusic.js";
const STAGE_CENTER = new THREE.Vector3(0, 1.3, -74);
const TRIGGER_DISTANCE = 22;
const STAGE_LEFT = new THREE.Vector3(-19, 1.3, -74);
const STAGE_RIGHT = new THREE.Vector3(19, 1.3, -74);
// HERO's performance ends when the actual stage audio track ends.
// This keeps the entrance, performance, and exit on the same song timeline.
const ENTRY_DURATION = 3;
// A sharp, quick rockstar exit rather than a slow curtain call.
const EXIT_DURATION = 1.35;
let scene;
let hero = null;
let state = "IDLE";
let stateTime = 0;
let performanceTime = 0;
function distanceToStage(player) {
  const dx = player.position.x - STAGE_CENTER.x;
  const dz = player.position.z - STAGE_CENTER.z;
  return Math.sqrt(dx * dx + dz * dz);
}
function faceDirection(targetX, targetZ) {
  if (!hero) return;
  const dx = targetX - hero.position.x;
  const dz = targetZ - hero.position.z;
  if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
    hero.rotation.y = Math.atan2(dx, dz);
  }
}
function beginPerformance(context) {
  const npc = context.systems?.npc;
  if (!npc || !npc.getHero) return;
  hero = npc.getHero();
  if (!hero) return;
  npc.setPerformanceMode?.(true);
  // Pause the normal city radio while HERO performs.
  AmbientMusic.pause();
  // Request playback. The entrance waits until the browser confirms audio
  // is actually playing, so an iPad autoplay delay cannot desynchronize them.
  StageMusic.playFromStart();
  hero.position.copy(STAGE_LEFT);
  hero.visible = false;
  state = "WAITING_FOR_AUDIO";
  stateTime = 0;
  performanceTime = 0;
}
function updateEntering(delta) {
  stateTime += delta;
  const t = Math.min(1, stateTime / ENTRY_DURATION);
  // HERO walks from stage left toward center while the song continues.
  const x = THREE.MathUtils.lerp(STAGE_LEFT.x, -7, t);
  hero.position.x = x;
  hero.position.y = 1.3 + Math.sin(t * Math.PI) * 0.05;
  faceDirection(-7, -74);
  if (t >= 1) {
    state = "PERFORMING";
    stateTime = 0;
    performanceTime = 0;
  }
}
function updatePerformance(delta) {
  performanceTime += delta;
  const t = performanceTime;
  // HERO moves back and forth across the stage.
  const x = Math.sin(t * 0.65) * 9;
  hero.position.x = x;
  hero.position.y = 1.3 + Math.abs(Math.sin(t * 2.2)) * 0.08;
  // Face the direction HERO is moving.
  const direction = Math.cos(t * 0.65);
  if (Math.abs(direction) > 0.05) {
    hero.rotation.y = direction > 0
      ? Math.PI / 2
      : -Math.PI / 2;
  }
  // The real audio "ended" event controls the exit. No independent timer.
  if (StageMusic.hasEnded()) {
    state = "EXITING";
    stateTime = 0;
  }
}
function updateExiting(delta, context) {
  stateTime += delta;
  const t = Math.min(1, stateTime / EXIT_DURATION);
  // HERO exits toward stage right.
  const x = THREE.MathUtils.lerp(
    9,
    STAGE_RIGHT.x,
    t
  );
  hero.position.x = x;
  hero.position.y = 1.3 + Math.sin(t * Math.PI) * 0.05;
  faceDirection(STAGE_RIGHT.x, -74);
  if (t >= 1) {
    const npc = context.systems?.npc;
    // Stop HERO's stage music when the exit animation is finished.
    StageMusic.stop();
    // Restore the normal city radio.
    AmbientMusic.resume();
    state = "COMPLETE";
    stateTime = 0;
    // Leave HERO standing at stage right for the post-performance journey.
    npc?.setPerformanceMode?.(false);
  }
}
export default {
  init(scene_) {
    scene = scene_;
  },
  update(delta, context) {
    if (!scene) return;
    if (state === "IDLE") {
      const player = context.player;
      if (!player) return;
      if (distanceToStage(player) <= TRIGGER_DISTANCE) {
        beginPerformance(context);
      }
      return;
    }
    if (!hero) return;
    if (state === "WAITING_FOR_AUDIO") {
      if (!StageMusic.isPlaying()) return;
      // Reveal HERO and begin his entrance on the first confirmed playback frame.
      hero.visible = true;
      state = "ENTERING";
      stateTime = 0;
      return;
    }
    if (state === "ENTERING") {
      updateEntering(delta);
      return;
    }
    if (state === "PERFORMING") {
      updatePerformance(delta);
      return;
    }
    if (state === "EXITING") {
      updateExiting(delta, context);
      return;
    }
  },
  getState() {
    return state;
  },
  reset() {
    StageMusic.stop();
    // Make sure the normal radio is restored if the performance
    // is reset before reaching the normal completion state.
    AmbientMusic.resume();
    state = "IDLE";
    stateTime = 0;
    performanceTime = 0;
    hero = null;
  },
};
