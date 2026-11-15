// festivalStageUpgrade.js
// LAMBO CITY — PERMANENT FESTIVAL MAIN-STAGE ARCHITECTURE
//
// Adds sponsor-ready front banners, side LED screens, overhead truss,
// speaker arrays, and matching left/right access staircases.
// Sponsor copy is intentionally configurable so partner artwork can change
// without rebuilding the stage geometry.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const SPONSOR_DEFAULTS = [
  { key: "left", title: "PRESENTING PARTNER", brand: "YOUR BRAND HERE" },
  { key: "center", title: "LAMBO CITY RECORDS", brand: "THE MAIN STAGE" },
  { key: "right", title: "OFFICIAL PARTNER", brand: "YOUR BRAND HERE" }
];

const bannerMeshes = new Map();
const bannerTextures = new Map();
let root = null;
let initialized = false;

function makeBannerTexture(title, brand) {
  const canvas = document.createElement("canvas");
  // Match the 13.2 x 1.98 sponsor panel's 6.67:1 aspect ratio so
  // sponsor artwork is not stretched or visually cropped on the fascia.
  canvas.width = 1600;
  canvas.height = 240;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 1600, 240);
  gradient.addColorStop(0, "#09090d");
  gradient.addColorStop(0.5, "#17121e");
  gradient.addColorStop(1, "#07070a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1600, 240);

  ctx.strokeStyle = "#c79b2d";
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, 1580, 220);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "#a855f7";
  ctx.shadowBlur = 20;
  ctx.fillStyle = "#e8c86a";
  ctx.font = "bold 40px Arial, sans-serif";
  ctx.fillText(String(title || "").toUpperCase().slice(0, 36), 800, 70, 1450);

  ctx.shadowBlur = 8;
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 78px Arial, sans-serif";
  ctx.fillText(String(brand || "").toUpperCase().slice(0, 24), 800, 158, 1450);

  ctx.shadowBlur = 0;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function addBox(parent, name, size, position, material) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size[0], size[1], size[2]),
    material
  );
  mesh.name = name;
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addSponsorPanel(parent, sponsor, x, width) {
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x171717,
    metalness: 0.82,
    roughness: 0.28
  });
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.62,
    metalness: 0.08
  });

  addBox(
    parent,
    "festivalSponsorFrame_" + sponsor.key,
    [width + 0.32, 2.28, 0.38],
    [x, 1.36, -62.82],
    frameMat
  );

  const texture = makeBannerTexture(sponsor.title, sponsor.brand);
  const material = panelMat.clone();
  material.map = texture;
  material.emissive = new THREE.Color(0x171018);
  material.emissiveMap = texture;
  material.emissiveIntensity = 0.58;
  material.needsUpdate = true;

  // This dedicated sponsor-visibility band uses a single front-facing
  // display plane instead of a shallow box, avoiding fascia UV distortion
  // and keeping the complete sponsor artwork cleanly visible.
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(width, 1.98),
    material
  );
  face.name = "festivalSponsorBanner_" + sponsor.key;
  face.position.set(x, 1.36, -62.58);
  face.renderOrder = 2;
  face.castShadow = false;
  face.receiveShadow = false;
  parent.add(face);
  bannerMeshes.set(sponsor.key, face);
  bannerTextures.set(sponsor.key, texture);
}

