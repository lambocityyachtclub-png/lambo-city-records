import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

let billboards = [];
let time = 0;

export default {
  init(scene) {
    this._buildSocialBillboards(scene);
    this._buildArchGate(scene);
    this._buildNeonSigns(scene);
  },

  _buildSocialBillboards(scene) {
    var socialData = [
      {
        x: -45, y: 8, z: -10, rotY: 0.6,
        accent: 0xff0050, label: 'TIKTOK',
        sub: '@LAMBOCITY • 2.4M'
      },
      {
        x: 45, y: 8, z: -10, rotY: -0.6,
        accent: 0xff0000, label: 'YOUTUBE',
        sub: '890K SUBSCRIBERS'
      },
      {
        x: -50, y: 8, z: -45, rotY: 0.3,
        accent: 0x1da1f2, label: 'TWITTER/X',
        sub: '1.1M FOLLOWERS'
      },
      {
        x: 50, y: 8, z: -45, rotY: -0.3,
        accent: 0xe1306c, label: 'INSTAGRAM',
        sub: '3.2M FOLLOWERS'
      },
    ];

    socialData.forEach(function(d) {
      var group = new THREE.Group();

      var back = new THREE.Mesh(
        new THREE.BoxGeometry(16, 7, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x050505 })
      );
      group.add(back);

      var border = new THREE.Mesh(
        new THREE.BoxGeometry(16.5, 7.5, 0.2),
        new THREE.MeshStandardMaterial({
          color: d.accent, emissive: d.accent, emissiveIntensity: 0.5
        })
      );
      border.position.z = -0.2;
      group.add(border);

      var bar = new THREE.Mesh(
        new THREE.BoxGeometry(14, 1.8, 0.5),
        new THREE.MeshStandardMaterial({
          color: d.accent, emissive: d.accent, emissiveIntensity: 0.4
        })
      );
      bar.position.set(0, 1.8, 0.3);
      group.add(bar);

      var strip = new THREE.Mesh(
        new THREE.BoxGeometry(12, 0.9, 0.5),
        new THREE.MeshStandardMaterial({
          color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.3
        })
      );
      strip.position.set(0, -2, 0.3);
      group.add(strip);

      [-5, 5].forEach(function(x) {
        var pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.18, 10, 6),
          new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        pole.position.set(x, -8.5, 0);
        group.add(pole);
      });

      var light = new THREE.PointLight(d.accent, 1.5, 22);
      light.position.set(0, 0, 4);
      group.add(light);

      group.position.set(d.x, d.y, d.z);
      group.rotation.y = d.rotY;
      scene.add(group);
      billboards.push({ group: group, light: light, offset: Math.random() * Math.PI * 2 });
    });
  },

  _buildArchGate(scene) {
    var archMat = new THREE.MeshStandardMaterial({
      color: 0x111111, metalness: 0.8, roughness: 0.2
    });
    var goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.6
    });

    // PILLARS — slimmer, not as tall
    var leftPillar = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 8, 1.2), archMat
    );
    leftPillar.position.set(-8, 4, 24);
    scene.add(leftPillar);

    var rightPillar = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 8, 1.2), archMat
    );
    rightPillar.position.set(8, 4, 24);
    scene.add(rightPillar);

    // TOP BEAM — lower
    var beam = new THREE.Mesh(
      new THREE.BoxGeometry(18, 1, 1.2), archMat
    );
    beam.position.set(0, 8.5, 24);
    scene.add(beam);

    // GOLD SIGN
    var sign = new THREE.Mesh(
      new THREE.BoxGeometry(13, 1.6, 0.3), goldMat
    );
    sign.position.set(0, 8.5, 24.7);
    scene.add(sign);

    // ARCH LIGHTS
    [-5, 0, 5].forEach(function(x) {
      var light = new THREE.PointLight(0xffd700, 1.2, 10);
      light.position.set(x, 9, 24);
      scene.add(light);
    });
  },

  _buildNeonSigns(scene) {
    var signs = [
      { x: -55, y: 6, z: -30, color: 0x9900ff, w: 10, h: 1.4 },
      { x:  55, y: 6, z: -30, color: 0x00ffcc, w: 10, h: 1.4 },
      { x: -55, y: 4, z: -55, color: 0xff00aa, w: 8,  h: 1.1 },
      { x:  55, y: 4, z: -55, color: 0xffcc00, w: 8,  h: 1.1 },
    ];

    signs.forEach(function(s) {
      var sign = new THREE.Mesh(
        new THREE.BoxGeometry(s.w, s.h, 0.2),
        new THREE.MeshStandardMaterial({
          color: s.color, emissive: s.color, emissiveIntensity: 1.5
        })
      );
      sign.position.set(s.x, s.y, s.z);
      scene.add(sign);

      var light = new THREE.PointLight(s.color, 1.5, 14);
      light.position.set(s.x, s.y, s.z + 2);
      scene.add(light);
    });
  },

  update(delta) {
    time += delta;
    billboards.forEach(function(b) {
      b.light.intensity = 1.2 + Math.sin(time * 1.5 + b.offset) * 0.6;
    });
  }
};
