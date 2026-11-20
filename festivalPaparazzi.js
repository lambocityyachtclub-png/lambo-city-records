// festivalPaparazzi.js
// LAMBO CITY — MEDIA PIT PHOTOGRAPHERS
// Four press photographers occupy the existing media pit. Their cameras
// rise toward HERO during the performance and use emissive flash pulses,
// not additional real-time lights.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const POSITIONS = [-11, -3.7, 3.7, 11];
let photographers = [];
let elapsed = 0;

function createPhotographer(scene, index) {
  const root = new THREE.Group();
  root.name = "festivalPaparazzi_" + (index + 1);
  const jacket = new THREE.MeshStandardMaterial({
    color: index % 2 ? 0x252a31 : 0x15191e,
    roughness: 0.84
  });
  const skin = new THREE.MeshStandardMaterial({ color: index % 2 ? 0x966b4e : 0x704a36, roughness: 0.9 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x090b0e, metalness: 0.48, roughness: 0.34 });
  const lens = new THREE.MeshStandardMaterial({
    color: 0x263b50, metalness: 0.78, roughness: 0.18,
    emissive: 0x0a1b2b, emissiveIntensity: 0.25
  });
  const flash = new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0
  });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.0, 0.4), jacket);
  torso.position.y = 1.42;
  root.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 10, 8), skin);
  head.position.y = 2.14;
  root.add(head);

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.43, 1.82, 0.02);
  const leftSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.22), jacket);
  leftSleeve.position.y = -0.31;
  leftArm.add(leftSleeve);
  root.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.43, 1.82, 0.02);
  const rightSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.22), jacket);
  rightSleeve.position.y = -0.31;
  rightArm.add(rightSleeve);
  root.add(rightArm);

  const camera = new THREE.Group();
  camera.name = "paparazziCamera";
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.24), dark);
  camera.add(body);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.2, 12), lens);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = 0.18;
  camera.add(barrel);
  const flashUnit = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 0.12), flash);
  flashUnit.position.set(0.16, 0.2, 0);
  camera.add(flashUnit);
  rightArm.add(camera);
  camera.position.set(0.02, -0.44, 0.28);
  camera.rotation.x = -0.16;

  const legs = [];
  for (const x of [-0.19, 0.19]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.84, 0.26), dark);
    leg.position.set(x, 0.42, 0);
    root.add(leg);
    legs.push(leg);
  }

  root.position.set(POSITIONS[index], 1.185, -60.35);
  root.rotation.y = Math.PI;
  scene.add(root);
  return {
    root, leftArm, rightArm, camera, flash: flashUnit, flashMaterial: flash,
    phase: index * 1.47, legs
  };
}

export default {
  init(scene) {
    if (!scene || scene.getObjectByName("festivalPaparazzi_1")) return;
    elapsed = 0;
    photographers = POSITIONS.map((_, index) => createPhotographer(scene, index));
  },

  update(delta, context) {
    if (!photographers.length) return;
    elapsed += Math.min(Math.max(delta || 0, 0), 0.05);
    const state = context?.systems?.heroPerformance?.getState?.() || "IDLE";
    const active = state === "ENTERING" || state === "PERFORMING" || state === "EXITING";
    photographers.forEach(person => {
      const raise = active ? 1 : 0;
      const motion = Math.sin(elapsed * 2.1 + person.phase);
      person.rightArm.rotation.x = THREE.MathUtils.lerp(0.15, -1.12, raise) + motion * 0.045;
      person.leftArm.rotation.x = THREE.MathUtils.lerp(0.08, -0.82, raise) - motion * 0.035;
      person.camera.rotation.x = THREE.MathUtils.lerp(-0.16, -0.38, raise);
      const pulse = active && Math.sin(elapsed * 7.2 + person.phase) > 0.91 ? 1.8 : 0;
      person.flashMaterial.emissiveIntensity = pulse;
      person.flash.scale.setScalar(pulse > 0 ? 1.25 : 1);
      person.root.rotation.y = Math.PI + Math.sin(elapsed * 0.22 + person.phase) * 0.035;
    });
  },

  getPhotographers() {
    return photographers.map(person => person.root.name);
  }
};
