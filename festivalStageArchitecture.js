// festivalStageArchitecture.js
// LAMBO CITY — GRAND STAGE ARCHITECTURAL REALISM
//
// A detail layer over the approved permanent stage.
// It deliberately preserves all stage/world coordinates, stairs,
// HERO performance and exit paths, screens, sponsor slots and pier layout.
//
// Design language: real touring-stage steelwork, fabricated metalwork,
// modular LED cabinets, detailed loudspeaker hardware and layered fascia.
// VR rule: shared materials/geometries, instancing, no new real-time lights.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let speakerConeInstances = null;
let speakerConeBasePositions = [];
let speakerPulseTime = 0;

const STAGE = Object.freeze({
  centerX: 0,
  centerZ: -74,
  halfWidth: 22,
  halfDepth: 9,
  deckTop: 1.8,
  frontZ: -65,
  rearZ: -83,
  trussLeft: -22.8,
  trussRight: 22.8,
  trussFrontZ: -83.6,
  trussRearZ: -84.4,
  trussBottomY: 26.72,
  trussTopY: 27.42
});

function addBox(parent, name, size, position, material) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size[0], size[1], size[2]),
    material
  );
  mesh.name = name;
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addInstancedBars(parent, name, bars, material, radius = 0.045) {
  if (!bars.length) return null;

  const geometry = new THREE.CylinderGeometry(radius, radius, 1, 8, 1, false);
  const instances = new THREE.InstancedMesh(geometry, material, bars.length);
  instances.name = name;
  instances.castShadow = false;
  instances.receiveShadow = true;

  const helper = new THREE.Object3D();
  const up = new THREE.Vector3(0, 1, 0);

  bars.forEach((bar, index) => {
    const start = new THREE.Vector3(...bar[0]);
    const end = new THREE.Vector3(...bar[1]);
    const direction = end.clone().sub(start);
    const length = direction.length();

    helper.position.copy(start).add(end).multiplyScalar(0.5);
    helper.quaternion.setFromUnitVectors(up, direction.normalize());
    helper.scale.set(1, length, 1);
    helper.updateMatrix();
    instances.setMatrixAt(index, helper.matrix);
  });

  instances.instanceMatrix.needsUpdate = true;
  parent.add(instances);
  return instances;
}

function buildMainTrussDetail(parent, material, accentMaterial) {
  const bars = [];
  const xStart = STAGE.trussLeft;
  const xEnd = STAGE.trussRight;
  const frontZ = STAGE.trussFrontZ;
  const rearZ = STAGE.trussRearZ;
  const low = STAGE.trussBottomY;
  const high = STAGE.trussTopY;
  const bay = 2.4;

  // Front and rear vertical web members with alternating diagonals.
  for (let x = xStart; x < xEnd - 0.01; x += bay) {
    const next = Math.min(x + bay, xEnd);
    [frontZ, rearZ].forEach(z => {
      bars.push([[x, low, z], [x, high, z]]);
      bars.push([[x, low, z], [next, high, z]]);
      bars.push([[x, high, z], [next, low, z]]);
    });
  }

  // Cross-depth braces make the overhead box truss read as real steelwork.
  for (let x = xStart; x <= xEnd + 0.01; x += bay) {
    bars.push([[x, low, frontZ], [x, low, rearZ]]);
    bars.push([[x, high, frontZ], [x, high, rearZ]]);
  }

  addInstancedBars(parent, "grandStageTrussLattice", bars, material, 0.052);

  // Small repeated gold connection collars are instanced to keep draw calls low.
  const collars = [];
  for (let x = xStart; x <= xEnd + 0.01; x += bay) {
    collars.push([[x, low, frontZ], [x, high, frontZ]]);
    collars.push([[x, low, rearZ], [x, high, rearZ]]);
  }
  addInstancedBars(parent, "grandStageTrussConnectionAccents", collars, accentMaterial, 0.075);
}

function buildTowerBracing(parent, material) {
  const bars = [];
  [-22.8, 22.8].forEach(x => {
    const zFront = -83.58;
    const zBack = -84.42;
    const bottom = 1.6;
    const top = 26.72;
    const bays = 5;
    const bayHeight = (top - bottom) / bays;

    for (let i = 0; i < bays; i++) {
      const y0 = bottom + i * bayHeight;
      const y1 = y0 + bayHeight;
      bars.push([[x, y0, zFront], [x, y1, zBack]]);
      bars.push([[x, y0, zBack], [x, y1, zFront]]);
    }
  });
  addInstancedBars(parent, "grandStageTowerCrossBracing", bars, material, 0.055);
}

