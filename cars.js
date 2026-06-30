import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {
    var carData = [
      { x: -28, z:  0,  color: 0xffcc00, rot:  0.3 },
      { x: -32, z: -18, color: 0xffffff, rot:  0.1 },
      { x:  28, z:  0,  color: 0x111111, rot: -0.3 },
      { x:  32, z: -18, color: 0xff2200, rot: -0.1 },
    ];

    carData.forEach(function(data) {
      var car = new THREE.Group();

      var body = new THREE.Mesh(
        new THREE.BoxGeometry(5, 1, 2.5),
        new THREE.MeshStandardMaterial({
          color: data.color, metalness: 0.9, roughness: 0.1
        })
      );
      body.position.y = 0.8;
      car.add(body);

      var cabin = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 0.9, 2.2),
        new THREE.MeshStandardMaterial({
          color: data.color, metalness: 0.9, roughness: 0.1
        })
      );
      cabin.position.set(-0.2, 1.75, 0);
      car.add(cabin);

      // WHEELS
      var wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
      var rimMat   = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 1 });
      [[1.6,1.3],[1.6,-1.3],[-1.6,1.3],[-1.6,-1.3]].forEach(function(w) {
        var wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.45, 0.45, 0.4, 10), wheelMat
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(w[0], 0.35, w[1]);
        car.add(wheel);
        var rim = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.2, 0.41, 8), rimMat
        );
        rim.rotation.z = Math.PI / 2;
        rim.position.set(w[0], 0.35, w[1]);
        car.add(rim);
      });

      // HEADLIGHTS
      [-0.8, 0.8].forEach(function(z) {
        var head = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 0.2, 0.2),
          new THREE.MeshStandardMaterial({
            color: 0xffffaa, emissive: 0xffffaa, emissiveIntensity: 1
          })
        );
        head.position.set(2.55, 0.9, z);
        car.add(head);
      });

      // NEON UNDERGLOW
      var neonMat = new THREE.MeshStandardMaterial({
        color: 0x9900ff, emissive: 0x9900ff, emissiveIntensity: 2
      });
      var underglow = new THREE.Mesh(
        new THREE.BoxGeometry(5, 0.05, 2.5), neonMat
      );
      underglow.position.y = 0.12;
      car.add(underglow);

      var glowLight = new THREE.PointLight(0x9900ff, 1.5, 6);
      glowLight.position.set(0, 0.2, 0);
      car.add(glowLight);

      // GROUND LEVEL
      car.position.set(data.x, 0.1, data.z);
      car.rotation.y = data.rot;
      scene.add(car);
    });
  },
  update() {}
};
