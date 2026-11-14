import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import StageMusic from "./stageMusic.js";
import AmbientMusic from "./ambientMusic.js";

const STAGE_SURFACE_Y = 1.8;
const GROUND_Y = 1.3;
const STAGE_CENTER = new THREE.Vector3(0, STAGE_SURFACE_Y, -74);
const TRIGGER_DISTANCE = 22;
const STAGE_LEFT = new THREE.Vector3(-19, STAGE_SURFACE_Y, -74);
const RIGHT_STAIR_ENTRY_X = 16.5;
const RIGHT_STAIR_EXIT_X = 21.5;

// HERO's performance ends only when the real audio track ends.
const ENTRY_DURATION = 3;
const STAIR_APPROACH_SPEED = 12;
const STAIR_DESCENT_DURATION = 1.05;

let scene;
let hero = null;
let state = "IDLE";
let stateTime = 0;
let performanceTime = 0;
let exitStartX = 0;
let exitPhase = "APPROACH";

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
  hero.position.y = STAGE_SURFACE_Y + Math.sin(t * Math.PI) * 0.05;
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
  const x = Math.sin(t * 0.65) * 9;

  hero.position.x = x;
  hero.position.y = STAGE_SURFACE_Y + Math.abs(Math.sin(t * 2.2)) * 0.08;

  const direction = Math.cos(t * 0.65);
  if (Math.abs(direction) > 0.05) {
    hero.rotation.y = direction > 0 ? Math.PI / 2 : -Math.PI / 2;
  }

  if (StageMusic.hasEnded()) {
    state = "EXITING";
    stateTime = 0;
    exitPhase = "APPROACH";
    exitStartX = hero.position.x;
  }
}

function updateExiting(delta, context) {
  stateTime += delta;

  if (exitPhase === "APPROACH") {
    const distance = Math.abs(RIGHT_STAIR_ENTRY_X - exitStartX);
    const duration = Math.max(0.35, distance / STAIR_APPROACH_SPEED);
    const t = Math.min(1, stateTime / duration);

    hero.position.x = THREE.MathUtils.lerp(exitStartX, RIGHT_STAIR_ENTRY_X, t);
    hero.position.y = STAGE_SURFACE_Y;
    hero.position.z = -74;
    faceDirection(RIGHT_STAIR_ENTRY_X + 1, -74);

    if (t >= 1) {
      exitPhase = "DESCEND";
      stateTime = 0;
    }
    return;
  }

  const t = Math.min(1, stateTime / STAIR_DESCENT_DURATION);
  hero.position.x = THREE.MathUtils.lerp(
    RIGHT_STAIR_ENTRY_X,
    RIGHT_STAIR_EXIT_X,
    t
  );
  hero.position.y = THREE.MathUtils.lerp(STAGE_SURFACE_Y, GROUND_Y, t);
  hero.position.z = -74;
  faceDirection(RIGHT_STAIR_EXIT_X + 1, -74);

  if (t >= 1) {
    const npc = context.systems?.npc;
    hero.position.set(RIGHT_STAIR_EXIT_X, GROUND_Y, -74);
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
    exitPhase = "APPROACH";
    hero = null;
  }
};