function addStaircase(parent, side) {
  const sign = side === "right" ? 1 : -1;
  const treadMat = new THREE.MeshStandardMaterial({
    color: 0x171719,
    roughness: 0.42,
    metalness: 0.72
  });
  const riserMat = new THREE.MeshStandardMaterial({
    color: 0x080809,
    roughness: 0.55,
    metalness: 0.65
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd5ad49,
    metalness: 0.82,
    roughness: 0.24,
    emissive: 0x5b3c08,
    emissiveIntensity: 0.28
  });
  const neonMat = new THREE.MeshStandardMaterial({
    color: 0x9b32e8,
    emissive: 0x9b32e8,
    emissiveIntensity: 1.4
  });

  const stepCount = 8;
  const startX = 22.15;
  const stepRun = 0.88;
  const topStart = 1.68;
  const drop = 0.145;

  for (let i = 0; i < stepCount; i++) {
    const x = sign * (startX + i * stepRun);
    const top = topStart - i * drop;

    addBox(
      parent,
      "festivalStairTread_" + side + "_" + i,
      [0.98, 0.18, 5.8],
      [x, top - 0.09, -74],
      treadMat
    );

    addBox(
      parent,
      "festivalStairRiser_" + side + "_" + i,
      [0.12, 0.18, 5.8],
      [sign * (startX + i * stepRun - 0.48), top - 0.09, -74],
      riserMat
    );

    addBox(
      parent,
      "festivalStairNosing_" + side + "_" + i,
      [0.08, 0.055, 5.84],
      [x - sign * 0.42, top + 0.01, -74],
      neonMat
    );
  }

  // Side stringers follow the stair slope; both edges receive handrails.
  [-2.95, 2.95].forEach((zOffset, railIndex) => {
    const rail = addBox(
      parent,
      "festivalStairHandrail_" + side + "_" + railIndex,
      [7.9, 0.16, 0.16],
      [sign * 25.0, 2.18, -74 + zOffset],
      goldMat
    );
    rail.rotation.z = sign * -0.13;

    for (let i = 0; i < stepCount; i += 2) {
      const x = sign * (22.35 + i * stepRun);
      const y = 2.00 - i * 0.145;
      addBox(
        parent,
        "festivalStairBaluster_" + side + "_" + railIndex + "_" + i,
        [0.10, 0.75, 0.10],
        [x, y, -74 + zOffset],
        goldMat
      );
    }
  });

  // Landing pad at the foot of each stair run.
  addBox(
    parent,
    "festivalStairLanding_" + side,
    [1.7, 0.18, 7.2],
    [sign * 29.55, 0.58, -74],
    treadMat
  );

  addBox(
    parent,
    "festivalStairLandingAccent_" + side,
    [0.10, 0.06, 7.0],
    [sign * 29.55, 0.70, -74],
    neonMat
  );
}

function addSpeakerArray(parent, side) {
  const sign = side === "right" ? 1 : -1;
  const cabinetMat = new THREE.MeshStandardMaterial({
    color: 0x080809,
    roughness: 0.48,
    metalness: 0.58
  });
  const grilleMat = new THREE.MeshStandardMaterial({
    color: 0x242428,
    roughness: 0.8,
    metalness: 0.35
  });

  // Six compact touring line-array modules create a more believable
  // flown speaker hang while staying inside the approved stage footprint.
  for (let i = 0; i < 6; i++) {
    const y = 20.2 - i * 2.0;
    const cabinet = addBox(
      parent,
      "festivalLineArray_" + side + "_" + i,
      [2.6, 2.0, 1.65],
      [sign * 24.5, y, -78.4],
      cabinetMat
    );
    // Small progressive splay gives the flown array a realistic curved
    // vertical coverage profile rather than one flat stack of boxes.
    const splay = (i - 2.5) * 0.022;
    cabinet.rotation.x = splay;
    cabinet.rotation.z = sign * 0.035;

    const grille = addBox(
      parent,
      "festivalLineArrayGrille_" + side + "_" + i,
      [2.35, 1.72, 0.08],
      [sign * 24.5, y, -77.52],
      grilleMat
    );
    grille.rotation.x = splay;
  }

  // Visible flybar and paired suspension links connect each array to the
  // existing front truss, making the hang read as real touring hardware.
  const riggingMat = new THREE.MeshStandardMaterial({
    color: 0x17191d,
    metalness: 0.86,
    roughness: 0.34
  });
  addBox(
    parent,
    "festivalLineArrayFlybar_" + side,
    [3.0, 0.22, 0.26],
    [sign * 24.5, 21.38, -78.4],
    riggingMat
  );
  [-0.92, 0.92].forEach((offset, index) => {
    addBox(
      parent,
      "festivalLineArraySuspension_" + side + "_" + index,
      [0.055, 2.55, 0.055],
      [sign * 24.5 + offset, 22.83, -78.4],
      riggingMat
    );
    addBox(
      parent,
      "festivalLineArrayHoist_" + side + "_" + index,
      [0.22, 0.20, 0.22],
      [sign * 24.5 + offset, 24.18, -78.4],
      riggingMat
    );
  });
}

