import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let lanternLights = [];
let time = 0;

export default {
  init(scene) {

    // --------------------------------------------------
    // RESET
    // --------------------------------------------------

    lanternLights = [];
    time = 0;

    // --------------------------------------------------
    // DOCK MATERIALS
    // --------------------------------------------------

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

    // --------------------------------------------------
    // FIXED WORLD CONNECTION POINTS
    //
    // DO NOT MOVE THE BOARDWALK.
    // DO NOT MOVE THE ROUNDABOUT.
    //
    // Boardwalk/dock connection:
    // X = 0
    // Z = 30
    //
    // Roundabout:
    // Center X = 30
    // Center Z = -2
    // Radius = 8
    //
    // The dock ends slightly inside the roundabout
    // so the two surfaces visually/physically connect.
    // --------------------------------------------------

    const BOARDWALK_X = 0;
    const BOARDWALK_Z = 30;

    const ROUNDABOUT_X = 30;
    const ROUNDABOUT_Z = -2;
    const ROUNDABOUT_RADIUS = 8;

    // --------------------------------------------------
    // CALCULATE DIAGONAL DOCK
    // --------------------------------------------------

    const directionX = ROUNDABOUT_X - BOARDWALK_X;
    const directionZ = ROUNDABOUT_Z - BOARDWALK_Z;

    const centerDistance = Math.sqrt(
      directionX * directionX +
      directionZ * directionZ
    );

    const directionUnitX = directionX / centerDistance;
    const directionUnitZ = directionZ / centerDistance;

    // End the centerline 1 unit inside the roundabout.
    // This gives the 14-wide dock a strong visual connection
    // into the roundabout without moving the roundabout itself.
    const dockEndRadius = ROUNDABOUT_RADIUS - 1;

    const DOCK_END_X =
      ROUNDABOUT_X -
      directionUnitX * dockEndRadius;

    const DOCK_END_Z =
      ROUNDABOUT_Z -
      directionUnitZ * dockEndRadius;

    const DOCK_START_X = BOARDWALK_X;
    const DOCK_START_Z = BOARDWALK_Z;

    const dockDX = DOCK_END_X - DOCK_START_X;
    const dockDZ = DOCK_END_Z - DOCK_START_Z;

    const DOCK_LENGTH = Math.sqrt(
      dockDX * dockDX +
      dockDZ * dockDZ
    );

    const DOCK_CENTER_X =
      (DOCK_START_X + DOCK_END_X) / 2;

    const DOCK_CENTER_Z =
      (DOCK_START_Z + DOCK_END_Z) / 2;

    // BoxGeometry's long axis is local Z.
    // Rotate the dock so local Z follows the connection line.
    const DOCK_ROTATION_Y =
      Math.atan2(dockDX, dockDZ);

    // --------------------------------------------------
    // DOCK GROUP
    //
    // Everything belongs to one rotated group.
    // This keeps the physical dock, planks, posts,
    // rails and lanterns aligned perfectly.
    // --------------------------------------------------

    const dock = new THREE.Group();

    dock.position.set(
      DOCK_CENTER_X,
      1.0,
      DOCK_CENTER_Z
    );

    dock.rotation.y = DOCK_ROTATION_Y;

    scene.add(dock);

    // --------------------------------------------------
    // MAIN DOCK BASE
    // --------------------------------------------------

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(
        14,
        0.4,
        DOCK_LENGTH
      ),
      woodMat
    );

    base.position.set(
      0,
      0,
      0
    );

    dock.add(base);

    // --------------------------------------------------
    // DOCK PLANKS
    // --------------------------------------------------

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

    // --------------------------------------------------
    // DOCK POSTS
    // --------------------------------------------------

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

    // --------------------------------------------------
    // DOCK RAILS
    // --------------------------------------------------

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

    // --------------------------------------------------
    // DOCK LANTERNS
    // --------------------------------------------------

    let idx = 0;

    for (
      let localZ = -DOCK_LENGTH / 2 + 2;
      localZ < DOCK_LENGTH / 2;
      localZ += 8
    ) {

      [-5.5, 5.5].forEach((x) => {

        // ----------------------------------------------
        // LANTERN POLE
        // ----------------------------------------------

        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(
            0.06,
            0.06,
            2.5,
            6
          ),
          new THREE.MeshStandardMaterial({
            color: 0x222222
          })
        );

        pole.position.set(
          x,
          1.5,
          localZ
        );

        dock.add(pole);

        // ----------------------------------------------
        // LANTERN
        // ----------------------------------------------

        const lantern = new THREE.Mesh(
          new THREE.BoxGeometry(
            0.4,
            0.5,
            0.4
          ),
          new THREE.MeshStandardMaterial({
            color: 0xffcc44,
            emissive: 0xffaa00,
            emissiveIntensity: 2.5
          })
        );

        lantern.position.set(
          x,
          2.9,
          localZ
        );

        dock.add(lantern);

        // ----------------------------------------------
        // LIMITED POINT LIGHTS
        // Keep the existing performance-friendly pattern.
        // ----------------------------------------------

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

  // --------------------------------------------------
  // UPDATE
  // --------------------------------------------------

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
