import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

// REBUILT per feedback: removed hotels, freeway/bridge, and boat slips.
// Boulevard + restaurant row (stores) repositioned to run alongside the
// dock starting at its beginning (dock spans z=-65 to z=35, ~14 wide,
// centered x=0), instead of being placed far away at z=150.

const BOULEVARD_X = 14;
const BOULEVARD_Z_START = -60;
const BOULEVARD_Z_END = 34;
const BOULEVARD_Z_LEN = BOULEVARD_Z_END - BOULEVARD_Z_START;
const BOULEVARD_Z_MID = (BOULEVARD_Z_START + BOULEVARD_Z_END) / 2;

export default {
  init(scene) {
    this._buildBoulevard(scene);
    this._buildRestaurantRow(scene);
    this._buildMarinaPalms(scene);
    this._buildMarinaNeon(scene);
  },

  _buildBoulevard(scene) {
    var roadMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
    var road = new THREE.Mesh(new THREE.BoxGeometry(18, 0.3, BOULEVARD_Z_LEN), roadMat);
    road.position.set(BOULEVARD_X, 0.5, BOULEVARD_Z_MID);
    scene.add(road);

    var markMat = new THREE.MeshStandardMaterial({
      color: 0xffcc00, emissive: 0xffcc00, emissiveIntensity: 0.3
    });
    for (var z = BOULEVARD_Z_START + 5; z < BOULEVARD_Z_END; z += 12) {
      var mark = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 6), markMat);
      mark.position.set(BOULEVARD_X, 0.66, z);
      scene.add(mark);
    }

    var sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x888877, roughness: 1 });
    [-1, 1].forEach(function(side) {
      var sidewalk = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, BOULEVARD_Z_LEN), sidewalkMat);
      sidewalk.position.set(BOULEVARD_X + side * 12, 0.55, BOULEVARD_Z_MID);
      scene.add(sidewalk);
    });

    for (var lz = BOULEVARD_Z_START; lz <= BOULEVARD_Z_END; lz += 20) {
      var pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
      );
      pole.position.set(BOULEVARD_X + 8, 4.5, lz);
      scene.add(pole);

      var lampHead = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.3, 2),
        new THREE.MeshStandardMaterial({ color: 0xffeeaa, emissive: 0xffeeaa, emissiveIntensity: 1.2 })
      );
      lampHead.position.set(BOULEVARD_X + 8, 8.5, lz);
      scene.add(lampHead);
    }
  },

  _buildRestaurantRow(scene) {
    var restaurants = [
      { z: -50, color: 0x8b1a1a, light: 0xff4444 },
      { z: -30, color: 0x1a3a1a, light: 0x44ff44 },
      { z: -10, color: 0x1a1a8b, light: 0x4444ff },
      { z:  10, color: 0x8b6a1a, light: 0xffaa00 },
      { z:  25, color: 0x4a1a8b, light: 0xaa00ff },
    ];

    restaurants.forEach(function(r) {
      var building = new THREE.Mesh(
        new THREE.BoxGeometry(14, 8, 18),
        new THREE.MeshStandardMaterial({ color: r.color, roughness: 0.8 })
      );
      building.position.set(BOULEVARD_X + 20, 4.5, r.z);
      scene.add(building);

      var awning = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.3, 18),
        new THREE.MeshStandardMaterial({ color: r.light, emissive: r.light, emissiveIntensity: 0.5 })
      );
      awning.position.set(BOULEVARD_X + 12.5, 5, r.z);
      scene.add(awning);

      var rSign = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 1.5, 12),
        new THREE.MeshStandardMaterial({ color: r.light, emissive: r.light, emissiveIntensity: 1.4 })
      );
      rSign.position.set(BOULEVARD_X + 13.4, 7, r.z);
      scene.add(rSign);

      for (var t = -3; t <= 3; t += 3) {
        var table = new THREE.Mesh(
          new THREE.CylinderGeometry(0.8, 0.8, 0.1, 8),
          new THREE.MeshStandardMaterial({ color: 0x888888 })
        );
        table.position.set(BOULEVARD_X + 8, 1.1, r.z + t);
        scene.add(table);
      }
    });
  },

  _buildMarinaPalms(scene) {
    var trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 1 });
    var leafMat  = new THREE.MeshStandardMaterial({ color: 0x1a5c2a, roughness: 0.8 });

    for (var pz = BOULEVARD_Z_START; pz <= BOULEVARD_Z_END; pz += 14) {
      var h = 8 + Math.random() * 4;
      var palm = new THREE.Group();

      var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.4, h, 8), trunkMat);
      trunk.position.y = h / 2;
      trunk.rotation.z = (Math.random() - 0.5) * 0.15;
      palm.add(trunk);

      [0, 0.6, 1.1].forEach(function(yOff, i) {
        var leaves = new THREE.Mesh(new THREE.SphereGeometry(2.2 - i * 0.4, 7, 5), leafMat);
        leaves.position.y = h + yOff;
        leaves.scale.set(1, 0.5, 1);
        palm.add(leaves);
      });

      palm.position.set(BOULEVARD_X - 8, 0.5, pz);
      scene.add(palm);
    }
  },

  _buildMarinaNeon(scene) {
    var mainSign = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x9900ff, emissive: 0x9900ff, emissiveIntensity: 1.4 })
    );
    mainSign.position.set(BOULEVARD_X - 8, 12, BOULEVARD_Z_END - 4);
    scene.add(mainSign);

    var mainText = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 2, 6),
      new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 2.5 })
    );
    mainText.position.set(BOULEVARD_X - 8.3, 12, BOULEVARD_Z_END - 4);
    scene.add(mainText);

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
        MARINA BOARDWALK
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
    if (pz > 5 && pz < 40) {
      this._labelShown = true;
      this._labelEl.style.display = 'block';
      var self = this;
      setTimeout(function() {
        self._labelEl.style.display = 'none';
      }, 3000);
    }
  }
};
