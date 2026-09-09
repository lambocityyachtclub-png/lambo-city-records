import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
let lanternLights = [];
let time = 0;
export default {
  init(scene) {
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
    const Y = 1.0;
    // ============================================================
    // DOCK CONNECTION
    //
    // The dock occupies the space BETWEEN the roundabout and the
    // boardwalk/ramp.
    //
    // Roundabout side: approximately Z = 14
    // Boardwalk/ramp side: approximately Z = 30
    //
    // This intentionally does NOT extend back toward the stage.
    // ============================================================
    const DOCK_START_Z = 14;
    const DOCK_END_Z = 30;
    const DOCK_LENGTH = DOCK_END_Z - DOCK_START_Z;
    const DOCK_CENTER_Z = (DOCK_START_Z + DOCK_END_Z) / 2;
    // ============================================================
    // MAIN DOCK BASE
    // ============================================================
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
      Y,
      DOCK_CENTER_Z
    );
    scene.add(base);
    // ============================================================
    // DOCK PLANKS
    // ============================================================
    for (
      let z = DOCK_START_Z;
      z < DOCK_END_Z;
      z += 2
    ) {
      const p = new THREE.Mesh(
        new THREE.BoxGeometry(
          13.5,
          0.15,
          1.2
        ),
        plankMat
      );
      p.position.set(
        0,
        Y + 0.28,
        z
      );
      scene.add(p);
    }
    // ============================================================
    // DOCK POSTS
    // ============================================================
    [-6, 6].forEach(x => {
      for (
        let z = DOCK_START_Z;
        z < DOCK_END_Z;
        z += 8
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
          Y - 3.5,
          z
        );
        scene.add(post);
      }
    });
    // ============================================================
    // DOCK RAILS
    // ============================================================
    [-6.2, 6.2].forEach(x => {
      const r = new THREE.Mesh(
        new THREE.BoxGeometry(
          0.12,
          0.6,
          DOCK_LENGTH
        ),
        railMat
      );
      r.position.set(
        x,
        Y + 0.6,
        DOCK_CENTER_Z
      );
      scene.add(r);
    });
    // ============================================================
    // DOCK LANTERNS
    //
    // Decorative dock lighting stays on the dock corridor only.
    // It does not continue onto the roundabout.
    // ============================================================
    let idx = 0;
    for (
      let z = DOCK_START_Z + 2;
      z < DOCK_END_Z;
      z += 8
    ) {
      [-5.5, 5.5].forEach(x => {
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
          Y + 1.5,
          z
        );
        scene.add(pole);
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
          Y + 2.9,
          z
        );
        scene.add(lantern);
        if (idx % 3 === 0) {
          const glow = new THREE.PointLight(
            0xffaa33,
            3.5,
            18
          );
          glow.position.set(
            x,
            Y + 2.9,
            z
          );
          scene.add(glow);
          lanternLights.push(glow);
        }
      });
      idx++;
    }
  },
  update(delta) {
    time += delta;
    lanternLights.forEach((l, i) => {
      l.intensity =
        3.5 +
        Math.sin(
          time * 1.8 + i * 0.4
        ) * 0.7;
    });
  }
};