function addStageTruss(parent) {
  const trussMat = new THREE.MeshStandardMaterial({
    color: 0x202024,
    roughness: 0.38,
    metalness: 0.86
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd0a842,
    roughness: 0.3,
    metalness: 0.8
  });
  const beamY = 27.1;

  addBox(parent, "festivalMainTruss", [48, 0.72, 0.72], [0, beamY, -84.0], trussMat);
  addBox(parent, "festivalFrontTruss", [48, 0.42, 0.42], [0, 24.6, -79.8], trussMat);
  addBox(parent, "festivalRearTruss", [48, 0.42, 0.42], [0, 24.6, -86.0], trussMat);

  [-22.8, 22.8].forEach((x, i) => {
    addBox(parent, "festivalTrussUpright_" + i, [0.72, 26.5, 0.72], [x, 13.6, -84.0], trussMat);
    addBox(parent, "festivalTrussBase_" + i, [2.2, 0.34, 2.2], [x, 0.85, -84.0], goldMat);
  });

  // Small, emissive fixture housings; existing moving-beam systems remain in charge.
  [-18, -12, -6, 0, 6, 12, 18].forEach((x, i) => {
    const fixture = addBox(
      parent,
      "festivalTrussFixture_" + i,
      [0.9, 0.42, 0.7],
      [x, 26.45, -80.2],
      goldMat
    );
    fixture.rotation.y = Math.PI / 2;
  });
}

function addSideScreens(parent) {
  const bezelMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    metalness: 0.8,
    roughness: 0.25
  });
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x241034,
    emissive: 0x6f1bb5,
    emissiveIntensity: 1.25,
    roughness: 0.35
  });

  [-1, 1].forEach((sign, index) => {
    const x = sign * 17.7;
    addBox(parent, "festivalSideScreenBezel_" + index, [8.2, 9.6, 0.65], [x, 11.8, -82.45], bezelMat);
    addBox(parent, "festivalSideScreen_" + index, [7.5, 8.9, 0.12], [x, 11.8, -82.05], screenMat);
  });
}

function addSponsorFlags(parent) {
  const poleMat = new THREE.MeshStandardMaterial({
    color: 0xc49a3a,
    metalness: 0.8,
    roughness: 0.28
  });
  const flagMat = new THREE.MeshStandardMaterial({
    color: 0x141018,
    roughness: 0.62,
    metalness: 0.22
  });

  [-1, 1].forEach((sign, index) => {
    const x = sign * 21.0;
    addBox(parent, "festivalSponsorFlagPole_" + index, [0.16, 6.2, 0.16], [x, 20.5, -83.0], poleMat);
    const flag = addBox(parent, "festivalSponsorFlag_" + index, [3.5, 5.0, 0.12], [x, 20.0, -82.72], flagMat);
    const texture = makeBannerTexture("LAMBO CITY", "PARTNER");
    flag.material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: texture,
      emissive: new THREE.Color(0x160d1c),
      emissiveMap: texture,
      emissiveIntensity: 0.35
    });
  });
}

function updateSponsorPanel(key, title, brand) {
  const mesh = bannerMeshes.get(key);
  if (!mesh) return false;

  const oldTexture = bannerTextures.get(key);
  const texture = makeBannerTexture(title, brand);
  mesh.material.map = texture;
  mesh.material.emissiveMap = texture;
  mesh.material.needsUpdate = true;
  bannerTextures.set(key, texture);
  oldTexture?.dispose?.();
  return true;
}

export default {
  init(scene) {
    if (initialized) return;
    initialized = true;
    root = new THREE.Group();
    root.name = "lamboCityFestivalStageUpgrade";
    scene.add(root);

    addStageTruss(root);
    addSideScreens(root);
    addSpeakerArray(root, "left");
    addSpeakerArray(root, "right");
    addStaircase(root, "left");
    addStaircase(root, "right");
    addSponsorFlags(root);

    SPONSOR_DEFAULTS.forEach((sponsor, index) => {
      addSponsorPanel(root, sponsor, (index - 1) * 14.2, 13.2);
    });

    // A continuous dark fascia ties the sponsor boards into one permanent stage front.
    addBox(
      root,
      "festivalStageFrontFascia",
      [44, 2.0, 0.42],
      [0, 1.18, -62.95],
      new THREE.MeshStandardMaterial({
        color: 0x09090b,
        roughness: 0.46,
        metalness: 0.7
      })
    );
  },

  update() {},

  setSponsorBranding(sponsors = {}) {
    ["left", "center", "right"].forEach(key => {
      const item = sponsors[key];
      if (!item) return;
      updateSponsorPanel(
        key,
        item.title || "OFFICIAL PARTNER",
        item.brand || "YOUR BRAND HERE"
      );
    });
  },

  getSponsorSlots() {
    return ["left", "center", "right"];
  }
};
