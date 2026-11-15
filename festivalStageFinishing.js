// festivalStageFinishing.js
// LAMBO CITY — GRAND STAGE REALISM FINISH
//
// A final additive construction-detail layer over the approved stage.
// Keeps the deck footprint, stage position, stair geometry, HERO routes,
// screens, performance systems, camera, controller, and waterfront untouched.
//
// Performance rules: shared materials, instanced repeated hardware,
// one procedural deck texture, and no additional real-time lights.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const STAGE = Object.freeze({
  centerX: 0,
  centerZ: -74,
  halfWidth: 22,
  halfDepth: 9,
  deckTop: 1.8,
  trussFrontZ: -79.8,
  trussBottomY: 24.39,
  towerX: [-22.8, 22.8],
  speakerX: [-24.5, 24.5],
  screenX: [-17.7, 17.7]
});

function createDeckTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to create the Grand Stage deck texture.");

  ctx.fillStyle = "#17191d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Fine, deterministic grain gives the painted anti-slip deck a subtle
  // physical surface without loading external image assets.
  let seed = 73421;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let i = 0; i < 26000; i++) {
    const shade = 24 + Math.floor(random() * 22);
    const alpha = 0.08 + random() * 0.13;
    ctx.fillStyle = "rgba(" + shade + "," + shade + "," + (shade + 3) + "," + alpha + ")";
    const x = random() * canvas.width;
    const y = random() * canvas.height;
    ctx.fillRect(x, y, 2 + random() * 7, 1 + random() * 2);
  }

  const columns = 16;
  const rows = 8;
  const cellW = canvas.width / columns;
  const cellH = canvas.height / rows;

  for (let col = 0; col < columns; col++) {
    for (let row = 0; row < rows; row++) {
      const x = col * cellW;
      const y = row * cellH;

      ctx.strokeStyle = "rgba(3,4,6,0.72)";
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 2, y + 2, cellW - 4, cellH - 4);

      ctx.strokeStyle = "rgba(112,119,128,0.13)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 6, y + 6, cellW - 12, cellH - 12);

      // Small recessed fixing points at panel corners.
      ctx.fillStyle = "rgba(5,6,8,0.78)";
      [[12, 12], [cellW - 12, 12], [12, cellH - 12], [cellW - 12, cellH - 12]]
        .forEach(([ox, oy]) => {
          ctx.beginPath();
          ctx.arc(x + ox, y + oy, 3.2, 0, Math.PI * 2);
          ctx.fill();
        });

      // A restrained brushed-metal highlight, not a glossy mirror finish.
      ctx.strokeStyle = "rgba(174,181,190,0.035)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 22, y + cellH * 0.28);
      ctx.lineTo(x + cellW - 24, y + cellH * 0.28);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function addInstancedBoxes(parent, name, size, positions, material) {
  if (!positions.length) return null;
  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(size[0], size[1], size[2]),
    material,
    positions.length
  );
  mesh.name = name;
  mesh.castShadow = false;
  mesh.receiveShadow = true;

  const helper = new THREE.Object3D();
  positions.forEach((position, index) => {
    helper.position.set(position[0], position[1], position[2]);
    helper.rotation.set(position[3] || 0, position[4] || 0, position[5] || 0);
    helper.updateMatrix();
    mesh.setMatrixAt(index, helper.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  parent.add(mesh);
  return mesh;
}

function addInstancedBolts(parent, name, positions, material, radius = 0.035) {
  if (!positions.length) return null;
  const mesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(radius * 0.78, radius, 0.025, 8),
    material,
    positions.length
  );
  mesh.name = name;
  mesh.castShadow = false;
  mesh.receiveShadow = true;

  const helper = new THREE.Object3D();
  positions.forEach((position, index) => {
    helper.position.set(position[0], position[1], position[2]);
    helper.rotation.set(position[3] || 0, position[4] || 0, position[5] || 0);
    helper.updateMatrix();
    mesh.setMatrixAt(index, helper.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  parent.add(mesh);
  return mesh;
}

function buildDeckSurface(parent) {
  const texture = createDeckTexture();
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: texture,
    bumpMap: texture,
    bumpScale: 0.018,
    metalness: 0.18,
    roughness: 0.82
  });

  const deck = new THREE.Mesh(
    new THREE.PlaneGeometry(43.55, 17.55),
    material
  );
  deck.name = "grandStageRealisticDeckSurface";
  deck.rotation.x = -Math.PI / 2;
  deck.position.set(STAGE.centerX, STAGE.deckTop + 0.004, STAGE.centerZ);
  deck.castShadow = false;
  deck.receiveShadow = true;
  parent.add(deck);
}

function buildStairAntiSlip(parent, rubberMaterial) {
  const strips = [];
  const stepCount = 8;
  const startX = 22.15;
  const stepRun = 0.88;
  const topStart = 1.68;
  const drop = 0.145;

  [-1, 1].forEach(sign => {
    for (let step = 0; step < stepCount; step++) {
      const centerX = sign * (startX + step * stepRun);
      const topY = topStart - step * drop;
      [-0.27, 0, 0.27].forEach(offset => {
        strips.push([
          centerX + sign * offset,
          topY + 0.014,
          -74
        ]);
      });
    }
  });

  addInstancedBoxes(
    parent,
    "grandStageStairAntiSlipStrips",
    [0.038, 0.018, 5.15],
    strips,
    rubberMaterial
  );
}

function buildRiggingHardware(parent, darkMetal, steel, goldMetal) {
  const motorPositions = [];
  const chainPositions = [];
  const hoistX = [-18, -12, -6, 0, 6, 12, 18];

  hoistX.forEach(x => {
    motorPositions.push([x, 24.12, STAGE.trussFrontZ]);
    for (let link = 0; link < 6; link++) {
      chainPositions.push([
        x,
        23.86 - link * 0.19,
        STAGE.trussFrontZ,
        Math.PI / 2,
        0,
        link % 2 ? 0.55 : -0.55
      ]);
    }
  });

  addInstancedBoxes(
    parent,
    "grandStageRiggingChainMotors",
    [0.72, 0.42, 0.52],
    motorPositions,
    darkMetal
  );

  const chainLinks = new THREE.InstancedMesh(
    new THREE.TorusGeometry(0.045, 0.011, 5, 8),
    steel,
    chainPositions.length
  );
  chainLinks.name = "grandStageRiggingHoistChains";
  chainLinks.castShadow = false;
  const helper = new THREE.Object3D();
  chainPositions.forEach((position, index) => {
    helper.position.set(position[0], position[1], position[2]);
    helper.rotation.set(position[3], position[4], position[5]);
    helper.updateMatrix();
    chainLinks.setMatrixAt(index, helper.matrix);
  });
  chainLinks.instanceMatrix.needsUpdate = true;
  parent.add(chainLinks);

  // Safety clamps sit directly beneath the front truss at each motor point.
  const clampPositions = hoistX.map(x => [x, 24.37, STAGE.trussFrontZ, 0, 0, 0]);
  addInstancedBoxes(
    parent,
    "grandStageRiggingSafetyClamps",
    [0.92, 0.075, 0.72],
    clampPositions,
    goldMetal
  );

  // A restrained cable conduit follows the front truss, with no new lights.
  const points = [
    new THREE.Vector3(-21.4, 24.02, -79.34),
    new THREE.Vector3(-14, 24.04, -79.34),
    new THREE.Vector3(-7, 24.02, -79.34),
    new THREE.Vector3(0, 24.05, -79.34),
    new THREE.Vector3(7, 24.02, -79.34),
    new THREE.Vector3(14, 24.04, -79.34),
    new THREE.Vector3(21.4, 24.02, -79.34)
  ];
  const cable = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 48, 0.035, 6, false),
    darkMetal
  );
  cable.name = "grandStageFrontTrussCableConduit";
  cable.castShadow = false;
  parent.add(cable);
}

function buildTowerAnchors(parent, steel) {
  const bolts = [];
  STAGE.towerX.forEach(x => {
    [-0.76, 0.76].forEach(dx => {
      [-0.76, 0.76].forEach(dz => {
        bolts.push([x + dx, 1.035, -84 + dz]);
      });
    });
  });
  addInstancedBolts(parent, "grandStageTowerBaseAnchorBolts", bolts, steel, 0.055);
}

function buildSpeakerCabinetHardware(parent, steel, goldMetal) {
  const bolts = [];
  const handles = [];

  STAGE.speakerX.forEach(x => {
    for (let cabinet = 0; cabinet < 4; cabinet++) {
      const y = 15.2 - cabinet * 2.25;
      [-0.92, 0.92].forEach(dx => {
        [-0.66, 0.66].forEach(dy => {
          bolts.push([x + dx, y + dy, -77.425, Math.PI / 2, 0, 0]);
        });
      });
      handles.push([x, y, -77.425]);
    }
  });

  addInstancedBolts(parent, "grandStageSpeakerCabinetFasteners", bolts, steel, 0.032);
  addInstancedBoxes(
    parent,
    "grandStageSpeakerCabinetHandles",
    [0.34, 0.075, 0.035],
    handles,
    goldMetal
  );
}

function buildLedCabinetSeams(parent, seamMaterial) {
  const seams = [];
  STAGE.screenX.forEach(centerX => {
    [-2.25, -0.75, 0.75, 2.25].forEach(offset => {
      seams.push([centerX + offset, 11.8, -81.975]);
    });
    [-3.0, -1.0, 1.0, 3.0].forEach(offset => {
      seams.push([centerX, 11.8 + offset, -81.975, 0, 0, Math.PI / 2]);
    });
  });

  addInstancedBoxes(
    parent,
    "grandStageLedCabinetModuleSeams",
    [0.022, 8.65, 0.012],
    seams.slice(0, 8),
    seamMaterial
  );

  const horizontal = [];
  STAGE.screenX.forEach(centerX => {
    [-3.0, -1.0, 1.0, 3.0].forEach(offset => {
      horizontal.push([centerX, 11.8 + offset, -81.975, 0, 0, Math.PI / 2]);
    });
  });
  addInstancedBoxes(
    parent,
    "grandStageLedCabinetHorizontalSeams",
    [0.022, 7.25, 0.012],
    horizontal,
    seamMaterial
  );
}

export default {
  init(scene) {
    if (!scene || scene.getObjectByName("grandStageFinishingLayer")) return;

    const root = new THREE.Group();
    root.name = "grandStageFinishingLayer";
    scene.add(root);

    const darkMetal = new THREE.MeshStandardMaterial({
      color: 0x101216,
      metalness: 0.78,
      roughness: 0.42
    });
    const steel = new THREE.MeshStandardMaterial({
      color: 0x777b82,
      metalness: 0.88,
      roughness: 0.3
    });
    const goldMetal = new THREE.MeshStandardMaterial({
      color: 0xb38a3b,
      metalness: 0.9,
      roughness: 0.26
    });
    const rubber = new THREE.MeshStandardMaterial({
      color: 0x24262a,
      metalness: 0.12,
      roughness: 0.94
    });
    const ledSeam = new THREE.MeshStandardMaterial({
      color: 0x08090b,
      metalness: 0.28,
      roughness: 0.78
    });

    buildDeckSurface(root);
    buildStairAntiSlip(root, rubber);
    buildRiggingHardware(root, darkMetal, steel, goldMetal);
    buildTowerAnchors(root, steel);
    buildSpeakerCabinetHardware(root, steel, goldMetal);
    buildLedCabinetSeams(root, ledSeam);
  },

  update() {}
};
