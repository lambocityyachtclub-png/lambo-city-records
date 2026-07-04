import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export default {
  init(scene) {
    this._buildBoulevard(scene);
    this._buildHotels(scene);
    this._buildRestaurantRow(scene);
    this._buildBoatSlips(scene);
    this._buildFreewayOnRamp(scene);
    this._buildMarinaPalms(scene);
    this._buildMarinaNeon(scene);
  },

  _buildBoulevard(scene) {
    // MAIN WATERFRONT BOULEVARD — runs east/west at Z=150
    var roadMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
    var road = new THREE.Mesh(
      new THREE.BoxGeometry(300, 0.3, 18), roadMat
    );
    road.position.set(0, 0.5, 150);
    scene.add(road);

    // ROAD LANE MARKINGS
    var markMat = new THREE.MeshStandardMaterial({
      color: 0xffcc00, emissive: 0xffcc00, emissiveIntensity: 0.3
    });
    for (var x = -140; x < 140; x += 12) {
      var mark = new THREE.Mesh(
        new THREE.BoxGeometry(6, 0.05, 0.4), markMat
      );
      mark.position.set(x, 0.66, 150);
      scene.add(mark);
    }

    // SIDEWALKS
    var sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x888877, roughness: 1 });
    [-1, 1].forEach(function(side) {
      var sidewalk = new THREE.Mesh(
        new THREE.BoxGeometry(300, 0.3, 6), sidewalkMat
      );
      sidewalk.position.set(0, 0.55, 150 + side * 12);
      scene.add(sidewalk);
    });

    // BOULEVARD GROUND FILL
    var ground = new THREE.Mesh(
      new THREE.BoxGeometry(300, 0.4, 140),
      new THREE.MeshStandardMaterial({ color: 0x2a1a08, roughness: 1 })
    );
    ground.position.set(0, 0.3, 90);
    scene.add(ground);

    // STREET LIGHTS along boulevard
    for (var lx = -130; lx <= 130; lx += 20) {
      var pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
      );
      pole.position.set(lx, 4.5, 144);
      scene.add(pole);

      var lampHead = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.3, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x444444 })
      );
      lampHead.position.set(lx, 8.5, 144);
      scene.add(lampHead);

      var lampLight = new THREE.PointLight(0xffeeaa, 1.5, 18);
      lampLight.position.set(lx, 8, 144);
      scene.add(lampLight);
    }
  },

  _buildHotels(scene) {
    var hotelData = [
      { x: -80, z: 100, w: 30, h: 45, color: 0x1a1a2e, name: 'MARINA GRAND' },
      { x:  80, z: 100, w: 30, h: 38, color: 0x0d1a2e, name: 'HARBOR SUITES' },
      { x:   0, z: 80,  w: 25, h: 55, color: 0x0a0a1e, name: 'LAMBO TOWER'   },
    ];

    hotelData.forEach(function(h) {
      // MAIN TOWER
      var tower = new THREE.Mesh(
        new THREE.BoxGeometry(h.w, h.h, 20),
        new THREE.MeshStandardMaterial({ color: h.color, roughness: 0.3, metalness: 0.4 })
      );
      tower.position.set(h.x, h.h / 2 + 0.5, h.z);
      scene.add(tower);

      // GLASS FACADE
      var glass = new THREE.Mesh(
        new THREE.BoxGeometry(h.w - 2, h.h - 4, 0.2),
        new THREE.MeshStandardMaterial({
          color: 0x003355, transparent: true,
          opacity: 0.5, metalness: 0.9
        })
      );
      glass.position.set(h.x, h.h / 2 + 0.5, h.z + 10.1);
      scene.add(glass);

      // WINDOWS GRID
      var rows = Math.floor(h.h / 4);
      var cols = Math.floor(h.w / 4);
      for (var row = 0; row < rows; row++) {
        for (var col = 0; col < cols; col++) {
          if (Math.random() < 0.25) continue;
          var win = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 1.2, 0.1),
            new THREE.MeshStandardMaterial({
              color: 0xffee88,
              emissive: 0xffee88,
              emissiveIntensity: Math.random() * 0.6 + 0.4
            })
          );
          win.position.set(
            h.x - h.w/2 + 2 + col * 4,
            2 + row * 4,
            h.z + 10.2
          );
          scene.add(win);
        }
      }

      // ROOFTOP NEON
      var roofNeon = new THREE.Mesh(
        new THREE.BoxGeometry(h.w + 1, 0.3, 0.3),
        new THREE.MeshStandardMaterial({
          color: 0x9900ff, emissive: 0x9900ff, emissiveIntensity: 2
        })
      );
      roofNeon.position.set(h.x, h.h + 0.8, h.z + 10);
      scene.add(roofNeon);

      var roofLight = new THREE.PointLight(0x9900ff, 2, 30);
      roofLight.position.set(h.x, h.h + 2, h.z + 10);
      scene.add(roofLight);

      // LOBBY ENTRANCE
      var lobby = new THREE.Mesh(
        new THREE.BoxGeometry(10, 5, 4),
        new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.2 })
      );
      lobby.position.set(h.x, 3, h.z + 12);
      scene.add(lobby);

      var lobbyLight = new THREE.PointLight(0xffaa44, 2, 15);
      lobbyLight.position.set(h.x, 3, h.z + 14);
      scene.add(lobbyLight);

      // LAMBO TOWER gets gold sign
      if (h.name === 'LAMBO TOWER') {
        var sign = new THREE.Mesh(
          new THREE.BoxGeometry(16, 2, 0.3),
          new THREE.MeshStandardMaterial({
            color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 1.5
          })
        );
        sign.position.set(h.x, h.h + 1.5, h.z + 10.2);
        scene.add(sign);
      }
    });
  },

  _buildRestaurantRow(scene) {
    var restaurants = [
      { x: -120, color: 0x8b1a1a, light: 0xff4444 },
      { x:  -90, color: 0x1a3a1a, light: 0x44ff44 },
      { x:  -60, color: 0x1a1a8b, light: 0x4444ff },
      { x:   60, color: 0x8b6a1a, light: 0xffaa00 },
      { x:   90, color: 0x4a1a8b, light: 0xaa00ff },
      { x:  120, color: 0x8b1a6a, light: 0xff00aa },
    ];

    restaurants.forEach(function(r) {
      // BUILDING
      var building = new THREE.Mesh(
        new THREE.BoxGeometry(18, 8, 14),
        new THREE.MeshStandardMaterial({ color: r.color, roughness: 0.8 })
      );
      building.position.set(r.x, 4.5, 170);
      scene.add(building);

      // AWNING
      var awning = new THREE.Mesh(
        new THREE.BoxGeometry(18, 0.3, 4),
        new THREE.MeshStandardMaterial({
          color: r.light, emissive: r.light, emissiveIntensity: 0.3
        })
      );
      awning.position.set(r.x, 5, 163.5);
      scene.add(awning);

      // SIGN
      var rSign = new THREE.Mesh(
        new THREE.BoxGeometry(12, 1.5, 0.2),
        new THREE.MeshStandardMaterial({
          color: r.light, emissive: r.light, emissiveIntensity: 0.8
        })
      );
      rSign.position.set(r.x, 7, 163.4);
      scene.add(rSign);

      // OUTDOOR SEATING
      for (var t = -3; t <= 3; t += 3) {
        var table = new THREE.Mesh(
          new THREE.CylinderGeometry(0.8, 0.8, 0.1, 8),
          new THREE.MeshStandardMaterial({ color: 0x888888 })
        );
        table.position.set(r.x + t, 1.1, 161);
        scene.add(table);
      }

      var rLight = new THREE.PointLight(r.light, 2, 16);
      rLight.position.set(r.x, 5, 163);
      scene.add(rLight);
    });
  },

  _buildBoatSlips(scene) {
    // MARINA DOCK FINGER PIERS extending into water
    var dockMat = new THREE.MeshStandardMaterial({ color: 0x8b5e3c, roughness: 0.9 });

    var slipPositions = [-100, -60, -20, 20, 60, 100];
    slipPositions.forEach(function(x, idx) {
      // FINGER PIER
      var pier = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.3, 35), dockMat
      );
      pier.position.set(x, 0.7, 28);
      scene.add(pier);

      // SMALL BOAT in slip
      var boat = new THREE.Group();

      var hull = new THREE.Mesh(
        new THREE.BoxGeometry(8, 1.5, 3),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
      );
      hull.position.y = 0.75;
      boat.add(hull);

      var cabin = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 1.5, 2.5),
        new THREE.MeshStandardMaterial({ color: 0xeeeeee })
      );
      cabin.position.set(0, 2, 0);
      boat.add(cabin);

      // BOAT NEON
      var boatNeon = new THREE.Mesh(
        new THREE.BoxGeometry(8, 0.1, 0.1),
        new THREE.MeshStandardMaterial({
          color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 2
        })
      );
      boatNeon.position.set(0, 0.2, 1.55);
      boat.add(boatNeon);

      boat.position.set(x + (idx % 2 === 0 ? 6 : -6), 0, 20);
      scene.add(boat);

      // PIER LIGHT
      var pierLight = new THREE.PointLight(0xffaa33, 1.5, 10);
      pierLight.position.set(x, 2, 28);
      scene.add(pierLight);
    });

    // MAIN MARINA DOCK WALL
    var wall = new THREE.Mesh(
      new THREE.BoxGeometry(280, 1.5, 3), dockMat
    );
    wall.position.set(0, 0.8, 12);
    scene.add(wall);
  },

  _buildFreewayOnRamp(scene) {
    // 710 FREEWAY VISIBLE IN DISTANCE
    var fwyMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });

    // MAIN FREEWAY — runs north/south
    var freeway = new THREE.Mesh(
      new THREE.BoxGeometry(24, 0.4, 200), fwyMat
    );
    freeway.position.set(0, 0.5, 250);
    scene.add(freeway);

    // FREEWAY DIVIDER
    var divider = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.2, 200),
      new THREE.MeshStandardMaterial({
        color: 0xffcc00, emissive: 0xffcc00, emissiveIntensity: 0.4
      })
    );
    divider.position.set(0, 0.7, 250);
    scene.add(divider);

    // ON-RAMP from marina to freeway
    var ramp = new THREE.Mesh(
      new THREE.BoxGeometry(12, 0.4, 80), fwyMat
    );
    ramp.position.set(0, 0.5, 195);
    scene.add(ramp);

    // FREEWAY SIGNS
    var signData = [
      { x: -8, text: '710 NORTH — DOWNTOWN' },
      { x:  8, text: '710 SOUTH — DOCKS'    },
    ];
    signData.forEach(function(s) {
      var signBoard = new THREE.Mesh(
        new THREE.BoxGeometry(14, 4, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x006600 })
      );
      signBoard.position.set(s.x, 8, 160);
      scene.add(signBoard);

      var signText = new THREE.Mesh(
        new THREE.BoxGeometry(12, 1.5, 0.4),
        new THREE.MeshStandardMaterial({
          color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5
        })
      );
      signText.position.set(s.x, 8, 160.2);
      scene.add(signText);

      // SIGN POLES
      [-5, 5].forEach(function(px) {
        var sPole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.2, 8, 6),
          new THREE.MeshStandardMaterial({ color: 0x888888 })
        );
        sPole.position.set(s.x + px, 4, 160);
        scene.add(sPole);
      });
    });

    // OVERPASS BRIDGE over marina boulevard
    var bridge = new THREE.Mesh(
      new THREE.BoxGeometry(28, 1, 8),
      new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 })
    );
    bridge.position.set(0, 7, 150);
    scene.add(bridge);

    // BRIDGE SUPPORT COLUMNS
    [-10, 10].forEach(function(x) {
      var col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 7, 8),
        new THREE.MeshStandardMaterial({ color: 0x444444 })
      );
      col.position.set(x, 3.5, 150);
      scene.add(col);
    });

    // FREEWAY LIGHTS
    for (var fz = 160; fz < 350; fz += 30) {
      [-14, 14].forEach(function(fx) {
        var fPole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.15, 0.15, 10, 6),
          new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        fPole.position.set(fx, 5, fz);
        scene.add(fPole);

        var fLight = new THREE.PointLight(0xffeeaa, 1, 20);
        fLight.position.set(fx, 10, fz);
        scene.add(fLight);
      });
    }
  },

  _buildMarinaPalms(scene) {
    var trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 1 });
    var leafMat  = new THREE.MeshStandardMaterial({ color: 0x1a5c2a, roughness: 0.8 });

    var palmPositions = [
      -120,-100,-80,-60,-40,-20,0,20,40,60,80,100,120
    ];

    palmPositions.forEach(function(x) {
      var palm = new THREE.Group();
      var h = 8 + Math.random() * 4;

      var trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.4, h, 8), trunkMat
      );
      trunk.position.y = h / 2;
      trunk.rotation.z = (Math.random() - 0.5) * 0.15;
      palm.add(trunk);

      [0, 0.6, 1.1].forEach(function(yOff, i) {
        var leaves = new THREE.Mesh(
          new THREE.SphereGeometry(2.2 - i * 0.4, 7, 5),
          leafMat
        );
        leaves.position.y = h + yOff;
        leaves.scale.set(1, 0.5, 1);
        palm.add(leaves);
      });

      // LINE BOTH SIDES OF BOULEVARD
      [-1, 1].forEach(function(side) {
        var p = palm.clone();
        p.position.set(x, 0.5, 150 + side * 16);
        scene.add(p);
      });
    });
  },

  _buildMarinaNeon(scene) {
    // MARINA DISTRICT SIGN
    var mainSign = new THREE.Mesh(
      new THREE.BoxGeometry(30, 4, 0.4),
      new THREE.MeshStandardMaterial({
        color: 0x9900ff, emissive: 0x9900ff, emissiveIntensity: 1
      })
    );
    mainSign.position.set(0, 12, 35);
    scene.add(mainSign);

    var mainText = new THREE.Mesh(
      new THREE.BoxGeometry(24, 2, 0.5),
      new THREE.MeshStandardMaterial({
        color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 2
      })
    );
    mainText.position.set(0, 12, 35.3);
    scene.add(mainText);

    // SIGN POLES
    [-12, 12].forEach(function(x) {
      var pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 12, 6),
        new THREE.MeshStandardMaterial({ color: 0x444444 })
      );
      pole.position.set(x, 6, 35);
      scene.add(pole);
    });

    var signLight = new THREE.PointLight(0x9900ff, 3, 35);
    signLight.position.set(0, 14, 38);
    scene.add(signLight);

    // WATERFRONT NEON STRIP
    var neonStrip = new THREE.Mesh(
      new THREE.BoxGeometry(280, 0.15, 0.15),
      new THREE.MeshStandardMaterial({
        color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 2
      })
    );
    neonStrip.position.set(0, 1, 12);
    scene.add(neonStrip);

    // ZONE LABEL HUD
    this._buildZoneLabel();
  },

  _buildZoneLabel() {
    var label = document.createElement('div');
    label.id = 'marina-label';
    label.style.cssText = `
      position:fixed;top:50%;left:50%;
      transform:translate(-50%,-50%);
      background:rgba(0,0,0,0.85);
      border:1px solid rgba(0,255,255,0.4);
      border-radius:12px;padding:16px 28px;
      color:white;font-family:Arial,sans-serif;
      text-align:center;z-index:300;
      pointer-events:none;display:none;
      box-shadow:0 0 30px rgba(0,255,255,0.2);
    `;
    label.innerHTML = `
      <div style="color:#00ffff;font-size:10px;letter-spacing:3px;margin-bottom:4px;">
        NEW ZONE
      </div>
      <div style="font-size:18px;font-weight:bold;color:white;margin-bottom:4px;">
        MARINA DISTRICT
      </div>
      <div style="color:#aaa;font-size:11px;">
        Long Beach Waterfront • Gateway to the City
      </div>
    `;
    document.body.appendChild(label);
    this._labelEl = label;
    this._labelShown = false;
  },

  update(delta, context) {
    if (!context.player || !this._labelEl || this._labelShown) return;
    var pz = context.player.position.z;
    if (pz > 100) {
      this._labelShown = true;
      this._labelEl.style.display = 'block';
      var self = this;
      setTimeout(function() {
        self._labelEl.style.display = 'none';
      }, 3000);
    }
  }
};
