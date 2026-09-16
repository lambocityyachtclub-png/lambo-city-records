import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const STREET_Z = 46;
const STORE_Z = 31;
const WATERFRONT_Z = 10.15;

function mat(
  color,
  roughness = 0.7,
  metalness = 0.0,
  emissive = 0x000000,
  emissiveIntensity = 0
) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    emissive,
    emissiveIntensity
  });
}

export default {

  init(scene) {

    this._buildStreet(scene);
    this._buildStores(scene);
    this._buildStoreRearPromenade(scene);
    this._buildWaterfrontRail(scene);
    this._buildMarinaAccents(scene);

  },

  update() {},


  // ============================================================
  // STREET / BOARDWALK CONNECTION
  // ============================================================

  _buildStreet(scene) {

    const roadMat = mat(0x161616, 0.95, 0.05);
    const sidewalkMat = mat(0x6b6258, 0.95);
    const curbMat = mat(0x292929, 0.85, 0.1);
    const goldMat = mat(0xd4af37, 0.25, 0.9);

    const road = new THREE.Mesh(
      new THREE.BoxGeometry(90, 0.22, 12),
      roadMat
    );

    road.position.set(
      0,
      0.72,
      STREET_Z
    );

    scene.add(road);


    const sidewalk = new THREE.Mesh(
      new THREE.BoxGeometry(90, 0.18, 7),
      sidewalkMat
    );

    sidewalk.position.set(
      0,
      0.73,
      38.5
    );

    scene.add(sidewalk);


    const curb = new THREE.Mesh(
      new THREE.BoxGeometry(90, 0.18, 0.45),
      curbMat
    );

    curb.position.set(
      0,
      0.86,
      42.0
    );

    scene.add(curb);


    const centerStripe = new THREE.Mesh(
      new THREE.BoxGeometry(80, 0.025, 0.10),
      goldMat
    );

    centerStripe.position.set(
      0,
      0.86,
      STREET_Z
    );

    scene.add(centerStripe);

  },


  // ============================================================
  // WATERFRONT STORES
  // ============================================================

  _buildStores(scene) {

    const stone = mat(
      0x3c332c,
      0.82,
      0.05
    );

    const dark = mat(
      0x111111,
      0.55,
      0.45
    );

    const glass = new THREE.MeshPhysicalMaterial({
      color: 0x9fd9e8,
      transparent: true,
      opacity: 0.32,
      roughness: 0.12,
      metalness: 0.2,
      transmission: 0.2,
      thickness: 0.06
    });

    const gold = mat(
      0xd4af37,
      0.2,
      0.9
    );

    const neon = mat(
      0xff36d1,
      0.25,
      0.15,
      0xff36d1,
      2.2
    );


    [-20, -32, -44].forEach((x, index) => {

      const width = 10;
      const depth = 12;
      const height = 5.5;


      const building = new THREE.Mesh(
        new THREE.BoxGeometry(
          width,
          height,
          depth
        ),
        stone
      );

      building.position.set(
        x,
        height / 2 + 0.9,
        STORE_Z
      );

      scene.add(building);


      // FRONT GLASS

      const frontGlass = new THREE.Mesh(
        new THREE.BoxGeometry(
          width - 0.8,
          3.2,
          0.12
        ),
        glass
      );

      frontGlass.position.set(
        x,
        2.7,
        STORE_Z - depth / 2 - 0.08
      );

      scene.add(frontGlass);


      // SIGN

      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(
          width - 1.2,
          0.55,
          0.18
        ),
        dark
      );

      sign.position.set(
        x,
        5.15,
        STORE_Z - depth / 2 - 0.15
      );

      scene.add(sign);


      // NEON SIGN

      const signGlow = new THREE.Mesh(
        new THREE.BoxGeometry(
          width - 1.5,
          0.10,
          0.05
        ),
        neon
      );

      signGlow.position.set(
        x,
        5.45,
        STORE_Z - depth / 2 - 0.24
      );

      scene.add(signGlow);


      // GOLD ROOF TRIM

      const goldTrim = new THREE.Mesh(
        new THREE.BoxGeometry(
          width + 0.15,
          0.10,
          0.18
        ),
        gold
      );

      goldTrim.position.set(
        x,
        6.0,
        STORE_Z - 0.1
      );

      scene.add(goldTrim);


      // DOOR

      const door = new THREE.Mesh(
        new THREE.BoxGeometry(
          1.5,
          2.7,
          0.14
        ),
        dark
      );

      door.position.set(
        x,
        2.15,
        STORE_Z - depth / 2 - 0.18
      );

      scene.add(door);


      // FRONT PLANTERS

      [-2.8, 2.8].forEach(dx => {

        const planter = new THREE.Mesh(
          new THREE.CylinderGeometry(
            0.42,
            0.5,
            0.65,
            10
          ),
          dark
        );

        planter.position.set(
          x + dx,
          1.25,
          STORE_Z - depth / 2 - 0.55
        );

        scene.add(planter);


        const plant = new THREE.Mesh(
          new THREE.SphereGeometry(
            0.55,
            8,
            6
          ),
          mat(0x274b2b, 0.95)
        );

        plant.position.set(
          x + dx,
          1.85,
          STORE_Z - depth / 2 - 0.55
        );

        scene.add(plant);

      });


      // REAR ARCHITECTURAL PILASTERS

      [
        -width / 2 + 0.45,
        width / 2 - 0.45
      ].forEach(dx => {

        const p = new THREE.Mesh(
          new THREE.BoxGeometry(
            0.35,
            height,
            0.35
          ),
          gold
        );

        p.position.set(
          x + dx,
          height / 2 + 0.9,
          STORE_Z + depth / 2 + 0.12
        );

        scene.add(p);

      });


      // ROOF ACCENT

      const roofAccent = new THREE.Mesh(
        new THREE.BoxGeometry(
          width - 1.5,
          0.12,
          0.16
        ),
        index === 1 ? neon : gold
      );

      roofAccent.position.set(
        x,
        height + 0.98,
        STORE_Z + 0.1
      );

      scene.add(roofAccent);

    });

  },


  // ============================================================
  // LUXURY REAR PROMENADE
  // ============================================================

  _buildStoreRearPromenade(scene) {

    const rearGround = mat(
      0x5a4534,
      0.92,
      0.02
    );

    const stone = mat(
      0x777067,
      0.78,
      0.05
    );

    const dark = mat(
      0x171717,
      0.58,
      0.55
    );

    const gold = mat(
      0xd4af37,
      0.22,
      0.92
    );

    const green = mat(
      0x29482d,
      0.95
    );

    const glow = mat(
      0xffd86b,
      0.25,
      0.1,
      0xffd86b,
      2.0
    );


    // REAR COURTYARD

    const courtyard = new THREE.Mesh(
      new THREE.BoxGeometry(
        86,
        0.10,
        22
      ),
      rearGround
    );

    courtyard.position.set(
      -6.5,
      0.70,
      20.0
    );

    scene.add(courtyard);


    // MAIN WALKING LANE

    const lane = new THREE.Mesh(
      new THREE.BoxGeometry(
        82,
        0.08,
        5.0
      ),
      stone
    );

    lane.position.set(
      -6.5,
      0.79,
      24.0
    );

    scene.add(lane);


    // WATERFRONT EDGE STRIP

    const edge = new THREE.Mesh(
      new THREE.BoxGeometry(
        83,
        0.10,
        0.65
      ),
      dark
    );

    edge.position.set(
      -6.5,
      0.81,
      WATERFRONT_Z + 0.75
    );

    scene.add(edge);


    // GOLD INLAY

    const inlay = new THREE.Mesh(
      new THREE.BoxGeometry(
        81,
        0.035,
        0.10
      ),
      gold
    );

    inlay.position.set(
      -6.5,
      0.86,
      25.9
    );

    scene.add(inlay);


    // PLANTERS

    [
      -40,
      -27,
      -14,
      -1,
      12,
      25
    ].forEach(x => {

      const planter = new THREE.Mesh(
        new THREE.BoxGeometry(
          3.0,
          0.65,
          1.8
        ),
        dark
      );

      planter.position.set(
        x,
        1.12,
        16.5
      );

      scene.add(planter);


      const soil = new THREE.Mesh(
        new THREE.BoxGeometry(
          2.5,
          0.12,
          1.35
        ),
        mat(0x24180f, 1)
      );

      soil.position.set(
        x,
        1.48,
        16.5
      );

      scene.add(soil);


      const shrub = new THREE.Mesh(
        new THREE.SphereGeometry(
          0.9,
          8,
          6
        ),
        green
      );

      shrub.scale.y = 0.65;

      shrub.position.set(
        x,
        2.15,
        16.5
      );

      scene.add(shrub);

    });


    // EMISSIVE LIGHT COLUMNS
    // No PointLights — safer for iPad/Safari.

    [
      -37,
      -24,
      -11,
      2,
      15,
      28
    ].forEach(x => {

      const column = new THREE.Mesh(
        new THREE.BoxGeometry(
          0.28,
          2.7,
          0.28
        ),
        dark
      );

      column.position.set(
        x,
        2.1,
        27.0
      );

      scene.add(column);


      const light = new THREE.Mesh(
        new THREE.BoxGeometry(
          0.10,
          1.35,
          0.05
        ),
        glow
      );

      light.position.set(
        x,
        2.25,
        26.82
      );

      scene.add(light);

    });


    // REAR SEATING

    [
      -31,
      -5,
      21
    ].forEach(x => {

      const seat = new THREE.Mesh(
        new THREE.BoxGeometry(
          4.0,
          0.35,
          1.0
        ),
        dark
      );

      seat.position.set(
        x,
        1.05,
        28.8
      );

      scene.add(seat);


      const back = new THREE.Mesh(
        new THREE.BoxGeometry(
          4.0,
          1.0,
          0.25
        ),
        dark
      );

      back.position.set(
        x,
        1.45,
        29.15
      );

      scene.add(back);

    });

  },


  // ============================================================
  // CONTINUOUS WATERFRONT GLASS BORDER
  // STORE SIDE → HQ SIDE
  // ============================================================

  _buildWaterfrontRail(scene) {

    const railGroup = new THREE.Group();

    railGroup.name =
      "LuxuryWaterfrontGlassBorder";


    const glassMat =
      new THREE.MeshPhysicalMaterial({

        color: 0xdff7ff,

        transparent: true,

        opacity: 0.28,

        roughness: 0.08,

        metalness: 0.15,

        transmission: 0.35,

        thickness: 0.08

      });


    const goldMat = mat(
      0xd4af37,
      0.2,
      0.9
    );


    const darkMetalMat = mat(
      0x151515,
      0.25,
      0.85
    );


    const glowMat =
      new THREE.MeshBasicMaterial({

        color: 0xffd86b,

        transparent: true,

        opacity: 0.65

      });


    const startX = -48;
    const endX = 35;

    const railZ =
      WATERFRONT_Z;

    const glassHeight = 1.65;

    const glassBottom = 0.55;

    const panelWidth = 4.0;


    // GLASS PANELS

    for (
      let x = startX;
      x < endX;
      x += panelWidth
    ) {

      const width =
        Math.min(
          panelWidth,
          endX - x
        );


      const panel = new THREE.Mesh(

        new THREE.BoxGeometry(
          Math.max(
            0.1,
            width - 0.08
          ),
          glassHeight,
          0.10
        ),

        glassMat

      );


      panel.position.set(

        x + width / 2,

        glassBottom +
          glassHeight / 2,

        railZ

      );


      railGroup.add(panel);

    }


    // GOLD TOP RAIL

    const topRail = new THREE.Mesh(

      new THREE.BoxGeometry(
        endX - startX,
        0.12,
        0.16
      ),

      goldMat

    );


    topRail.position.set(

      (startX + endX) / 2,

      glassBottom +
        glassHeight +
        0.06,

      railZ

    );


    railGroup.add(topRail);


    // DARK LOWER RAIL

    const lowerRail = new THREE.Mesh(

      new THREE.BoxGeometry(
        endX - startX,
        0.10,
        0.14
      ),

      darkMetalMat

    );


    lowerRail.position.set(

      (startX + endX) / 2,

      glassBottom,

      railZ

    );


    railGroup.add(lowerRail);


    // GOLD SUPPORT POSTS

    for (
      let x = startX;
      x <= endX + 0.01;
      x += panelWidth
    ) {

      const post = new THREE.Mesh(

        new THREE.BoxGeometry(
          0.13,
          glassHeight + 0.20,
          0.18
        ),

        goldMat

      );


      post.position.set(

        x,

        glassBottom +
          glassHeight / 2,

        railZ

      );


      railGroup.add(post);


      const accent = new THREE.Mesh(

        new THREE.BoxGeometry(
          0.06,
          0.34,
          0.03
        ),

        glowMat

      );


      accent.position.set(

        x,

        glassBottom +
          glassHeight * 0.52,

        railZ - 0.10

      );


      railGroup.add(accent);

    }


    // PREMIUM BASE

    const base = new THREE.Mesh(

      new THREE.BoxGeometry(
        endX - startX,
        0.16,
        0.38
      ),

      darkMetalMat

    );


    base.position.set(

      (startX + endX) / 2,

      glassBottom - 0.08,

      railZ

    );


    railGroup.add(base);


    // END CAPS

    [
      startX,
      endX
    ].forEach(x => {

      const cap = new THREE.Mesh(

        new THREE.BoxGeometry(
          0.24,
          glassHeight + 0.30,
          0.30
        ),

        goldMat

      );


      cap.position.set(

        x,

        glassBottom +
          glassHeight / 2,

        railZ

      );


      railGroup.add(cap);

    });


    scene.add(railGroup);

  },


  // ============================================================
  // MARINA TRANSITION DETAILS
  // ============================================================

  _buildMarinaAccents(scene) {

    const dark = mat(
      0x151515,
      0.55,
      0.45
    );

    const gold = mat(
      0xd4af37,
      0.22,
      0.9
    );

    const neon = mat(
      0xff36d1,
      0.25,
      0.15,
      0xff36d1,
      2.0
    );


    // DOCK / BOARDWALK TRANSITION

    const transition = new THREE.Mesh(

      new THREE.BoxGeometry(
        13.5,
        0.12,
        1.6
      ),

      dark

    );


    transition.position.set(
      0,
      0.86,
      35.8
    );


    scene.add(transition);


    const transitionTrim = new THREE.Mesh(

      new THREE.BoxGeometry(
        12.5,
        0.08,
        0.12
      ),

      gold

    );


    transitionTrim.position.set(
      0,
      0.96,
      35.15
    );


    scene.add(transitionTrim);


    // LOW WATERFRONT ARCHITECTURAL MARKERS
    // Emissive only — no dynamic lights.

    [
      -43,
      -29,
      -15,
      0,
      15,
      29
    ].forEach(x => {

      const post = new THREE.Mesh(

        new THREE.BoxGeometry(
          0.18,
          1.4,
          0.18
        ),

        dark

      );


      post.position.set(
        x,
        1.45,
        12.0
      );


      scene.add(post);


      const strip = new THREE.Mesh(

        new THREE.BoxGeometry(
          0.08,
          0.5,
          0.04
        ),

        neon

      );


      strip.position.set(
        x,
        1.55,
        11.88
      );


      scene.add(strip);

    });

  }

};
