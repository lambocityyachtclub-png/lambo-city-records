import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {
    this._buildYachtClubZone(scene);
    this._buildLeaderboard(scene);
    this._buildFinancialDistrict(scene);
  },

  _buildYachtClubZone(scene) {
    // YACHT CLUB BUILDING — right side of marina
    var club = new THREE.Group();

    // MAIN BUILDING
    var mainBuilding = new THREE.Mesh(
      new THREE.BoxGeometry(30, 12, 20),
      new THREE.MeshStandardMaterial({
        color: 0x0d0d1a, roughness: 0.3, metalness: 0.6
      })
    );
    mainBuilding.position.y = 6;
    club.add(mainBuilding);

    // GLASS FACADE
    var glass = new THREE.Mesh(
      new THREE.BoxGeometry(28, 10, 0.2),
      new THREE.MeshStandardMaterial({
        color: 0x003355, transparent: true,
        opacity: 0.6, metalness: 0.9
      })
    );
    glass.position.set(0, 6, 10.1);
    club.add(glass);

    // GOLD TRIM TOP
    var trim = new THREE.Mesh(
      new THREE.BoxGeometry(30.5, 0.5, 20.5),
      new THREE.MeshStandardMaterial({
        color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.5
      })
    );
    trim.position.y = 12.25;
    club.add(trim);

    // ROOFTOP DECK
    var roof = new THREE.Mesh(
      new THREE.BoxGeometry(28, 0.3, 18),
      new THREE.MeshStandardMaterial({ color: 0x111122 })
    );
    roof.position.y = 12.5;
    club.add(roof);

    // ROOFTOP POOL (cyan glow)
    var pool = new THREE.Mesh(
      new THREE.BoxGeometry(12, 0.2, 8),
      new THREE.MeshStandardMaterial({
        color: 0x00aacc, emissive: 0x00aacc,
        emissiveIntensity: 0.8, transparent: true, opacity: 0.85
      })
    );
    pool.position.set(0, 12.7, 0);
    club.add(pool);

    var poolLight = new THREE.PointLight(0x00ccff, 3, 20);
    poolLight.position.set(0, 14, 0);
    club.add(poolLight);

    // VIP SIGN
    var vipSign = new THREE.Mesh(
      new THREE.BoxGeometry(12, 2, 0.3),
      new THREE.MeshStandardMaterial({
        color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 1.5
      })
    );
    vipSign.position.set(0, 13.5, 10.2);
    club.add(vipSign);

    // ENTRANCE STEPS
    for (var i = 0; i < 4; i++) {
      var step = new THREE.Mesh(
        new THREE.BoxGeometry(10, 0.3, 1.5),
        new THREE.MeshStandardMaterial({ color: 0x222233 })
      );
      step.position.set(0, i * 0.3, 11.5 + i * 1.2);
      club.add(step);
    }

    // ENTRANCE PILLARS
    [-4, 4].forEach(function(x) {
      var pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 10, 8),
        new THREE.MeshStandardMaterial({
          color: 0xcccccc, metalness: 0.9, roughness: 0.1
        })
      );
      pillar.position.set(x, 5, 10.5);
      club.add(pillar);

      var pillarLight = new THREE.PointLight(0xffd700, 1.5, 8);
      pillarLight.position.set(x, 10, 10.5);
      club.add(pillarLight);
    });

    // NEON STRIPS on building
    var neonColors = [0x9900ff, 0x00ffff, 0xff00aa];
    [3, 6, 9].forEach(function(y, i) {
      var strip = new THREE.Mesh(
        new THREE.BoxGeometry(30, 0.12, 0.12),
        new THREE.MeshStandardMaterial({
          color: neonColors[i], emissive: neonColors[i], emissiveIntensity: 2
        })
      );
      strip.position.set(0, y, 10.1);
      club.add(strip);
    });

    club.position.set(55, 0, -35);
    club.rotation.y = -Math.PI / 2;
    scene.add(club);

    // VIP VELVET ROPE
    var ropeData = [
      { x: 48, z: -22 }, { x: 48, z: -28 },
      { x: 48, z: -34 }, { x: 48, z: -40 }
    ];
    ropeData.forEach(function(r) {
      var post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 2.5, 6),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1 })
      );
      post.position.set(r.x, 1.25, r.z);
      scene.add(post);
    });

    var rope = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.08, 18),
      new THREE.MeshStandardMaterial({
        color: 0xcc0000, emissive: 0x880000, emissiveIntensity: 0.3
      })
    );
    rope.position.set(48, 1.8, -31);
    scene.add(rope);
  },

  _buildLeaderboard(scene) {
    // LEADERBOARD SCREEN near yacht club entrance
    var board = new THREE.Group();

    var screen = new THREE.Mesh(
      new THREE.BoxGeometry(10, 14, 0.3),
      new THREE.MeshStandardMaterial({
        color: 0x050510, roughness: 0.5
      })
    );
    board.add(screen);

    // HEADER BAR
    var header = new THREE.Mesh(
      new THREE.BoxGeometry(10, 2, 0.4),
      new THREE.MeshStandardMaterial({
        color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.8
      })
    );
    header.position.set(0, 6, 0.2);
    board.add(header);

    // RANK BARS
    var rankColors = [0xffd700, 0xcccccc, 0xcc8844, 0x9900ff, 0x00ffff];
    for (var i = 0; i < 5; i++) {
      var bar = new THREE.Mesh(
        new THREE.BoxGeometry(8, 1.2, 0.35),
        new THREE.MeshStandardMaterial({
          color: rankColors[i],
          emissive: rankColors[i],
          emissiveIntensity: 0.2
        })
      );
      bar.position.set(0, 3.5 - i * 2, 0.2);
      board.add(bar);
    }

    // BOARD LIGHT
    var light = new THREE.PointLight(0xffd700, 2, 15);
    light.position.set(0, 0, 3);
    board.add(light);

    // POLE
    var pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 4, 6),
      new THREE.MeshStandardMaterial({ color: 0x444444 })
    );
    pole.position.set(0, -9, 0);
    board.add(pole);

    board.position.set(42, 10, -20);
    board.rotation.y = -Math.PI / 2;
    scene.add(board);

    // HTML LEADERBOARD OVERLAY — appears when near
    this._createLeaderboardHTML();
  },

  _createLeaderboardHTML() {
    var lb = document.createElement('div');
    lb.id = 'leaderboard';
    lb.style.cssText = `
      position:fixed;top:50%;right:20px;
      transform:translateY(-50%);
      background:rgba(0,0,0,0.85);
      border:1px solid rgba(255,215,0,0.4);
      border-radius:12px;padding:16px;
      color:white;font-family:Arial,sans-serif;
      width:200px;z-index:100;
      display:none;
      box-shadow:0 0 30px rgba(255,215,0,0.2);
    `;
    lb.innerHTML = `
      <div style="color:#ffd700;font-size:10px;letter-spacing:2px;
        text-align:center;margin-bottom:10px;border-bottom:1px solid rgba(255,215,0,0.2);
        padding-bottom:8px;">
        🏆 CITIZEN LEADERBOARD
      </div>
      ${this._lbRow('1', '👑', 'HERO', 'LEGEND', '#ffd700')}
      ${this._lbRow('2', '💎', 'CIPHER', 'ELITE', '#cccccc')}
      ${this._lbRow('3', '🔥', 'BLAZE', 'VIP', '#cc8844')}
      ${this._lbRow('4', '⚡', 'NEON', 'MEMBER', '#9900ff')}
      ${this._lbRow('5', '🌊', 'WAVE', 'MEMBER', '#00ffff')}
      <div style="margin-top:10px;padding-top:8px;
        border-top:1px solid rgba(255,255,255,0.1);
        color:#666;font-size:9px;text-align:center;letter-spacing:1px;">
        YOU — CITIZEN • RANK #247
      </div>
    `;
    document.body.appendChild(lb);
    this._leaderboardEl = lb;
  },

  _lbRow(rank, icon, name, title, color) {
    return `
      <div style="display:flex;align-items:center;gap:8px;
        margin-bottom:7px;padding:5px 6px;
        background:rgba(255,255,255,0.03);border-radius:6px;">
        <div style="color:${color};font-size:11px;width:14px;">${rank}</div>
        <div style="font-size:14px;">${icon}</div>
        <div style="flex:1;">
          <div style="color:white;font-size:10px;font-weight:bold;">${name}</div>
          <div style="color:${color};font-size:8px;letter-spacing:1px;">${title}</div>
        </div>
      </div>
    `;
  },

  _buildFinancialDistrict(scene) {
    // FINANCIAL KIOSKS along dock sides
    var kioskData = [
      { x: -20, z: -5,  color: 0x00ff88, label: 'INVEST' },
      { x:  20, z: -5,  color: 0xff00aa, label: 'NFT'    },
      { x: -20, z: -35, color: 0x00ccff, label: 'REALTY' },
      { x:  20, z: -35, color:
