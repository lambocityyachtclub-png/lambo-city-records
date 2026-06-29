import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let jetSkis = [];
let time = 0;

export default {
  init(scene) {
    // JET SKIS on water
    var jetSkiData = [
      { x: -20, z: -15, rot: 0.3 },
      { x: -25, z: -30, rot: -0.2 },
      { x:  22, z: -10, rot: -0.4 },
    ];

    jetSkiData.forEach(function(data) {
      var js = new THREE.Group();

      // HULL
      var hull = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.8, 1.8),
        new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 })
      );
      hull.position.y = 0.2;
      js.add(hull);

      // SEAT
      var seat = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.4, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
      );
      seat.position.set(0, 0.8, 0);
      js.add(seat);

      // NEON STRIP
      var neon = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.1, 0.1),
        new THREE.MeshStandardMaterial({
          color: 0x00ffff,
          emissive: 0x00ffff,
          emissiveIntensity: 2
        })
      );
      neon.position.set(0, 0.1, 0.95);
      js.add(neon);

      // LAMBO CITY DECAL
      var decal = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.1, 0.05),
        new THREE.MeshStandardMaterial({
          color: 0xffd700,
          emissive: 0xffd700,
          emissiveIntensity: 1
        })
      );
      decal.position.set(0, 0.65, -0.93);
      js.add(decal);

      js.position.set(data.x, -0.5, data.z);
      js.rotation.y = data.rot;
      scene.add(js);
      jetSkis.push(js);
    });

    // DOCK FLAGS
    var flagColors = [0x9900ff, 0xffd700, 0xff00aa];
    [-6, 0, 6].forEach(function(x, i) {
      var pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 5, 6),
        new THREE.MeshStandardMaterial({ color: 0x888888 })
      );
      pole.position.set(x, 2.8, 18);
      scene.add(pole);

      var flag = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.8, 0.05),
        new THREE.MeshStandardMaterial({
          color: flagColors[i],
          emissive: flagColors[i],
          emissiveIntensity: 0.3
        })
      );
      flag.position.set(x + 0.75, 5.0, 18);
      scene.add(flag);
    });

    // FLOATING BUOYS
    [-30, 30].forEach(function(x) {
      var buoy = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 8, 8),
        new THREE.MeshStandardMaterial({
          color: 0xff4400,
          emissive: 0xff2200,
          emissiveIntensity: 0.5
        })
      );
      buoy.position.set(x, 0, -20);
      scene.add(buoy);
    });
  },

  update(delta) {
    time += delta;
    jetSkis.forEach(function(js, i) {
      js.position.y = -0.5 + Math.sin(time * 0.8 + i) * 0.12;
      js.rotation.z = Math.sin(time * 0.6 + i) * 0.04;
    });
  }
};
