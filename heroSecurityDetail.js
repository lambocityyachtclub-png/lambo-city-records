// heroSecurityDetail.js
// LAMBO CITY — HERO'S TWO-PERSON SECURITY DETAIL
// Keeps two recognizable guards with HERO in the world, then coordinates
// their stage positions with the existing performance and exit state machine.
// This is additive: HERO, stage geometry, performance audio, and route are untouched.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const GROUND_Y = 1.3;
const STAGE_Y = 1.8;
const LEFT_STAGE_POST = new THREE.Vector3(-18.8, STAGE_Y, -78.2);
const RIGHT_STAIR_POST = new THREE.Vector3(31.4, 0.67, -75.1);
const GUARD_SPEED = 3.4;
const EXIT_FOLLOW_SPEED = 6.8;

let guards = [];
let scene = null;
let lastPerformanceState = "IDLE";
let rightGuardReleased = false;

function makeGuard(name, accentColor) {
  const root = new THREE.Group();
  root.name = name;
  root.userData.lamboCityRole = "HERO security";
  const suit = new THREE.MeshStandardMaterial({ color: 0x101216, roughness: 0.72 });
  const shirt = new THREE.MeshStandardMaterial({ color: 0xd8dce0, roughness: 0.8 });
  const skin = new THREE.MeshStandardMaterial({ color: 0x80583f, roughness: 0.9 });
  const shoes = new THREE.MeshStandardMaterial({ color: 0x070809, roughness: 0.48 });
  const accent = new THREE.MeshStandardMaterial({ color: accentColor, metalness: 0.55, roughness: 0.34 });
  const glasses = new THREE.MeshStandardMaterial({ color: 0x050607, metalness: 0.2, roughness: 0.18 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.76, 1.05, 0.42), suit);
  torso.position.y = 1.48;
  root.add(torso);

  const shirtFront = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.82, 0.035), shirt);
  shirtFront.position.set(0, 1.48, 0.225);
  root.add(shirtFront);

  const tie = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.52, 0.045), accent);
  tie.position.set(0, 1.42, 0.25);
  root.add(tie);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.29, 12, 10), skin);
  head.position.y = 2.22;
  root.add(head);

  const shades = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.105, 0.055), glasses);
  shades.position.set(0, 2.27, 0.255);
  root.add(shades);

  const earpiece = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), accent);
  earpiece.position.set(-0.29, 2.2, 0.02);
  root.add(earpiece);

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.48, 1.86, 0);
  const leftSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.82, 0.24), suit);
  leftSleeve.position.y = -0.39;
  leftArm.add(leftSleeve);
  root.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.48, 1.86, 0);
  const rightSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.82, 0.24), suit);
  rightSleeve.position.y = -0.39;
  rightArm.add(rightSleeve);
  root.add(rightArm);

  const legs = [];
  for (const x of [-0.2, 0.2]) {
    const legPivot = new THREE.Group();
    legPivot.position.set(x, 0.98, 0);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.92, 0.28), suit);
    leg.position.y = -0.43;
    legPivot.add(leg);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.42), shoes);
    shoe.position.set(0, -0.88, 0.07);
    legPivot.add(shoe);
    root.add(legPivot);
    legs.push(legPivot);
  }

  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.035), accent);
  badge.position.set(-0.22, 1.73, 0.24);
  root.add(badge);

  root.position.set(2.5, GROUND_Y, 8);
  scene.add(root);
  return {
    root, leftArm, rightArm, legs, phase: guards.length * 1.7,
    homeOffset: guards.length === 0 ? { back: 2.0, side: -1.15 } : { back: 3.7, side: 1.25 },
    mode: "FOLLOWING"
  };
}

