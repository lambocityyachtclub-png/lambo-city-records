// recordsHQ.js
// LAMBO CITY RECORDS Headquarters VIP Expansion
//
// HQ LOCATION LOCKED:
// x:28 z:22
//
// Includes:
// - VIP red carpet arrival
// - luxury HQ exterior
// - marble VIP plaza
// - exclusive headquarters atmosphere
// - private VIP lounge
// - roundabout turnaround
// - VIP waterfront promenade
// - luxury architectural transition from HQ -> waterfront
//
// PERFORMANCE:
// - No new PointLights
// - No animation systems
// - Lightweight geometry
// - Uses emissive materials for architectural lighting
//
// Water remains handled by:
// water.js
// marina.js
// yacht.js

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const HQ_POSITION = {
  x: 28,
  z: 22
};


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

function buildStanchion(x, z) {

  const group = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(
      .32,
      .38,
      .14,
      12
    ),
    new THREE.MeshStandardMaterial({
      color: 0x111111,
      metalness: .7,
      roughness: .35
    })
  );

  base.position.y = .07;
  group.add(base);


  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(
      .07,
      .07,
      1.1,
      10
    ),
    new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffd700,
      emissiveIntensity: .4,
      metalness: .8,
      roughness: .3
    })
  );

  pole.position.y = .65;
  group.add(pole);


  const top = new THREE.Mesh(
    new THREE.SphereGeometry(
      .13,
      12,
      12
    ),
    new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffd700,
      emissiveIntensity: .5,
      metalness: .6
    })
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
      .8,
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
      .055,
      6,
      false
    ),
    new THREE.MeshStandardMaterial({
      color: 0x8b0018,
      roughness: .6
    })
  );

  parent.add(rope);
}


// ============================================================
// WATERFRONT PROMENADE
// ============================================================

