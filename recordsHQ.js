// recordsHQ.js
// LAMBO CITY RECORDS Headquarters VIP Expansion
//
// HQ LOCATION LOCKED:
// x:28 z:22
//
// Phase 1 Environment Upgrade:
// - Luxury HQ exterior
// - Grand architectural facade
// - Entrance canopy
// - Illuminated entrance frame
// - Gold architectural columns
// - Layered facade bands
// - Rooftop crown
// - VIP red carpet arrival
// - Marble VIP plaza
// - Private VIP lounge
// - Roundabout turnaround
// - Existing HQ signage preserved
//
// IMPORTANT:
// - Visual/environment upgrade only
// - No new systems
// - No collision changes
// - No new real-time lights
// - Water remains handled by water.js
// - Designed to remain lightweight for iPad / Safari
//
// Three.js 0.160.0

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const HQ_POSITION = {
  x: 28,
  z: 22
};

// ============================================================
// MATERIALS
// ============================================================

function createMaterials() {

  return {

    building: new THREE.MeshStandardMaterial({
      color: 0x08090d,
      roughness: 0.48,
      metalness: 0.35
    }),

    buildingSecondary: new THREE.MeshStandardMaterial({
      color: 0x15161c,
      roughness: 0.4,
      metalness: 0.45
    }),

    blackMetal: new THREE.MeshStandardMaterial({
      color: 0x080808,
      roughness: 0.28,
      metalness: 0.78
    }),

    gold: new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffd700,
      emissiveIntensity: 1.15,
      roughness: 0.28,
      metalness: 0.82
    }),

    goldSoft: new THREE.MeshStandardMaterial({
      color: 0xc99a32,
      roughness: 0.32,
      metalness: 0.72
    }),

    goldGlow: new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffc400,
      emissiveIntensity: 2.2,
      roughness: 0.25,
      metalness: 0.55
    }),

    warmGlass: new THREE.MeshStandardMaterial({
      color: 0xffe8a0,
      emissive: 0xffd66b,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.52,
      roughness: 0.18,
      metalness: 0.05
    }),

    darkGlass: new THREE.MeshStandardMaterial({
      color: 0x111a24,
      emissive: 0x07121c,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.58,
      roughness: 0.12,
      metalness: 0.18
    }),

    marble: new THREE.MeshStandardMaterial({
      color: 0xe9e4d8,
      roughness: 0.25,
      metalness: 0.2
    }),

    redCarpet: new THREE.MeshStandardMaterial({
      color: 0x8b0018,
      roughness: 0.7
    }),

    lounge: new THREE.MeshStandardMaterial({
      color: 0x161616,
      roughness: 0.35,
      metalness: 0.4
    }),

    seat: new THREE.MeshStandardMaterial({
      color: 0x050505,
      roughness: 0.4,
      metalness: 0.3
    }),

    barrier: new THREE.MeshStandardMaterial({
      color: 0x220000,
      roughness: 0.5
    })

  };

}


// ============================================================
// TEXTURES
// ============================================================

function createSignTexture() {

  const canvas = document.createElement("canvas");

  canvas.width = 1024;
  canvas.height = 512;

  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, 1024, 512);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = "bold 110px Arial";

  ctx.shadowColor = "#ff00aa";
  ctx.shadowBlur = 30;

  ctx.fillStyle = "#ffd700";

  ctx.fillText(
    "LAMBO CITY",
    512,
    280
  );

  ctx.font = "bold 90px Arial";

  ctx.fillText(
    "RECORDS",
    512,
    400
  );

  ctx.shadowBlur = 0;

  return canvas;
}


function createMarqueeTexture() {

  const canvas = document.createElement("canvas");

  canvas.width = 1024;
  canvas.height = 128;

  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#000000";

  ctx.fillRect(
    0,
    0,
    1024,
    128
  );

  ctx.font = "bold 42px Arial";

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = "#ffffff";

  ctx.fillText(
    "LAMBO CITY RECORDS — THE SOUND OF THE CITY",
    512,
    64
  );

  return canvas;
}


// ============================================================
// VIP STANCHION
// ============================================================

