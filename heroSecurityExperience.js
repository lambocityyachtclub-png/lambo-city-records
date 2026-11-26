import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

// HERO's original security escort. Paparazzi are fully disabled for now.
// This is a presentation/gameplay layer only. Server-side access controls
// must remain authoritative for private spaces, voice, and player permissions.

const GUARD_OFFSETS = [
  new THREE.Vector3(-1.15, 0, 0.28),
  new THREE.Vector3(1.15, 0, 0.28)
];
const PRESS_ANGLES = [-0.88, 0.88, Math.PI];
const PRESS_RADIUS = 7.8;
const PERSONAL_SPACE_RADIUS = 5.7;

let scene = null;
let guards = [];
let perimeter = null;
let elapsed = 0;
let active = false;
let lastState = "IDLE";

function makeMaterial(color, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.72,
    metalness: 0.12,
    ...extra
  });
}

function addBox(parent, name, size, material, position) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function makeGuard(index) {
  const root = new THREE.Group();
  root.name = "heroSecurityEscort" + (index + 1);
  // HERO is normalized to 4 world units. A 2.1x security rig reads as
  // visibly taller and broader without changing HERO or escort spacing.
  root.scale.setScalar(2.1);
  const suit = makeMaterial(0x101318, { metalness: 0.18, roughness: 0.56 });
  const shirt = makeMaterial(0xddd9d0, { roughness: 0.85 });
  const skin = makeMaterial(index === 0 ? 0x81543b : 0x9a674b, { roughness: 0.92 });
  const dark = makeMaterial(0x050608, { roughness: 0.36, metalness: 0.24 });
  const brass = makeMaterial(0x9c7946, { metalness: 0.72, roughness: 0.3 });

  addBox(root, "securityTorso", [0.62, 0.82, 0.34], suit, [0, 1.23, 0]);
  addBox(root, "securityShirt", [0.12, 0.52, 0.035], shirt, [0, 1.28, -0.184]);
  addBox(root, "securityTie", [0.055, 0.3, 0.045], brass, [0, 1.29, -0.211]);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), skin);
  head.position.set(0, 1.82, 0);
  head.castShadow = true;
  root.add(head);
  addBox(root, "securitySunglasses", [0.32, 0.07, 0.045], dark, [0, 1.86, -0.17]);
  addBox(root, "securityLeftLeg", [0.22, 0.67, 0.25], suit, [-0.16, 0.48, 0]);
  addBox(root, "securityRightLeg", [0.22, 0.67, 0.25], suit, [0.16, 0.48, 0]);
  addBox(root, "securityLeftShoe", [0.24, 0.13, 0.39], dark, [-0.16, 0.12, -0.055]);
  addBox(root, "securityRightShoe", [0.24, 0.13, 0.39], dark, [0.16, 0.12, -0.055]);

  const leftArm = addBox(root, "securityLeftArm", [0.19, 0.66, 0.22], suit, [-0.42, 1.22, 0]);
  const rightArm = addBox(root, "securityRightArm", [0.19, 0.66, 0.22], suit, [0.42, 1.22, 0]);
  leftArm.geometry.translate(0, -0.24, 0);
  rightArm.geometry.translate(0, -0.24, 0);
  root.userData.walkPhase = index * Math.PI;
  root.userData.leftArm = leftArm;
  root.userData.rightArm = rightArm;
  root.visible = false;
  scene.add(root);
  return root;
}

function localToWorld(hero, local) {
  return local.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), hero.rotation.y)
    .add(hero.position);
}

function updateGuard(guard, hero, offset, delta, index) {
  const target = localToWorld(hero, offset);
  const blend = Math.min(1, delta * 4.2);
  guard.position.lerp(target, blend);
  guard.position.y = hero.position.y;
  guard.rotation.y += Math.atan2(
    Math.sin(hero.rotation.y - guard.rotation.y),
    Math.cos(hero.rotation.y - guard.rotation.y)
  ) * Math.min(1, delta * 5);
  const gait = elapsed * 7.2 + guard.userData.walkPhase;
  const swing = Math.sin(gait) * (lastState === "WALKING" ? 0.22 : 0.035);
  guard.userData.leftArm.rotation.x = swing;
  guard.userData.rightArm.rotation.x = -swing;
  guard.position.y += lastState === "WALKING" ? Math.abs(Math.sin(gait * 2)) * 0.025 : 0;
}

function createPerimeter() {
  const geometry = new THREE.TorusGeometry(PERSONAL_SPACE_RADIUS, 0.025, 5, 96);
  const material = new THREE.MeshBasicMaterial({
    color: 0xc6a16a,
    transparent: true,
    opacity: 0.2,
    depthWrite: false
  });
  perimeter = new THREE.Mesh(geometry, material);
  perimeter.name = "heroPersonalSpaceVisualCue";
  perimeter.rotation.x = Math.PI / 2;
  perimeter.position.y = 0.79;
  perimeter.visible = false;
  scene.add(perimeter);
}

export default {
  init(scene_) {
    scene = scene_;
    elapsed = 0;
    active = false;
    lastState = "IDLE";
    guards = [makeGuard(0), makeGuard(1)];
    createPerimeter();
  },

  update(delta, context) {
    if (!scene) return;
    elapsed += Math.min(Math.max(delta || 0, 0), 0.05);
    const hero = context?.systems?.npc?.getHero?.();
    const state = context?.systems?.heroPostPerformance?.getState?.() || "IDLE";
    lastState = state;
    const visible = !!hero && (state === "WALKING" || state === "ARRIVED");

    if (!visible) {
      if (active) {
        guards.forEach(item => { item.visible = false; });
        if (perimeter) perimeter.visible = false;
      }
      active = false;
      return;
    }

    active = true;
    guards.forEach((guard, index) => {
      guard.visible = true;
      updateGuard(guard, hero, GUARD_OFFSETS[index], delta, index);
    });

    if (perimeter) {
      perimeter.visible = true;
      perimeter.position.set(hero.position.x, 0.79, hero.position.z);
    }

  }
};
