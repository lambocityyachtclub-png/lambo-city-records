import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {
    var carData = [
      { x: -20, z: 5,  color: 0xffcc00, rot: 0.3  },
      { x: -24, z: 15, color: 0xffffff, rot: 0.1  },
      { x:  22, z: 5,  color: 0x111111, rot: -0.3 },
      { x:  26, z: 15, color: 0xff2200, rot: -0.1 },
    ];

    carData.forEach(function(data) {
      var car = new THREE.Group();

      // BODY
      var body = new THREE.Mesh(
        new THREE.BoxGeometry(5, 1, 2.5),
        new THREE.MeshStandardMaterial({
          color: data.color,
          metalness: 0.9,
          roughness: 0.1
        })
      );
      body.position.y = 0.8;
      car.add(body);

      // CABIN
      var cabin = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 0.9, 2.2),
        new THREE.MeshStandardMaterial({
          color: data.color,
          metalness: 0.9,
          roughness: 0.1
        })
      );
      cabin.position.set(-0.2, 1.75, 0);
      car.add(cabin);

      // WINDOWS
      var winMat = new THREE.MeshStandardMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.6,
        metalness: 0.5
      });
      var frontWin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 1.9), winMat);
      frontWin.position.set(1.25, 1.75, 0);
      car.add(frontWin);

      var backWin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 1.9), winMat);
      backWin.position.set(-1.25, 1.75, 0);
      car.add(backWin);

      // WHEELS
      var wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
      var rimMat   = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 1 });
      var wheelPositions = [
        [1.6, 0, 1.3], [1.6, 0, -1.3],
        [-1.6, 0, 1.3], [-1.6, 0, -1.3]
      ];
      wheelPositions.forEach(function(wp) {
        var wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.45, 0.45, 0.4, 12),
          wheelMat
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wp[0], wp[1] + 0.35, wp[2]);
        car.add(wheel);

        var rim = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.2, 0.41, 8),
          rimMat
        );
        rim.rotation.z = Math.PI / 2;
        rim.position.set(wp[0], wp[1] + 0.35, wp[2]);
        car.add(rim);
      });

      // HEADLIGHTS
      var headMat = new THREE.MeshStandardMaterial({
        color: 0xffffaa,
        emissive: 0xffffaa,
        emissiveIntensity: 1
      });
      [-0.8, 0.8].forEach(function(z) {
        var head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), headMat);
        head.position.set(2.55, 0.9, z);
        car.add(head);
      });

      // NEON UNDERGLOW
      var neonMat = new THREE.MeshStandardMaterial({
        color: 0x9900ff,
        emissive: 0x9900ff,
        emissiveIntensity: 2
      });
      var underglow = new THREE.Mesh(
        new THREE.BoxGeometry(5, 0.05, 2.5),
        neonMat
      );
      underglow.position.y = 0.12;
      car.add(underglow);

      var glowLight = new THREE.PointLight(0x9900ff, 1.5, 6);
      glowLight.position.set(0, 0.2, 0);
      car.add(glowLight);

      car.position.set(data.x, 0.5, data.z);
      car.rotation.y = data.rot;
      scene.add(car);
    });
  },
  update() {}
};