function buildStanchion(
  x,
  z,
  materials
) {

  const group = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.32,
      0.38,
      0.14,
      12
    ),
    materials.blackMetal
  );

  base.position.y = 0.07;

  group.add(base);


  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.07,
      0.07,
      1.1,
      10
    ),
    materials.gold
  );

  pole.position.y = 0.65;

  group.add(pole);


  const top = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.13,
      12,
      12
    ),
    materials.gold
  );

  top.position.y = 1.25;

  group.add(top);


  group.position.set(
    x,
    0,
    z
  );

  return group;
}


// ============================================================
// VIP ROPE
// ============================================================

function buildRope(
  x1,
  z1,
  x2,
  z2,
  parent
) {

  const curve = new THREE.CatmullRomCurve3([

    new THREE.Vector3(
      x1,
      1.2,
      z1
    ),

    new THREE.Vector3(
      (x1 + x2) / 2,
      0.8,
      (z1 + z2) / 2
    ),

    new THREE.Vector3(
      x2,
      1.2,
      z2
    )

  ]);


  const rope = new THREE.Mesh(

    new THREE.TubeGeometry(
      curve,
      12,
      0.055,
      6,
      false
    ),

    new THREE.MeshStandardMaterial({
      color: 0x8b0018,
      roughness: 0.6
    })

  );


  parent.add(rope);
}


// ============================================================
// GRAND FACADE
// ============================================================

function buildFacade(
  group,
  materials
) {

  // ----------------------------------------------------------
  // LARGE SIDE ARCHITECTURAL COLUMNS
  // ----------------------------------------------------------

  [-8.15, 8.15].forEach(x => {

    const column = new THREE.Mesh(

      new THREE.BoxGeometry(
        0.55,
        24,
        0.55
      ),

      materials.gold

    );

    column.position.set(
      x,
      13,
      7.18
    );

    group.add(column);

  });


  // ----------------------------------------------------------
  // SECONDARY VERTICAL FACADE COLUMNS
  // ----------------------------------------------------------

  [-5.4, -2.7, 2.7, 5.4].forEach(x => {

    const column = new THREE.Mesh(

      new THREE.BoxGeometry(
        0.22,
        18,
        0.32
      ),

      materials.goldSoft

    );

    column.position.set(
      x,
      12,
      7.16
    );

    group.add(column);

  });


  // ----------------------------------------------------------
  // HORIZONTAL GOLD ARCHITECTURAL BANDS
  // ----------------------------------------------------------

  [6.2, 11.2, 16.2, 20.1].forEach(y => {

    const band = new THREE.Mesh(

      new THREE.BoxGeometry(
        17.7,
        0.18,
        0.38
      ),

      materials.goldSoft

    );

    band.position.set(
      0,
      y,
      7.18
    );

    group.add(band);

  });


  // ----------------------------------------------------------
  // DARK GLASS FACADE PANELS
  // ----------------------------------------------------------

  [-6.9, -4.1, -1.3, 1.3, 4.1, 6.9].forEach(x => {

    const glass = new THREE.Mesh(

      new THREE.BoxGeometry(
        2.05,
        4.2,
        0.12
      ),

      materials.darkGlass

    );

    glass.position.set(
      x,
      8.5,
      7.17
    );

    group.add(glass);

  });


  // ----------------------------------------------------------
  // ENTRANCE GLASS WALL
  // ----------------------------------------------------------

  const entranceGlass = new THREE.Mesh(

    new THREE.BoxGeometry(
      9.4,
      5.5,
      0.16
    ),

    materials.warmGlass

  );

  entranceGlass.position.set(
    0,
    3.0,
    7.2
  );

  group.add(entranceGlass);


  // ----------------------------------------------------------
  // ENTRANCE GOLD FRAME
  // ----------------------------------------------------------

  const frameTop = new THREE.Mesh(

    new THREE.BoxGeometry(
      10.5,
      0.22,
      0.3
    ),

    materials.goldGlow

  );

  frameTop.position.set(
    0,
    5.85,
    7.35
  );

  group.add(frameTop);


  [-5.15, 5.15].forEach(x => {

    const frameSide = new THREE.Mesh(

      new THREE.BoxGeometry(
        0.22,
        5.8,
        0.3
      ),

      materials.goldGlow

    );

    frameSide.position.set(
      x,
      3.0,
      7.35
    );

    group.add(frameSide);

  });


  // ----------------------------------------------------------
  // ENTRANCE CENTER DOOR DIVIDER
  // ----------------------------------------------------------

  const doorDivider = new THREE.Mesh(

    new THREE.BoxGeometry(
      0.12,
      5.2,
      0.2
    ),

    materials.goldSoft

  );

  doorDivider.position.set(
    0,
    3,
    7.4
  );

  group.add(doorDivider);

}


