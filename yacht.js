import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {
    const yacht = new THREE.Group();

    // HULL
    const hull = new THREE.Mesh(
      new THREE.BoxGeometry(22, 3, 8),
      new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.2, metalness: 0.5 })
    );
    hull.position.y = 1.5;
    yacht.add(hull);

    // LOWER DECK
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.3, 7.5),
      new THREE.MeshStandardMaterial({ color: 0xe8e8e8 })
    );
    deck.position.y = 3.1;
    yacht.add(deck);

    // CABIN LEVEL 1
    const cabin1 = new THREE.Mesh(
      new THREE.BoxGeometry(12, 2.5, 6),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 })
    );
    cabin1.position.set(1, 4.4, 0);
    yacht.add(cabin1);

    // CABIN LEVEL 2
    const cabin2 = new THREE.Mesh(
      new THREE.BoxGeometry(7, 2, 5),
      new THREE.MeshStandardMaterial({ color: 0xf0f0f0 })
    );
    cabin2.position.set(2, 6.6, 0);
    yacht.add(cabin2);

    // BRIDGE TOP
    const bridge = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1.2, 4),
      new THREE.MeshStandardMaterial({ color: 0xe0e0e0 })
    );
    bridge.position.set(3, 8.2, 0);
    yacht.add(bridge);

    // MAST
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 10, 6),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 })
    );
    mast.position.set(3, 13, 0);
    yacht.add(mast);

    // LAMBO CITY SIGN (emissive)
    const signMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffd700,
      emissiveIntensity: 1.0
    });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(8, 1, 0.1), signMat);
    sign.position.set(0, 4, -4.1);
    yacht.add(sign);

    // NEON STRIP — hull bottom
    const neonStrip = new THREE.Mesh(
      new THREE.BoxGeometry(22, 0.15, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 2 })
    );
    neonStrip.position.set(0, 0.2, 4.1);
    yacht.add(neonStrip);

    // YACHT LIGHT
    const yachtLight = new THREE.PointLight(0x00ffff, 2, 30);
    yachtLight.position.set(0, 3, 0);
    yacht.add(yachtLight);

    yacht.position.set(35, 0, -20);
    yacht.rotation.y = Math.PI / 6;
    scene.add(yacht);
  },
  update() {}
};
