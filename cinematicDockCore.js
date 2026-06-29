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
        x: -38, y: 10, z: -15, rotY:  0.5,
        color: 0x000000, accent: 0xff0050,
        label: 'TIKTOK', sub: '@LAMBOCITY • 2.4M FOLLOWERS'
      },
      {
        x:  38, y: 10, z: -15, rotY: -0.5,
        color: 0x000000, accent: 0xff0000,
        label: 'YOUTUBE', sub: 'LAMBO CITY RECORDS • 890K SUBS'
      },
      {
        x: -42, y: 10, z: -45, rotY:  0.3,
        color: 0x000000, accent: 0x1da1f2,
        label: 'TWITTER/X', sub: '@LAMBOCITY • 1.1M FOLLOWERS'
      },
      {
        x:  42, y: 10, z: -45, rotY: -0.3,
        color: 0x000000, accent: 0xe1306c,
        label: 'INSTAGRAM', sub: '@LAMBOCITYOFFICIAL • 3.2M'
      },
    ];

    socialData.forEach(function(d) {
      var group = new THREE.Group();

      // BOARD BACKING
      var back = new THREE.Mesh(
        new THREE.BoxGeometry(18, 8, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.5 })
      );
      group.add(back);

      // ACCENT BORDER
      var border = new THREE.Mesh(
        new THREE.BoxGeometry(18.4, 8.4, 0.2),
        new THREE.MeshStandardMaterial({
          color: d.accent,
          emissive: d.accent,
          emissiveIntensity: 0.6
        })
      );
      border.position.z = -0.2;
      group.add(border);

      // PLATFORM NAME BAR
      var bar = new THREE.Mesh(
        new THREE.BoxGeometry(16, 2, 0.5),
        new THREE.MeshStandardMaterial({
          color: d.accent,
          emissive: d.accent,
          emissiveIntensity: 0.5
        })
      );
      bar.position.set(0, 2, 0.3);
      group.add(bar);

      // FOLLOWER STRIP
      var strip = new THREE.Mesh(
        new THREE.BoxGeometry(14, 1, 0.5),
        new THREE.MeshStandardMaterial({
          color: 0xffd700,
          emissive: 0xffd700,
          emissiveIntensity: 0.4
        })
      );
      strip.position.set(0, -2, 0.3);
      group.add(strip);

      // POLES
      [-6, 6].forEach(function(x) {
        var pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.2, 12, 6),
          new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        pole.position.set(x, -10, 0);
        group.add(pole);
      });

      // BILLBOARD LIGHT
      var light = new THREE.PointLight(d.accent, 2, 25);
      light.position.set(0, 0, 3);
      group.add(light);

      group.position.set(d.x, d.y, d.z);
      group.rotation.y = d.rotY;
      scene.add(group);
      billboards.push({ group: group, light: light, offset: Math.random() * Math.PI * 2 });
    });
  },

  _buildArchGate(scene) {
    // LAMBO CITY ENTRANCE ARCH over dock
    var archMat = new THREE.MeshStandardMaterial({
      color: 0x111111, metalness: 0.8, roughness: 0.2
    });
    var goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.8
    });

    // LEFT PILLAR
    var leftPillar = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 12, 1.5), archMat
    );
    leftPillar.position.set(-8, 6, 22);
    scene.add(leftPillar);

    // RIGHT PILLAR
    var rightPillar = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 12, 1.5), archMat
    );
    rightPillar.position.set(8, 6, 22);
    scene.add(rightPillar);

    // TOP BEAM
    var beam = new THREE.Mesh(
      new THREE.BoxGeometry(18, 1.2, 1.5), archMat
    );
    beam.position.set(0, 12, 22);
    scene.add(beam);

    // GOLD SIGN ON ARCH
    var sign = new THREE.Mesh(
      new THREE.BoxGeometry(14, 2, 0.3), goldMat
    );
    sign.position.set(0, 12, 22.8);
    scene.add(sign);

    // ARCH LIGHTS
    [-6, 0, 6].forEach(function(x) {
      var archLight = new THREE.PointLight(0xffd700, 1.5, 12);
      archLight.position.set(x, 13, 22);
      scene.add(archLight);
    });
  },

  _buildNeonSigns(scene) {
    // NEON SIGNS floating near buildings
    var signs = [
      { x: -50, y: 8, z: -35, color: 0x9900ff, w: 10, h: 1.5 },
      { x:  50, y: 8, z: -35, color: 0x00ffcc, w: 10, h: 1.5 },
      { x: -50, y: 5, z: -60, color: 0xff00aa, w: 8,  h: 1.2 },
      { x:  50, y: 5, z: -60, color: 0xffcc00, w: 8,  h: 1.2 },
    ];

    signs.forEach(function(s) {
      var sign = new THREE.Mesh(
        new THREE.BoxGeometry(s.w, s.h, 0.2),
        new THREE.MeshStandardMaterial({
          color: s.color,
          emissive: s.color,
          emissiveIntensity: 1.5
        })
      );
      sign.position.set(s.x, s.y, s.z);
      scene.add(sign);

      var light = new THREE.PointLight(s.color, 2, 15);
      light.position.set(s.x, s.y, s.z + 2);
      scene.add(light);
    });
  },

  update(delta) {
    time += delta;
    billboards.forEach(function(b, i) {
      b.light.intensity = 1.5 + Math.sin(time * 1.5 + b.offset) * 0.8;
    });
  }
};
