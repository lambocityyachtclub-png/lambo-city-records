// dockLuxuryOverhaul.js
// LAMBO CITY — Luxury Dock Environment Upgrade
//
// Phase 1A:
// - Luxury dock trim/details
// - Mooring hardware
// - Bollards / cleats
// - Premium lantern fixtures + emissive glow
// - Dock underglow
// - Five VIP waterfront ESTATES
// - Estate landscaping/details
// - Premium glass/material treatment
//
// IMPORTANT:
// This module does NOT replace the structural dock geometry owned by dock.js.
// It layers visual/detail upgrades on top of the existing dock.
//
// Three.js 0.160.0
// Optimized for iPad / Safari:
// - Shared geometries
// - Shared materials
// - No unnecessary per-object PointLights
// - Limited object count
// - No expensive real-time shadow systems added here

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const DOCK_X_LEFT  = -6.2;
const DOCK_X_RIGHT =  6.2;

const DOCK_Z_START = -55;
const DOCK_Z_END   = 25;
const DOCK_Z_LEN   = DOCK_Z_END - DOCK_Z_START;
const DOCK_Z_MID   = (DOCK_Z_START + DOCK_Z_END) / 2;

const THEMES = [
  { name: "MOVIE ESTATE",     color: 0xffd700 },
  { name: "GAMING ESTATE",    color: 0x9900ff },
  { name: "MUSIC ESTATE",     color: 0xff00aa },
  { name: "CREATOR ESTATE",   color: 0x00ffff },
  { name: "EXECUTIVE ESTATE", color: 0xffffff },
];

let animatedGlows = [];
let time = 0;

// ============================================================
// SHARED MATERIALS
// ============================================================

function createMaterials() {
  return {
    dockTrim: new THREE.MeshStandardMaterial({
      color: 0x24150d,
      roughness: 0.72,
      metalness: 0.05,
    }),

    darkWood: new THREE.MeshStandardMaterial({
      color: 0x3a2415,
      roughness: 0.82,
      metalness: 0.02,
    }),

    premiumWood: new THREE.MeshStandardMaterial({
      color: 0x6d4327,
      roughness: 0.72,
      metalness: 0.02,
    }),

    metal: new THREE.MeshStandardMaterial({
      color: 0x191919,
      roughness: 0.35,
      metalness: 0.75,
    }),

    brass: new THREE.MeshStandardMaterial({
      color: 0xb78a42,
      roughness: 0.28,
      metalness: 0.8,
    }),

    lanternBody: new THREE.MeshStandardMaterial({
      color: 0x17130f,
      roughness: 0.42,
      metalness: 0.7,
    }),

    lanternGlow: new THREE.MeshStandardMaterial({
      color: 0xffb84a,
      emissive: 0xff9d24,
      emissiveIntensity: 3.0,
    }),

    warmLight: new THREE.MeshStandardMaterial({
      color: 0xffd18a,
      emissive: 0xffaa44,
      emissiveIntensity: 2.0,
      transparent: true,
      opacity: 0.9,
    }),

    estateBody: new THREE.MeshStandardMaterial({
      color: 0x332e29,
      roughness: 0.68,
      metalness: 0.03,
    }),

    estateUpper: new THREE.MeshStandardMaterial({
      color: 0x4a4038,
      roughness: 0.58,
      metalness: 0.03,
    }),

    roof: new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.38,
      metalness: 0.25,
    }),

    glass: new THREE.MeshPhysicalMaterial({
      color: 0x91c8e8,
      roughness: 0.12,
      metalness: 0.05,
      transmission: 0.05,
      transparent: true,
      opacity: 0.48,
    }),

    planter: new THREE.MeshStandardMaterial({
      color: 0x191919,
      roughness: 0.7,
    }),

    stone: new THREE.MeshStandardMaterial({
      color: 0x77716a,
      roughness: 0.88,
    }),
  };
}

// ============================================================
// SHARED GEOMETRIES
// ============================================================