// ============================================================
// GRAND ENTRANCE CANOPY
// ============================================================

function buildEntranceCanopy(
  group,
  materials
) {

  // ----------------------------------------------------------
  // MAIN CANOPY
  // ----------------------------------------------------------

  const canopy = new THREE.Mesh(

    new THREE.BoxGeometry(
      11.5,
      0.35,
      4.8
    ),

    materials.blackMetal

  );

  canopy.position.set(
    0,
    7.0,
    9.0
  );

  group.add(canopy);


  // ----------------------------------------------------------
  // GOLD CANOPY EDGE
  // ----------------------------------------------------------

  const canopyEdge = new THREE.Mesh(

    new THREE.BoxGeometry(
      11.7,
      0.12,
      0.18
    ),

    materials.goldGlow

  );

  canopyEdge.position.set(
    0,
    6.78,
    11.35
  );

  group.add(canopyEdge);


  // ----------------------------------------------------------
  // CANOPY SUPPORTS
  // ----------------------------------------------------------

  [-5.0, 5.0].forEach(x => {

    const support = new THREE.Mesh(

      new THREE.BoxGeometry(
        0.25,
        3.5,
        0.25
      ),

      materials.gold

    );

    support.position.set(
      x,
      5.1,
      10.9
    );

    group.add(support);

  });


  // ----------------------------------------------------------
  // CANOPY UNDERSIDE LIGHT STRIPS
  // ----------------------------------------------------------

  [-3.5, 0, 3.5].forEach(x => {

    const strip = new THREE.Mesh(

      new THREE.BoxGeometry(
        2.5,
        0.06,
        0.08
      ),

      materials.goldGlow

    );

    strip.position.set(
      x,
      6.77,
      9.0
    );

    group.add(strip);

  });

}


// ============================================================
// ROOFTOP CROWN
// ============================================================

function buildRooftopCrown(
  group,
  materials
) {

  // ----------------------------------------------------------
  // MAIN CROWN
  // ----------------------------------------------------------

  const crown = new THREE.Mesh(

    new THREE.BoxGeometry(
      18.5,
      0.45,
      14.5
    ),

    materials.blackMetal

  );

  crown.position.y = 26.15;

  group.add(crown);


  // ----------------------------------------------------------
  // GOLD CROWN EDGE
  // ----------------------------------------------------------

  const frontEdge = new THREE.Mesh(

    new THREE.BoxGeometry(
      18.2,
      0.14,
      0.22
    ),

    materials.goldGlow

  );

  frontEdge.position.set(
    0,
    25.88,
    7.22
  );

  group.add(frontEdge);


  // ----------------------------------------------------------
  // ROOFTOP CENTER FEATURE
  // ----------------------------------------------------------

  const centerFeature = new THREE.Mesh(

    new THREE.BoxGeometry(
      7,
      0.18,
      0.3
    ),

    materials.gold

  );

  centerFeature.position.set(
    0,
    26.48,
    7.15
  );

  group.add(centerFeature);


  // ----------------------------------------------------------
  // ROOFTOP CORNER CAPS
  // ----------------------------------------------------------

  [-8.2, 8.2].forEach(x => {

    const cap = new THREE.Mesh(

      new THREE.BoxGeometry(
        0.7,
        0.5,
        0.7
      ),

      materials.gold

    );

    cap.position.set(
      x,
      26.55,
      6.8
    );

    group.add(cap);

  });

}


// ============================================================
// HQ WINDOWS
// ============================================================

