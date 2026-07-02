import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let jetSkis = [];
let time = 0;

export default {
  init(scene) {
    var jetSkiData = [
      { x:  18, z: -8,  rot: -0.3 },
      { x:  22, z: -22, rot:  0.2 },
      { x:  20, z: -38, rot: -0.1 },
      { x: -20, z: -30, rot:  0.4 },
    ];

    jetSkiData.forEach(function(data) {
      var js = new THREE.Group();

      var hull = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.8, 1.8),
        new THREE.MeshStandardMaterial({
          color: 0x111111, metalness: 0.8, roughness: 0.2
        })
      );
      hull.position.y = 0.4;
      js.add(hull);

      var seat = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.5, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
      );
      seat.position.set(0, 1.0, 0);
      js.add(seat);

      var neon = new THREE.Mesh(
        new THREE.BoxGeometry(4.1, 0.08, 0.08),
        new THREE.MeshStandardMaterial({
          color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 3
        })
      );
      neon.position.set(0, 0.15, 0.95);
      js.add(neon);

      var decal = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.08, 0.05),
        new THREE.MeshStandardMaterial({
          color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 1.5
        })
      );
      decal.position.set(0, 0.65, -0.93);
      js.add(decal);

      var glow = new THREE.PointLight(0x00ffff, 1.5, 8);
      glow.position.set(0, 0.5, 0);
      js.add(glow);

      // SIT ON WATER at Y=-0.3
      js.position.set(data.x, -0.1, data.z);
      js.rotation.y = data.rot;
      scene.add(js);
      jetSkis.push(js);
    });

    // DOCK FLAGS
    var flagColors = [0x9900ff, 0xffd700, 0xff00aa];
    [-5, 0, 5].forEach(function(x, i) {
      var pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 5, 6),
        new THREE.MeshStandardMaterial({ color: 0x888888 })
      );
      pole.position.set(x, 2.5, 22);
      scene.add(pole);

      var flag = new THREE.Mesh(
        new THREE.BoxGeometry(2, 1, 0.05),
        new THREE.MeshStandardMaterial({
          color: flagColors[i], emissive: flagColors[i], emissiveIntensity: 0.4
        })
      );
      flag.position.set(x + 1, 5.5, 22);
      scene.add(flag);
    });

    // BUOYS on water
    [-22, 22].forEach(function(x) {
      var buoy = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 8, 8),
        new THREE.MeshStandardMaterial({
          color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 0.6
        })
      );
      buoy.position.set(x, 0.2, -22);
      scene.add(buoy);

      var bLight = new THREE.PointLight(0xff4400, 1, 8);
      bLight.position.set(x, 0.8, -22);
      scene.add(bLight);
    });
  },

  update(delta) {
    time += delta;
    jetSkis.forEach(function(js, i) {
      // BOB on water surface
      js.position.y = -0.1 + Math.sin(time * 0.8 + i) * 0.12;
      js.rotation.z = Math.sin(time * 0.5 + i) * 0.04;
    });
  }
};