function createGeometries() {
  return {
    trimLong: new THREE.BoxGeometry(0.18, 0.22, DOCK_Z_LEN),

    trimShort: new THREE.BoxGeometry(0.18, 0.22, 0.9),

    bollard: new THREE.CylinderGeometry(
      0.16,
      0.2,
      0.48,
      8
    ),

    cleatBase: new THREE.BoxGeometry(
      0.38,
      0.08,
      0.18
    ),

    cleatArm: new THREE.BoxGeometry(
      0.08,
      0.12,
      0.42
    ),

    lanternPole: new THREE.CylinderGeometry(
      0.055,
      0.07,
      2.25,
      8
    ),

    lanternCap: new THREE.CylinderGeometry(
      0.24,
      0.24,
      0.08,
      8
    ),

    lanternBody: new THREE.BoxGeometry(
      0.34,
      0.42,
      0.34
    ),

    lanternGlow: new THREE.BoxGeometry(
      0.22,
      0.28,
      0.22
    ),

    planter: new THREE.CylinderGeometry(
      0.28,
      0.22,
      0.38,
      10
    ),

    plant: new THREE.ConeGeometry(
      0.22,
      0.75,
      6
    ),

    estateBase: new THREE.BoxGeometry(
      9,
      4.5,
      7
    ),

    estateUpper: new THREE.BoxGeometry(
      7,
      3.5,
      6
    ),

    glassLower: new THREE.BoxGeometry(
      8.6,
      3.6,
      0.15
    ),

    glassUpper: new THREE.BoxGeometry(
      6.6,
      2.8,
      0.15
    ),

    roof: new THREE.BoxGeometry(
      7.4,
      0.25,
      6.4
    ),

    roofAccent: new THREE.BoxGeometry(
      7.5,
      0.08,
      0.08
    ),

    walkway: new THREE.BoxGeometry(
      7,
      0.15,
      3
    ),

    walkwayAccent: new THREE.BoxGeometry(
      7.1,
      0.06,
      0.06
    ),
  };
}

// ============================================================
// DOCK EDGE TRIM
// ============================================================

function buildDockTrim(scene, materials, geometries) {
  const left = new THREE.Mesh(
    geometries.trimLong,
    materials.dockTrim
  );

  left.position.set(
    -7.02,
    1.36,
    DOCK_Z_MID
  );

  scene.add(left);

  const right = new THREE.Mesh(
    geometries.trimLong,
    materials.dockTrim
  );

  right.position.set(
    7.02,
    1.36,
    DOCK_Z_MID
  );

  scene.add(right);
}

// ============================================================
// MOORING BOLLARDS
// ============================================================

function buildMooringBollards(scene, materials, geometries) {
  const zPositions = [
    -50,
    -38,
    -26,
    -14,
    -2,
    10,
    22,
  ];

  zPositions.forEach(z => {
    [-6.7, 6.7].forEach(x => {
      const bollard = new THREE.Mesh(
        geometries.bollard,
        materials.brass
      );

      bollard.position.set(
        x,
        1.66,
        z
      );

      scene.add(bollard);
    });
  });
}

// ============================================================
// DOCK CLEATS
// ============================================================

function buildDockCleats(scene, materials, geometries) {
  const zPositions = [
    -44,
    -32,
    -20,
    -8,
    4,
    16,
  ];

  zPositions.forEach(z => {
    [-5.4, 5.4].forEach(x => {
      const group = new THREE.Group();

      const base = new THREE.Mesh(
        geometries.cleatBase,
        materials.metal
      );

      base.position.y = 1.53;
      group.add(base);

      const armLeft = new THREE.Mesh(
        geometries.cleatArm,
        materials.metal
      );

      armLeft.position.set(
        -0.15,
        1.61,
        0
      );

      armLeft.rotation.z = -0.25;

      group.add(armLeft);

      const armRight = new THREE.Mesh(
        geometries.cleatArm,
        materials.metal
      );

      armRight.position.set(
        0.15,
        1.61,
        0
      );

      armRight.rotation.z = 0.25;

      group.add(armRight);

      group.position.set(
        x,
        0,
        z
      );

      scene.add(group);
    });
  });
}

// ============================================================
// LUXURY LANTERNS
// ============================================================

function buildLanterns(scene, materials, geometries) {
  const zPositions = [];

  for (
    let z = DOCK_Z_START;
    z <= DOCK_Z_END;
    z += 8
  ) {
    zPositions.push(z);
  }

  zPositions.forEach((z, index) => {
    [-5.5, 5.5].forEach(x => {
      const group = new THREE.Group();

      const pole = new THREE.Mesh(
        geometries.lanternPole,
        materials.lanternBody
      );

      pole.position.y = 1.95;
      group.add(pole);

      const cap = new THREE.Mesh(
        geometries.lanternCap,
        materials.brass
      );

      cap.position.y = 3.08;
      group.add(cap);

      const lantern = new THREE.Mesh(
        geometries.lanternBody,
        materials.lanternBody
      );

      lantern.position.y = 3.28;
      group.add(lantern);

      const glow = new THREE.Mesh(
        geometries.lanternGlow,
        materials.lanternGlow
      );

      glow.position.y = 3.28;
      group.add(glow);

      group.position.set(
        x,
        0,
        z
      );

      scene.add(group);

      animatedGlows.push({
        mesh: glow,
        offset: index * 0.35 + (x > 0 ? 0.15 : 0)
      });
    });
  });
}

