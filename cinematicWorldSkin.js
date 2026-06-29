import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let jetSkis = [];
let time = 0;

export default {
  init(scene) {
    var jetSkiData = [
      { x: -18, z: -12, rot:  0.3 },
      { x: -26, z: -32, rot: -0.2 },
      { x:  20, z: -10, rot: -0.4 },
      { x:  28, z: -30, rot:  0.5 },
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
      decal.position.set(0, 0.75, -0.93);
      js.add(decal);

      var glow = new THREE.PointLight(0x00ffff, 1.5, 8);
      glow.position.set(0, 0.5, 0);
      js.add(glow);

      js.position.set(data.x, 0.4, data.z);
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
      pole.position.set(x, 3, 22);
      scene.add(pole);

      var flag = new THREE.Mesh(
        new THREE.BoxGeometry(2, 1, 0.05),
        new THREE.MeshStandardMaterial({
          color: flagColors[i], emissive: flagColors[i], emissiveIntensity: 0.4
        })
      );
      flag.position.set(x + 1, 5.8, 22);
      scene.add(flag);
    });

    // BUOYS on water surface
    [-28, 28].forEach(function(x) {
      var buoy = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 8, 8),
        new THREE.MeshStandardMaterial({
          color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 0.6
        })
      );
      buoy.position.set(x, 0.7, -22);
      scene.add(buoy);

      var bLight = new THREE.PointLight(0xff4400, 1, 8);
      bLight.position.set(x, 1.2, -22);
      scene.add(bLight);
    });

    // LAMBO CITY BILLBOARD
    var bb = new THREE.Group();
    var board = new THREE.Mesh(
      new THREE.BoxGeometry(16, 6, 0.3),
      new THREE.MeshStandardMaterial({
        color: 0x9900ff, emissive: 0x9900ff, emissiveIntensity: 0.6
      })
    );
    bb.add(board);

    var boardText = new THREE.Mesh(
      new THREE.BoxGeometry(13, 1.8, 0.4),
      new THREE.MeshStandardMaterial({
        color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 1.5
      })
    );
    boardText.position.y = 0.5;
    bb.add(boardText);

    [-5, 5].forEach(function(x) {
      var pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 10, 6),
        new THREE.MeshStandardMaterial({ color: 0x444444 })
      );
      pole.position.set(x, -8, 0);
      bb.add(pole);
    });

    bb.position.set(-38, 10, -18);
    bb.rotation.y = 0.4;
    scene.add(bb);
  },

  update(delta) {
    time += delta;
    jetSkis.forEach(function(js, i) {
      js.position.y = 0.4 + Math.sin(time * 0.8 + i) * 0.15;
      js.rotation.z = Math.sin(time * 0.5 + i) * 0.04;
    });
  }
};
