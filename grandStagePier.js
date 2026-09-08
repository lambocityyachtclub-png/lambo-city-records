import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {
    // ============================================================ 
    // GRAND STAGE CIRCULAR PIER
    // LAMBO CITY
    //
    // TEST BUILD:
    // - Wide circular promenade
    // - Uses the same material language as dock.js
    // - Keeps existing dock connection
    // - Extends behind the stage
    // - No PointLights yet
    // - No decorative lighting systems yet
    // ============================================================

    const PIER_X = 0;
    const PIER_Z = -74;

    // Expanded from the working 30-unit radius.
    const PIER_RADIUS = 44;

    // ============================================================
    // DOCK MATERIALS
    // Matched directly to the existing dock.js materials.
    // ============================================================

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x8b5e3c,
      roughness: 0.9
    });

    const plankMat = new THREE.MeshStandardMaterial({
      color: 0xa0693a,
      roughness: 0.85
    });

    const postMat = new THREE.MeshStandardMaterial({
      color: 0x5c3d1e,
      roughness: 1.0
    });

    const railMat = new THREE.MeshStandardMaterial({
      color: 0x3a2510,
      roughness: 0.8
    });

    // Dark metal accent from the luxury dock upgrade.
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x191919,
      roughness: 0.35,
      metalness: 0.75
    });

    // Purple LAMBO CITY stage accent.
    const neonMat = new THREE.MeshStandardMaterial({
      color: 0x9900ff,
      emissive: 0x9900ff,
      emissiveIntensity: 2.5
    });

    // ============================================================
    // MAIN CIRCULAR DOCK BASE
    // ============================================================

    const pier = new THREE.Mesh(
      new THREE.CylinderGeometry(
        PIER_RADIUS,
        PIER_RADIUS,
        0.55,
        64
      ),
      woodMat
    );

    pier.position.set(
      PIER_X,
      0.72,
      PIER_Z
    );

    pier.receiveShadow = true;
    pier.name = "grandStageCircularPier";

    scene.add(pier);

    // ============================================================
    // CIRCULAR WALKING SURFACE
    //
    // A second slightly raised cylinder creates the premium
    // wooden promenade surface.
    // ============================================================

    const promenade = new THREE.Mesh(
      new THREE.CylinderGeometry(
        PIER_RADIUS - 0.7,
        PIER_RADIUS - 0.7,
        0.18,
        64
      ),
      plankMat
    );

    promenade.position.set(
      PIER_X,
      1.08,
      PIER_Z
    );

    promenade.receiveShadow = true;
    promenade.name = "grandStageCircularPromenade";

    scene.add(promenade);

    // ============================================================
    // CIRCULAR PLANK BANDS
    //
    // These are subtle concentric wood bands so the surface
    // doesn't read as one giant flat disk.
    // ============================================================

    const plankBandMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b5e3c,
      roughness: 0.9
    });

    const bandRadii = [
      11,
      20,
      29,
      38
    ];

    bandRadii.forEach((radius, index) => {
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(
          radius,
          0.055,
          6,
          96
        ),
        plankBandMaterial
      );

      band.rotation.x = Math.PI / 2;

      band.position.set(
        PIER_X,
        1.19,
        PIER_Z
      );

      band.name = `grandStagePierPlankBand_${index}`;

      scene.add(band);
    });

    // ============================================================
    // OUTER DARK WOOD / METAL STRUCTURAL RIM
    // ============================================================

    const outerRim = new THREE.Mesh(
      new THREE.TorusGeometry(
        PIER_RADIUS - 0.35,
        0.48,
        8,
        96
      ),
      railMat
    );

    outerRim.rotation.x = Math.PI / 2;

    outerRim.position.set(
      PIER_X,
      1.25,
      PIER_Z
    );

    outerRim.name = "grandStagePierOuterRim";

    scene.add(outerRim);

    // ============================================================
    // INNER LUXURY TRIM
    // ============================================================

    const innerTrim = new THREE.Mesh(
      new THREE.TorusGeometry(
        PIER_RADIUS - 1.15,
        0.10,
        6,
        96
      ),
      metalMat
    );

    innerTrim.rotation.x = Math.PI / 2;

    innerTrim.position.set(
      PIER_X,
      1.25,
      PIER_Z
    );

    innerTrim.name = "grandStagePierInnerTrim";

    scene.add(innerTrim);

    // ============================================================
    // PURPLE NEON WATERFRONT ACCENT
    // ============================================================

    const neon = new THREE.Mesh(
      new THREE.TorusGeometry(
        PIER_RADIUS - 1.45,
        0.09,
        6,
        96
      ),
      neonMat
    );

    neon.rotation.x = Math.PI / 2;

    neon.position.set(
      PIER_X,
      1.30,
      PIER_Z
    );

    neon.name = "grandStagePierNeon";

    scene.add(neon);

    // ============================================================
    // OUTER SUPPORT POSTS
    //
    // Kept lightweight: no PointLights.
    // ============================================================

    const postGeometry = new THREE.CylinderGeometry(
      0.18,
      0.22,
      2.2,
      8
    );

    const postCount = 32;

    for (let i = 0; i < postCount; i++) {
      const angle = (i / postCount) * Math.PI * 2;

      const x =
        PIER_X +
        Math.cos(angle) * (PIER_RADIUS - 1.0);

      const z =
        PIER_Z +
        Math.sin(angle) * (PIER_RADIUS - 1.0);

      const post = new THREE.Mesh(
        postGeometry,
        postMat
      );

      post.position.set(
        x,
        1.85,
        z
      );

      post.name = `grandStagePierPost_${i}`;

      scene.add(post);
    }

    // ============================================================
    // LOW CIRCULAR RAIL
    //
    // This establishes the edge without making the pier feel
    // enclosed like a fenced arena.
    // ============================================================

    const rail = new THREE.Mesh(
      new THREE.TorusGeometry(
        PIER_RADIUS - 1.0,
        0.08,
        6,
        96
      ),
      railMat
    );

    rail.rotation.x = Math.PI / 2;

    rail.position.set(
      PIER_X,
      2.72,
      PIER_Z
    );

    rail.name = "grandStagePierRail";

    scene.add(rail);

    // ============================================================
    // DOCK CONNECTION
    //
    // This creates a broad wooden transition toward the existing
    // dock instead of leaving a hard visual break.
    //
    // Existing dock runs along Z, so the connection is centered
    // on the positive-Z side of the circular pier.
    // ============================================================

    const connection = new THREE.Mesh(
      new THREE.BoxGeometry(
        14,
        0.18,
        12
      ),
      plankMat
    );

    connection.position.set(
      PIER_X,
      1.12,
      PIER_Z + PIER_RADIUS - 5
    );

    connection.name = "grandStagePierDockConnection";

    scene.add(connection);

    // ============================================================
    // CONNECTION TRIM
    // ============================================================

    [-6.4, 6.4].forEach((x, index) => {
      const trim = new THREE.Mesh(
        new THREE.BoxGeometry(
          0.18,
          0.22,
          12
        ),
        railMat
      );

      trim.position.set(
        x,
        1.28,
        PIER_Z + PIER_RADIUS - 5
      );

      trim.name = `grandStagePierConnectionTrim_${index}`;

      scene.add(trim);
    });

    // ============================================================
    // STORE PIER INFORMATION
    // Other systems can use these later for interaction,
    // navigation, camera work, or yacht-view logic.
    // ============================================================

    this.pierCenter = new THREE.Vector3(
      PIER_X,
      0,
      PIER_Z
    );

    this.pierRadius = PIER_RADIUS;
  },

  update() {}
};
