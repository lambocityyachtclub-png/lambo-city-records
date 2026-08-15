// stageArchitecture.js
// LAMBO CITY — Grand Stage expansion
//
// IMPORTANT:
// This file ADDS to the existing Grand Stage built in world.js.
// It does not move, resize, or replace the existing:
// - Stage platform
// - Jumbotron
// - Stage back wall
// - Gold sign
// - Stage towers
// - Existing stairs
//
// Current world.js stage:
//   platform center: (0, 1.1, -74)
//   platform size:   34 x 1.4 x 18
//   platform top:    approximately y = 1.8
//   back wall:       z = -83.5
//
// This file is intentionally only the physical architecture.
// Hero performance logic will be added separately later.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const STAGE = {
  centerX: 0,
  platformTopY: 1.8,
  frontZ: -65,
  backZ: -83.5,

  width: 34,
  depth: 18,

  // Main performer area
  performanceX: 0,
  performanceZ: -78,
};

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.5,
    metalness: options.metalness ?? 0,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
  });
}

function addBox(scene, name, size, position, mat) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size.x, size.y, size.z),
    mat
  );

  mesh.name = name;
  mesh.position.set(position.x, position.y, position.z);
  scene.add(mesh);

  return mesh;
}

export default {
  init(scene) {
    this._scene = scene;

    this._buildPerformanceDais(scene);
    this._buildRunway(scene);
    this._buildStageEntrances(scene);
    this._buildBackstageStructure(scene);
    this._buildStageEdgeDetails(scene);
    this._buildPerformanceMarkers(scene);
  },

  // ------------------------------------------------------------
  // HERO PERFORMANCE DAIS
  // ------------------------------------------------------------
  //
  // A smaller raised platform placed ON the existing stage.
  // This is where Hero will eventually perform.
  //
  _buildPerformanceDais(scene) {
    const daisMaterial = material(0x111111, {
      roughness: 0.4,
      metalness: 0.6,
    });

    const dais = addBox(
      scene,
      "heroPerformanceDais",
      { x: 10, y: 0.5, z: 6 },
      {
        x: STAGE.performanceX,
        y: STAGE.platformTopY + 0.25,
        z: STAGE.performanceZ,
      },
      daisMaterial
    );

    // Glowing perimeter pieces
    const neonMaterial = material(0x9900ff, {
      emissive: 0x9900ff,
      emissiveIntensity: 2.5,
    });

    const trimFront = addBox(
      scene,
      "heroDaisTrimFront",
      { x: 10.2, y: 0.08, z: 0.12 },
      {
        x: STAGE.performanceX,
        y: STAGE.platformTopY + 0.54,
        z: STAGE.performanceZ + 3,
      },
      neonMaterial
    );

    const trimBack = addBox(
      scene,
      "heroDaisTrimBack",
      { x: 10.2, y: 0.08, z: 0.12 },
      {
        x: STAGE.performanceX,
        y: STAGE.platformTopY + 0.54,
        z: STAGE.performanceZ - 3,
      },
      neonMaterial
    );

    const trimLeft = addBox(
      scene,
      "heroDaisTrimLeft",
      { x: 0.12, y: 0.08, z: 6 },
      {
        x: STAGE.performanceX - 5,
        y: STAGE.platformTopY + 0.54,
        z: STAGE.performanceZ,
      },
      neonMaterial
    );

    const trimRight = addBox(
      scene,
      "heroDaisTrimRight",
      { x: 0.12, y: 0.08, z: 6 },
      {
        x: STAGE.performanceX + 5,
        y: STAGE.platformTopY + 0.54,
        z: STAGE.performanceZ,
      },
      neonMaterial
    );

    // Keep references available for the future concert controller.
    this.performanceDais = dais;
    this.performanceTrim = [
      trimFront,
      trimBack,
      trimLeft,
      trimRight,
    ];
  },

  // ------------------------------------------------------------
  // CENTER RUNWAY
  // ------------------------------------------------------------
  //
  // Extends toward the audience/player.
  // It connects visually with the existing stage stairs.
  //
  _buildRunway(scene) {
    const runwayMaterial = material(0x0d0d0d, {
      roughness: 0.45,
      metalness: 0.35,
    });

    const runway = addBox(
      scene,
      "grandStageRunway",
      { x: 4, y: 0.3, z: 10 },
      {
        x: 0,
        y: STAGE.platformTopY - 0.15,
        z: -62,
      },
      runwayMaterial
    );

    const neonMaterial = material(0x9900ff, {
      emissive: 0x9900ff,
      emissiveIntensity: 2.5,
    });

    addBox(
      scene,
      "runwayEdgeLeft",
      { x: 0.12, y: 0.08, z: 10 },
      {
        x: -2.05,
        y: STAGE.platformTopY + 0.03,
        z: -62,
      },
      neonMaterial
    );

    addBox(
      scene,
      "runwayEdgeRight",
      { x: 0.12, y: 0.08, z: 10 },
      {
        x: 2.05,
        y: STAGE.platformTopY + 0.03,
        z: -62,
      },
      neonMaterial
    );

    this.runway = runway;
  },

  // ------------------------------------------------------------
  // STAGE LEFT / STAGE RIGHT ENTRANCES
  // ------------------------------------------------------------
  //
  // These are primarily visual architecture for now.
  // Later Hero will use these locations as actual entrance/exit points.
  //
  _buildStageEntrances(scene) {
    const frameMaterial = material(0x111111, {
      roughness: 0.6,
      metalness: 0.3,
    });

    const doorwayMaterial = material(0x020202, {
      roughness: 1,
    });

    const goldMaterial = material(0xffd700, {
      emissive: 0xffd700,
      emissiveIntensity: 2,
    });

    const entranceX = [-14.5, 14.5];

    entranceX.forEach((x, index) => {
      const side = index === 0 ? "Left" : "Right";

      // Vertical entrance frame
      addBox(
        scene,
        `stageEntrance${side}Frame`,
        { x: 3, y: 6, z: 0.6 },
        {
          x,
          y: 3.2,
          z: STAGE.backZ + 0.35,
        },
        frameMaterial
      );

      // Dark doorway opening
      addBox(
        scene,
        `stageEntrance${side}Doorway`,
        { x: 2.2, y: 5, z: 0.3 },
        {
          x,
          y: 3,
          z: STAGE.backZ + 0.68,
        },
        doorwayMaterial
      );

      // Small gold light above entrance
      addBox(
        scene,
        `stageEntrance${side}Light`,
        { x: 2.3, y: 0.08, z: 0.08 },
        {
          x,
          y: 5.7,
          z: STAGE.backZ + 0.7,
        },
        goldMaterial
      );

      // Future Hero navigation point.
      // These are intentionally stored as plain Vector3 values for now.
      if (!this.heroEntrancePoints) {
        this.heroEntrancePoints = {};
      }

      this.heroEntrancePoints[side.toLowerCase()] = new THREE.Vector3(
        x,
        1.3,
        STAGE.backZ + 1.5
      );
    });
  },

  // ------------------------------------------------------------
  // BACKSTAGE STRUCTURE
  // ------------------------------------------------------------
  //
  // We deliberately DO NOT create a giant enclosed box.
  //
  // The previous Claude version used a large solid box behind the
  // stage. That could create unwanted collision/visibility problems.
  //
  // Instead, we establish the backstage area with side walls and
  // a rear wall. This gives us a real backstage volume without
  // unnecessarily filling the whole space with solid geometry.
  //
  _buildBackstageStructure(scene) {
    const backstageMaterial = material(0x080808, {
      roughness: 0.8,
      metalness: 0.2,
    });

    // Left backstage wall
    addBox(
      scene,
      "backstageLeftWall",
      { x: 0.6, y: 8, z: 12 },
      {
        x: -15,
        y: 4,
        z: -90,
      },
      backstageMaterial
    );

    // Right backstage wall
    addBox(
      scene,
      "backstageRightWall",
      { x: 0.6, y: 8, z: 12 },
      {
        x: 15,
        y: 4,
        z: -90,
      },
      backstageMaterial
    );

    // Rear wall
    addBox(
      scene,
      "backstageRearWall",
      { x: 30, y: 8, z: 0.6 },
      {
        x: 0,
        y: 4,
        z: -96,
      },
      backstageMaterial
    );

    // Small practical lights
    const practicalMaterial = material(0xffaa44, {
      emissive: 0xffaa44,
      emissiveIntensity: 1.5,
    });

    [-10, 0, 10].forEach((x, index) => {
      const light = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 8),
        practicalMaterial
      );

      light.name = `backstagePracticalLight${index}`;
      light.position.set(x, 7, -95.5);
      scene.add(light);
    });
  },

  // ------------------------------------------------------------
  // STAGE EDGE DETAILS
  // ------------------------------------------------------------
  _buildStageEdgeDetails(scene) {
    const edgeMaterial = material(0x9900ff, {
      emissive: 0x9900ff,
      emissiveIntensity: 2,
    });

    // Front edge of existing stage.
    // This does not replace the existing stage.
    addBox(
      scene,
      "grandStageFrontGlow",
      { x: 30, y: 0.08, z: 0.12 },
      {
        x: 0,
        y: 1.88,
        z: -65.05,
      },
      edgeMaterial
    );
  },

  // ------------------------------------------------------------
  // PERFORMANCE MARKERS
  // ------------------------------------------------------------
  //
  // These invisible helper objects give us reliable locations for
  // the future Hero concert system.
  //
  _buildPerformanceMarkers(scene) {
    const markerMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
    });

    const performanceStart = new THREE.Object3D();
    performanceStart.name = "heroPerformanceStart";
    performanceStart.position.set(0, 1.3, -66);
    scene.add(performanceStart);

    const performanceCenter = new THREE.Object3D();
    performanceCenter.name = "heroPerformanceCenter";
    performanceCenter.position.set(
      STAGE.performanceX,
      1.3,
      STAGE.performanceZ
    );
    scene.add(performanceCenter);

    const performanceExitLeft = new THREE.Object3D();
    performanceExitLeft.name = "heroPerformanceExitLeft";
    performanceExitLeft.position.set(-14.5, 1.3, -82);
    scene.add(performanceExitLeft);

    const performanceExitRight = new THREE.Object3D();
    performanceExitRight.name = "heroPerformanceExitRight";
    performanceExitRight.position.set(14.5, 1.3, -82);
    scene.add(performanceExitRight);

    // Store references for future systems.
    this.performancePoints = {
      start: performanceStart,
      center: performanceCenter,
      exitLeft: performanceExitLeft,
      exitRight: performanceExitRight,
    };
  },

  update() {
    // No animation or concert logic yet.
    //
    // This is intentional.
    // Stage architecture should be stable before we add:
    // - Hero navigation
    // - Performance animation
    // - Music triggers
    // - Lighting cues
    // - Crowd reactions
    // - Concert sequencing
  },
};
