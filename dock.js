import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
let lanternLights = [];
let time = 0;
export default {
  init(scene) {
    lanternLights = [];
    time = 0;
    // ============================================================
    // MATERIALS
    // ============================================================
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x8b5e3c,
      roughness: 0.9
    });
    const plankMat = new THREE.MeshStandardMaterial({
      color: 0x6d4327,
      roughness: 0.72,
      metalness: 0.02
    });
    const postMat = new THREE.MeshStandardMaterial({
      color: 0x5c3d1e,
      roughness: 1
    });
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x3a2510,
      roughness: 0.8
    });
    const lanternMetalMat = new THREE.MeshStandardMaterial({
      color: 0x222222
    });
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0xffcc44,
      emissive: 0xffaa00,
      emissiveIntensity: 2.5
    });
    // ============================================================
    // FIXED CONNECTION POINTS
    //
    // BOARDWALK:
    // X = 0
    // Z = 30
    // Y = 1.0
    //
    // ROUNDABOUT:
    // X = 30
    // Z = -2
    // Surface Y ≈ 0.175
    //
    // Neither existing landmark is moved.
    // ============================================================
    const START = new THREE.Vector3(
      0,
      1.0,
      30
    );
    const ROUNDABOUT_CENTER = new THREE.Vector3(
      30,
      0.175,
      -2
    );
    const ROUNDABOUT_RADIUS = 8;
    // ============================================================
    // STRAIGHT CENTERLINE
    //
    // The walkway goes in ONE straight line from the
    // boardwalk directly toward the roundabout.
    //
    // It finishes 1 unit inside the roundabout edge so
    // the physical dock overlaps the roundabout surface.
    // ============================================================
    const horizontalDX =
      ROUNDABOUT_CENTER.x - START.x;
    const horizontalDZ =
      ROUNDABOUT_CENTER.z - START.z;
    const horizontalDistance = Math.sqrt(
      horizontalDX * horizontalDX +
      horizontalDZ * horizontalDZ
    );
    const unitX =
      horizontalDX / horizontalDistance;
    const unitZ =
      horizontalDZ / horizontalDistance;
        const END_DISTANCE_FROM_CENTER =
      ROUNDABOUT_RADIUS - 4;
    const END = new THREE.Vector3(
      ROUNDABOUT_CENTER.x - unitX * END_DISTANCE_FROM_CENTER,
      ROUNDABOUT_CENTER.y,
      ROUNDABOUT_CENTER.z - unitZ * END_DISTANCE_FROM_CENTER
    );
    // ============================================================
    // DOCK DIMENSIONS
    // ============================================================
    const dx = END.x - START.x;
    const dy = END.y - START.y;
    const dz = END.z - START.z;
    const DOCK_LENGTH = Math.sqrt(
      dx * dx +
      dy * dy +
      dz * dz
    );
    const CENTER = new THREE.Vector3(
      (START.x + END.x) / 2,
      (START.y + END.y) / 2,
      (START.z + END.z) / 2
    );
    // ============================================================
    // DOCK GROUP
    // ============================================================
    const dock = new THREE.Group();
    dock.position.copy(CENTER);
    // Horizontal direction.
    dock.rotation.y = Math.atan2(dx, dz);
    // Slope from boardwalk down toward roundabout.
    const horizontalLength = Math.sqrt(
      dx * dx +
      dz * dz
    );
    dock.rotation.x =
      -Math.atan2(dy, horizontalLength);
    scene.add(dock);
    // ============================================================
    // MAIN DOCK
    // ============================================================
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(
        14,
        0.4,
        DOCK_LENGTH
      ),
      woodMat
    );
    dock.add(base);
    // ============================================================
    // PLANKS
    // ============================================================
    const plankSpacing = 2;
    for (
      let localZ = -DOCK_LENGTH / 2;
      localZ < DOCK_LENGTH / 2;
      localZ += plankSpacing
    ) {
      const plank = new THREE.Mesh(
        new THREE.BoxGeometry(
          13.5,
          0.15,
          1.2
        ),
        plankMat
      );
      plank.position.set(
        0,
        0.28,
        localZ
      );
      dock.add(plank);
    }
    // ============================================================
    // POSTS
    // ============================================================
    [-6, 6].forEach((x) => {
      for (
        let localZ = -DOCK_LENGTH / 2;
        localZ < DOCK_LENGTH / 2;
        localZ += 8
      ) {
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(
            0.22,
            0.22,
            8,
            8
          ),
          postMat
        );
        post.position.set(
          x,
          -3.5,
          localZ
        );
        dock.add(post);
      }
    });
    // ============================================================
    // RAILS
    // ============================================================
    [-6.2, 6.2].forEach((x) => {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(
          0.12,
          0.6,
          DOCK_LENGTH
        ),
        railMat
      );
      rail.position.set(
        x,
        0.6,
        0
      );
      dock.add(rail);
    });
    // ============================================================
    // LANTERNS
    // ============================================================
    let idx = 0;
    for (
      let localZ = -DOCK_LENGTH / 2 + 2;
      localZ < DOCK_LENGTH / 2;
      localZ += 8
    ) {
      [-5.5, 5.5].forEach((x) => {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(
            0.06,
            0.06,
            2.5,
            6
          ),
          lanternMetalMat
        );
        pole.position.set(
          x,
          1.5,
          localZ
        );
        dock.add(pole);
        const lantern = new THREE.Mesh(
          new THREE.BoxGeometry(
            0.4,
            0.5,
            0.4
          ),
          lanternMat
        );
        lantern.position.set(
          x,
          2.9,
          localZ
        );
        dock.add(lantern);
        // Keep the existing limited lighting pattern.
        if (idx % 3 === 0) {
          const glow = new THREE.PointLight(
            0xffaa33,
            3.5,
            18
          );
          glow.position.set(
            x,
            2.9,
            localZ
          );
          dock.add(glow);
          lanternLights.push(glow);
        }
      });
      idx++;
    }
  },
  // ============================================================
  // UPDATE
  // ============================================================
  update(delta) {
    time += delta;
    lanternLights.forEach((light, i) => {
      light.intensity =
        3.5 +
        Math.sin(
          time * 1.8 +
          i * 0.4
        ) * 0.7;
    });
  }
};