function buildStageFascia(parent, darkMetal, goldMetal) {
  // Recessed side returns and structural ribs give the original deck a
  // fabricated stage-front thickness without changing its footprint.
  [-1, 1].forEach(sign => {
    addBox(
      parent,
      "grandStageFasciaSideReturn_" + sign,
      [0.28, 1.82, 17.4],
      [sign * 21.82, 1.18, -74],
      darkMetal
    );

    addBox(
      parent,
      "grandStageFasciaCornerGuard_" + sign,
      [0.12, 1.94, 0.16],
      [sign * 21.78, 1.18, -63.12],
      goldMetal
    );
  });

  const ribBars = [];
  for (let x = -20; x <= 20; x += 4) {
    ribBars.push([[x, 0.32, -63.20], [x, 2.05, -63.20]]);
  }
  addInstancedBars(parent, "grandStageFasciaStructuralRibs", ribBars, goldMetal, 0.055);

  // Narrow, layered deck-edge inlays remain outside HERO's walking surface.
  const edgeMat = new THREE.MeshStandardMaterial({
    color: 0x8c6a2b,
    metalness: 0.88,
    roughness: 0.24
  });
  addBox(parent, "grandStageDeckFrontMetalInlay", [43.6, 0.055, 0.10], [0, 1.84, -65.04], edgeMat);
  addBox(parent, "grandStageDeckRearMetalInlay", [43.6, 0.055, 0.10], [0, 1.84, -82.96], edgeMat);
  [-21.96, 21.96].forEach((x, index) => {
    addBox(parent, "grandStageDeckSideMetalInlay_" + index, [0.10, 0.055, 17.8], [x, 1.84, -74], edgeMat);
  });
}

function buildSpeakerHardware(parent) {
  const coneMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    metalness: 0.28,
    roughness: 0.82
  });
  const surroundMat = new THREE.MeshStandardMaterial({
    color: 0x5a5b60,
    metalness: 0.78,
    roughness: 0.34
  });

  const coneGeometry = new THREE.CylinderGeometry(0.34, 0.34, 0.075, 20);
  const ringGeometry = new THREE.TorusGeometry(0.37, 0.045, 6, 20);
  const cones = [];
  const rings = [];

  [-1, 1].forEach(sign => {
    for (let cabinet = 0; cabinet < 6; cabinet++) {
      const y = 20.2 - cabinet * 2.0;
      [-0.48, 0.48].forEach(offset => {
        const splay = (cabinet - 2.5) * 0.022;
        const position = [sign * 24.5, y + offset, -77.40, splay];
        cones.push(position);
        rings.push(position);
      });
    }
  });

  const coneInstances = new THREE.InstancedMesh(coneGeometry, coneMat, cones.length);
  coneInstances.name = "grandStageSpeakerCones";
  speakerConeInstances = coneInstances;
  speakerConeBasePositions = cones.map(position => position.slice());
  const ringInstances = new THREE.InstancedMesh(ringGeometry, surroundMat, rings.length);
  ringInstances.name = "grandStageSpeakerSurrounds";

  const helper = new THREE.Object3D();
  cones.forEach((position, index) => {
    helper.position.set(...position);
    helper.rotation.x = Math.PI / 2 + (position[3] || 0);
    helper.updateMatrix();
    coneInstances.setMatrixAt(index, helper.matrix);

    // TorusGeometry already faces +Z; match the cabinet's subtle splay.
    helper.rotation.set(position[3] || 0, 0, 0);
    helper.updateMatrix();
    ringInstances.setMatrixAt(index, helper.matrix);
  });

  coneInstances.instanceMatrix.needsUpdate = true;
  ringInstances.instanceMatrix.needsUpdate = true;
  parent.add(coneInstances, ringInstances);
}

