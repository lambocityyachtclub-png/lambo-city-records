// yachtLuxuryDetails.js
// BIG, unmissable luxury upgrades for the yacht — full-hull underglow,
// glowing brand wordmark, mast beacon, bright helipad — plus smaller deck
// furniture. Built as its own group matching yacht.js's transform exactly,
// without touching yacht.js at all.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

function createWordmarkTexture() {
  const w = 1024, h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 130px Arial, sans-serif";
  ctx.shadowColor = "#ff00aa";
  ctx.shadowBlur = 40;
  ctx.fillStyle = "#ffd700";
  ctx.fillText("LAMBO CITY", w/2, h/2);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff4cc";
  ctx.fillText("LAMBO CITY", w/2, h/2);
  return canvas;
}

function createHelipadTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#101010";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "#ffd700";
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 - 12, 0, Math.PI*2);
  ctx.stroke();
  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 140px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("H", size/2, size/2 + 8);
  return canvas;
}

let beacon, beaconTime = 0;

export default {
  init(scene) {
    const group = new THREE.Group();
    group.position.set(38, -2, -28);
    group.rotation.y = Math.PI / 6;

    const underglowPurple = new THREE.Mesh(
      new THREE.BoxGeometry(22, 0.25, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x9900ff, emissive: 0x9900ff, emissiveIntensity: 3 })
    );
    underglowPurple.position.set(0, 0.1, 4.6);
    group.add(underglowPurple);
    const underglowGold = underglowPurple.clone();
    underglowGold.material = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 3 });
    underglowGold.position.z = -4.6;
    group.add(underglowGold);

    const wordmarkTex = new THREE.CanvasTexture(createWordmarkTexture());
    const wordmark = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 3.5),
      new THREE.MeshStandardMaterial({
        color: 0x000000, map: wordmarkTex,
        emissive: 0xffffff, emissiveMap: wordmarkTex, emissiveIntensity: 1.6,
      })
    );
    wordmark.position.set(0, 2.2, 4.55);
    group.add(wordmark);

    const beaconGeo = new THREE.SphereGeometry(0.5, 12, 12);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0xff00aa, emissive: 0xff00aa, emissiveIntensity: 3,
    });
    beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(3, 17.6, 0);
    group.add(beacon);

    const padTexture = new THREE.CanvasTexture(createHelipadTexture());
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x000000, map: padTexture,
      emissive: 0xffffff, emissiveMap: padTexture, emissiveIntensity: 1.4,
    });
    const pad = new THREE.Mesh(new THREE.CircleGeometry(3.2, 24), padMat);
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

  update(delta) {
    beaconTime += delta;
    if (beacon) {
      beacon.material.emissiveIntensity = 2.2 + Math.sin(beaconTime * 3) * 1.2;
    }
  },
};
