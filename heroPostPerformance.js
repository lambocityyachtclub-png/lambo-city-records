// heroPostPerformance.js
// LAMBO CITY — HERO celebrity entrance and post-performance encounter.
// Uses the existing HERO model and performance state. No second HERO is created.
// The player remains in control; this module never moves the player or camera.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const HERO_SPEED = 4.5;
const ARRIVAL_DISTANCE = 2.8;
const PLAYER_APPROACH_DISTANCE = 3.0;

let hero = null;
let scene = null;
let entourage = [];
let active = false;
let arrived = false;
let encounterShown = false;
let time = 0;
let target = null;
let playerFocus = null;

function facePoint(point) {
  if (!hero) return;
  const dx = point.x - hero.position.x;
  const dz = point.z - hero.position.z;
  if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
    hero.rotation.y = Math.atan2(dx, dz);
  }
}

function makePerson({ security = false, paparazzi = false } = {}) {
  const person = new THREE.Group();
  const suit = new THREE.MeshStandardMaterial({
    color: security ? 0x101114 : 0x171717,
    roughness: 0.82
  });
  const skin = new THREE.MeshStandardMaterial({ color: 0x80563f, roughness: 0.9 });
  const shirt = new THREE.MeshStandardMaterial({
    color: security ? 0x20242a : 0x30343a,
    roughness: 0.8
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.58, 1.05, 0.32), suit);
  body.position.y = 1.05;
  body.castShadow = true;
  person.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), skin);
  head.position.y = 1.72;
  head.castShadow = true;
  person.add(head);

  const shirtFront = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.68, 0.025), shirt);
  shirtFront.position.set(0, 1.12, 0.17);
  person.add(shirtFront);

  if (paparazzi) {
    const cameraBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.2, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x090a0c, metalness: 0.55, roughness: 0.35 })
    );
    cameraBody.position.set(0.22, 1.42, 0.24);
    person.add(cameraBody);
    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.12, 10),
      new THREE.MeshStandardMaterial({ color: 0x050505, metalness: 0.7, roughness: 0.2 })
    );
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0.22, 1.42, 0.34);
    person.add(lens);
    const flash = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.07, 0.035),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    flash.name = "camera_flash";
    flash.position.set(0.22, 1.57, 0.24);
    flash.visible = false;
    person.add(flash);
    person.userData.flash = flash;
  }

  person.userData.paparazzi = paparazzi;
  person.userData.security = security;
  return person;
}

function buildEntourage() {
  if (!scene || entourage.length) return;
  // Two security members lead and flank HERO; paparazzi trail behind.
  const formation = [
    { type: "security", offset: [-1.45, -0.7] },
    { type: "security", offset: [1.45, -0.7] },
    { type: "paparazzi", offset: [-2.15, -2.0] },
    { type: "paparazzi", offset: [2.15, -2.0] },
    { type: "paparazzi", offset: [0, -2.8] }
  ];
  formation.forEach(item => {
    const person = makePerson({
      security: item.type === "security",
      paparazzi: item.type === "paparazzi"
    });
    person.userData.offset = item.offset;
    person.position.y = 1.3;
    scene.add(person);
    entourage.push(person);
  });
}

function updateEntourage(delta) {
  if (!hero || !entourage.length) return;
  time += delta;
  const c = Math.cos(hero.rotation.y);
  const s = Math.sin(hero.rotation.y);
  entourage.forEach((person, index) => {
    const [ox, oz] = person.userData.offset;
    const x = ox * c + oz * s;
    const z = -ox * s + oz * c;
    const desiredX = hero.position.x + x;
    const desiredZ = hero.position.z + z;
    const follow = Math.min(1, delta * 5);
    person.position.x += (desiredX - person.position.x) * follow;
    person.position.z += (desiredZ - person.position.z) * follow;
    person.position.y = 1.3 + Math.abs(Math.sin(time * 7 + index)) * 0.025;
    person.rotation.y = hero.rotation.y;
    const flash = person.userData.flash;
    if (flash) {
      const pulse = Math.sin(time * (5.2 + index * 0.35) + index * 2.1);
      flash.visible = pulse > 0.965;
    }
  });
}