function buildWaterfrontPromenade(group) {

  // ----------------------------------------------------------
  // SHARED MATERIALS
  // ----------------------------------------------------------

  const promenadeStone = new THREE.MeshStandardMaterial({
    color: 0x202024,
    roughness: .48,
    metalness: .18
  });

  const promenadeEdge = new THREE.MeshStandardMaterial({
    color: 0x111114,
    roughness: .38,
    metalness: .35
  });

  const gold = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    emissive: 0xffd700,
    emissiveIntensity: 1.15,
    roughness: .3,
    metalness: .7
  });

  const glass = new THREE.MeshStandardMaterial({
    color: 0x87dfff,
    emissive: 0x155d73,
    emissiveIntensity: .35,
    transparent: true,
    opacity: .42,
    roughness: .12,
    metalness: .15
  });

  const planterMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: .7,
    metalness: .15
  });

  const plantMat = new THREE.MeshStandardMaterial({
    color: 0x174f42,
    roughness: .9
  });


  // ----------------------------------------------------------
  // MAIN PROMENADE
  //
  // Extends from the HQ plaza toward the waterfront.
  // ----------------------------------------------------------

  const promenade = new THREE.Mesh(
    new THREE.BoxGeometry(
      12,
      .14,
      18
    ),
    promenadeStone
  );

  promenade.position.set(
    HQ_POSITION.x - 7,
    .12,
    HQ_POSITION.z + 18
  );

  group.add(promenade);


  // ----------------------------------------------------------
  // DARK OUTER BORDER
  // ----------------------------------------------------------

  const borderLeft = new THREE.Mesh(
    new THREE.BoxGeometry(
      .32,
      .18,
      18
    ),
    promenadeEdge
  );

  borderLeft.position.set(
    HQ_POSITION.x - 12.85,
    .19,
    HQ_POSITION.z + 18
  );

  group.add(borderLeft);


  const borderRight = new THREE.Mesh(
    new THREE.BoxGeometry(
      .32,
      .18,
      18
    ),
    promenadeEdge
  );

  borderRight.position.set(
    HQ_POSITION.x - 1.15,
    .19,
    HQ_POSITION.z + 18
  );

  group.add(borderRight);


  // ----------------------------------------------------------
  // GOLD INLAY LINES
  // ----------------------------------------------------------

  [-10.5, -7, -3.5, 0].forEach(offset => {

    const line = new THREE.Mesh(
      new THREE.BoxGeometry(
        .055,
        .19,
        18
      ),
      gold
    );

    line.position.set(
      HQ_POSITION.x + offset,
      .21,
      HQ_POSITION.z + 18
    );

    group.add(line);
  });


  // ----------------------------------------------------------
  // WATERFRONT END CAP
  // ----------------------------------------------------------

  const endCap = new THREE.Mesh(
    new THREE.BoxGeometry(
      12.3,
      .22,
      .5
    ),
    promenadeEdge
  );

  endCap.position.set(
    HQ_POSITION.x - 7,
    .2,
    HQ_POSITION.z + 27
  );

  group.add(endCap);


  // ----------------------------------------------------------
  // GLASS GUARD / ARCHITECTURAL RAIL
  // ----------------------------------------------------------

  const glassRail = new THREE.Mesh(
    new THREE.BoxGeometry(
      10.5,
      1.25,
      .08
    ),
    glass
  );

  glassRail.position.set(
    HQ_POSITION.x - 7,
    .82,
    HQ_POSITION.z + 26.6
  );

  group.add(glassRail);


  // ----------------------------------------------------------
  // GOLD RAIL TOP
  // ----------------------------------------------------------

  const railTop = new THREE.Mesh(
    new THREE.BoxGeometry(
      10.7,
      .08,
      .12
    ),
    gold
  );

  railTop.position.set(
    HQ_POSITION.x - 7,
    1.48,
    HQ_POSITION.z + 26.6
  );

  group.add(railTop);


  // ----------------------------------------------------------
  // LOW ARCHITECTURAL LIGHT PILLARS
  // ----------------------------------------------------------

  const pillarGeometry = new THREE.BoxGeometry(
    .28,
    1.5,
    .28
  );

  [
    [-12.2, 10],
    [-1.8, 10],
    [-12.2, 18],
    [-1.8, 18],
    [-12.2, 26],
    [-1.8, 26]
  ].forEach(([x, z]) => {

    const pillar = new THREE.Mesh(
      pillarGeometry,
      gold
    );

    pillar.position.set(
      HQ_POSITION.x + x,
      .78,
      HQ_POSITION.z + z
    );

    group.add(pillar);
  });


  // ----------------------------------------------------------
  // LUXURY PLANTERS
  // ----------------------------------------------------------

  const planterGeometry = new THREE.CylinderGeometry(
    .42,
    .34,
    .48,
    12
  );

  const plantGeometry = new THREE.ConeGeometry(
    .34,
    1.15,
    7
  );


  [
    [-11.4, 12],
    [-2.6, 16],
    [-11.4, 21],
    [-2.6, 24]
  ].forEach(([x, z]) => {

    const planter = new THREE.Mesh(
      planterGeometry,
      planterMat
    );

    planter.position.set(
      HQ_POSITION.x + x,
      .36,
      HQ_POSITION.z + z
    );

    group.add(planter);


    const plant = new THREE.Mesh(
      plantGeometry,
      plantMat
    );

    plant.position.set(
      HQ_POSITION.x + x,
      1.12,
      HQ_POSITION.z + z
    );

    group.add(plant);
  });


  // ----------------------------------------------------------
  // CENTRAL LAMBO CITY EMBLEM
  // ----------------------------------------------------------

  const emblem = new THREE.Mesh(
    new THREE.CylinderGeometry(
      1.25,
      1.25,
      .08,
      32
    ),
    gold
  );

  emblem.rotation.x = Math.PI / 2;

  emblem.position.set(
    HQ_POSITION.x - 7,
    .23,
    HQ_POSITION.z + 20
  );

  group.add(emblem);


  // ----------------------------------------------------------
  // SECONDARY WATERFRONT PLAZA
  // ----------------------------------------------------------

  const waterfrontPlaza = new THREE.Mesh(
    new THREE.BoxGeometry(
      16,
      .12,
      5
    ),
    promenadeStone
  );

  waterfrontPlaza.position.set(
    HQ_POSITION.x - 7,
    .13,
    HQ_POSITION.z + 29
  );

  group.add(waterfrontPlaza);


  // ----------------------------------------------------------
  // WATERFRONT PLAZA GOLD BORDER
  // ----------------------------------------------------------

  const plazaFront = new THREE.Mesh(
    new THREE.BoxGeometry(
      16,
      .08,
      .08
    ),
    gold
  );

  plazaFront.position.set(
    HQ_POSITION.x - 7,
    .22,
    HQ_POSITION.z + 31.35
  );

  group.add(plazaFront);


  // ----------------------------------------------------------
  // SUBTLE SEATING BLOCKS
  // ----------------------------------------------------------

  const seatGeometry = new THREE.BoxGeometry(
    2.2,
    .45,
    .8
  );

  const seatMat = new THREE.MeshStandardMaterial({
    color: 0x080808,
    roughness: .42,
    metalness: .25
  });


  [
    [-11, 29],
    [-3, 29]
  ].forEach(([x, z]) => {

    const seat = new THREE.Mesh(
      seatGeometry,
      seatMat
    );

    seat.position.set(
      HQ_POSITION.x + x,
      .42,
      HQ_POSITION.z + z
    );

    group.add(seat);
  });
}


// ============================================================
// MAIN HQ
// ============================================================