// ============================================================
// DOCK UNDERGLOW
// ============================================================

function buildUnderglow(scene) {
  const material = new THREE.MeshStandardMaterial({
    color: 0x9900ff,
    emissive: 0x9900ff,
    emissiveIntensity: 2.6,
    roughness: 0.5,
  });

  [-7.5, 7.5].forEach(x => {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(
        0.28,
        0.12,
        DOCK_Z_LEN
      ),
      material
    );

    strip.position.set(
      x,
      1.38,
      DOCK_Z_MID
    );

    scene.add(strip);
  });
}

// ============================================================
// SMALL DOCK PLANTERS
// ============================================================

function buildDockPlanters(scene, materials, geometries) {
  const positions = [
    [-6.0, -47],
    [6.0, -35],
    [-6.0, -17],
    [6.0, -5],
    [-6.0, 13],
  ];

  positions.forEach(([x, z]) => {
    const planter = new THREE.Mesh(
      geometries.planter,
      materials.planter
    );

    planter.position.set(
      x,
      1.72,
      z
    );

    scene.add(planter);

    const plant = new THREE.Mesh(
      geometries.plant,
      materials.warmLight
    );

    plant.position.set(
      x,
      2.27,
      z
    );

    scene.add(plant);
  });
}

// ============================================================
// ESTATE PLAQUE
// ============================================================

function createPlaqueTexture(name, color) {
  const w = 768;
  const h = 180;

  const canvas = document.createElement("canvas");

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");

  ctx.clearRect(
    0,
    0,
    w,
    h
  );

  ctx.fillStyle = "#050505";

  ctx.fillRect(
    0,
    0,
    w,
    h
  );

  ctx.strokeStyle =
    "#" +
    color.toString(16).padStart(6, "0");

  ctx.lineWidth = 5;

  ctx.strokeRect(
    8,
    8,
    w - 16,
    h - 16
  );

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font =
    "bold 44px Arial, sans-serif";

  ctx.fillStyle =
    "#" +
    color.toString(16).padStart(6, "0");

  ctx.fillText(
    name,
    w / 2,
    h / 2
  );

  return canvas;
}

// ============================================================
// ESTATE LANDSCAPING
// ============================================================

function buildEstateLandscaping(group, materials, geometries, theme) {
  const positions = [
    [-3.7, 0, 2.9],
    [ 3.5, 0, 2.9],
    [-3.7, 0, -2.6],
    [ 3.5, 0, -2.6],
  ];

  positions.forEach(([x, y, z]) => {
    const planter = new THREE.Mesh(
      geometries.planter,
      materials.planter
    );

    planter.position.set(
      x,
      0.25,
      z
    );

    group.add(planter);

    const plantMaterial =
      new THREE.MeshStandardMaterial({
        color: theme.color,
        emissive: theme.color,
        emissiveIntensity: 0.35,
        roughness: 0.9,
      });

    const plant = new THREE.Mesh(
      geometries.plant,
      plantMaterial
    );

    plant.position.set(
      x,
      0.78,
      z
    );

    group.add(plant);
  });
}

// ============================================================
// ESTATE
// ============================================================