function buildSideScreenFrames(parent, metal, gold) {
  [-1, 1].forEach((sign, index) => {
    const x = sign * 17.7;
    const z = -81.91;
    const y = 11.8;

    // Slim outer rails sit just forward of the existing LED surface.
    addBox(parent, "grandStageSideScreenFrameTop_" + index, [8.0, 0.16, 0.16], [x, y + 4.72, z], metal);
    addBox(parent, "grandStageSideScreenFrameBottom_" + index, [8.0, 0.16, 0.16], [x, y - 4.72, z], metal);
    addBox(parent, "grandStageSideScreenFrameLeft_" + index, [0.16, 9.25, 0.16], [x - 3.92, y, z], metal);
    addBox(parent, "grandStageSideScreenFrameRight_" + index, [0.16, 9.25, 0.16], [x + 3.92, y, z], metal);

    [-3.25, 3.25].forEach((offset, boltIndex) => {
      const bolt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.075, 0.075, 0.035, 10),
        gold
      );
      bolt.name = "grandStageSideScreenFastener_" + index + "_" + boltIndex;
      bolt.rotation.x = Math.PI / 2;
      bolt.position.set(x + offset, y + 4.72, z + 0.10);
      parent.add(bolt);
    });
  });
}

function buildLightingFixtureDetails(parent, darkMetal, lensMetal) {
  // These are physical fixture housings only. Existing stage lighting
  // systems continue to control beams; this module adds no PointLights.
  const fixturePositions = [-18, -12, -6, 0, 6, 12, 18];
  fixturePositions.forEach((x, index) => {
    const housing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.42, 0.82, 12),
      darkMetal
    );
    housing.name = "grandStageMovingHeadHousing_" + index;
    housing.rotation.x = Math.PI / 2;
    housing.position.set(x, 25.95, -80.2);
    parent.add(housing);

    const lens = new THREE.Mesh(
      new THREE.CircleGeometry(0.25, 16),
      lensMetal
    );
    lens.name = "grandStageMovingHeadLens_" + index;
    lens.position.set(x, 25.95, -79.76);
    parent.add(lens);

    const yoke = addBox(
      parent,
      "grandStageMovingHeadYoke_" + index,
      [0.12, 0.56, 0.12],
      [x, 26.38, -80.2],
      darkMetal
    );
    yoke.rotation.z = 0.08;
  });
}

export default {
  init(scene) {
    if (!scene || scene.getObjectByName("grandStageArchitecturalRealism")) return;

    const root = new THREE.Group();
    root.name = "grandStageArchitecturalRealism";
    scene.add(root);

    const darkMetal = new THREE.MeshStandardMaterial({
      color: 0x111216,
      metalness: 0.86,
      roughness: 0.31
    });
    const structuralMetal = new THREE.MeshStandardMaterial({
      color: 0x292b31,
      metalness: 0.82,
      roughness: 0.38
    });
    const goldMetal = new THREE.MeshStandardMaterial({
      color: 0xb58b3b,
      metalness: 0.9,
      roughness: 0.24
    });
    const lensMetal = new THREE.MeshBasicMaterial({
      color: 0xe8d7ff
    });

    buildMainTrussDetail(root, structuralMetal, goldMetal);
    buildTowerBracing(root, structuralMetal);
    buildStageFascia(root, darkMetal, goldMetal);
    buildSpeakerHardware(root);
    buildSideScreenFrames(root, darkMetal, goldMetal);
    buildLightingFixtureDetails(root, darkMetal, lensMetal);
  },

  update(delta, context) {
    if (!speakerConeInstances) return;

    // A restrained bass-cone excursion follows the existing live-performance
    // playback state. The 126 BPM visual pulse matches the venue's established
    // crowd-pulse rhythm without routing or modifying the approved audio chain.
    const music = context?.systems?.stageMusic;
    const playing = !!music?.isPlaying?.();
    if (playing) speakerPulseTime += delta;

    const beatDuration = 60 / 126;
    const beatPhase = (speakerPulseTime % beatDuration) / beatDuration;
    const pulse = playing ? Math.pow(Math.max(0, Math.sin(beatPhase * Math.PI)), 4) : 0;
    const excursion = pulse * 0.045;
    const helper = new THREE.Object3D();

    speakerConeBasePositions.forEach((position, index) => {
      helper.position.set(position[0], position[1], position[2] + excursion);
      helper.rotation.x = Math.PI / 2 + (position[3] || 0);
      helper.updateMatrix();
      speakerConeInstances.setMatrixAt(index, helper.matrix);
    });

    speakerConeInstances.instanceMatrix.needsUpdate = true;
  }
};
