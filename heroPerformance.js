import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import StageMusic from "./stageMusic.js";
import AmbientMusic from "./ambientMusic.js";

const STAGE_DECK_Y = 1.8;
const STAGE_CENTER = new THREE.Vector3(0, STAGE_DECK_Y, -74);
const TRIGGER_DISTANCE = 22;
const APPROACH_DISTANCE = 55;
const STAGE_LEFT = new THREE.Vector3(-20.5, STAGE_DECK_Y, -74);
const STAIR_TOP_X = 22.15;
const STAIR_BOTTOM_X = 29.55;
const STAIR_TOP_Y = 1.68;
const STAIR_BOTTOM_Y = 0.67;
const STAGE_Z = -74;
const ENTRY_DURATION = 3;
const EXIT_DURATION = 4.2;
const PROVISIONAL_BPM = 126;
const BEAT_SECONDS = 60 / PROVISIONAL_BPM;

let scene;
let hero = null;
let state = "IDLE";
let stateTime = 0;
let performanceTime = 0;
let exitStartX = 0;
let exitStartY = 1.3;
let exitStartZ = STAGE_Z;
let approachAmbientPaused = false;
let heroRig = null;

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

function collectHeroRig(root) {
  const rig = {};
  root.traverse(object => {
    if (["torso", "head", "armL", "armR", "forearmL", "forearmR", "thighL", "thighR", "heroBusinessBowtie"].includes(object.name)) {
      rig[object.name] = object;
    }
  });
  return rig;
}

function animateHeroToSong(songTime) {
  if (!hero || !heroRig) return;
  const beat = songTime / BEAT_SECONDS;
  const beatPhase = beat * Math.PI * 2;
  const barPhase = beat * Math.PI / 2;

  // Whole-body groove and head nod are locked to the actual audio playhead.
  if (heroRig.torso) {
    heroRig.torso.rotation.z = Math.sin(barPhase) * 0.075;
    heroRig.torso.rotation.x = Math.sin(beatPhase * 0.5) * 0.035;
  }
  if (heroRig.head) {
    heroRig.head.rotation.x = Math.sin(beatPhase + 0.5) * 0.045;
    heroRig.head.rotation.z = Math.sin(barPhase + 0.7) * 0.035;
  }
  if (heroRig.armL) {
    heroRig.armL.rotation.z = -0.18 + Math.sin(barPhase + 0.2) * 0.38;
    heroRig.armL.rotation.x = Math.sin(beatPhase + 0.3) * 0.13;
  }
  if (heroRig.armR) {
    heroRig.armR.rotation.z = 0.18 + Math.sin(barPhase + Math.PI) * 0.42;
    heroRig.armR.rotation.x = Math.sin(beatPhase + Math.PI) * 0.13;
  }
  if (heroRig.forearmL) heroRig.forearmL.rotation.x = Math.max(0, Math.sin(beatPhase)) * 0.28;
  if (heroRig.forearmR) heroRig.forearmR.rotation.x = Math.max(0, Math.sin(beatPhase + Math.PI)) * 0.28;
  if (heroRig.thighL) heroRig.thighL.rotation.z = Math.sin(beatPhase) * 0.09;
  if (heroRig.thighR) heroRig.thighR.rotation.z = Math.sin(beatPhase + Math.PI) * 0.09;
}

// The business bowtie is part of HERO's off-stage identity; the show look is reserved for active performance.
function setBusinessBowtieVisible(visible) {
  if (heroRig?.heroBusinessBowtie) heroRig.heroBusinessBowtie.visible = visible;
}

function resetHeroDance() {
  if (!heroRig) return;
  for (const name of ["torso", "head", "armL", "armR", "forearmL", "forearmR", "thighL", "thighR"]) {
    if (heroRig[name]) heroRig[name].rotation.set(0, 0, 0);
  }
}

function beginPerformance(context) {
  const npc = context.systems?.npc;
  if (!npc || !npc.getHero) return;
  hero = npc.getHero();
  if (!hero) return;

  heroRig = collectHeroRig(hero);
  setBusinessBowtieVisible(true);
  npc.setPerformanceMode?.(true);
  AmbientMusic.pause();
  approachAmbientPaused = false;
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
  hero.position.y = STAGE_DECK_Y + Math.sin(t * Math.PI) * 0.05;
  faceDirection(-7, STAGE_Z);

  if (t >= 1) {
    state = "PERFORMING";
    stateTime = 0;
    performanceTime = 0;
  }
}

function updatePerformance(delta) {
  const clock = StageMusic.getPlaybackClock();
  if (!clock.playing) return;

  const songTime = clock.currentTime;
  performanceTime = songTime;

  // Stage travel and body choreography use the same playhead as lighting.
  const groove = songTime * (Math.PI * 2 / 8.0);
  hero.position.x = Math.sin(groove) * 12;
  hero.position.y = STAGE_DECK_Y + Math.abs(Math.sin(songTime * Math.PI / BEAT_SECONDS)) * 0.11;
  const direction = Math.cos(groove);
  if (Math.abs(direction) > 0.05) {
    hero.rotation.y = direction > 0 ? Math.PI / 2 : -Math.PI / 2;
  }
  animateHeroToSong(songTime);

  if (StageMusic.hasEnded()) {
    resetHeroDance();
    setBusinessBowtieVisible(true);
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

  if (t >= approachEnd) hero.position.y += Math.abs(Math.sin(stateTime * 11)) * 0.012;
  faceDirection(STAIR_BOTTOM_X, STAGE_Z);

  if (t >= 1) {
    const npc = context.systems?.npc;
    hero.position.set(STAIR_BOTTOM_X, STAIR_BOTTOM_Y, STAGE_Z);
    StageMusic.stop();
    AmbientMusic.resume();
    approachAmbientPaused = false;
    state = "COMPLETE";
    stateTime = 0;
    npc?.setPerformanceMode?.(false);
    heroRig = null;
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

      const distance = distanceToStage(player);
      StageMusic.updateApproach(distance);

      if (distance <= APPROACH_DISTANCE && distance > TRIGGER_DISTANCE) {
        if (!approachAmbientPaused) {
          AmbientMusic.pause();
          approachAmbientPaused = true;
        }
      } else if (distance > APPROACH_DISTANCE && approachAmbientPaused) {
        AmbientMusic.resume();
        approachAmbientPaused = false;
      }

      if (distance <= TRIGGER_DISTANCE) beginPerformance(context);
      return;
    }

    if (!hero) return;

    if (state === "WAITING_FOR_AUDIO") {
      if (!StageMusic.isPlaying()) return;
      setBusinessBowtieVisible(false);
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
    if (state === "EXITING") updateExiting(delta, context);
  },

  getState() {
    return state;
  },

  reset() {
    StageMusic.stop();
    AmbientMusic.resume();
    approachAmbientPaused = false;
    resetHeroDance();
    setBusinessBowtieVisible(true);
    state = "IDLE";
    stateTime = 0;
    performanceTime = 0;
    exitStartX = 0;
    exitStartY = 1.3;
    exitStartZ = STAGE_Z;
    hero = null;
    heroRig = null;
  }
};
