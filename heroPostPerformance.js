// LAMBO CITY — HERO post-performance journey and personal HQ invitation.
// Uses the existing HERO NPC and the existing performance completion state.
// Does not move the player, change the camera, or alter the Studio engine.

import HeroInvitation from "./heroInvitation.js";

const STAGE_RIGHT = { x: 19, y: 1.3, z: -74 };
const HQ_DESTINATION = { x: 28, y: 1.3, z: 30 };
const HERO_SPEED = 4.5;
const ARRIVAL_DISTANCE = 2.5;
const INVITATION_TRIGGER_DISTANCE = 55;
const CONVERSATION_DISTANCE = 4.2;
const HERO_PLAYER_STANDOFF = 3.4;

let hero = null;
let active = false;
let arrived = false;
let approachingPlayer = false;
let conversationOpen = false;
let conversationResolved = false;
let invitationDelivered = false;
let time = 0;

function distanceXZ(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

function faceTarget(target) {
  if (!hero) return;
  const dx = target.x - hero.position.x;
  const dz = target.z - hero.position.z;
  if (Math.abs(dx) < 0.001 && Math.abs(dz) < 0.001) return;
  hero.rotation.y = Math.atan2(dx, dz);
}

function moveToward(target, delta, stopDistance = ARRIVAL_DISTANCE) {
  if (!hero) return false;
  const dx = target.x - hero.position.x;
  const dz = target.z - hero.position.z;
  const distance = Math.sqrt(dx * dx + dz * dz);
  if (distance <= stopDistance) {
    hero.position.x = target.x;
    hero.position.z = target.z;
    hero.position.y = target.y ?? 1.3;
    faceTarget(target);
    return true;
  }
  const step = Math.min(HERO_SPEED * delta, distance);
  hero.position.x += (dx / distance) * step;
  hero.position.z += (dz / distance) * step;
  hero.position.y = 1.3 + Math.abs(Math.sin(time * 8)) * 0.035;
  faceTarget(target);
  return false;
}

function openInvitationDialogue() {
  if (conversationOpen || !hero) return;
  conversationOpen = true;

  if (!invitationDelivered) {
    HeroInvitation.deliver();
    invitationDelivered = true;
  }

  const existing = document.getElementById("lc-hero-personal-invitation");
  existing?.remove();

  const overlay = document.createElement("div");
  overlay.id = "lc-hero-personal-invitation";
  overlay.style.cssText = "position:fixed;inset:0;z-index:11800;display:flex;align-items:flex-end;justify-content:center;padding:24px 18px 34px;background:linear-gradient(0deg,rgba(0,0,0,.72),rgba(0,0,0,0));font-family:Arial,sans-serif;pointer-events:none;";

  const card = document.createElement("section");
  card.style.cssText = "width:min(520px,100%);padding:20px 22px;border:1px solid rgba(255,215,0,.55);border-radius:17px;background:linear-gradient(145deg,rgba(15,12,20,.98),rgba(5,5,8,.98));box-shadow:0 12px 42px rgba(0,0,0,.55);color:#fff;pointer-events:auto;";

  const label = document.createElement("div");
  label.textContent = "HERO · LAMBO CITY RECORDS";
  label.style.cssText = "color:#ffd700;font-size:10px;letter-spacing:2.5px;font-weight:700;margin-bottom:10px;";

  const message = document.createElement("p");
  message.textContent = "What's up. I saw you out there. Welcome to LAMBO CITY. I want you to come see what we're building at LAMBO CITY Records. Come through — I've got something special to show you. — HERO";
  message.style.cssText = "font-size:14px;line-height:1.7;color:#f1f1f1;margin:0 0 16px;";

  const status = document.createElement("div");
  status.textContent = "A personal invitation has been sent to your Citizen Phone. STUDIO ACCESS UNLOCKED.";
  status.style.cssText = "font-size:10px;line-height:1.5;letter-spacing:.7px;color:#f1d987;margin-bottom:14px;";

  const actions = document.createElement("div");
  actions.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;";

  const coming = document.createElement("button");
  coming.type = "button";
  coming.textContent = "I'M COMING";
  coming.style.cssText = "flex:1;min-width:130px;padding:11px 14px;border:0;border-radius:10px;background:linear-gradient(90deg,#b68a20,#f5d46a);color:#15110a;font-weight:700;cursor:pointer;";

  const later = document.createElement("button");
  later.type = "button";
  later.textContent = "I'LL CATCH UP";
  later.style.cssText = "flex:1;min-width:130px;padding:11px 14px;border:1px solid rgba(255,255,255,.2);border-radius:10px;background:rgba(255,255,255,.07);color:#fff;font-weight:700;cursor:pointer;";

  const close = () => {
    overlay.remove();
    conversationOpen = false;
    conversationResolved = true;
  };
  coming.addEventListener("click", () => {
    HeroInvitation.accept();
    close();
  });
  later.addEventListener("click", close);

  actions.append(coming, later);
  card.append(label, message, status, actions);
  overlay.append(card);
  document.body.append(overlay);
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
    if (!performance || performance.getState?.() !== "COMPLETE") return;

    const player = context.player;
    if (!player?.position) return;

    time += delta;

    if (!active && !arrived) {
      hero.position.y = 1.3;
      active = true;
      hero.position.x = STAGE_RIGHT.x;
      hero.position.z = STAGE_RIGHT.z;
    }

    if (active) {
      if (moveToward(HQ_DESTINATION, delta)) {
        active = false;
        arrived = true;
      }
      return;
    }

    if (!arrived || conversationOpen || conversationResolved) return;

    const playerPosition = {
      x: player.position.x,
      y: player.position.y,
      z: player.position.z
    };
    const heroPosition = hero.position;

    if (!approachingPlayer) {
      if (distanceXZ(heroPosition, playerPosition) <= INVITATION_TRIGGER_DISTANCE) {
        approachingPlayer = true;
      } else {
        faceTarget(HQ_DESTINATION);
        return;
      }
    }

    const dx = playerPosition.x - heroPosition.x;
    const dz = playerPosition.z - heroPosition.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance <= CONVERSATION_DISTANCE) {
      faceTarget(playerPosition);
      openInvitationDialogue();
      return;
    }

    const target = {
      x: playerPosition.x - (dx / distance) * HERO_PLAYER_STANDOFF,
      y: 1.3,
      z: playerPosition.z - (dz / distance) * HERO_PLAYER_STANDOFF
    };
    moveToward(target, delta, 0.5);
  },

  reset() {
    document.getElementById("lc-hero-personal-invitation")?.remove();
    hero = null;
    active = false;
    arrived = false;
    approachingPlayer = false;
    conversationOpen = false;
    conversationResolved = false;
    invitationDelivered = false;
    time = 0;
  }
};
