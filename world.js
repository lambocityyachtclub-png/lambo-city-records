import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {

    // GROUND PLATFORM (marina base)
    const ground = new THREE.Mesh(
      new THREE.BoxGeometry(200, 0.5, 200),
      new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.9 })
    );
    ground.position.set(0, -0.5, 0);
    scene.add(ground);

    // STAGE STRUCTURE
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

    // LED SCREEN (emissive purple)
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

    // LAMBO CITY TEXT SIGN ON SCREEN
    const signTop = new THREE.Mesh(
      new THREE.BoxGeometry(20, 2, 0.3),
      new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 2
      })
    );
    signTop.position.set(0, 15.5, -82.3);
    scene.add(signTop);

    // STAGE STAIRS
    for (let i = 0; i < 4; i++) {
      const stair = new THREE.Mesh(
        new THREE.BoxGeometry(10, 0.3, 1.5),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
      );
      stair.position.set(0, 0.15 + i * 0.3, -68 - i * 1.5);
      scene.add(stair);
    }

    // MARINA BUILDINGS (background luxury villas)
    const buildingData = [
      { x: -50, z: -30, w: 12, h: 16, d: 10, color: 0x1a1a3e },
      { x: -65, z: -50, w: 10, h: 22, d: 10, color: 0x0d0d2b },
      { x: 50,  z: -30, w: 12, h: 14, d: 10, color: 0x1a1a3e },
      { x: 65,  z: -50, w: 10, h: 18, d: 10, color: 0x0d0d2b },
    ];
    buildingData.forEach(b => {
      const building = new THREE.Mesh(
        new THREE.BoxGeometry(b.w, b.h, b.d),
        new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.8 })
      );
      building.position.set(b.x, b.h / 2, b.z);
      scene.add(building);

      // window lights
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 3; col++) {
          const win = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 0.8, 0.1),
            new THREE.MeshStandardMaterial({
              color: 0xffee88,
              emissive: 0xffee88,
              emissiveIntensity: Math.random() > 0.3 ? 1 : 0
            })
          );
          win.position.set(
            b.x - 3 + col * 3,
            3 + row * 3.5,
            b.z + b.d / 2 + 0.1
          );
          scene.add(win);
        }
      }
    });

    // NEON GROUND STRIPS along dock edges
    const neonMat = new THREE.MeshStandardMaterial({
      color: 0x9900ff,
      emissive: 0x9900ff,
      emissiveIntensity: 1.5
    });
    [-7, 7].forEach(x => {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 80), neonMat);
      strip.position.set(x, 0.35, -20);
      scene.add(strip);
    });
  },
  update() {}
};