export default {

  init(scene) {

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

      new THREE.MeshStandardMaterial({

        color: 0x0a0a0f,
        roughness: .5,
        metalness: .3

      })

    );

    building.position.y = 13;

    group.add(building);


    // ========================================================
    // GOLD BUILDING TRIM
    // ========================================================

    [-9, 9].forEach(x => {

      const trim = new THREE.Mesh(

        new THREE.BoxGeometry(
          .2,
          26,
          .2
        ),

        new THREE.MeshStandardMaterial({

          color: 0xffd700,
          emissive: 0xffd700,
          emissiveIntensity: 1.5

        })

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

    for (let row = 0; row < 7; row++) {

      for (let col = 0; col < 5; col++) {

        if (Math.random() < .35) continue;

        const win = new THREE.Mesh(

          new THREE.BoxGeometry(
            1.4,
            1.6,
            .1
          ),

          new THREE.MeshStandardMaterial({

            color: 0xffee88,
            emissive: 0xffee88,
            emissiveIntensity: .7

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
        .3
      ),

      new THREE.MeshStandardMaterial({

        color: 0xfff4d0,
        emissive: 0xffe8a0,
        emissiveIntensity: 1,
        transparent: true,
        opacity: .55

      })

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

      new THREE.MeshStandardMaterial({

        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 1.8

      })

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

      new THREE.MeshStandardMaterial({

        color: 0x8b0018,
        roughness: .7

      })

    );

    carpet.rotation.x = -Math.PI / 2;

    carpet.position.set(
      0,
      .03,
      10.5
    );

    group.add(carpet);


    // ========================================================
    // VELVET ROPE ENTRANCE
    // ========================================================

    const ropeZ = [8.5, 11.5];

    [-2.5, 2.5].forEach(x => {

      ropeZ.forEach(z => {

        group.add(
          buildStanchion(x, z)
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
        .08,
        18
      ),

      new THREE.MeshStandardMaterial({

        color: 0xe9e4d8,
        roughness: .25,
        metalness: .2

      })

    );

    plaza.position.set(

      HQ_POSITION.x,
      .04,
      HQ_POSITION.z + 10

    );

    group.add(plaza);


    // ========================================================
    // GOLD MARBLE LINES
    // ========================================================

    [-8, -4, 0, 4, 8].forEach(x => {

      const line = new THREE.Mesh(

        new THREE.BoxGeometry(
          .05,
          .09,
          18
        ),

        new THREE.MeshStandardMaterial({

          color: 0xffd700,
          emissive: 0xffd700,
          emissiveIntensity: 1

        })

      );

      line.position.set(

        HQ_POSITION.x + x,
        .09,
        HQ_POSITION.z + 10

      );

      group.add(line);

    });


    // ========================================================
    // PRIVATE VIP LOUNGE AREA
    // ========================================================

    const loungeFloor = new THREE.Mesh(

      new THREE.BoxGeometry(
        14,
        .15,
        12
      ),

      new THREE.MeshStandardMaterial({

        color: 0x161616,
        roughness: .35,
        metalness: .4

      })

    );

    loungeFloor.position.set(

      HQ_POSITION.x + 14,
      .08,
      HQ_POSITION.z + 8

    );

    group.add(loungeFloor);


    const seatMat = new THREE.MeshStandardMaterial({

      color: 0x050505,
      roughness: .4,
      metalness: .3

    });


    [
      [-5, -3],
      [5, -3],
      [-5, 3],
      [5, 3]

    ].forEach(pos => {

      const seat = new THREE.Mesh(

        new THREE.BoxGeometry(
          2,
          .7,
          2
        ),

        seatMat

      );

      seat.position.set(

        HQ_POSITION.x + 14 + pos[0],

        .45,

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
        .15,
        24
      ),

      new THREE.MeshStandardMaterial({

        color: 0x111111,
        metalness: .8,
        roughness: .2

      })

    );

    table.position.set(

      HQ_POSITION.x + 14,
      .7,
      HQ_POSITION.z + 8

    );

    group.add(table);


    // ========================================================
    // HQ ROUNDABOUT TURNAROUND
    // ========================================================

    const roundabout = new THREE.Mesh(

      new THREE.CylinderGeometry(
        8,
        8,
        .15,
        48
      ),

      new THREE.MeshStandardMaterial({

        color: 0x111111,
        roughness: .8

      })

    );

    roundabout.position.set(

      HQ_POSITION.x + 2,
      .1,
      HQ_POSITION.z - 24

    );

    group.add(roundabout);


    const ring = new THREE.Mesh(

      new THREE.TorusGeometry(
        5,
        .12,
        12,
        48
      ),

      new THREE.MeshStandardMaterial({

        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 1.5

      })

    );

    ring.rotation.x = Math.PI / 2;

    ring.position.set(

      HQ_POSITION.x + 2,
      .25,
      HQ_POSITION.z - 24

    );

    group.add(ring);


    // ========================================================
    // VIP STREET CONTROL
    // ========================================================

    const barrier = new THREE.Mesh(

      new THREE.BoxGeometry(
        18,
        .6,
        1
      ),

      new THREE.MeshStandardMaterial({

        color: 0x220000,
        roughness: .5

      })

    );

    barrier.position.set(

      HQ_POSITION.x,
      .3,
      HQ_POSITION.z + 15

    );

    group.add(barrier);


    // ========================================================
    // NEW — VIP WATERFRONT PROMENADE
    // ========================================================

    buildWaterfrontPromenade(group);


    // ========================================================
    // FINAL ADD
    // ========================================================

    scene.add(group);

  },


  update() {}

};