function moveToward(guard, target, delta, speed, context = null) {
  const root = guard.root;
  const dx = target.x - root.position.x;
  const dz = target.z - root.position.z;
  const distance = Math.hypot(dx, dz);
  if (distance > 0.035) {
    const step = Math.min(distance, speed * delta);
    const nextX = root.position.x + (dx / distance) * step;
    const nextZ = root.position.z + (dz / distance) * step;
    // When following HERO around the wider world, guards respect the same
    // safe-surface and obstacle checks instead of cutting across water.
    if (context?.systems?.collision?.isBlocked?.(nextX, nextZ, 0.42, root.position.y)) return;
    root.position.x = nextX;
    root.position.z = nextZ;
    root.rotation.y = THREE.MathUtils.damp(root.rotation.y, Math.atan2(dx, dz), 7, delta);
    const gait = performance.now() * 0.009 + guard.phase;
    const stride = Math.sin(gait) * Math.min(0.48, step * 2.6);
    guard.legs[0].rotation.x = stride;
    guard.legs[1].rotation.x = -stride;
    guard.leftArm.rotation.x = -stride * 0.55;
    guard.rightArm.rotation.x = stride * 0.55;
  } else {
    guard.legs[0].rotation.x *= 0.72;
    guard.legs[1].rotation.x *= 0.72;
    guard.leftArm.rotation.x *= 0.72;
    guard.rightArm.rotation.x *= 0.72;
  }
  root.position.y = target.y;
}

function followTarget(hero, guard) {
  const yaw = hero.rotation.y || 0;
  const forwardX = Math.sin(yaw);
  const forwardZ = Math.cos(yaw);
  const rightX = Math.cos(yaw);
  const rightZ = -Math.sin(yaw);
  return {
    x: hero.position.x - forwardX * guard.homeOffset.back + rightX * guard.homeOffset.side,
    y: hero.position.y,
    z: hero.position.z - forwardZ * guard.homeOffset.back + rightZ * guard.homeOffset.side
  };
}

function faceStage(guard, x, z) {
  guard.root.rotation.y = Math.atan2(x - guard.root.position.x, z - guard.root.position.z);
}

export default {
  init(scene_) {
    scene = scene_;
    guards = [];
    lastPerformanceState = "IDLE";
    rightGuardReleased = false;
    guards.push(makeGuard("heroSecurityGuardLeft", 0xc49b43));
    guards.push(makeGuard("heroSecurityGuardRight", 0x9ca6b1));
  },

  update(delta, context) {
    if (!scene || guards.length !== 2) return;
    const hero = context?.systems?.npc?.getHero?.();
    if (!hero) return;

    const state = context?.systems?.heroPerformance?.getState?.() || "IDLE";
    const left = guards[0];
    const right = guards[1];

    if (state === "ENTERING" || state === "PERFORMING") {
      left.mode = "STAGE_POST";
      right.mode = "STAIR_POST";
      rightGuardReleased = false;
      left.root.position.copy(LEFT_STAGE_POST);
      faceStage(left, -7, -74);
      right.root.position.set(RIGHT_STAIR_POST.x, RIGHT_STAIR_POST.y, RIGHT_STAIR_POST.z);
      faceStage(right, 29.55, -74);
    } else if (state === "EXITING") {
      left.mode = "ESCORTING";
      const leftTarget = {
        x: hero.position.x - 2.6,
        y: hero.position.y,
        z: hero.position.z + 0.15
      };
      moveToward(left, leftTarget, delta, EXIT_FOLLOW_SPEED);
      right.mode = "STAIR_POST";
      right.root.position.set(RIGHT_STAIR_POST.x, RIGHT_STAIR_POST.y, RIGHT_STAIR_POST.z);
      faceStage(right, 29.55, -74);
    } else if (state === "COMPLETE") {
      if (!rightGuardReleased && hero.position.x >= 33.2) {
        rightGuardReleased = true;
        right.mode = "FOLLOWING";
      }
      moveToward(left, followTarget(hero, left), delta, GUARD_SPEED, context);
      if (rightGuardReleased) {
        moveToward(right, followTarget(hero, right), delta, GUARD_SPEED, context);
      }
    } else {
      rightGuardReleased = false;
      left.mode = "FOLLOWING";
      right.mode = "FOLLOWING";
      moveToward(left, followTarget(hero, left), delta, GUARD_SPEED, context);
      moveToward(right, followTarget(hero, right), delta, GUARD_SPEED, context);
    }

    lastPerformanceState = state;
  },

  getGuards() {
    return guards.map(guard => ({
      name: guard.root.name,
      mode: guard.mode,
      position: guard.root.position.clone()
    }));
  }
};
