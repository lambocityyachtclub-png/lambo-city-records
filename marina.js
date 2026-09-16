import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

// ============================================================
// LAMBO CITY — MARINA / BOARDWALK
// ============================================================
//
// WEST / STORE SIDE:
// - Luxury rear-store promenade
// - Refurbished waterfront ground
// - Architectural landscaping
//
// EAST / HQ SIDE:
// - Existing Records HQ owns its VIP waterfront architecture
//
// WATER:
// - Visual edge railing added here
// - Player blocking handled by collision.js
//
// GRAND STAGE:
// - Future hotel district remains untouched
//
// iPad / Safari:
// - Emissive materials preferred over many real lights
// - No new PointLights
// ============================================================


const STREET_Z = 46;
const STREET_X_MIN = -45;
const STREET_X_MAX = 45;
const STREET_LEN = STREET_X_MAX - STREET_X_MIN;
const STREET_X_MID = (STREET_X_MIN + STREET_X_MAX) / 2;


// ============================================================
// SHARED MATERIALS
// ============================================================

function createMarinaMaterials() {

  return {

    luxuryStone: new THREE.MeshStandardMaterial({
      color: 0x24242a,
      roughness: 0.48,
      metalness: 0.18
    }),

    darkStone: new THREE.MeshStandardMaterial({
      color: 0x111114,
      roughness: 0.38,
      metalness: 0.35
    }),

    gold: new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffd700,
      emissiveIntensity: 1.0,
      roughness: 0.3,
      metalness: 0.7
    }),

    glass: new THREE.MeshStandardMaterial({
      color: 0x87dfff,
      emissive: 0x155d73,
      emissiveIntensity: 0.28,
      transparent: true,
      opacity: 0.38,
      roughness: 0.12,
      metalness: 0.15
    }),

    planter: new THREE.MeshStandardMaterial({
      color: 0x101014,
      roughness: 0.65,
      metalness: 0.2
    }),

    greenery: new THREE.MeshStandardMaterial({
      color: 0x174f42,
      roughness: 0.9
    }),

    rearGround: new THREE.MeshStandardMaterial({
      color: 0x5a4634,
      roughness: 0.82,
      metalness: 0.05
    }),

    rearAccent: new THREE.MeshStandardMaterial({
      color: 0x30271f,
      roughness: 0.68,
      metalness: 0.12
    })
  };
}


