import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {

    // MARINA GROUND — left side (villas)
    var groundMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e, roughness: 1
    });
    var leftGround = new THREE.Mesh(
      new THREE.BoxGeometry(80, 0.4, 120),
      groundMat
    );
    leftGround.position.set(-47, 0.0, -20);
    scene.add(leftGround);

    // MARINA GROUND — right side (yacht/jet skis)
    var rightGround = new THREE.Mesh(
      new THREE.BoxGeometry(80, 0.4, 120),
      groundMat
    );
    rightGround.position.set(47, 0.0, -20);
    scene.add(rightGround);

    // STAGE GROUND
    var stageGround = new THREE.Mesh(
      new THREE.BoxGeometry(120, 0.4, 60),
      groundMat
    );
    stageGround.position.set(0, 0.0, -72);
    scene.add(stageGround);

    // STAGE PLATFORM
    var stage = new THREE.Mesh(
      new THREE.BoxGeometry(32, 1.2, 16),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 })
    );
    stage.position.set(0, 0.6, -74);
    scene.add(stage);

    // STAGE BACK WALL
    var backWall = new THREE.Mesh(
      new THREE.BoxGeometry(32, 20, 1),
      new THREE.MeshStandardMaterial({ color: 0x080808 })
    );
    backWall.position.set(0, 10, -83);
    scene.add(backWall);

    // LED SCREEN
    var screen = new THREE.Mesh(
      new THREE.BoxGeometry(26, 13, 0.3),
      new THREE.MeshStandardMaterial({
        color: 0x9900ff, emissive: 0x9900ff, emissiveIntensity: 1.8
      })
    );
    screen.position.set(0, 11, -82.5);
    scene.add(screen);

    // GOLD SIGN
    var sign = new THREE.Mesh(
      new THREE.BoxGeometry(22, 2.2, 0.3),
      new THREE.MeshStandardMaterial({
        color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 2
      })
    );
    sign.position.set(0, 17.5, -82.3);
    scene.add(sign);

    // TEXT BAR
    var textBar = new THREE.Mesh(
      new THREE.BoxGeometry(18, 1.2, 0.3),
      new THREE.MeshStandardMaterial({
        color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5
      })
    );
    textBar.position.set(0, 15.5, -82.3);
    scene.add(textBar);

    // STAGE TOWERS
    [-16, 16].forEach(function(x) {
      var tower = new THREE.Mesh(
        new THREE.BoxGeometry(2, 22, 2),
        new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.8 })
      );
      tower.position.set(x, 11, -82);
      scene.add(tower);
      var tLight = new THREE.PointLight(0xff00ff, 2, 20);
      tLight.position.set(x, 20, -80);
      scene.add(tLight);
    });

    // STAGE STAIRS
    for (var i = 0; i < 5; i++) {
      var stair = new THREE.Mesh(
        new THREE.BoxGeometry(14, 0.3, 1.5),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
      );
      stair.position.set(0, 0.15 + i * 0.25, -66 - i * 1.5);
      scene.add(stair);
    }

    // VILLAS — LEFT SIDE
    var villaMat = new THREE.MeshStandardMaterial({ color: 0x4a2e1a, roughness: 0.9 });
    var roofMat  = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 1 });
    var glassMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff, transparent: true, opacity: 0.5,
      emissive: 0xffaa44, emissiveIntensity: 0.3
    });

    var villaPositions = [
      { x: -38, z: 5  },
      { x: -38, z: -18 },
      { x: -38, z: -41 },
    ];

    villaPositions.forEach(function(vp) {
      // MAIN STRUCTURE
      var villa = new THREE.Mesh(
        new THREE.BoxGeometry(16, 9, 14),
        villaMat
      );
      villa.position.set(vp.x, 4.5, vp.z);
      scene.add(villa);

      // ROOF
      var roof = new THREE.Mesh(
        new THREE.BoxGeometry(17, 1, 15),
        roofMat
      );
      roof.position.set(vp.x, 9.5, vp.z);
      scene.add(roof);

      // BALCONY
      var balcony = new THREE.Mesh(
        new THREE.BoxGeometry(14, 0.3, 3),
        new THREE.MeshStandardMaterial({ color: 0x3a2010 })
      );
      balcony.position.set(vp.x, 5.5, vp.z + 7.5);
      scene.add(balcony);

      // WINDOWS — warm lit
      for (var row = 0; row < 2; row++) {
        for (var col = 0; col < 3; col++) {
          var win = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 2, 0.1),
            glassMat
          );
          win.position.set(
            vp.x - 4 + col * 4,
            3 + row * 4,
            vp.z + 7.1
          );
          scene.add(win);
        }
      }

      // VILLA WARM LIGHT
      var vLight = new THREE.PointLight(0xffaa44, 2, 16);
      vLight.position.set(vp.x, 4, vp.z + 6);
      scene.add(vLight);

      // POOL — teal glow
      var pool = new THREE.Mesh(
        new THREE.BoxGeometry(10, 0.2, 5),
        new THREE.MeshStandardMaterial({
          color: 0x00aacc, emissive: 0x00aacc,
          emissiveIntensity: 0.6, transparent: true, opacity: 0.8
        })
      );
      pool.position.set(vp.x, 0.3, vp.z + 11);
      scene.add(pool);

      var poolLight = new THREE.PointLight(0x00aacc, 1.5, 12);
      poolLight.position.set(vp.x, 1, vp.z + 11);
      scene.add(poolLight);

      // NEON TRIM on villa
      var neonTrim = new THREE.Mesh(
        new THREE.BoxGeometry(16, 0.12, 0.12),
        new THREE.MeshStandardMaterial({
          color: 0x9900ff, emissive: 0x9900ff, emissiveIntensity: 2
        })
      );
      neonTrim.position.set(vp.x, 0.4, vp.z + 7.1);
      scene.add(neonTrim);
    });

    // BUILDINGS background
    var buildings = [
      { x: -65, z: -45, w: 12, h: 20, color: 0x1a1a3e },
      { x: -80, z: -62, w: 10, h: 28, color: 0x0d0d2b },
      { x:  65, z: -45, w: 12, h: 18, color: 0x1a1a3e },
      { x:  80, z: -62, w: 10, h: 24, color: 0x0d0d2b },
      { x:   0, z: -96, w: 18, h: 22, color: 0x0a0820 },
    ];

    buildings.forEach(function(b) {
      var building = new THREE.Mesh(
        new THREE.BoxGeometry(b.w, b.h, 10),
        new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.8 })
      );
      building.position.set(b.x, b.h / 2, b.z);
      scene.add(building);

      for (var row = 0; row < 4; row++) {
        for (var col = 0; col < 3; col++) {
          if (Math.random() < 0.4) continue;
          var win = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 0.8, 0.1),
            new THREE.MeshStandardMaterial({
              color: 0xffee88, emissive: 0xffee88, emissiveIntensity: 0.8
            })
          );
          win.position.set(
            b.x - 3 + col * 3,
            3 + row * 3.5,
            b.z + 5.1
          );
          scene.add(win);
        }
      }

      var roofNeon = new THREE.Mesh(
        new THREE.BoxGeometry(b.w, 0.2, 0.2),
        new THREE.MeshStandardMaterial({
          color: 0x9900ff, emissive: 0x9900ff, emissiveIntensity: 2
        })
      );
      roofNeon.position.set(b.x, b.h + 0.1, b.z + 5);
      scene.add(roofNeon);
    });

    // NEON DOCK STRIPS
    [-7, 7].forEach(function(x) {
      var strip = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.05, 100),
        new THREE.MeshStandardMaterial({
          color: 0x9900ff, emissive: 0x9900ff, emissiveIntensity: 1.5
        })
      );
      strip.position.set(x, 0.55, -25);
      scene.add(strip);
    });
  },
  update() {}
};