function buildEstate(
  x,
  z,
  theme,
  materials,
  geometries
) {
  const group = new THREE.Group();

  // ----------------------------------------------------------
  // MAIN STRUCTURE
  // ----------------------------------------------------------

  const floor1 = new THREE.Mesh(
    geometries.estateBase,
    materials.estateBody
  );

  floor1.position.y = 2.25;

  group.add(floor1);

  // ----------------------------------------------------------
  // LOWER GLASS
  // ----------------------------------------------------------

  const glass1 = new THREE.Mesh(
    geometries.glassLower,
    materials.glass
  );

  glass1.position.set(
    0,
    2.4,
    3.55
  );

  group.add(glass1);

  // ----------------------------------------------------------
  // UPPER STRUCTURE
  // ----------------------------------------------------------

  const floor2 = new THREE.Mesh(
    geometries.estateUpper,
    materials.estateUpper
  );

  floor2.position.set(
    0.5,
    6.25,
    -0.3
  );

  group.add(floor2);

  // ----------------------------------------------------------
  // UPPER GLASS
  // ----------------------------------------------------------

  const glass2 = new THREE.Mesh(
    geometries.glassUpper,
    materials.glass
  );

  glass2.position.set(
    0.5,
    6.3,
    2.7
  );

  group.add(glass2);

  // ----------------------------------------------------------
  // ROOF
  // ----------------------------------------------------------

  const roof = new THREE.Mesh(
    geometries.roof,
    materials.roof
  );

  roof.position.set(
    0.5,
    8.1,
    -0.3
  );

  group.add(roof);

  // ----------------------------------------------------------
  // ROOF ACCENT
  // ----------------------------------------------------------

  const accentMaterial =
    new THREE.MeshStandardMaterial({
      color: theme.color,
      emissive: theme.color,
      emissiveIntensity: 2.2,
      roughness: 0.35,
    });

  const roofAccent = new THREE.Mesh(
    geometries.roofAccent,
    accentMaterial
  );

  roofAccent.position.set(
    0.5,
    8.24,
    2.85
  );

  group.add(roofAccent);

  // ----------------------------------------------------------
  // FRONT ACCENT
  // ----------------------------------------------------------

  const frontAccent = new THREE.Mesh(
    new THREE.BoxGeometry(
      8.7,
      0.06,
      0.06
    ),
    accentMaterial
  );

  frontAccent.position.set(
    0,
    1.35,
    3.62
  );

  group.add(frontAccent);

  // ----------------------------------------------------------
  // ESTATE PLAQUE
  // ----------------------------------------------------------

  const plaqueTex = new THREE.CanvasTexture(
    createPlaqueTexture(
      theme.name,
      theme.color
    )
  );

  plaqueTex.anisotropy = 4;

  const plaqueMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x050505,
      map: plaqueTex,
      emissive: 0xffffff,
      emissiveMap: plaqueTex,
      emissiveIntensity: 1.1,
      roughness: 0.4,
      metalness: 0.5,
    });

  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(
      3.4,
      0.8
    ),
    plaqueMaterial
  );

  plaque.position.set(
    0,
    4.6,
    3.63
  );

  group.add(plaque);

  // ----------------------------------------------------------
  // PRIVATE WALKWAY
  // ----------------------------------------------------------

  const walkway = new THREE.Mesh(
    geometries.walkway,
    materials.premiumWood
  );

  walkway.position.set(
    7.5,
    0.1,
    0
  );

  group.add(walkway);

  const walkwayGlow = new THREE.Mesh(
    geometries.walkwayAccent,
    accentMaterial
  );

  walkwayGlow.position.set(
    7.5,
    0.19,
    1.55
  );

  group.add(walkwayGlow);

  // Second subtle accent line

  const walkwayGlow2 = new THREE.Mesh(
    geometries.walkwayAccent,
    accentMaterial
  );

  walkwayGlow2.position.set(
    7.5,
    0.19,
    -1.55
  );

  group.add(walkwayGlow2);

  // ----------------------------------------------------------
  // LANDSCAPING
  // ----------------------------------------------------------

  buildEstateLandscaping(
    group,
    materials,
    geometries,
    theme
  );

  // ----------------------------------------------------------
  // POSITION
  // ----------------------------------------------------------

  group.position.set(
    x,
    0,
    z
  );

  return group;
}

// ============================================================
// BUILD ALL ESTATES
// ============================================================

function buildEstates(
  scene,
  materials,
  geometries
) {
  const zPositions = [
    -50,
    -35,
    -20,
    -5,
    10,
  ];

  zPositions.forEach((z, i) => {
    scene.add(
      buildEstate(
        -16,
        z,
        THEMES[i],
        materials,
        geometries
      )
    );
  });
}

// ============================================================
// INIT
// ============================================================

export default {
  init(scene) {
    const materials = createMaterials();
    const geometries = createGeometries();

    buildDockTrim(
      scene,
      materials,
      geometries
    );

    buildMooringBollards(
      scene,
      materials,
      geometries
    );

    buildDockCleats(
      scene,
      materials,
      geometries
    );

    buildLanterns(
      scene,
      materials,
      geometries
    );

    buildUnderglow(scene);

    buildDockPlanters(
      scene,
      materials,
      geometries
    );

    buildEstates(
      scene,
      materials,
      geometries
    );
  },

  update(delta) {
    time += delta;

    animatedGlows.forEach((item, index) => {
      const pulse =
        2.8 +
        Math.sin(
          time * 1.6 +
          item.offset +
          index * 0.05
        ) * 0.35;

      item.mesh.material.emissiveIntensity =
        pulse;
    });
  },
};