export default {

  init(scene) {

    this._materials = createMarinaMaterials();

    this._buildDockRamp(scene);
    this._buildStreet(scene);
    this._buildStores(scene);
    this._buildStoreRearPromenade(scene);
    this._buildWaterfrontRail(scene);
    this._buildPalms(scene);
    this._buildNeon(scene);
  },


  // ==========================================================
  // DOCK RAMP
  // ==========================================================

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


  // ==========================================================
  // STREET
  // ==========================================================

  _buildStreet(scene) {

    var roadMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.9
    });

    var road = new THREE.Mesh(
      new THREE.BoxGeometry(
        STREET_LEN,
        0.3,
        8
      ),
      roadMat
    );

    road.position.set(
      STREET_X_MID,
      0.5,
      STREET_Z
    );

    scene.add(road);


    // Road markings

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


    // Sidewalks

    var sidewalkMat = new THREE.MeshStandardMaterial({
      color: 0x888877,
      roughness: 1
    });

    [-1, 1].forEach(function(side) {

      var sidewalk = new THREE.Mesh(
        new THREE.BoxGeometry(
          STREET_LEN,
          0.3,
          5
        ),
        sidewalkMat
      );

      sidewalk.position.set(
        STREET_X_MID,
        0.55,
        STREET_Z + side * 6.5
      );

      scene.add(sidewalk);
    });


    // Street lights remain lightweight:
    // emissive lamp heads, no additional PointLights.

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
        new THREE.BoxGeometry(
          2,
          0.3,
          0.3
        ),
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


  // ==========================================================
  // STORES
  // ==========================================================

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
        new THREE.BoxGeometry(
          10,
          8,
          12
        ),
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
        new THREE.BoxGeometry(
          10,
          0.3,
          3
        ),
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
        new THREE.BoxGeometry(
          8,
          1.3,
          0.2
        ),
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


  // ==========================================================
  // NEW — LUXURY REAR STORE PROMENADE
  // ==========================================================
  //
  // This turns the remaining brown ground behind the stores
  // into intentional luxury real estate / resort-style space.
  //
  // It does NOT touch the Grand Stage hotel land.
  // ==========================================================

  _buildStoreRearPromenade(scene) {

    var mat = this._materials;


    // --------------------------------------------------------
    // REAR COURTYARD SURFACE
    // --------------------------------------------------------

    var rearSurface = new THREE.Mesh(
      new THREE.BoxGeometry(
        34,
        0.12,
        10
      ),
      mat.luxuryStone
    );

    rearSurface.position.set(
      -32,
      0.68,
      15
    );

    scene.add(rearSurface);


    // --------------------------------------------------------
    // DARK PERIMETER BORDER
    // --------------------------------------------------------

    var rearBorder = new THREE.Mesh(
      new THREE.BoxGeometry(
        34.5,
        0.16,
        0.45
      ),
      mat.darkStone
    );

    rearBorder.position.set(
      -32,
      0.76,
      20
    );

    scene.add(rearBorder);


    // --------------------------------------------------------
    // GOLD ARCHITECTURAL INLAY
    // --------------------------------------------------------

    var goldLine = new THREE.Mesh(
      new THREE.BoxGeometry(
        32,
        0.035,
        0.12
      ),
      mat.gold
    );

    goldLine.position.set(
      -32,
      0.84,
      19.45
    );

    scene.add(goldLine);


    // --------------------------------------------------------
    // WALKING LANES
    // --------------------------------------------------------

    [-43, -32, -21].forEach(function(x) {

      var lane = new THREE.Mesh(
        new THREE.BoxGeometry(
          0.08,
          0.04,
          8.5
        ),
        mat.gold
      );

      lane.position.set(
        x,
        0.85,
        15
      );

      scene.add(lane);
    });


    // --------------------------------------------------------
    // LOW PLANTERS
    // --------------------------------------------------------

    var planterGeometry =
      new THREE.BoxGeometry(
        2.2,
        0.55,
        1.0
      );

    var plantGeometry =
      new THREE.ConeGeometry(
        0.55,
        1.4,
        7
      );


    [
      [-43, 13],
      [-32, 18],
      [-21, 13]
    ].forEach(function(pos) {

      var planter = new THREE.Mesh(
        planterGeometry,
        mat.planter
      );

      planter.position.set(
        pos[0],
        0.95,
        pos[1]
      );

      scene.add(planter);


      var plant = new THREE.Mesh(
        plantGeometry,
        mat.greenery
      );

      plant.position.set(
        pos[0],
        1.75,
        pos[1]
      );

      scene.add(plant);
    });


    // --------------------------------------------------------
    // SMALL ARCHITECTURAL LIGHT COLUMNS
    // --------------------------------------------------------
    // Emissive only — no PointLights.

    [-41, -32, -23].forEach(function(x) {

      var column = new THREE.Mesh(
        new THREE.BoxGeometry(
          0.18,
          1.8,
          0.18
        ),
        mat.gold
      );

      column.position.set(
        x,
        1.6,
        19
      );

      scene.add(column);
    });
  },


  // ==========================================================
  // NEW — WATERFRONT SAFETY RAIL
  // ==========================================================
  //
  // Visual boundary only.
  // Actual player collision is handled by collision.js.
  //
  // This creates a luxury marina edge instead of an ugly fence.
  // ==========================================================

  _buildWaterfrontRail(scene) {

    var mat = this._materials;


    // --------------------------------------------------------
    // WEST STORE-SIDE WATER EDGE
    // --------------------------------------------------------

    var westRail = new THREE.Group();

    var westGlass = new THREE.Mesh(
      new THREE.BoxGeometry(
        31,
        1.15,
        0.08
      ),
      mat.glass
    );

    westGlass.position.set(
      -32,
      1.25,
      10.15
    );

    westRail.add(westGlass);


    var westTop = new THREE.Mesh(
      new THREE.BoxGeometry(
        31.3,
        0.08,
        0.12
      ),
      mat.gold
    );

    westTop.position.set(
      -32,
      1.88,
      10.15
    );

    westRail.add(westTop);


    // --------------------------------------------------------
    // SUPPORT POSTS
    // --------------------------------------------------------

    [-47, -39, -31, -23, -17].forEach(function(x) {

      var post = new THREE.Mesh(
        new THREE.BoxGeometry(
          0.18,
          1.45,
          0.18
        ),
        mat.gold
      );

      post.position.set(
        x,
        1.25,
        10.15
      );

      westRail.add(post);
    });


    scene.add(westRail);


    // --------------------------------------------------------
    // SMALL GOLD WATER-EDGE MARKERS
    // --------------------------------------------------------

    [-44, -36, -28, -20].forEach(function(x) {

      var marker = new THREE.Mesh(
        new THREE.BoxGeometry(
          0.35,
          0.12,
          0.35
        ),
        mat.gold
      );

      marker.position.set(
        x,
        0.88,
        10.05
      );

      scene.add(marker);
    });
  },


  // ==========================================================
  // PALMS
  // ==========================================================

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

      trunk.rotation.z =
        (Math.random() - 0.5) * 0.15;

      palm.add(trunk);


      [0, 0.6, 1.1].forEach(
        function(yOff, i) {

          var leaves = new THREE.Mesh(
            new THREE.SphereGeometry(
              2.2 - i * 0.4,
              7,
              5
            ),
            leafMat
          );

          leaves.position.y =
            h + yOff;

          leaves.scale.set(
            1,
            0.5,
            1
          );

          palm.add(leaves);
        }
      );


      palm.position.set(
        px,
        0.5,
        STREET_Z + 12
      );

      scene.add(palm);
    }
  },


  // ==========================================================
  // NEON
  // ==========================================================

  _buildNeon(scene) {

    var mainSign = new THREE.Mesh(
      new THREE.BoxGeometry(
        8,
        4,
        0.4
      ),
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


  // ==========================================================
  // ZONE LABEL
  // ==========================================================

  _buildZoneLabel() {

    var label =
      document.createElement("div");

    label.id =
      "marina-label";

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
      <div style="
        color:#00ffff;
        font-size:10px;
        letter-spacing:3px;
        margin-bottom:4px;
      ">
        NEW ZONE
      </div>

      <div style="
        font-size:18px;
        font-weight:bold;
        color:white;
        margin-bottom:4px;
      ">
        MARINA BOARDWALK
      </div>

      <div style="
        color:#aaa;
        font-size:11px;
      ">
        Long Beach Waterfront • Gateway to the City
      </div>
    `;


    document.body.appendChild(label);

    this._labelEl = label;
    this._labelShown = false;
  },


  // ==========================================================
  // UPDATE
  // ==========================================================

  update(delta, context) {

    if (
      !context.player ||
      !this._labelEl ||
      this._labelShown
    ) {
      return;
    }


    var pz =
      context.player.position.z;


    if (
      pz > 20 &&
      pz < 40
    ) {

      this._labelShown = true;

      this._labelEl.style.display =
        "block";


      var self = this;


      setTimeout(function() {

        self._labelEl.style.display =
          "none";

      }, 3000);
    }
  }
};
