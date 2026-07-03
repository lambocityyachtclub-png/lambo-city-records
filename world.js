import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {
    var groundMat = new THREE.MeshStandardMaterial({
      color: 0x1a1008, roughness: 1
    });

    // LEFT MARINA GROUND
    var leftGround = new THREE.Mesh(
      new THREE.BoxGeometry(60, 0.5, 130), groundMat
    );
    leftGround.position.set(-40, 0.25, -20);
    scene.add(leftGround);

    // RIGHT MARINA GROUND
    var rightGround = new THREE.Mesh(
      new THREE.BoxGeometry(60, 0.5, 130), groundMat
    );
    rightGround.position.set(40, 0.25, -20);
    scene.add(rightGround);

    // STAGE GROUND
    var stageGround = new THREE.Mesh(
      new THREE.BoxGeometry(130, 0.5, 55),
      new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 1 })
    );
    stageGround.position.set(0, 0.25, -72);
    scene.add(stageGround);

    // STAGE PLATFORM
    var stage = new THREE.Mesh(
      new THREE.BoxGeometry(32, 1.2, 16),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 })
    );
    stage.position.set(0, 1.1, -74);
    scene.add(stage);

    // STAGE BACK WALL
    var backWall = new THREE.Mesh(
      new THREE.BoxGeometry(32, 20, 1),
      new THREE.MeshStandardMaterial({ color: 0x080808 })
    );
    backWall.position.set(0, 10.5, -83);
    scene.add(backWall);

    // LED SCREEN
    var screen = new THREE.Mesh(
      new THREE.BoxGeometry(26, 13, 0.3),
      new THREE.MeshStandardMaterial({
        color: 0x9900ff, emissive: 0x9900ff, emissiveIntensity: 1.8
      })
    );
    screen.position.set(0, 11.5, -82.5);
    scene.add(screen);

    // GOLD SIGN
    var sign = new THREE.Mesh(
      new THREE.BoxGeometry(22, 2.2, 0.3),
      new THREE.MeshStandardMaterial({
        color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 2
      })
    );
    sign.position.set(0, 18, -82.3);
    scene.add(sign);

    // TEXT BAR
    var textBar = new THREE.Mesh(
      new THREE.BoxGeometry(18, 1.2, 0.3),
      new THREE.MeshStandardMaterial({
        color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5
      })
    );
    textBar.position.set(0, 16, -82.3);
    scene.add(textBar);

    // STAGE TOWERS
    [-16, 16].forEach(function(x) {
      var tower = new THREE.Mesh(
        new THREE.BoxGeometry(2, 22, 2),
        new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.8 })
      );
      tower.position.set(x, 11.5, -82);
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
      stair.position.set(0, 0.65 + i * 0.25, -66 - i * 1.5);
      scene.add(stair);
    }

    // VILLAS LEFT SIDE
    [{z: 8}, {z: -16}, {z: -40}].forEach(function(vp) {
      var x = -37;

      var villa = new THREE.Mesh(
        new THREE.BoxGeometry(18, 9, 14),
        new THREE.MeshStandardMaterial({ color: 0x4a2e1a, roughness: 0.9 })
      );
      villa.position.set(x, 5, vp.z);
      scene.add(villa);

      var roof = new THREE.Mesh(
        new THREE.BoxGeometry(19, 0.8, 15),
        new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 1 })
      );
      roof.position.set(x, 9.9, vp.z);
      scene.add(roof);

      // WINDOWS
      for (var row = 0; row < 2; row++) {
        for (var col = 0; col < 4; col++) {
          var win = new THREE.Mesh(
            new THREE.BoxGeometry(2.2, 1.8, 0.1),
            new THREE.MeshStandardMaterial({
              color: 0xffcc66, emissive: 0xffaa33, emissiveIntensity: 0.9,
              transparent: true, opacity: 0.9
            })
          );
          win.position.set(x - 6 + col * 4, 4 + row * 4, vp.z + 7.1);
          scene.add(win);
        }
      }

      var vLight = new THREE.PointLight(0xffaa44, 3, 20);
      vLight.position.set(x, 4, vp.z + 5);
      scene.add(vLight);

      // POOL
      var pool = new THREE.Mesh(
        new THREE.BoxGeometry(12, 0.2, 5),
        new THREE.MeshStandardMaterial({
          color: 0x00aacc, emissive: 0x00aacc,
          emissiveIntensity: 0.8, transparent: true, opacity: 0.85
        })
      );
      pool.position.set(x, 0.8, vp.z + 12);
      scene.add(pool);

      var poolLight = new THREE.PointLight(0x00ccff, 2, 14);
      poolLight.position.set(x, 1.5, vp.z + 12);
      scene.add(poolLight);

      // NEON TRIM
      var neon = new THREE.Mesh(
        new THREE.BoxGeometry(18, 0.1, 0.1),
        new THREE.MeshStandardMaterial({
          color: 0x9900ff, emissive: 0x9900ff, emissiveIntensity: 2
        })
      );
      neon.position.set(x, 0.8, vp.z + 7.1);
      scene.add(neon);
    });

    // BUILDINGS
    [{x:-65,z:-45,w:12,h:22,c:0x1a1a3e},
     {x:-82,z:-65,w:10,h:30,c:0x0d0d2b},
     {x: 65,z:-45,w:12,h:20,c:0x1a1a3e},
     {x: 82,z:-65,w:10,h:26,c:0x0d0d2b},
     {x:  0,z:-98,w:20,h:24,c:0x0a0820}
    ].forEach(function(b) {
      var building = new THREE.Mesh(
        new THREE.BoxGeometry(b.w, b.h, 10),
        new THREE.MeshStandardMaterial({ color: b.c, roughness: 0.8 })
      );
      building.position.set(b.x, b.h/2, b.z);
      scene.add(building);

      for (var row = 0; row < 4; row++) {
        for (var col = 0; col < 3; col++) {
          if (Math.random() < 0.35) continue;
          var win = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 0.8, 0.1),
            new THREE.MeshStandardMaterial({
              color: 0xffee88, emissive: 0xffee88, emissiveIntensity: 0.8
            })
          );
          win.position.set(b.x-3+col*3, 3+row*3.5, b.z+5.1);
          scene.add(win);
        }
      }
    });

    // NEON STRIPS
    [-7,7].forEach(function(x) {
      var strip = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.05, 100),
        new THREE.MeshStandardMaterial({
          color: 0x9900ff, emissive: 0x9900ff, emissiveIntensity: 1.5
        })
      );
      strip.position.set(x, 1.1, -20);
      scene.add(strip);
    });
  },
  update() {}
};
