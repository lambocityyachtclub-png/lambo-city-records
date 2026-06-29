import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {
    var stageMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });

    // STAGE PLATFORM — sits on ground
    var stage = new THREE.Mesh(
      new THREE.BoxGeometry(32, 1.2, 16), stageMat
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

    // BULL LOGO on screen
    var bull = new THREE.Mesh(
      new THREE.BoxGeometry(4, 4, 0.4),
      new THREE.MeshStandardMaterial({
        color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 2
      })
    );
    bull.position.set(0, 13, -82.2);
    scene.add(bull);

    // GOLD SIGN
    var sign = new THREE.Mesh(
      new THREE.BoxGeometry(22, 2.2, 0.3),
      new THREE.MeshStandardMaterial({
        color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 2
      })
    );
    sign.position.set(0, 17.5, -82.3);
    scene.add(sign);

    // LAMBO CITY TEXT BAR
    var textBar = new THREE.Mesh(
      new THREE.BoxGeometry(18, 1.2, 0.3),
      new THREE.MeshStandardMaterial({
        color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5
      })
    );
    textBar.position.set(0, 15.5, -82.3);
    scene.add(textBar);

    // STAGE STAIRS
    for (var i = 0; i < 5; i++) {
      var stair = new THREE.Mesh(
        new THREE.BoxGeometry(14, 0.3, 1.5),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
      );
      stair.position.set(0, 0.15 + i * 0.25, -66 - i * 1.5);
      scene.add(stair);
    }

    // STAGE SIDE TOWERS
    [-16, 16].forEach(function(x) {
      var tower = new THREE.Mesh(
        new THREE.BoxGeometry(2, 22, 2),
        new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.8 })
      );
      tower.position.set(x, 11, -82);
      scene.add(tower);

      // TOWER LIGHTS
      var tLight = new THREE.PointLight(0xff00ff, 2, 20);
      tLight.position.set(x, 20, -80);
      scene.add(tLight);
    });

    // GROUND — wide marina base
    var ground = new THREE.Mesh(
      new THREE.BoxGeometry(300, 0.4, 300),
      new THREE.MeshStandardMaterial({ color: 0x0a0a18, roughness: 1 })
    );
    ground.position.set(0, -0.2, -40);
    scene.add(ground);

    // BUILDINGS — background skyline
    var buildings = [
      { x: -55, z: -40, w: 12, h: 20, color: 0x1a1a3e },
      { x: -70, z: -60, w: 10, h: 28, color: 0x0d0d2b },
      { x: -85, z: -50, w: 8,  h: 16, color: 0x111130 },
      { x:  55, z: -40, w: 12, h: 18, color: 0x1a1a3e },
      { x:  70, z: -60, w: 10, h: 24, color: 0x0d0d2b },
      { x:  85, z: -50, w: 8,  h: 20, color: 0x111130 },
      { x: -40, z: -85, w: 14, h: 16, color: 0x120d2b },
      { x:  40, z: -85, w: 14, h: 16, color: 0x120d2b },
      { x:   0, z: -95, w: 16, h: 22, color: 0x0a0820 },
    ];

    buildings.forEach(function(b) {
      var building = new THREE.Mesh(
        new THREE.BoxGeometry(b.w, b.h, 10),
        new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.8 })
      );
      building.position.set(b.x, b.h / 2, b.z);
      scene.add(building);

      // WINDOWS
      for (var row = 0; row < 5; row++) {
        for (var col = 0; col < 3; col++) {
          var lit = Math.random() > 0.35;
          var win = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 0.8, 0.1),
            new THREE.MeshStandardMaterial({
              color: lit ? 0xffee88 : 0x222233,
              emissive: lit ? 0xffee88 : 0x000000,
              emissiveIntensity: lit ? 0.8 : 0
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

      // ROOFTOP NEON
      var roofNeon = new THREE.Mesh(
        new THREE.BoxGeometry(b.w, 0.2, 0.2),
        new THREE.MeshStandardMaterial({
          color: 0x9900ff, emissive: 0x9900ff, emissiveIntensity: 2
        })
      );
      roofNeon.position.set(b.x, b.h + 0.1, b.z + 5);
      scene.add(roofNeon);
    });

    // NEON GROUND STRIPS along dock
    var neonMat = new THREE.MeshStandardMaterial({
      color: 0x9900ff, emissive: 0x9900ff, emissiveIntensity: 1.5
    });
    [-7, 7].forEach(function(x) {
      var strip = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.05, 100), neonMat
      );
      strip.position.set(x, 0.55, -25);
      scene.add(strip);
    });
  },
  update() {}
};
