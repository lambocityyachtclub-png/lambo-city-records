// recordsHQ.js
// LAMBO CITY RECORDS headquarters — exterior landmark building near the
// start of the dock, on the RIGHT (east/positive X) side, matching the
// reference map. Glowing wordmark + original bull emblem, marquee
// announcement bar, lit glass lobby front (decorative, not walkable yet),
// red carpet with velvet-rope stanchions.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const HQ_POSITION = { x: 28, z: 22 };

function createSignTexture() {
  const w = 1024, h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.translate(w / 2, 130);
  ctx.strokeStyle = "#ffd700";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(-60, 0, 55, Math.PI * 0.15, Math.PI * 1.1);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(60, 0, 55, -Math.PI * 0.15, -Math.PI * 1.1, true);
  ctx.stroke();
  ctx.fillStyle = "#ffd700";
  ctx.beginPath();
  ctx.ellipse(0, 20, 40, 32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 110px Arial, sans-serif";
  ctx.shadowColor = "#ff00aa";
  ctx.shadowBlur = 30;
  ctx.fillStyle = "#ffd700";
  ctx.fillText("LAMBO CITY", w / 2, 300);
  ctx.font = "bold 90px Arial, sans-serif";
  ctx.fillText("RECORDS", w / 2, 410);
  ctx.shadowBlur = 0;

  return canvas;
}

function createMarqueeTexture() {
  const w = 1024, h = 128;
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 42px Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("LAMBO CITY RECORDS — THE SOUND OF THE CITY", w / 2, h / 2);
  return canvas;
}

function buildStanchion(x, z) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.38, 0.14, 12),
    new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.6 })
  );
  base.position.y = 0.07;
  group.add(base);
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 1.1, 10),
    new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.15, emissive: 0xffd700, emissiveIntensity: 0.3 })
  );
  pole.position.y = 0.68;
  group.add(pole);
  const top = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.1, emissive: 0xffd700, emissiveIntensity: 0.5 })
  );
  top.position.y = 1.28;
  group.add(top);
  group.position.set(x, 0, z);
  return group;
}

function buildRope(x1, z1, x2, z2, group) {
  const attachY = 1.22;
  const sagY = 0.8;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(x1, attachY, z1),
    new THREE.Vector3((x1 + x2) / 2, sagY, (z1 + z2) / 2),
    new THREE.Vector3(x2, attachY, z2),
  ]);
  const geo = new THREE.TubeGeometry(curve, 12, 0.055, 6, false);
  const mat = new THREE.MeshStandardMaterial({ color: 0x8b0018, roughness: 0.6 });
  group.add(new THREE.Mesh(geo, mat));
}

export default {
  init(scene) {
    const group = new THREE.Group();
    group.position.set(HQ_POSITION.x, 0, HQ_POSITION.z);

    const building = new THREE.Mesh(
      new THREE.BoxGeometry(18, 26, 14),
      new THREE.MeshStandardMaterial({ color: 0x0a0a0f, roughness: 0.5, metalness: 0.3 })
    );
    building.position.y = 13;
    group.add(building);

    [-9, 9].forEach(x => {
      const trim = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 26, 0.2),
        new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 1.5 })
      );
      trim.position.set(x, 13, 7.05);
      group.add(trim);
    });

    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (Math.random() < 0.35) continue;
        const win = new THREE.Mesh(
          new THREE.BoxGeometry(1.4, 1.6, 0.1),
          new THREE.MeshStandardMaterial({
            color: 0xffee88, emissive: 0xffee88, emissiveIntensity: Math.random() * 0.5 + 0.4,
          })
        );
        win.position.set(-7 + col * 3.5, 21 - row * 2.6, 7.06);
        group.add(win);
      }
    }

    const signTex = new THREE.CanvasTexture(createSignTexture());
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 8),
      new THREE.MeshStandardMaterial({
        color: 0x000000, map: signTex,
        emissive: 0xffffff, emissiveMap: signTex, emissiveIntensity: 1.4,
      })
    );
    sign.position.set(0, 22, 7.1);
    group.add(sign);

    const marqueeTex = new THREE.CanvasTexture(createMarqueeTexture());
    const marquee = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 1.5),
      new THREE.MeshStandardMaterial({
        color: 0x000000, map: marqueeTex,
        emissive: 0xffffff, emissiveMap: marqueeTex, emissiveIntensity: 1.2,
      })
    );
    marquee.position.set(0, 16.5, 7.1);
    group.add(marquee);

    const lobbyGlow = new THREE.Mesh(
      new THREE.BoxGeometry(10, 6, 0.3),
      new THREE.MeshStandardMaterial({
        color: 0xfff4d0, emissive: 0xffe8a0, emissiveIntensity: 1.0,
        transparent: true, opacity: 0.55,
      })
    );
    lobbyGlow.position.set(0, 3, 7.2);
    group.add(lobbyGlow);

    const lobbyEmblem = new THREE.Mesh(
      new THREE.CircleGeometry(1.3, 24),
      new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 1.8 })
    );
    lobbyEmblem.position.set(0, 3.5, 6.9);
    group.add(lobbyEmblem);

const carpet = new THREE.Mesh(
  new THREE.PlaneGeometry(4, 5),
  new THREE.MeshStandardMaterial({
    color: 0x8b0018,
    roughness: 0.7
  })
);

carpet.rotation.x = -Math.PI / 2;
carpet.position.set(0, 0.03, 10.5);

group.add(carpet);


// VIP velvet rope entrance
const ropeZs = [9.0, 12.0];

[-2.2, 2.2].forEach(x => {
  ropeZs.forEach(z => group.add(buildStanchion(x, z)));

  for (let i = 0; i < ropeZs.length - 1; i++) {
    buildRope(x, ropeZs[i], x, ropeZs[i + 1], group);
  }
});

    scene.add(group);
  },
  update() {},
};
