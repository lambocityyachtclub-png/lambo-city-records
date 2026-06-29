import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {

    // STAGE PLATFORM
    const stageMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
    const stage = new THREE.Mesh(new THREE.BoxGeometry(30, 1, 15), stageMat);
    stage.position.set(0, 0.5, -75);
    scene.add(stage);

    // STAGE BACK WALL
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(30, 18, 1),
      new THREE.MeshStandardMaterial({ color: 0x0a0a0a })
    );
    backWall.position.set(0, 10, -83);
    scene.add(backWall);

    // LED SCREEN
    const screen = new THREE.Mesh(
      new THREE.BoxGeometry(24, 12, 0.2),
      new THREE.MeshStandardMaterial({
        color: 0x9900ff,
        emissive: 0x9900ff,
        emissiveIntensity: 1.5
      })
    );
    screen.position.set(0, 10, -82.5);
    scene.add(screen);

    // GOLD SIGN
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(20, 2, 0.3),
      new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 2
      })
    );
    sign.position.set(0, 16, -82.3);
    scene.add(sign);

    // STAGE STAIRS
    for (var i = 0; i < 5; i++) {
      const stair = new THREE.Mesh(
        new THREE.BoxGeometry(12, 0.3, 1.5),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
      );
      stair.position.set(0, 0.15 + i * 0.25, -67 - i * 1.5);
      scene.add(stair);
    }

    // BACKGROUND BUILDINGS
    var buildings = [
      { x: -55, z: -40, w: 12, h: 20, color: 0x1a1a3e },
      { x: -70, z: -60, w: 10, h: 28, color: 0x0d0d2b },
      { x:  55, z: -40, w: 12, h: 18, color: 0x1a1a3e },
      { x:  70, z: -60, w: 10, h: 24, color: 0x0d0d2b },
      { x: -40, z: -80, w: 14, h: 16, color: 0x120d2b },
      { x:  40, z: -80, w: 14, h: 16, color: 0x120d2b },
    ];

    buildings.forEach(function(b) {
      const building = new THREE.Mesh(
        new THREE.BoxGeometry(b.w, b.h, 10),
        new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.8 })
      );
      building.position.set(b.x, b.h / 2, b.z);
      scene.add(building);

      // WINDOWS
      for (var row = 0; row < 5; row++) {
        for (var col = 0; col < 3; col++) {
          const lit = Math.random() > 0.35;
          const win = new THREE.Mesh(
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
    });

    // NEON GROUND STRIPS
    var neonMat = new THREE.MeshStandardMaterial({
      color: 0x9900ff,
      emissive: 0x9900ff,
      emissiveIntensity: 1.5
    });
    [-7, 7].forEach(function(x) {
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.05, 80),
        neonMat
      );
      strip.position.set(x, 0.38, -20);
      scene.add(strip);
    });

    // MARINA GROUND PADS beside dock
    var padMat = new THREE.MeshStandardMaterial({ color: 0x0a0a1a, roughness: 1 });
    [-30, 30].forEach(function(x) {
      const pad = new THREE.Mesh(
        new THREE.BoxGeometry(40, 0.3, 100),
        padMat
      );
      pad.position.set(x, -0.1, -30);
      scene.add(pad);
    });
  },

  update() {}
};
