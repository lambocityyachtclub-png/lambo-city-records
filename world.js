import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {

    // ============================================================
    // MARINA GROUND
    // ============================================================
    // The old version used two giant 44 x 130 slabs that extended
    // underneath the yacht and across the waterfront.
    //
    // Keep land where the HQ / stores / street need it,
    // but OPEN THE WATERFRONT so the yacht clearly sits in water.
    // ============================================================

    const gm = new THREE.MeshStandardMaterial({
      color: 0x3a2010,
      roughness: 1
    });

    // NORTH / STREET-SIDE LAND
    // Supports the Records HQ, stores and boardwalk approach.
    const leftLand = new THREE.Mesh(
      new THREE.BoxGeometry(44, 0.5, 35),
      gm
    );
    leftLand.position.set(-43, 0.4, 27.5);
    scene.add(leftLand);

    const rightLand = new THREE.Mesh(
      new THREE.BoxGeometry(44, 0.5, 35),
      gm
    );
    rightLand.position.set(43, 0.4, 27.5);
    scene.add(rightLand);


    // ============================================================
    // STAGE GROUND
    // ============================================================

    const sg = new THREE.Mesh(
      new THREE.BoxGeometry(130, 0.5, 55),
      new THREE.MeshStandardMaterial({
        color: 0x0a0a14,
        roughness: 1
      })
    );

    sg.position.set(0, 0.4, -72);
    scene.add(sg);


    // ============================================================
    // STAGE PLATFORM
    // ============================================================

    const stage = new THREE.Mesh(
      new THREE.BoxGeometry(34, 1.4, 18),
      new THREE.MeshStandardMaterial({
        color: 0x0d0d0d,
        roughness: 0.5
      })
    );

    stage.position.set(0, 1.1, -74);
    scene.add(stage);


    // ============================================================
    // GRAND STAGE — LEFT AND RIGHT ACCESS STAIRS
    // ============================================================
    // Compact side staircases connect the existing stage platform
    // to the surrounding performance ground. The platform footprint
    // and overall stage scale remain unchanged.
    const stairBaseY = 0.65;
    const stairRise = 0.1;
    const stairTreadWidth = 1.1;
    const stairDepth = 6.4;
    const stairStepMaterial = new THREE.MeshStandardMaterial({
      color: 0x17131f,
      roughness: 0.48,
      metalness: 0.55
    });
    const stairNosingMaterial = new THREE.MeshStandardMaterial({
      color: 0x9900ff,
      emissive: 0x9900ff,
      emissiveIntensity: 1.35,
      metalness: 0.45,
      roughness: 0.35
    });

    [-1, 1].forEach(side => {
      for (let step = 0; step < 5; step++) {
        const stepHeight = 1.15 - (step + 1) * stairRise;
        const stepX = side * (17.55 + step * 1.05);
        const stepTop = 1.8 - (step + 1) * stairRise;

        const tread = new THREE.Mesh(
          new THREE.BoxGeometry(stairTreadWidth, stepHeight, stairDepth),
          stairStepMaterial
        );
        tread.position.set(
          stepX,
          stairBaseY + stepHeight / 2,
          -74
        );
        tread.name = `grandStageSideStair_${side > 0 ? "right" : "left"}_${step + 1}`;
        tread.receiveShadow = true;
        tread.castShadow = true;
        scene.add(tread);

        const nosing = new THREE.Mesh(
          new THREE.BoxGeometry(stairTreadWidth + 0.06, 0.07, stairDepth + 0.08),
          stairNosingMaterial
        );
        nosing.position.set(stepX, stepTop + 0.035, -74);
        nosing.name = `grandStageSideStairNosing_${side > 0 ? "right" : "left"}_${step + 1}`;
        scene.add(nosing);
      }
    });

    // ============================================================
    // STAGE BACK WALL
    // ============================================================

    const bw = new THREE.Mesh(
      new THREE.BoxGeometry(34, 22, 1.2),
      new THREE.MeshStandardMaterial({
        color: 0x060606
      })
    );

    bw.position.set(0, 11, -83.5);
    scene.add(bw);


    // ============================================================
    // LED SCREEN
    // ============================================================

    const screen = new THREE.Mesh(
      new THREE.BoxGeometry(28, 14, 0.4),
      new THREE.MeshStandardMaterial({
        color: 0x9900ff,
        emissive: 0x9900ff,
        emissiveIntensity: 2.0
      })
    );

    screen.name = "stageScreenOuter";
    screen.position.set(0, 12, -83);
    scene.add(screen);


    // ============================================================
    // SCREEN INNER
    // ============================================================

    const screenC = new THREE.Mesh(
      new THREE.BoxGeometry(22, 10, 0.5),
      new THREE.MeshStandardMaterial({
        color: 0xcc44ff,
        emissive: 0xcc44ff,
        emissiveIntensity: 1.5
      })
    );

    screenC.name = "stageScreenInner";
    screenC.position.set(0, 12, -82.8);
    scene.add(screenC);


    // ============================================================
    // GOLD SIGN
    // ============================================================

    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(24, 2.5, 0.4),
      new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 2.5
      })
    );

    sign.name = "stageGoldSign";
    sign.position.set(0, 19.5, -82.8);
    scene.add(sign);


    // ============================================================
    // STAGE TOWERS
    // ============================================================

    [-17, 17].forEach(x => {

      const t = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 26, 2.5),
        new THREE.MeshStandardMaterial({
          color: 0x080808,
          metalness: 0.7
        })
      );

      t.position.set(x, 13, -83);
      scene.add(t);


      // Tower neon strips
      [8, 14, 20].forEach(y => {

        const strip = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.15, 2.5),
          new THREE.MeshStandardMaterial({
            color: 0x9900ff,
            emissive: 0x9900ff,
            emissiveIntensity: 2
          })
        );

        strip.position.set(x, y, -83);
        scene.add(strip);
      });


      const tl = new THREE.PointLight(
        0xff00ff,
        3,
        34
      );

      tl.position.set(x, 24, -80);
      scene.add(tl);
    });


    // ============================================================
    // STAGE PLATFORM EDGE TRIM
    // ============================================================

    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x9900ff,
      emissive: 0x9900ff,
      emissiveIntensity: 2.5
    });

    [
      { w: 34.3, d: 0.15, x: 0, z: -65.1 },
      { w: 34.3, d: 0.15, x: 0, z: -82.9 },
      // Leave the side-stair openings clear; trim continues above and below each stair.
      { w: 0.15, d: 5.8, x: -17.1, z: -80.1 },
      { w: 0.15, d: 5.8, x: -17.1, z: -67.9 },
      { w: 0.15, d: 5.8, x: 17.1, z: -80.1 },
      { w: 0.15, d: 5.8, x: 17.1, z: -67.9 },
    ].forEach(e => {

      const trim = new THREE.Mesh(
        new THREE.BoxGeometry(e.w, 0.15, e.d),
        trimMat
      );

      trim.position.set(e.x, 1.85, e.z);
      scene.add(trim);
    });


    // ============================================================
    // BACKGROUND SKYLINE
    // ============================================================

    [
      {x:-68,z:-48,w:14,h:26,c:0x1a1a3e},
      {x:-85,z:-68,w:11,h:38,c:0x0d0d2b},
      {x:-102,z:-55,w:9,h:22,c:0x111130},
      {x:68,z:-48,w:14,h:24,c:0x1a1a3e},
      {x:85,z:-68,w:11,h:34,c:0x0d0d2b},
      {x:102,z:-55,w:9,h:28,c:0x111130},
      {x:0,z:-100,w:22,h:28,c:0x0a0820},
      {x:-40,z:-90,w:12,h:20,c:0x120d2b},
      {x:40,z:-90,w:12,h:20,c:0x120d2b},
    ].forEach((b, idx) => {

      const bl = new THREE.Mesh(
        new THREE.BoxGeometry(b.w, b.h, 12),
        new THREE.MeshStandardMaterial({
          color: b.c,
          roughness: 0.7,
          metalness: 0.2
        })
      );

      bl.position.set(b.x, b.h / 2, b.z);
      scene.add(bl);


      // WINDOWS
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 3; col++) {

          if (Math.random() < 0.3) continue;

          const w = new THREE.Mesh(
            new THREE.BoxGeometry(1.4, 1.0, 0.1),
            new THREE.MeshStandardMaterial({
              color: 0xffee88,
              emissive: 0xffee88,
              emissiveIntensity:
                Math.random() * 0.6 + 0.4
            })
          );

          w.position.set(
            b.x - b.w / 2 + 2 + col * 4,
            3 + row * 4,
            b.z + 6.1
          );

          scene.add(w);
        }
      }


      // ROOFTOP NEON
      const rn = new THREE.Mesh(
        new THREE.BoxGeometry(b.w + 1, 0.2, 0.2),
        new THREE.MeshStandardMaterial({
          color: 0x9900ff,
          emissive: 0x9900ff,
          emissiveIntensity: 2.5
        })
      );

      rn.position.set(
        b.x,
        b.h + 0.2,
        b.z + 6
      );

      scene.add(rn);


      // ROOFTOP LIGHT
      if (idx % 3 === 0) {

        const rl = new THREE.PointLight(
          0x9900ff,
          2.2,
          55
        );

        rl.position.set(
          b.x,
          b.h + 2,
          b.z + 6
        );

        scene.add(rl);
      }
    });


    // ============================================================
    // STAGE NEON FLOOR STRIPS
    // ============================================================

    [-12, -6, 0, 6, 12].forEach(x => {

      const s = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.06, 18),
        new THREE.MeshStandardMaterial({
          color: 0x9900ff,
          emissive: 0x9900ff,
          emissiveIntensity: 2
        })
      );

      s.position.set(x, 1.55, -70);
      scene.add(s);
    });


     // ============================================================
    // WATERFRONT NEON STRIP
    // ============================================================

    // Removed the single purple LED crossing the waterfront.
    // Dock-connected LED strips remain unchanged.

  },

  update() {}
};
