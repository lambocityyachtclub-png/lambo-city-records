import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import StageMusic from "./stageMusic.js";
import AmbientMusic from "./ambientMusic.js";

const STAGE_CENTER = new THREE.Vector3(0, 1.3, -74);
const TRIGGER_DISTANCE = 22;
const STAGE_LEFT = new THREE.Vector3(-20.5, 1.3, -74);
const STAIR_TOP_X = 22.15;
const STAIR_BOTTOM_X = 29.55;
const STAIR_TOP_Y = 1.68;
const STAIR_BOTTOM_Y = 0.67;
const STAGE_Z = -74;
const ENTRY_DURATION = 3;
const EXIT_DURATION = 4.2;

let scene;
let hero = null;
let state = "IDLE";
let stateTime = 0;
let performanceTime = 0;
let exitStartX = 0;
let exitStartY = 1.3;
let exitStartZ = STAGE_Z;

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
  AmbientMusic.pause();
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
  const x = THREE.MathUtils.lerp(STAGE_LEFT.x, -7, t);
  hero.position.x = x;
  hero.position.y = 1.3 + Math.sin(t * Math.PI) * 0.05;
  faceDirection(-7, STAGE_Z);

  if (t >= 1) {
    state = "PERFORMING";
    stateTime = 0;
    performanceTime = 0;
  }
}

function updatePerformance(delta) {
  performanceTime += delta;
  const t = performanceTime;
  const x = Math.sin(t * 0.65) * 12;
  hero.position.x = x;
  hero.position.y = 1.3 + Math.abs(Math.sin(t * 2.2)) * 0.08;

  const direction = Math.cos(t * 0.65);
  if (Math.abs(direction) > 0.05) {
    hero.rotation.y = direction > 0 ? Math.PI / 2 : -Math.PI / 2;
  }

  // The actual audio element's ended event—not a guessed duration—
  // starts HERO's walk to the right-hand staircase.
  if (StageMusic.hasEnded()) {
    exitStartX = hero.position.x;
    exitStartY = hero.position.y;
    exitStartZ = hero.position.z;
    state = "EXITING";
    stateTime = 0;
  }
}

function updateExiting(delta, context) {
  stateTime += delta;
  const t = Math.min(1, stateTime / EXIT_DURATION);
  const approachEnd = 0.34;

  if (t < approachEnd) {
    const approachT = t / approachEnd;
    const eased = approachT * approachT * (3 - 2 * approachT);
    hero.position.x = THREE.MathUtils.lerp(exitStartX, STAIR_TOP_X, eased);
    hero.position.y = THREE.MathUtils.lerp(exitStartY, STAIR_TOP_Y, eased);
    hero.position.z = THREE.MathUtils.lerp(exitStartZ, STAGE_Z, eased);
  } else {
    const stairT = (t - approachEnd) / (1 - approachEnd);
    const eased = stairT * stairT * (3 - 2 * stairT);
    hero.position.x = THREE.MathUtils.lerp(STAIR_TOP_X, STAIR_BOTTOM_X, eased);
    hero.position.y = STAIR_TOP_Y + (STAIR_BOTTOM_Y - STAIR_TOP_Y) * eased;
    hero.position.z = STAGE_Z;
  }

  // Keep HERO aligned with the actual stair elevation as he descends.
  // A very small footfall bounce adds life without lifting him off the treads.
  if (t >= approachEnd) {
    hero.position.y += Math.abs(Math.sin(stateTime * 11)) * 0.012;
  }
  faceDirection(STAIR_BOTTOM_X, STAGE_Z);

  if (t >= 1) {
    const npc = context.systems?.npc;
    hero.position.set(STAIR_BOTTOM_X, STAIR_BOTTOM_Y, STAGE_Z);
    StageMusic.stop();
    AmbientMusic.resume();
    state = "COMPLETE";
    stateTime = 0;
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
    }
  },

  getState() {
    return state;
  },

  reset() {
    StageMusic.stop();
    AmbientMusic.resume();
    state = "IDLE";
    stateTime = 0;
    performanceTime = 0;
    exitStartX = 0;
    exitStartY = 1.3;
    exitStartZ = STAGE_Z;
    hero = null;
  }
};
