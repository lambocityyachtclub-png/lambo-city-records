// heroPostPerformance.js
// LAMBO CITY — HERO'S STAGE-TO-HEADQUARTERS JOURNEY
// Uses the existing HERO NPC and leaves player movement, camera,
// collision, elevator, and Records HQ architecture untouched.

import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";
import HeroInvitation from "./heroInvitation.js";

const STAGE_RIGHT = new THREE.Vector3(19, 1.3, -74);
const ENCOUNTER_WAYPOINT = new THREE.Vector3(5, 1.3, -62);
const HQ_DESTINATION = new THREE.Vector3(28, 1.3, 30);

const HERO_SPEED = 4.5;
const ARRIVAL_DISTANCE = 2.5;
const PLAYER_ENCOUNTER_DISTANCE = 34;
const ENCOUNTER_TIMEOUT = 35;

let hero = null;
let active = false;
let arrived = false;
let phase = "IDLE";
let time = 0;
let encounterElapsed = 0;
let encounterShown = false;
let encounterPanel = null;

function distanceXZ(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

function faceTarget(target) {
  if (!hero) return;
  const dx = target.x - hero.position.x;
  const dz = target.z - hero.position.z;
  if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
    hero.rotation.y = Math.atan2(dx, dz);
  }
}

function closeEncounter() {
  if (encounterPanel) {
    encounterPanel.remove();
    encounterPanel = null;
  }
  encounterShown = true;
  phase = "WALKING";
}

function showEncounter() {
  if (encounterPanel || !hero) return;

  const panel = document.createElement("div");
  panel.id = "hero-hq-encounter";
  panel.style.cssText = "position:fixed;left:50%;bottom:118px;transform:translateX(-50%);width:min(440px,calc(100vw - 32px));box-sizing:border-box;padding:20px 22px;background:rgba(5,5,12,.96);border:1px solid rgba(255,215,0,.65);border-radius:14px;color:#fff;font-family:Arial,sans-serif;text-align:center;z-index:650;box-shadow:0 0 34px rgba(255,215,0,.18);pointer-events:auto";
  panel.innerHTML = `
    <div style="color:#ffd700;font-size:10px;letter-spacing:3px;margin-bottom:8px">HERO</div>
    <div style="font-size:15px;line-height:1.65;margin-bottom:15px">Good to see you. I'm heading to LAMBO CITY Records headquarters. Come with me — I've got something I want to show you.</div>
    <button type="button" id="hero-hq-come" style="background:linear-gradient(90deg,#9900ff,#c18a16);border:0;border-radius:22px;color:#fff;padding:10px 20px;font-weight:bold;letter-spacing:1px;cursor:pointer;margin:4px">I'M COMING</button>
    <button type="button" id="hero-hq-later" style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);border-radius:22px;color:#ddd;padding:10px 18px;cursor:pointer;margin:4px">I'LL CATCH UP</button>
    <div style="color:#999;font-size:10px;margin-top:10px">HERO's invitation will also be saved in your in-game phone</div>
  `;
  document.body.appendChild(panel);
  panel.querySelector("#hero-hq-come")?.addEventListener("click", closeEncounter);
  panel.querySelector("#hero-hq-later")?.addEventListener("click", closeEncounter);
  encounterPanel = panel;
}

function begin() {
  if (!hero) return;
  active = true;
  arrived = false;
  phase = "WALKING";
  time = 0;
  encounterElapsed = 0;
  encounterShown = false;
  // Deliver in-game even if the player skips the conversation or never
  // shares a personal phone number.
  HeroInvitation.deliver();
}

function updateWalking(delta, context) {
  if (!hero) return;
  time += delta;

  if (phase === "ENCOUNTER_WAIT") {
    encounterElapsed += delta;
    const player = context.player;
    if (
      !encounterShown &&
      player &&
      distanceXZ(player.position, hero.position) <= PLAYER_ENCOUNTER_DISTANCE
    ) {
      faceTarget(player.position);
      showEncounter();
    }
    if (encounterElapsed >= ENCOUNTER_TIMEOUT) closeEncounter();
    return;
  }

  const target = encounterShown ? HQ_DESTINATION : ENCOUNTER_WAYPOINT;
  const dx = target.x - hero.position.x;
  const dz = target.z - hero.position.z;
  const distance = Math.sqrt(dx * dx + dz * dz);

  if (distance <= ARRIVAL_DISTANCE) {
    hero.position.x = target.x;
    hero.position.z = target.z;
    hero.position.y = target.y;

    if (target === ENCOUNTER_WAYPOINT) {
      phase = "ENCOUNTER_WAIT";
      encounterElapsed = 0;
      const player = context.player;
      if (player && distanceXZ(player.position, hero.position) <= PLAYER_ENCOUNTER_DISTANCE) {
        faceTarget(player.position);
        showEncounter();
      }
      return;
    }

    faceTarget(HQ_DESTINATION);
    active = false;
    arrived = true;
    phase = "ARRIVED";
    return;
  }

  const step = Math.min(HERO_SPEED * delta, distance);
  hero.position.x += (dx / distance) * step;
  hero.position.z += (dz / distance) * step;
  hero.position.y = 1.3 + Math.abs(Math.sin(time * 8)) * 0.035;
  faceTarget(target);
}

export default {
  init(scene) {
    this.scene = scene;
  },

  update(delta, context) {
    const npc = context.systems?.npc;
    if (!npc) return;

    if (!hero) hero = npc.getHero?.();
    if (!hero) return;

    const performance = context.systems?.heroPerformance;
    if (!performance) return;

    const state = performance.getState?.();
    if (!active && !arrived && state === "COMPLETE") {
      hero.position.y = 1.3;
      hero.position.x = STAGE_RIGHT.x;
      hero.position.z = STAGE_RIGHT.z;
      begin();
    }

    if (active) updateWalking(delta, context);
  },

  reset() {
    if (encounterPanel) encounterPanel.remove();
    encounterPanel = null;
    active = false;
    arrived = false;
    phase = "IDLE";
    time = 0;
    encounterElapsed = 0;
    encounterShown = false;
    hero = null;
  }
};
