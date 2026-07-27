import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

// REBUILT to match the reference map: boardwalk/street now crosses
// PERPENDICULAR to the dock near its base (a T-shape), instead of running
// alongside its full length. Stores/Club Vista sit on the LEFT (west,
// negative X) side of the dock. Records HQ (built separately in
// recordsHQ.js) sits on the RIGHT (east, positive X) side.

const STREET_Z = 30;
const STREET_X_MIN = -45;
const STREET_X_MAX = 45;
const STREET_LEN = STREET_X_MAX - STREET_X_MIN;
const STREET_X_MID = (STREET_X_MIN + STREET_X_MAX) / 2;

export default {
  init(scene) {
    this._buildStreet(scene);
    this._buildStores(scene);
    this._buildPalms(scene);
    this._buildNeon(scene);
  },

  _buildStreet(scene) {
    var roadMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
    var road = new THREE.Mesh(new THREE.BoxGeometry(STREET_LEN, 0.3, 8), roadMat);
    road.position.set(STREET_X_MID, 0.5, STREET_Z);
    scene.add(road);

    var markMat = new THREE.MeshStandardMaterial({
      color: 0xffcc00, emissive: 0xffcc00, emissiveIntensity: 0.3
    });
    for (var x = STREET_X_MIN + 5; x < STREET_X_MAX; x += 12) {
      var mark = new THREE.Mesh(new THREE.BoxGeometry(6, 0.05, 0.4), markMat);
      mark.position.set(x, 0.66, STREET_Z);
      scene.add(mark);
    }

    var sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x888877, roughness: 1 });
    [-1, 1].forEach(function(side) {
      var sidewalk = new THREE.Mesh(new THREE.BoxGeometry(STREET_LEN, 0.3, 5), sidewalkMat);
      sidewalk.position.set(STREET_X_MID, 0.55, STREET_Z + side * 6.5);
      scene.add(sidewalk);
    });

    for (var lx = STREET_X_MIN; lx <= STREET_X_MAX; lx += 18) {
      var pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
      );
      pole.position.set(lx, 4.5, STREET_Z + 9);
      scene.add(pole);

      var lampHead = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.3, 0.3),
        new THREE.MeshStandardMaterial({ color: 0xffeeaa, emissive: 0xffeeaa, emissiveIntensity: 1.2 })
      );
      lampHead.position.set(lx, 8.5, STREET_Z + 9);
      scene.add(lampHead);
    }
  },

  _buildStores(scene) {
    var stores = [
      { x: -20, color: 0x1a1a3e, light: 0x00ccff, label: "CLUB VISTA" },
      { x: -32, color: 0x3a1a2a, light: 0xff2288, label: "STORE" },
      { x: -44, color: 0x2a2a10, light: 0xffcc00, label: "STORE" },
    ];

    stores.forEach(function(s) {
      var building = new THREE.Mesh(
        new THREE.BoxGeometry(10, 8, 12),
        new THREE.MeshStandardMaterial({ color: s.color, roughness: 0.8 })
      );
      building.position.set(s.x, 4.5, STREET_Z - 10);
      scene.add(building);

      var awning = new THREE.Mesh(
        new THREE.BoxGeometry(10, 0.3, 3),
        new THREE.MeshStandardMaterial({ color: s.light, emissive: s.light, emissiveIntensity: 0.5 })
      );
      awning.position.set(s.x, 5, STREET_Z - 5.5);
      scene.add(awning);

      var signPlane = new THREE.Mesh(
        new THREE.BoxGeometry(8, 1.3, 0.2),
        new THREE.MeshStandardMaterial({ color: s.light, emissive: s.light, emissiveIntensity: 1.6 })
      );
      signPlane.position.set(s.x, 6.8, STREET_Z - 4);
      scene.add(signPlane);
    });
  },

  _buildPalms(scene) {
    var trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 1 });
    var leafMat  = new THREE.MeshStandardMaterial({ color: 0x1a5c2a, roughness: 0.8 });

    for (var px = STREET_X_MIN; px <= STREET_X_MAX; px += 16) {
      if (Math.abs(px) < 8) continue;
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

      palm.position.set(px, 0.5, STREET_Z + 12);
      scene.add(palm);
    }
  },

  _buildNeon(scene) {
    var mainSign = new THREE.Mesh(
      new THREE.BoxGeometry(8, 4, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x9900ff, emissive: 0x9900ff, emissiveIntensity: 1.4 })
    );
    mainSign.position.set(STREET_X_MIN + 4, 12, STREET_Z);
    scene.add(mainSign);

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
    if (pz > 20 && pz < 40) {
      this._labelShown = true;
      this._labelEl.style.display = 'block';
      var self = this;
      setTimeout(function() {
        self._labelEl.style.display = 'none';
      }, 3000);
    }
  }
};
