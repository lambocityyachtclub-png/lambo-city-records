// dockLuxuryOverhaul.js
// Dock atmosphere (underglow strips, lantern glow) plus 5 VIP waterfront
// ESTATES — not cabins. Aspen-luxury-cabin-meets-Malibu-mansion, each with
// a themed accent color and name plaque (Movie/Gaming/Music/Creator/
// Executive), connected to the dock by a private walkway. Exterior only
// for now — interior/invite-only access is a future gameplay system, not
// built here. Doesn't touch dock.js or world.js.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const DOCK_Z_START = -55;
const DOCK_Z_END = 25;
const DOCK_Z_LEN = DOCK_Z_END - DOCK_Z_START;
const DOCK_Z_MID = (DOCK_Z_START + DOCK_Z_END) / 2;

const THEMES = [
  { name: "MOVIE ESTATE",     color: 0xffd700 },
  { name: "GAMING ESTATE",    color: 0x9900ff },
  { name: "MUSIC ESTATE",     color: 0xff00aa },
  { name: "CREATOR ESTATE",   color: 0x00ffff },
  { name: "EXECUTIVE ESTATE", color: 0xffffff },
];

function buildUnderglow(scene) {
  [-7.5, 7.5].forEach(x => {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.15, DOCK_Z_LEN),
      new THREE.MeshStandardMaterial({ color: 0x9900ff, emissive: 0x9900ff, emissiveIntensity: 3 })
    );
    strip.position.set(x, 1.35, DOCK_Z_MID);
    scene.add(strip);
  });
}

function buildLanternGlows(scene) {
  for (let z = DOCK_Z_START; z <= DOCK_Z_END; z += 6) {
    [-7, 7].forEach(x => {
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xffaa33, emissive: 0xffaa33, emissiveIntensity: 2.5 })
      );
      glow.position.set(x, 2.6, z);
      scene.add(glow);
    });
  }
}

function createPlaqueTexture(name, color) {
  const w = 512, h = 128;
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 46px Arial, sans-serif";
  const hex = "#" + color.toString(16).padStart(6, "0");
  ctx.fillStyle = hex;
  ctx.fillText(name, w / 2, h / 2);
  return canvas;
}

function buildEstate(x, z, theme) {
  const group = new THREE.Group();

  const floor1 = new THREE.Mesh(
    new THREE.BoxGeometry(9, 4.5, 7),
    new THREE.MeshStandardMaterial({ color: 0x3a3530, roughness: 0.7 })
  );
  floor1.position.y = 2.25;
  group.add(floor1);

  const glass1 = new THREE.Mesh(
    new THREE.BoxGeometry(8.6, 3.6, 0.15),
    new THREE.MeshStandardMaterial({
      color: 0x88ccff, transparent: true, opacity: 0.55,
      emissive: 0xffcc77, emissiveIntensity: 0.5,
    })
  );
  glass1.position.set(0, 2.4, 3.55);
  group.add(glass1);

  const floor2 = new THREE.Mesh(
    new THREE.BoxGeometry(7, 3.5, 6),
    new THREE.MeshStandardMaterial({ color: 0x4a4038, roughness: 0.6 })
  );
  floor2.position.set(0.5, 6.25, -0.3);
  group.add(floor2);

  const glass2 = new THREE.Mesh(
    new THREE.BoxGeometry(6.6, 2.8, 0.15),
    new THREE.MeshStandardMaterial({
      color: 0x88ccff, transparent: true, opacity: 0.55,
      emissive: 0xffcc77, emissiveIntensity: 0.5,
    })
  );
  glass2.position.set(0.5, 6.3, 2.7);
  group.add(glass2);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(7.4, 0.25, 6.4),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 })
  );
  roof.position.set(0.5, 8.1, -0.3);
  group.add(roof);

  const roofAccent = new THREE.Mesh(
    new THREE.BoxGeometry(7.5, 0.08, 0.08),
    new THREE.MeshStandardMaterial({ color: theme.color, emissive: theme.color, emissiveIntensity: 2 })
  );
  roofAccent.position.set(0.5, 8.24, 2.85);
  group.add(roofAccent);

  const plaqueTex = new THREE.CanvasTexture(createPlaqueTexture(theme.name, theme.color));
  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 0.85),
    new THREE.MeshStandardMaterial({
      color: 0x000000, map: plaqueTex,
      emissive: 0xffffff, emissiveMap: plaqueTex, emissiveIntensity: 1.3,
    })
  );
  plaque.position.set(0, 4.6, 3.63);
  group.add(plaque);

  const walkway = new THREE.Mesh(
    new THREE.BoxGeometry(7, 0.15, 3),
    new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.9 })
  );
  walkway.position.set(7.5, 0.1, 0);
  group.add(walkway);

  const walkwayGlow = new THREE.Mesh(
    new THREE.BoxGeometry(7.1, 0.06, 0.06),
    new THREE.MeshStandardMaterial({ color: theme.color, emissive: theme.color, emissiveIntensity: 2.5 })
  );
  walkwayGlow.position.set(7.5, 0.19, 1.55);
  group.add(walkwayGlow);

  group.position.set(x, 0, z);
  return group;
}

function buildEstates(scene) {
  const zPositions = [-50, -35, -20, -5, 10];
  zPositions.forEach((z, i) => {
    scene.add(buildEstate(-16, z, THEMES[i]));
  });
}

export default {
  init(scene) {
    buildUnderglow(scene);
    buildLanternGlows(scene);
    buildEstates(scene);
  },
  update() {},
};
