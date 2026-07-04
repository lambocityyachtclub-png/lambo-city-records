import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {
    var yacht = new THREE.Group();

    var hull = new THREE.Mesh(
      new THREE.BoxGeometry(22, 4, 9),
      new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.2, metalness: 0.5 })
    );
    hull.position.y = 2;
    yacht.add(hull);

    var deck = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.3, 8.5),
      new THREE.MeshStandardMaterial({ color: 0xe8e8e8 })
    );
    deck.position.y = 4.15;
    yacht.add(deck);

    var cabin1 = new THREE.Mesh(
      new THREE.BoxGeometry(12, 2.5, 7),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 })
    );
    cabin1.position.set(1, 5.5, 0);
    yacht.add(cabin1);

    var cabin2 = new THREE.Mesh(
      new THREE.BoxGeometry(7, 2, 6),
      new THREE.MeshStandardMaterial({ color: 0xf0f0f0 })
    );
    cabin2.position.set(2, 7.7, 0);
    yacht.add(cabin2);

    var bridge = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1.5, 5),
      new THREE.MeshStandardMaterial({ color: 0xe0e0e0 })
    );
    bridge.position.set(3, 9.5, 0);
    yacht.add(bridge);

    var mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 14, 6),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 })
    );
    mast.position.set(3, 17, 0);
    yacht.add(mast);

    // LAMBO CITY SIGN
    var sign = new THREE.Mesh(
      new THREE.BoxGeometry(12, 1.5, 0.15),
      new THREE.MeshStandardMaterial({
        color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 2
      })
    );
    sign.position.set(0, 6, -4.6);
    yacht.add(sign);

    // CYAN NEON STRIP
    var neon = new THREE.Mesh(
      new THREE.BoxGeometry(22, 0.2, 0.2),
      new THREE.MeshStandardMaterial({
        color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 3
      })
    );
    neon.position.set(0, 0.2, 4.6);
    yacht.add(neon);

    // WINDOWS
    [-1, 1].forEach(function(side) {
      for (var i = 0; i < 5; i++) {
        var win = new THREE.Mesh(
          new THREE.BoxGeometry(1.8, 1.0, 0.1),
          new THREE.MeshStandardMaterial({
            color: 0x88ccff, transparent: true,
            opacity: 0.8, emissive: 0x224466, emissiveIntensity: 0.6
          })
        );
        win.position.set(-5 + i * 2.5, 5.5, side * 3.55);
        yacht.add(win);
      }
    });

    // DECK RAILING
    var railMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 });
    [-4.4, 4.4].forEach(function(z) {
      var rail = new THREE.Mesh(new THREE.BoxGeometry(20, 0.1, 0.1), railMat);
      rail.position.set(0, 4.5, z);
      yacht.add(rail);
    });

    // LIGHTS
    var cyanLight = new THREE.PointLight(0x00ffff, 4, 50);
    cyanLight.position.set(0, 4, 0);
    yacht.add(cyanLight);

    var goldLight = new THREE.PointLight(0xffd700, 2, 25);
    goldLight.position.set(0, 9, -4);
    yacht.add(goldLight);

    // HULL BOTTOM at Y=0 when group Y=-2
    // So hull center at Y=2 inside group, hull bottom at Y=0
    // Water at Y=0.45, hull bottom at -2+2=0 — floats naturally
    yacht.position.set(38, -2, -28);
    yacht.rotation.y = Math.PI / 6;
    scene.add(yacht);
  },
  update() {}
};
