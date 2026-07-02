import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let billboards = [];
let time = 0;

export default {
  init(scene) {
    this._buildSocialBillboards(scene);
  },

  _buildSocialBillboards(scene) {
    var socialData = [
      { x: -70, z: -15, rotY:  0.5, accent: 0xff0050 },
      { x:  70, z: -15, rotY: -0.5, accent: 0xff0000 },
      { x: -75, z: -50, rotY:  0.3, accent: 0x1da1f2 },
      { x:  75, z: -50, rotY: -0.3, accent: 0xe1306c },
    ];

    socialData.forEach(function(d) {
      var group = new THREE.Group();

      var back = new THREE.Mesh(
        new THREE.BoxGeometry(14, 6, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x050505 })
      );
      group.add(back);

      var border = new THREE.Mesh(
        new THREE.BoxGeometry(14.5, 6.5, 0.2),
        new THREE.MeshStandardMaterial({
          color: d.accent, emissive: d.accent, emissiveIntensity: 0.5
        })
      );
      border.position.z = -0.2;
      group.add(border);

      var bar = new THREE.Mesh(
        new THREE.BoxGeometry(12, 1.5, 0.5),
        new THREE.MeshStandardMaterial({
          color: d.accent, emissive: d.accent, emissiveIntensity: 0.4
        })
      );
      bar.position.set(0, 1.5, 0.3);
      group.add(bar);

      // POLES — tall enough to reach ground
      [-4.5, 4.5].forEach(function(x) {
        var pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.2, 14, 6),
          new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        pole.position.set(x, -10, 0);
        group.add(pole);
      });

      var light = new THREE.PointLight(d.accent, 2, 25);
      light.position.set(0, 0, 3);
      group.add(light);

      // board at Y=10, poles reach down to Y=-3 (ground)
      group.position.set(d.x, 10, d.z);
      group.rotation.y = d.rotY;
      scene.add(group);
      billboards.push({ light: light, offset: Math.random() * Math.PI * 2 });
    });
  },

  update(delta) {
    time += delta;
    billboards.forEach(function(b) {
      b.light.intensity = 1.5 + Math.sin(time * 1.5 + b.offset) * 0.6;
    });
  }
};
