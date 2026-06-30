import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {

    // STAGE PLATFORM
    var stageMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
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

    // BUILDINGS — reduced count for performance
    var buildings = [
      { x: -55, z: -45, w: 12, h: 20, color: 0x1a1a3e },
      { x: -72, z: -62, w: 10, h: 28, color: 0x0d0d2b },
      { x:  55, z: -45, w: 12, h: 18, color: 0x1a1a3e },
      { x:  72, z: -62, w: 10, h: 24, color: 0x0d0d2b },
      { x:   0, z: -96, w: 18, h: 22, color: 0x0a0820 },
    ];

    buildings.forEach(function(b) {
      var building = new THREE.Mesh(
        new THREE.BoxGeometry(b.w, b.h, 10),
        new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.8 })
      );
      building.position.set(b.x, b.h / 2, b.z);
      scene.add(building);

      // WINDOWS — reduced for performance
      for (var row = 0; row < 4; row++) {
        for (var col = 0; col < 3; col++) {
          var lit = Math.random() > 0.4;
          if (!lit) continue;
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

    // NEON DOCK STRIPS
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

    // VILLAS — left side like concept image
    var villaMat = new THREE.MeshStandardMaterial({ color: 0x5c3d1e, roughness: 0.9 });
    var roofMat  = new THREE.MeshStandardMaterial({ color: 0x3a2510, roughness: 1 });
    [-1, 1].forEach(function(side) {
      for (var v = 0; v < 3; v++) {
        var villa = new THREE.Mesh(
          new THREE.BoxGeometry(14, 8, 12),
          villaMat
        );
        villa.position.set(side * 32, 4, -10 - v * 18);
        scene.add(villa);

        var roof = new THREE.Mesh(
          new THREE.BoxGeometry(15, 1, 13),
          roofMat
        );
        roof.position.set(side * 32, 8.5, -10 - v * 18);
        scene.add(roof);

        // VILLA WINDOWS
        for (var w = 0; w < 3; w++) {
          var vwin = new THREE.Mesh(
            new THREE.BoxGeometry(2, 1.5, 0.1),
            new THREE.MeshStandardMaterial({
              color: 0xffee88, emissive: 0xffee88, emissiveIntensity: 0.6,
              transparent: true, opacity: 0.8
            })
          );
          vwin.position.set(
            side * 32 - 4 + w * 4,
            4, side > 0 ? -10 - v * 18 - 6.1 : -10 - v * 18 + 6.1
          );
          scene.add(vwin);
        }

        // VILLA LIGHT
        var vLight = new THREE.PointLight(0xffaa44, 1, 12);
        vLight.position.set(side * 32, 3, -10 - v * 18);
        scene.add(vLight);
      }
    });
  },
  update() {}
};