function buildWindows(
  group,
  materials
) {

  for (let row = 0; row < 7; row++) {

    for (let col = 0; col < 5; col++) {

      if (Math.random() < 0.35) continue;

      const win = new THREE.Mesh(

        new THREE.BoxGeometry(
          1.4,
          1.6,
          0.1
        ),

        new THREE.MeshStandardMaterial({

          color: 0xffee88,
          emissive: 0xffee88,
          emissiveIntensity: 0.7

        })

      );

      win.position.set(

        -7 + col * 3.5,

        21 - row * 2.6,

        7.06

      );

      group.add(win);

    }

  }

}


// ============================================================
// MAIN HQ
// ============================================================

export default {

  init(scene) {

    const materials = createMaterials();

    const group = new THREE.Group();


    group.position.set(
      HQ_POSITION.x,
      0,
      HQ_POSITION.z
    );


    // ========================================================
    // HQ BUILDING
    // ========================================================

    const building = new THREE.Mesh(

      new THREE.BoxGeometry(
        18,
        26,
        14
      ),

      materials.building

    );

    building.position.y = 13;

    group.add(building);


    // ========================================================
    // GRAND FACADE UPGRADE
    // ========================================================

    buildFacade(
      group,
      materials
    );


    // ========================================================
    // ENTRANCE CANOPY
    // ========================================================

    buildEntranceCanopy(
      group,
      materials
    );


    // ========================================================
    // ROOFTOP CROWN
    // ========================================================

    buildRooftopCrown(
      group,
      materials
    );


    // ========================================================
    // ORIGINAL GOLD BUILDING TRIM
    // ========================================================

    [-9, 9].forEach(x => {

      const trim = new THREE.Mesh(

        new THREE.BoxGeometry(
          0.2,
          26,
          0.2
        ),

        materials.goldGlow

      );

      trim.position.set(
        x,
        13,
        7.05
      );

      group.add(trim);

    });


    // ========================================================
    // WINDOWS
    // ========================================================

    buildWindows(
      group,
      materials
    );


    // ========================================================
    // MAIN SIGN
    // ========================================================

    const signTex = new THREE.CanvasTexture(
      createSignTexture()
    );

    const sign = new THREE.Mesh(

      new THREE.PlaneGeometry(
        16,
        8
      ),

      new THREE.MeshStandardMaterial({

        map: signTex,
        emissiveMap: signTex,
        emissiveIntensity: 1.4

      })

    );

    sign.position.set(
      0,
      22,
      7.1
    );

    group.add(sign);


    // ========================================================
    // MARQUEE
    // ========================================================

    const marqueeTex = new THREE.CanvasTexture(
      createMarqueeTexture()
    );

    const marquee = new THREE.Mesh(

      new THREE.PlaneGeometry(
        14,
        1.5
      ),

      new THREE.MeshStandardMaterial({

        map: marqueeTex,
        emissiveMap: marqueeTex,
        emissiveIntensity: 1.2

      })

    );

    marquee.position.set(
      0,
      16.5,
      7.1
    );

    group.add(marquee);


    // ========================================================
    // LOBBY GLASS ENTRANCE
    // ========================================================

    const lobbyGlow = new THREE.Mesh(

      new THREE.BoxGeometry(
        10,
        6,
        0.3
      ),

      materials.warmGlass

    );

    lobbyGlow.position.set(
      0,
      3,
      7.2
    );

    group.add(lobbyGlow);


    // ========================================================
    // GOLD LOBBY EMBLEM
    // ========================================================

    const lobbyEmblem = new THREE.Mesh(

      new THREE.CircleGeometry(
        1.3,
        24
      ),

      materials.goldGlow

    );

    lobbyEmblem.position.set(
      0,
      3.5,
      6.9
    );

    group.add(lobbyEmblem);


    // ========================================================
    // RED CARPET VIP ARRIVAL
    // ========================================================

    const carpet = new THREE.Mesh(

      new THREE.PlaneGeometry(
        5,
        8
      ),

      materials.redCarpet

    );

    carpet.rotation.x = -Math.PI / 2;

    carpet.position.set(
      0,
      0.03,
      10.5
    );

    group.add(carpet);


    // ========================================================
    // VELVET ROPE ENTRANCE
    // ========================================================

    const ropeZ = [
      8.5,
      11.5
    ];

    [-2.5, 2.5].forEach(x => {

      ropeZ.forEach(z => {

        group.add(
          buildStanchion(
            x,
            z,
            materials
          )
        );

      });

      buildRope(
        x,
        ropeZ[0],
        x,
        ropeZ[1],
        group
      );

    });


    // ========================================================
    // VIP MARBLE PLAZA
    // ========================================================

    const plaza = new THREE.Mesh(

      new THREE.BoxGeometry(
        22,
        0.08,
        18
      ),

      materials.marble

    );

    plaza.position.set(
      HQ_POSITION.x,
      0.04,
      HQ_POSITION.z + 10
    );

    group.add(plaza);


    // ========================================================
    // GOLD MARBLE LINES
    // ========================================================

    [-8, -4, 0, 4, 8].forEach(x => {

      const line = new THREE.Mesh(

        new THREE.BoxGeometry(
          0.05,
          0.09,
          18
        ),

        materials.gold

      );

      line.position.set(
        HQ_POSITION.x + x,
        0.09,
        HQ_POSITION.z + 10
      );

      group.add(line);

    });


    // ========================================================
    // PRIVATE VIP LOUNGE
    // ========================================================

    const loungeFloor = new THREE.Mesh(

      new THREE.BoxGeometry(
        14,
        0.15,
        12
      ),

      materials.lounge

    );

    loungeFloor.position.set(

      HQ_POSITION.x + 14,
      0.08,
      HQ_POSITION.z + 8

    );

    group.add(loungeFloor);


    // ========================================================
    // VIP SEATING
    // ========================================================

    [
      [-5, -3],
      [5, -3],
      [-5, 3],
      [5, 3]

    ].forEach(pos => {

      const seat = new THREE.Mesh(

        new THREE.BoxGeometry(
          2,
          0.7,
          2
        ),

        materials.seat

      );

      seat.position.set(

        HQ_POSITION.x + 14 + pos[0],
        0.45,
        HQ_POSITION.z + 8 + pos[1]

      );

      group.add(seat);

    });


    // ========================================================
    // VIP TABLE
    // ========================================================

    const table = new THREE.Mesh(

      new THREE.CylinderGeometry(
        1.2,
        1.2,
        0.15,
        24
      ),

      new THREE.MeshStandardMaterial({

        color: 0x111111,
        metalness: 0.8,
        roughness: 0.2

      })

    );

    table.position.set(

      HQ_POSITION.x + 14,
      0.7,
      HQ_POSITION.z + 8

    );

    group.add(table);


    // ========================================================
    // HQ ROUNDABOUT
    // ========================================================

    const roundabout = new THREE.Mesh(

      new THREE.CylinderGeometry(
        8,
        8,
        0.15,
        48
      ),

      new THREE.MeshStandardMaterial({

        color: 0x111111,
        roughness: 0.8

      })

    );

    roundabout.position.set(

      HQ_POSITION.x + 2,
      0.1,
      HQ_POSITION.z - 24

    );

    group.add(roundabout);


    // ========================================================
    // ROUNDABOUT GOLD RING
    // ========================================================

    const ring = new THREE.Mesh(

      new THREE.TorusGeometry(
        5,
        0.12,
        12,
        48
      ),

      materials.goldGlow

    );

    ring.rotation.x = Math.PI / 2;

    ring.position.set(

      HQ_POSITION.x + 2,
      0.25,
      HQ_POSITION.z - 24

    );

    group.add(ring);


    // ========================================================
    // VIP STREET CONTROL
    // ========================================================

    const barrier = new THREE.Mesh(

      new THREE.BoxGeometry(
        18,
        0.6,
        1
      ),

      materials.barrier

    );

    barrier.position.set(

      HQ_POSITION.x,
      0.3,
      HQ_POSITION.z + 15

    );

    group.add(barrier);


    // ========================================================
    // FINAL ADD
    // ========================================================

    scene.add(group);

  },


  update() {}

};
