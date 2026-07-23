// yachtLuxuryDetails.js
// Decorative luxury detail layer for the yacht — helipad, deck furniture,
// gold trim, and a flag. Built as its own group positioned to match
// yacht.js's transform exactly, without touching yacht.js at all.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

function createHelipadTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#101010";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "#ffd700";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 - 10, 0, Math.PI*2);
  ctx.stroke();
  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 140px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("H", size/2, size/2 + 8);
  return canvas;
}

export default {
  init(scene) {
    const group = new THREE.Group();

    group.position.set(38, -2, -28);
    group.rotation.y = Math.PI / 6;

    const padTexture = new THREE.CanvasTexture(createHelipadTexture());
    const padMat = new THREE.MeshStandardMaterial({
      map: padTexture,
      emissive: 0xffd700,
      emissiveMap: padTexture,
      emissiveIntensity: 0.6,
    });
    const pad = new THREE.Mesh(new THREE.CircleGeometry(2.5, 24), padMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(0, 10.3, 0);
    group.add(pad);

    [-2.5, 2.5].forEach(x => {
      const chair = new THREE.Group();
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.15, 2),
        new THREE.MeshStandardMaterial({ color: 0xf5f0e6, roughness: 0.6 })
      );
      base.position.y = 0.15;
      chair.add(base);
      const back = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.6, 0.15),
        new THREE.MeshStandardMaterial({ color: 0xf5f0e6, roughness: 0.6 })
      );
      back.position.set(0, 0.4, -0.9);
      back.rotation.x = -0.4;
      chair.add(back);
      chair.position.set(x, 4.3, 3);
      group.add(chair);
    });

    const umbrella = new THREE.Group();
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 2, 8),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.7 })
    );
    pole.position.y = 1;
    umbrella.add(pole);
    const canopy = new THREE.Mesh(
      new THREE.ConeGeometry(1.4, 0.6, 12),
      new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 0.3 })
    );
    canopy.position.y = 2.1;
    umbrella.add(canopy);
    umbrella.position.set(0, 4.3, 3);
    group.add(umbrella);

    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(20.5, 0.08, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 1.8 })
    );
    trim.position.set(0, 4.35, 4.3);
    group.add(trim);
    const trim2 = trim.clone();
    trim2.position.z = -4.3;
    group.add(trim2);

    const flagPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 3, 6),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 })
    );
    flagPole.position.set(-9, 5.5, -4.2);
    group.add(flagPole);
    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 0.7),
      new THREE.MeshStandardMaterial({
        color: 0x9900ff, emissive: 0x9900ff, emissiveIntensity: 0.5, side: THREE.DoubleSide,
      })
    );
    flag.position.set(-8.4, 6.6, -4.2);
    group.add(flag);

    scene.add(group);
  },
  update() {},
};