function showEncounter() {
  if (encounterShown || typeof document === "undefined") return;
  encounterShown = true;

  const panel = document.createElement("section");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "HERO rooftop party invitation");
  panel.style.cssText = [
    "position:fixed",
    "left:50%",
    "bottom:clamp(24px,9vh,100px)",
    "transform:translateX(-50%)",
    "width:min(520px,calc(100vw - 32px))",
    "box-sizing:border-box",
    "padding:22px 24px",
    "border:1px solid rgba(212,168,42,.72)",
    "border-radius:16px",
    "background:linear-gradient(145deg,rgba(8,10,14,.97),rgba(22,18,12,.97))",
    "color:#f6f2e9",
    "font-family:Arial,sans-serif",
    "text-align:center",
    "z-index:1200",
    "box-shadow:0 18px 60px rgba(0,0,0,.55)"
  ].join(";");

  const label = document.createElement("div");
  label.textContent = "H E R O";
  label.style.cssText = "color:#d4a82a;font-size:11px;letter-spacing:5px;font-weight:800;margin-bottom:10px";
  const message = document.createElement("p");
  message.textContent = "I saw what you did up there. That's how you make people remember you. I'm having a rooftop get-together later. I want you there — but you need a special code to get in.";
  message.style.cssText = "font-size:15px;line-height:1.65;margin:0 0 16px";
  const note = document.createElement("p");
  note.textContent = "HERO can send your private entry code by text when invitations are connected.";
  note.style.cssText = "color:#b9b6ae;font-size:11px;line-height:1.5;margin:0 0 15px";
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "I HEAR YOU";
  close.style.cssText = "border:0;border-radius:22px;padding:11px 28px;background:linear-gradient(90deg,#a77b17,#e3c15b);color:#101010;font-weight:800;letter-spacing:1.5px;cursor:pointer";
  close.addEventListener("click", () => panel.remove());
  panel.append(label, message, note, close);
  document.body.appendChild(panel);
}

function begin(player) {
  if (!hero || !player?.position) return;
  active = true;
  arrived = false;
  time = 0;
  buildEntourage();

  // Lock a point three metres in front of the player so HERO approaches
  // the performer without walking through them or chasing them indefinitely.
  const dx = player.position.x - hero.position.x;
  const dz = player.position.z - hero.position.z;
  const length = Math.max(0.001, Math.hypot(dx, dz));
  playerFocus = new THREE.Vector3(player.position.x, 1.3, player.position.z);
  target = new THREE.Vector3(
    player.position.x - (dx / length) * PLAYER_APPROACH_DISTANCE,
    1.3,
    player.position.z - (dz / length) * PLAYER_APPROACH_DISTANCE
  );

  entourage.forEach((person, index) => {
    person.position.set(
      hero.position.x + (index % 2 ? 1.8 : -1.8),
      1.3,
      hero.position.z - 1.5 - index * 0.25
    );
  });
}

function updateWalking(delta) {
  if (!hero || !target) return;
  const dx = target.x - hero.position.x;
  const dz = target.z - hero.position.z;
  const distance = Math.hypot(dx, dz);

  if (distance <= ARRIVAL_DISTANCE) {
    hero.position.x = target.x;
    hero.position.z = target.z;
    hero.position.y = 1.3;
    if (playerFocus) facePoint(playerFocus);
    active = false;
    arrived = true;
    showEncounter();
    return;
  }

  const step = Math.min(HERO_SPEED * delta, distance);
  hero.position.x += (dx / distance) * step;
  hero.position.z += (dz / distance) * step;
  hero.position.y = 1.3 + Math.abs(Math.sin(time * 8)) * 0.035;
  facePoint(target);
}

export default {
  init(scene_) {
    scene = scene_;
    buildEntourage();
  },

  update(delta, context) {
    const npc = context.systems?.npc;
    if (!npc) return;
    if (!hero) hero = npc.getHero?.();
    if (!hero) return;

    const performance = context.systems?.heroPerformance;
    const state = performance?.getState?.();

    // The entrance happens only after the live performance completes.
    if (!active && !arrived && state === "COMPLETE") {
      begin(context.player);
    }

    if (active) updateWalking(delta);
    if (active || arrived) updateEntourage(delta);
  },

  reset() {
    active = false;
    arrived = false;
    encounterShown = false;
    time = 0;
    target = null;
    playerFocus = null;
    hero = null;
    entourage.forEach(person => scene?.remove(person));
    entourage = [];
    if (typeof document !== "undefined") {
      document.querySelector('[aria-label="HERO rooftop party invitation"]')?.remove();
    }
  }
};
