// festivalAudienceZone.js
// LAMBO CITY — GRAND STAGE AUDIENCE / PRODUCTION PIT
//
// Adds a clearly defined audience standing zone, a front-of-house
// photographer/media pit, touring crowd-control barricades, and a wide
// central security/dock corridor. This is a visual-only layer: it does not
// change player collision, HERO routing, stage geometry, or waterfront layout.
//
// Repeated hardware is instanced for iPad performance. No real-time lights.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const ZONE = Object.freeze({
  stageCenterX: 0,
  stageFrontZ: -65,
  mediaPitZ: -60.35,
  audienceFrontZ: -57.4,
  audienceBackZ: -45.4,
  halfWidth: 21.2,
  corridorHalfWidth: 6.8,
  floorY: 1.185
});

function addInstances(parent, name, size, transforms, material) {
  if (!transforms.length) return null;
  const geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
  const mesh = new THREE.InstancedMesh(geometry, material, transforms.length);
  mesh.name = name;
  mesh.castShadow = false;
  mesh.receiveShadow = true;

  const helper = new THREE.Object3D();
  transforms.forEach((item, index) => {
    helper.position.set(item.x, item.y, item.z);
    helper.rotation.set(0, item.yaw || 0, 0);
    helper.scale.set(1, 1, 1);
    helper.updateMatrix();
    mesh.setMatrixAt(index, helper.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  parent.add(mesh);
  return mesh;
}

function barrierTransforms(centers, yOffset = 0) {
  return centers.map(item => ({
    x: item.x,
    y: ZONE.floorY + yOffset,
    z: item.z,
    yaw: item.yaw || 0
  }));
}

function buildBarrierLine(parent, centers, materials) {
  const posts = [];
  const topRails = [];
  const lowerRails = [];
  const meshBars = [];
  const feet = [];

  centers.forEach(center => {
    const yaw = center.yaw || 0;
    const axisX = Math.cos(yaw);
    const axisZ = -Math.sin(yaw);

    posts.push(
      { x: center.x - axisX * 1.08, y: ZONE.floorY + 0.56, z: center.z - axisZ * 1.08, yaw },
      { x: center.x + axisX * 1.08, y: ZONE.floorY + 0.56, z: center.z + axisZ * 1.08, yaw }
    );
    topRails.push({ x: center.x, y: ZONE.floorY + 1.06, z: center.z, yaw });
    lowerRails.push({ x: center.x, y: ZONE.floorY + 0.12, z: center.z, yaw });
    feet.push(
      { x: center.x - axisX * 0.72, y: ZONE.floorY + 0.045, z: center.z - axisZ * 0.72, yaw },
      { x: center.x + axisX * 0.72, y: ZONE.floorY + 0.045, z: center.z + axisZ * 0.72, yaw }
    );

    for (let i = -3; i <= 3; i++) {
      meshBars.push({
        x: center.x + axisX * (i * 0.29),
        y: ZONE.floorY + 0.57,
        z: center.z + axisZ * (i * 0.29),
        yaw
      });
    }
  });

  addInstances(parent, "grandStageCrowdBarrierPosts", [0.075, 1.12, 0.09], posts, materials.steel);
  addInstances(parent, "grandStageCrowdBarrierTopRails", [2.28, 0.075, 0.11], topRails, materials.dark);
  addInstances(parent, "grandStageCrowdBarrierLowerRails", [2.28, 0.06, 0.09], lowerRails, materials.steel);
  addInstances(parent, "grandStageCrowdBarrierMeshBars", [0.035, 0.82, 0.045], meshBars, materials.mesh);
  addInstances(parent, "grandStageCrowdBarrierFeet", [0.48, 0.09, 0.34], feet, materials.dark);
}

function buildBarricades(parent, materials) {
  const frontCenters = [];
  const rearCenters = [];
  const sideCenters = [];

  // Two front barricade runs leave a 13.6-unit opening for the established
  // central route from the pier to the dock.
  for (let i = 0; i < 6; i++) {
    const offset = 20.0 - i * 2.4;
    frontCenters.push({ x: -offset, z: ZONE.audienceFrontZ, yaw: 0 });
    frontCenters.push({ x: offset, z: ZONE.audienceFrontZ, yaw: 0 });

    rearCenters.push({ x: -offset, z: ZONE.audienceBackZ, yaw: 0 });
    rearCenters.push({ x: offset, z: ZONE.audienceBackZ, yaw: 0 });
  }

  // Short side returns frame the audience wings without closing the
  // perimeter promenade or the right-side HERO exit route.
  for (let i = 0; i < 4; i++) {
    const z = -55.9 + i * 2.4;
    sideCenters.push({ x: -21.0, z, yaw: Math.PI / 2 });
    sideCenters.push({ x: 21.0, z, yaw: Math.PI / 2 });
  }

  buildBarrierLine(parent, frontCenters, materials);
  buildBarrierLine(parent, rearCenters, materials);
  buildBarrierLine(parent, sideCenters, materials);
}

function buildMediaPit(parent, materials) {
  const carpet = new THREE.Mesh(
    new THREE.PlaneGeometry(38.4, 3.6),
    materials.media
  );
  carpet.name = "grandStagePhotographerMediaPit";
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, ZONE.floorY + 0.012, ZONE.mediaPitZ);
  carpet.receiveShadow = true;
  parent.add(carpet);

  const edgeLines = [];
  [-19.2, 19.2].forEach(x => {
    edgeLines.push({ x, y: ZONE.floorY + 0.028, z: ZONE.mediaPitZ, yaw: 0 });
  });
  addInstances(parent, "grandStageMediaPitEdgeMarkings", [0.055, 0.018, 3.6], edgeLines, materials.gold);

  const cameraPads = [];
  [-15.8, 15.8].forEach(x => {
    cameraPads.push({ x, y: ZONE.floorY + 0.075, z: ZONE.mediaPitZ, yaw: 0 });
  });
  addInstances(parent, "grandStageMediaCameraPads", [2.2, 0.12, 1.8], cameraPads, materials.dark);
}

function buildSecurityCorridor(parent, materials) {
  const laneEdges = [];
  [-ZONE.corridorHalfWidth, ZONE.corridorHalfWidth].forEach(x => {
    laneEdges.push({ x, y: ZONE.floorY + 0.022, z: -51.3, yaw: 0 });
  });
  addInstances(parent, "grandStageCentralSecurityLaneEdges", [0.075, 0.018, 12.2], laneEdges, materials.gold);

  const gatePosts = [];
  [-1, 1].forEach(sign => {
    [-57.4, -45.4].forEach(z => {
      gatePosts.push({
        x: sign * (ZONE.corridorHalfWidth + 0.35),
        y: ZONE.floorY + 0.58,
        z,
        yaw: 0
      });
    });
  });
  addInstances(parent, "grandStageSecurityLaneGatePosts", [0.18, 1.16, 0.18], gatePosts, materials.gold);
}

export default {
  init(scene) {
    if (!scene || scene.getObjectByName("grandStageAudienceZone")) return;

    const root = new THREE.Group();
    root.name = "grandStageAudienceZone";
    scene.add(root);

    const materials = {
      dark: new THREE.MeshStandardMaterial({
        color: 0x17191d,
        metalness: 0.78,
        roughness: 0.38
      }),
      steel: new THREE.MeshStandardMaterial({
        color: 0x747a82,
        metalness: 0.86,
        roughness: 0.32
      }),
      mesh: new THREE.MeshStandardMaterial({
        color: 0x383d44,
        metalness: 0.68,
        roughness: 0.58
      }),
      gold: new THREE.MeshStandardMaterial({
        color: 0xc29a42,
        metalness: 0.88,
        roughness: 0.27,
        emissive: 0x241707,
        emissiveIntensity: 0.16
      }),
      media: new THREE.MeshStandardMaterial({
        color: 0x101115,
        metalness: 0.12,
        roughness: 0.94
      })
    };

    buildMediaPit(root, materials);
    buildBarricades(root, materials);
    buildSecurityCorridor(root, materials);
  },

  update() {}
};
