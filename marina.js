import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

// LAMBO CITY — Marina / Boardwalk
// Original layout preserved.
// Waterfront glass completely seals the water-facing edges
// of both brown waterfront land sections.

const STREET_Z = 46;
const STREET_X_MIN = -45;
const STREET_X_MAX = 45;
const STREET_LEN = STREET_X_MAX - STREET_X_MIN;
const STREET_X_MID = (STREET_X_MIN + STREET_X_MAX) / 2;

// Waterfront ground from world.js
const WATERFRONT_Z = 10;

const LEFT_WATERFRONT_MIN_X = -65;
const LEFT_WATERFRONT_MAX_X = -21;

const RIGHT_WATERFRONT_MIN_X = 21;
const RIGHT_WATERFRONT_MAX_X = 65;

// The brown waterfront ground extends from Z=10 to Z=45.
// These side edges are the outer water-facing edges.
const WATERFRONT_BACK_Z = 45;

export default {

  init(scene) {
    this._buildDockRamp(scene);
    this._buildStreet(scene);
    this._buildStores(scene);
    this._buildPalms(scene);
    this._buildNeon(scene);
    this._buildWaterfrontGlass(scene);
  },


  _buildDockRamp(scene) {

    var stepMat = new THREE.MeshStandardMaterial({
      color: 0x5c3d1e,
      roughness: 1
    });

    for (var i = 0; i < 5; i++) {

      var step = new THREE.Mesh(
        new THREE.BoxGeometry(13, 0.25, 1.6),
        stepMat
      );

      step.position.set(
        0,
        1.15 - i * 0.16,
        31 + i * 1.5
      );

      scene.add(step);
    }
  },


  _buildStreet(scene) {

    var roadMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.9
    });

    var road = new THREE.Mesh(
      new THREE.BoxGeometry(STREET_LEN, 0.3, 8),
      roadMat
    );

    road.position.set(
  STREET_X_MID,
  0.51,
  STREET_Z
);

    scene.add(road);


    var markMat = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      emissive: 0xffcc00,
      emissiveIntensity: 0.3
    });

    for (
      var x = STREET_X_MIN + 5;
      x < STREET_X_MAX;
      x += 12
    ) {

      var mark = new THREE.Mesh(
        new THREE.BoxGeometry(6, 0.05, 0.4),
        markMat
      );

      mark.position.set(
        x,
        0.66,
        STREET_Z
      );

      scene.add(mark);
    }


    var sidewalkMat = new THREE.MeshStandardMaterial({
      color: 0x888877,
      roughness: 1
    });

    [-1, 1].forEach(function(side) {

      var sidewalk = new THREE.Mesh(
        new THREE.BoxGeometry(STREET_LEN, 0.3, 5),
        sidewalkMat
      );

      sidewalk.position.set(
        STREET_X_MID,
        0.55,
        STREET_Z + side * 6.5
      );

      scene.add(sidewalk);
    });


    for (
      var lx = STREET_X_MIN;
      lx <= STREET_X_MAX;
      lx += 18
    ) {

      var pole = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.15,
          0.15,
          8,
          6
        ),
        new THREE.MeshStandardMaterial({
          color: 0x333333
        })
      );

      pole.position.set(
        lx,
        4.5,
        STREET_Z + 9
      );

      scene.add(pole);


      var lampHead = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.3, 0.3),
        new THREE.MeshStandardMaterial({
          color: 0xffeeaa,
          emissive: 0xffeeaa,
          emissiveIntensity: 1.2
        })
      );

      lampHead.position.set(
        lx,
        8.5,
        STREET_Z + 9
      );

      scene.add(lampHead);
    }
  },


  _buildStores(scene) {

    var stores = [
      {
        x: -20,
        color: 0x1a1a3e,
        light: 0x00ccff,
        label: "CLUB VISTA"
      },
      {
        x: -32,
        color: 0x3a1a2a,
        light: 0xff2288,
        label: "STORE"
      },
      {
        x: -44,
        color: 0x2a2a10,
        light: 0xffcc00,
        label: "STORE"
      }
    ];

    stores.forEach(function(s) {

      var building = new THREE.Mesh(
        new THREE.BoxGeometry(10, 8, 12),
        new THREE.MeshStandardMaterial({
          color: s.color,
          roughness: 0.8
        })
      );

      building.position.set(
        s.x,
        4.5,
        STREET_Z - 15
      );

      scene.add(building);


      var awning = new THREE.Mesh(
        new THREE.BoxGeometry(10, 0.3, 3),
        new THREE.MeshStandardMaterial({
          color: s.light,
          emissive: s.light,
          emissiveIntensity: 0.5
        })
      );

      awning.position.set(
        s.x,
        5,
        STREET_Z - 10.5
      );

      scene.add(awning);


      var signPlane = new THREE.Mesh(
        new THREE.BoxGeometry(8, 1.3, 0.2),
        new THREE.MeshStandardMaterial({
          color: s.light,
          emissive: s.light,
          emissiveIntensity: 1.6
        })
      );

      signPlane.position.set(
        s.x,
        6.8,
        STREET_Z - 9
      );

      scene.add(signPlane);
    });
  },


  _buildPalms(scene) {

    var trunkMat = new THREE.MeshStandardMaterial({
      color: 0x6b4226,
      roughness: 1
    });

    var leafMat = new THREE.MeshStandardMaterial({
      color: 0x1a5c2a,
      roughness: 0.8
    });

    for (
      var px = STREET_X_MIN;
      px <= STREET_X_MAX;
      px += 16
    ) {

      if (Math.abs(px) < 8) continue;

      var h = 8 + Math.random() * 4;
      var palm = new THREE.Group();

      var trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.2,
          0.4,
          h,
          8
        ),
        trunkMat
      );

      trunk.position.y = h / 2;
      trunk.rotation.z = (Math.random() - 0.5) * 0.15;

      palm.add(trunk);


      [0, 0.6, 1.1].forEach(function(yOff, i) {

        var leaves = new THREE.Mesh(
          new THREE.SphereGeometry(
            2.2 - i * 0.4,
            7,
            5
          ),
          leafMat
        );

        leaves.position.y = h + yOff;
        leaves.scale.set(1, 0.5, 1);

        palm.add(leaves);
      });


      palm.position.set(
        px,
        0.5,
        STREET_Z + 12
      );

      scene.add(palm);
    }
  },


  _buildNeon(scene) {

    var mainSign = new THREE.Mesh(
      new THREE.BoxGeometry(8, 4, 0.4),
      new THREE.MeshStandardMaterial({
        color: 0x9900ff,
        emissive: 0x9900ff,
        emissiveIntensity: 1.4
      })
    );

    mainSign.position.set(
      STREET_X_MIN + 4,
      12,
      STREET_Z
    );

    scene.add(mainSign);

    this._buildZoneLabel();
  },


  // ============================================================
  // COMPLETE WATERFRONT GLASS
  //
  // STORE SIDE:
  //   front edge Z=10
  //   outer side X=-65
  //
  // RECORDS HQ SIDE:
  //   front edge Z=10
  //   outer side X=65
  //
  // This creates two continuous L-shaped barriers.
  //
  // CENTER X=-21 -> 21 remains OPEN for the dock.
  // ============================================================

  _buildWaterfrontGlass(scene) {

    var glassMat = new THREE.MeshStandardMaterial({
      color: 0x87dfff,
      emissive: 0x155d73,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.38,
      roughness: 0.12,
      metalness: 0.15
    });


    var frameMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffd700,
      emissiveIntensity: 0.8,
      roughness: 0.3,
      metalness: 0.7
    });


    var baseMat = new THREE.MeshStandardMaterial({
      color: 0x111114,
      roughness: 0.38,
      metalness: 0.35
    });


    // ------------------------------------------------------------
    // Helper: straight glass section
    // ------------------------------------------------------------

    function addGlassSection(startX, endX, startZ, endZ) {

      var horizontal = Math.abs(endX - startX) >= Math.abs(endZ - startZ);

      var length = horizontal
        ? Math.abs(endX - startX)
        : Math.abs(endZ - startZ);

      var centerX = (startX + endX) / 2;
      var centerZ = (startZ + endZ) / 2;

      var glassDepth = 0.08;


      // Base
      var base = new THREE.Mesh(
        horizontal
          ? new THREE.BoxGeometry(length, 0.18, 0.5)
          : new THREE.BoxGeometry(0.5, 0.18, length),
        baseMat
      );

      base.position.set(
        centerX,
        0.62,
        centerZ
      );

      scene.add(base);


      // Glass
      var glass = new THREE.Mesh(
        horizontal
          ? new THREE.BoxGeometry(length, 1.65, glassDepth)
          : new THREE.BoxGeometry(glassDepth, 1.65, length),
        glassMat
      );

      glass.position.set(
        centerX,
        1.42,
        centerZ
      );

      scene.add(glass);


      // Top rail
      var topRail = new THREE.Mesh(
        horizontal
          ? new THREE.BoxGeometry(length + 0.2, 0.09, 0.13)
          : new THREE.BoxGeometry(0.13, 0.09, length + 0.2),
        frameMat
      );

      topRail.position.set(
        centerX,
        2.27,
        centerZ
      );

      scene.add(topRail);


      // Bottom rail
      var bottomRail = new THREE.Mesh(
        horizontal
          ? new THREE.BoxGeometry(length, 0.07, 0.12)
          : new THREE.BoxGeometry(0.12, 0.07, length),
        frameMat
      );

      bottomRail.position.set(
        centerX,
        0.72,
        centerZ
      );

      scene.add(bottomRail);


      // Posts
      var postPositions = [0, 0.5, 1];

      postPositions.forEach(function(t) {

        var px = startX + (endX - startX) * t;
        var pz = startZ + (endZ - startZ) * t;

        var post = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 1.75, 0.18),
          frameMat
        );

        post.position.set(
          px,
          1.45,
          pz
        );

        scene.add(post);
      });
    }


    // ------------------------------------------------------------
    // LEFT / STORES
    //
    // Front waterfront edge
    // X -65 -> -21 at Z=10
    // ------------------------------------------------------------

    addGlassSection(
      LEFT_WATERFRONT_MIN_X,
      LEFT_WATERFRONT_MAX_X,
      WATERFRONT_Z,
      WATERFRONT_Z
    );


    // Outer west side
    // Z 10 -> 45 at X=-65

    addGlassSection(
      LEFT_WATERFRONT_MIN_X,
      LEFT_WATERFRONT_MIN_X,
      WATERFRONT_Z,
      WATERFRONT_BACK_Z
    );


    // ------------------------------------------------------------
    // RIGHT / RECORDS HQ
    //
    // Front waterfront edge
    // X 21 -> 65 at Z=10
    // ------------------------------------------------------------

    addGlassSection(
      RIGHT_WATERFRONT_MIN_X,
      RIGHT_WATERFRONT_MAX_X,
      WATERFRONT_Z,
      WATERFRONT_Z
    );


    // Outer east side
    // Z 10 -> 45 at X=65

    addGlassSection(
      RIGHT_WATERFRONT_MAX_X,
      RIGHT_WATERFRONT_MAX_X,
      WATERFRONT_Z,
      WATERFRONT_BACK_Z
    );
  },


  _buildZoneLabel() {

    var label = document.createElement('div');

    label.id = 'marina-label';

    label.style.cssText = `
      position:fixed;
      top:50%;
      left:50%;
      transform:translate(-50%,-50%);
      background:rgba(0,0,0,0.85);
      border:1px solid rgba(0,255,255,0.4);
      border-radius:12px;
      padding:16px 28px;
      color:white;
      font-family:Arial,sans-serif;
      text-align:center;
      z-index:300;
      pointer-events:none;
      display:none;
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
