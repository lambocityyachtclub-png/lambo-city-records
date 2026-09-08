import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {
    // ============================================================
    // GRAND STAGE CIRCULAR PIER
    // Centered around the existing Grand Stage:
    // Stage center = (0, -74)
    //
    // The dock walk connects to the SOUTH side.
    // Water surrounds the remaining sides.
    // ============================================================

    const PIER_X = 0;
    const PIER_Z = -74;

    const PIER_RADIUS = 30;
    const PIER_HEIGHT = 1.0;

    // ------------------------------------------------------------
    // MAIN CIRCULAR PIER
    // ------------------------------------------------------------

    const pierMaterial = new THREE.MeshStandardMaterial({
      color: 0x17131c,
      roughness: 0.7,
      metalness: 0.25
    });

    const pier = new THREE.Mesh(
      new THREE.CylinderGeometry(
        PIER_RADIUS,
        PIER_RADIUS,
        PIER_HEIGHT,
        64
      ),
      pierMaterial
    );

    pier.position.set(
      PIER_X,
      0.45,
      PIER_Z
    );

    pier.receiveShadow = true;
    pier.name = "grandStageCircularPier";

    scene.add(pier);

    // ------------------------------------------------------------
    // OUTER WATERFRONT RIM
    // ------------------------------------------------------------

    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0x08080d,
      roughness: 0.45,
      metalness: 0.65
    });

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(
        PIER_RADIUS - 0.35,
        0.45,
        8,
        96
      ),
      rimMaterial
    );

    rim.rotation.x = Math.PI / 2;

    rim.position.set(
      PIER_X,
      1.0,
      PIER_Z
    );

    rim.name = "grandStagePierRim";

    scene.add(rim);

    // ------------------------------------------------------------
    // PURPLE WATERFRONT NEON
    // ------------------------------------------------------------

    const neonMaterial = new THREE.MeshStandardMaterial({
      color: 0x9900ff,
      emissive: 0x9900ff,
      emissiveIntensity: 2.5
    });

    const neon = new THREE.Mesh(
      new THREE.TorusGeometry(
        PIER_RADIUS - 0.9,
        0.08,
        6,
        96
      ),
      neonMaterial
    );

    neon.rotation.x = Math.PI / 2;

    neon.position.set(
      PIER_X,
      1.08,
      PIER_Z
    );

    neon.name = "grandStagePierNeon";

    scene.add(neon);

    // ------------------------------------------------------------
    // LIGHTWEIGHT WATERFRONT LIGHTING
    //
    // IMPORTANT:
    // Keep decorative lighting as emissive geometry.
    // Only use 4 actual PointLights around the pier.
    // This avoids creating a large number of dynamic lights
    // on Safari / iPad / mobile WebGL.
    // ------------------------------------------------------------

    const edgeLightPositions = [
      Math.PI * 0.10,
      Math.PI * 0.90,
      Math.PI * 1.10,
      Math.PI * 1.90
    ];

    edgeLightPositions.forEach(angle => {
      const x =
        PIER_X +
        Math.cos(angle) * (PIER_RADIUS - 1.5);

      const z =
        PIER_Z +
        Math.sin(angle) * (PIER_RADIUS - 1.5);

      const light = new THREE.PointLight(
        0x9900ff,
        0.7,
        10
      );

      light.position.set(
        x,
        1.5,
        z
      );

      scene.add(light);
    });

    // ------------------------------------------------------------
    // PUBLIC WALKING ZONE
    //
    // Players can walk around the entire stage.
    // ------------------------------------------------------------

    const walkwayRing = new THREE.Mesh(
      new THREE.RingGeometry(
        10,
        PIER_RADIUS - 2,
        64
      ),
      new THREE.MeshStandardMaterial({
        color: 0x211a29,
        roughness: 0.8,
        metalness: 0.15
      })
    );

    walkwayRing.rotation.x = -Math.PI / 2;

    walkwayRing.position.set(
      PIER_X,
      0.96,
      PIER_Z
    );

    walkwayRing.name = "grandStagePublicWalk";

    scene.add(walkwayRing);

    // ------------------------------------------------------------
    // DECORATIVE CIRCULAR WALKWAY LINES
    // ------------------------------------------------------------

    [13, 18, 23, 27].forEach(radius => {
      const line = new THREE.Mesh(
        new THREE.TorusGeometry(
          radius,
          0.035,
          6,
          96
        ),
        neonMaterial
      );

      line.rotation.x = Math.PI / 2;

      line.position.set(
        PIER_X,
        1.02,
        PIER_Z
      );

      scene.add(line);
    });

    // ------------------------------------------------------------
    // CENTRAL PIER LIGHT
    //
    // Reduced intensity/range to keep the stage visually lit
    // without adding another expensive high-power light.
    // ------------------------------------------------------------

    const pierLight = new THREE.PointLight(
      0x9900ff,
      2.5,
      35
    );

    pierLight.position.set(
      PIER_X,
      5,
      PIER_Z
    );

    scene.add(pierLight);

    // ------------------------------------------------------------
    // SINGLE DOCK-WALK CONNECTION
    // ------------------------------------------------------------

    const entranceWidth = 8;
    const entranceLength = 12;

    const entrance = new THREE.Mesh(
      new THREE.BoxGeometry(
        entranceWidth,
        0.8,
        entranceLength
      ),
      pierMaterial
    );

    entrance.position.set(
      PIER_X,
      0.45,
      PIER_Z + PIER_RADIUS + entranceLength / 2 - 1
    );

    entrance.name = "grandStagePierEntrance";

    scene.add(entrance);

    // ------------------------------------------------------------
    // ENTRANCE NEON
    // ------------------------------------------------------------

    [-3.2, 3.2].forEach(xOffset => {
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(
          0.12,
          0.08,
          entranceLength
        ),
        neonMaterial
      );

      strip.position.set(
        PIER_X + xOffset,
        0.9,
        PIER_Z + PIER_RADIUS + entranceLength / 2 - 1
      );

      scene.add(strip);
    });

    // ------------------------------------------------------------
    // DEBUG REFERENCE
    // ------------------------------------------------------------

    this.pierCenter = new THREE.Vector3(
      PIER_X,
      0,
      PIER_Z
    );

    this.pierRadius = PIER_RADIUS;
  },

  update() {}
};
