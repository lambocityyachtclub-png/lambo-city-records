import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {
    var yacht = new THREE.Group();

    var hull = new THREE.Mesh(
      new THREE.BoxGeometry(22, 3, 8),
      new THREE.MeshStandardMaterial({
        color: 0xfafafa, roughness: 0.2, metalness: 0.5
      })
    );
    hull.position.y = 1.5;
    yacht.add(hull);

    var deck = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.3, 7.5),
      new THREE.MeshStandardMaterial({ color: 0xe8e8e8 })
    );
    deck.position.y = 3.1;
    yacht.add(deck);

    var cabin1 = new THREE.Mesh(
      new THREE.BoxGeometry(12, 2.5, 6),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 })
    );
    cabin1.position.set(1, 4.4, 0);
    yacht.add(cabin1);

    var cabin2 = new THREE.Mesh(
      new THREE.BoxGeometry(7, 2, 5),
      new THREE.MeshStandardMaterial({ color: 0xf0f0f0 })
    );
    cabin2.position.set(2, 6.6, 0);
    yacht.add(cabin2);

    var bridge = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1.2, 4),
      new THREE.MeshStandardMaterial({ color: 0xe0e0e0 })
    );
    bridge.position.set(3, 8.2, 0);
    yacht.add(bridge);

    var mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 12, 6),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 })
    );
    mast.position.set(3, 15, 0);
    yacht.add(mast);

    var sign = new THREE.Mesh(
      new THREE.BoxGeometry(8, 1, 0.1),
      new THREE.MeshStandardMaterial({
        color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 1.5
      })
    );
    sign.position.set(0, 4.5, -4.1);
    yacht.add(sign);

    var neon = new THREE.Mesh(
      new THREE.BoxGeometry(22, 0.15, 0.15),
      new THREE.MeshStandardMaterial({
        color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 3
      })
    );
    neon.position.set(0, 0.3, 4.1);
    yacht.add(neon);

    [-1, 1].forEach(function(side) {
      for (var i = 0; i < 4; i++) {
        var win = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, 0.8, 0.1),
          new THREE.MeshStandardMaterial({
            color: 0x88ccff, transparent: true,
            opacity: 0.7, emissive: 0x224466, emissiveIntensity: 0.5
          })
        );
        win.position.set(-4 + i * 3, 4.4, side * 3.05);
        yacht.add(win);
      }
    });

    var anchorLight = new THREE.PointLight(0x00ffff, 3, 40);
    anchorLight.position.set(0, 4, 0);
    yacht.add(anchorLight);

    var goldLight = new THREE.PointLight(0xffd700, 1.5, 20);
    goldLight.position.set(0, 8, -4);
    yacht.add(goldLight);

    // SITS ON WATER SURFACE
    yacht.position.set(36, -0.5, -25);
    yacht.rotation.y = Math.PI / 6;
    scene.add(yacht);
  },
  update() {}
};
