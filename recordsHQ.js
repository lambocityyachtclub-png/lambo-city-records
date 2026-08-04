// recordsHQ.js
// LAMBO CITY RECORDS — VIP Headquarters
//
// HQ LOCATION LOCKED:
// x:28 z:22
//
// ENVIRONMENT-FIRST VERSION
//
// Includes:
// - Luxury HQ exterior
// - Main LAMBO CITY RECORDS sign
// - Marquee
// - Lobby glass entrance
// - Gold lobby emblem
// - VIP red carpet
// - Velvet rope entrance
// - Marble VIP plaza
// - Private VIP lounge
// - Roundabout turnaround
// - VIP street control
// - VIP waterfront promenade
// - Waterfront plaza
// - Glass waterfront guard
// - Gold architectural accents
// - Luxury planters
//
// PERFORMANCE:
// - No PointLights
// - No animation systems
// - Shared materials
// - Shared geometries where practical
// - No unnecessary dynamic objects
// - iPad / Safari friendly
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
// SHARED MATERIALS
// ============================================================

function createMaterials() {

  return {

    black: new THREE.MeshStandardMaterial({
      color: 0x0a0a0f,
      roughness: 0.5,
      metalness: 0.3
    }),

    darkBlack: new THREE.MeshStandardMaterial({
      color: 0x080808,
      roughness: 0.45,
      metalness: 0.35
    }),

    gold: new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffd700,
      emissiveIntensity: 1.25,
      roughness: 0.3,
      metalness: 0.75
    }),

    goldSoft: new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffd700,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.7
    }),

    window: new THREE.MeshStandardMaterial({
      color: 0xffee88,
      emissive: 0xffee88,
      emissiveIntensity: 0.7
    }),

    lobby: new THREE.MeshStandardMaterial({
      color: 0xfff4d0,
      emissive: 0xffe8a0,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.55
    }),

    marble: new THREE.MeshStandardMaterial({
      color: 0xe9e4d8,
      roughness: 0.25,
      metalness: 0.2
    }),

    red: new THREE.MeshStandardMaterial({
      color: 0x8b0018,
      roughness: 0.7
    }),

    rope: new THREE.MeshStandardMaterial({
      color: 0x8b0018,
      roughness: 0.6
    }),

    waterfront: new THREE.MeshStandardMaterial({
      color: 0x202024,
      roughness: 0.48,
      metalness: 0.18
    }),

    waterfrontEdge: new THREE.MeshStandardMaterial({
      color: 0x111114,
      roughness: 0.38,
      metalness: 0.35
    }),

    glass: new THREE.MeshStandardMaterial({
      color: 0x87dfff,
      emissive: 0x155d73,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.42,
      roughness: 0.12,
      metalness: 0.15
    }),

    planter: new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.7,
      metalness: 0.15
    }),

    plant: new THREE.MeshStandardMaterial({
      color: 0x174f42,
      roughness: 0.9
    })
  };
}


// ============================================================
// SHARED GEOMETRIES
// ============================================================

function createGeometries() {

  return {

    stanchionBase:
      new THREE.CylinderGeometry(
        0.32,
        0.38,
        0.14,
        10
      ),

    stanchionPole:
      new THREE.CylinderGeometry(
        0.07,
        0.07,
        1.1,
        8
      ),

    stanchionTop:
      new THREE.SphereGeometry(
        0.13,
        10,
        8
      ),

    planter:
      new THREE.CylinderGeometry(
        0.42,
        0.34,
        0.48,
        10
      ),

    plant:
      new THREE.ConeGeometry(
        0.34,
        1.15,
        7
      ),

    promenade:
      new THREE.BoxGeometry(
        12,
        0.14,
        18
      ),

    promenadeBorder:
      new THREE.BoxGeometry(
        0.32,
        0.18,
        18
      ),

    goldLine:
      new THREE.BoxGeometry(
        0.055,
        0.19,
        18
      ),

    promenadeEnd:
      new THREE.BoxGeometry(
        12.3,
        0.22,
        0.5
      ),

    glassRail:
      new THREE.BoxGeometry(
        10.5,
        1.25,
        0.08
      ),

    railTop:
      new THREE.BoxGeometry(
        10.7,
        0.08,
        0.12
      ),

    pillar:
      new THREE.BoxGeometry(
        0.28,
        1.5,
        0.28
      ),

    waterfrontPlaza:
      new THREE.BoxGeometry(
        16,
        0.12,
        5
      ),

    plazaFront:
      new THREE.BoxGeometry(
        16,
        0.08,
        0.08
      ),

    seat:
      new THREE.BoxGeometry(
        2.2,
        0.45,
        0.8
      )
  };
}


// ============================================================
// VIP STANCHION
// ============================================================

function buildStanchion(
  x,
  z,
  materials,
  geometries
) {

  const group = new THREE.Group();

  const base = new THREE.Mesh(
    geometries.stanchionBase,
    materials.darkBlack
  );

  base.position.y = 0.07;

  group.add(base);


  const pole = new THREE.Mesh(
    geometries.stanchionPole,
    materials.goldSoft
  );

  pole.position.y = 0.65;

  group.add(pole);


  const top = new THREE.Mesh(
    geometries.stanchionTop,
    materials.goldSoft
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
  parent,
  materials
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
      8,
      0.055,
      5,
      false
    ),

    materials.rope

  );


  parent.add(rope);
}


// ============================================================
// WATERFRONT PROMENADE
// ============================================================
//
// IMPORTANT:
// This function works in LOCAL HQ coordinates.
// The HQ group itself is already positioned at:
// x:28
// z:22
//
// This prevents the old double-offset problem.
// ============================================================

function buildWaterfrontPromenade(
  group,
  materials,
  geometries
) {

  // ----------------------------------------------------------
  // MAIN PROMENADE
  // ----------------------------------------------------------

  const promenade = new THREE.Mesh(
    geometries.promenade,
    materials.waterfront
  );

  promenade.position.set(
    -7,
    0.12,
    18
  );

  group.add(promenade);


  // ----------------------------------------------------------
  // DARK OUTER BORDERS
  // ----------------------------------------------------------

  const borderLeft = new THREE.Mesh(
    geometries.promenadeBorder,
    materials.waterfrontEdge
  );

  borderLeft.position.set(
    -12.85,
    0.19,
    18
  );

  group.add(borderLeft);


  const borderRight = new THREE.Mesh(
    geometries.promenadeBorder,
    materials.waterfrontEdge
  );

  borderRight.position.set(
    -1.15,
    0.19,
    18
  );

  group.add(borderRight);


  // ----------------------------------------------------------
  // GOLD INLAY
  // ----------------------------------------------------------

  [-10.5, -7, -3.5, 0].forEach(x => {

    const line = new THREE.Mesh(
      geometries.goldLine,
      materials.gold
    );

    line.position.set(
      x,
      0.21,
      18
    );

    group.add(line);

  });


  // ----------------------------------------------------------
  // WATERFRONT END CAP
  // ----------------------------------------------------------

  const endCap = new THREE.Mesh(
    geometries.promenadeEnd,
    materials.waterfrontEdge
  );

  endCap.position.set(
    -7,
    0.2,
    27
  );

  group.add(endCap);


  // ----------------------------------------------------------
  // GLASS GUARD
  // ----------------------------------------------------------

  const glassRail = new THREE.Mesh(
    geometries.glassRail,
    materials.glass
  );

  glassRail.position.set(
    -7,
    0.82,
    26.6
  );

  group.add(glassRail);


  // ----------------------------------------------------------
  // GOLD RAIL TOP
  // ----------------------------------------------------------

  const railTop = new THREE.Mesh(
    geometries.railTop,
    materials.gold
  );

  railTop.position.set(
    -7,
    1.48,
    26.6
  );

  group.add(railTop);


  // ----------------------------------------------------------
  // ARCHITECTURAL LIGHT PILLARS
  // ----------------------------------------------------------

  [
    [-12.2, 10],
    [-1.8, 10],
    [-12.2, 18],
    [-1.8, 18],
    [-12.2, 26],
    [-1.8, 26]
  ].forEach(([x, z]) => {

    const pillar = new THREE.Mesh(
      geometries.pillar,
      materials.gold
    );

    pillar.position.set(
      x,
      0.78,
      z
    );

    group.add(pillar);

  });


  // ----------------------------------------------------------
  // LUXURY PLANTERS
  // ----------------------------------------------------------

  [
    [-11.4, 12],
    [-2.6, 16],
    [-11.4, 21],
    [-2.6, 24]
  ].forEach(([x, z]) => {

    const planter = new THREE.Mesh(
      geometries.planter,
      materials.planter
    );

    planter.position.set(
      x,
      0.36,
      z
    );

    group.add(planter);


    const plant = new THREE.Mesh(
      geometries.plant,
      materials.plant
    );

    plant.position.set(
      x,
      1.12,
      z
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
      0.08,
      24
    ),

    materials.gold

  );

  emblem.rotation.x = Math.PI / 2;

  emblem.position.set(
    -7,
    0.23,
    20
  );

  group.add(emblem);


  // ----------------------------------------------------------
  // SECONDARY WATERFRONT PLAZA
  // ----------------------------------------------------------

  const waterfrontPlaza = new THREE.Mesh(
    geometries.waterfrontPlaza,
    materials.waterfront
  );

  waterfrontPlaza.position.set(
    -7,
    0.13,
    29
  );

  group.add(waterfrontPlaza);


  // ----------------------------------------------------------
  // WATERFRONT GOLD BORDER
  // ----------------------------------------------------------

  const plazaFront = new THREE.Mesh(
    geometries.plazaFront,
    materials.gold
  );

  plazaFront.position.set(
    -7,
    0.22,
    31.35
  );

  group.add(plazaFront);


  // ----------------------------------------------------------
  // SEATING
  // ----------------------------------------------------------

  [
    [-11, 29],
    [-3, 29]
  ].forEach(([x, z]) => {

    const seat = new THREE.Mesh(
      geometries.seat,
      materials.darkBlack
    );

    seat.position.set(
      x,
      0.42,
      z
    );

    group.add(seat);

  });
}


// ============================================================
// INIT
// ============================================================

export default {

  init(scene) {

    const materials = createMaterials();
    const geometries = createGeometries();

    const group = new THREE.Group();


    // HQ WORLD POSITION
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

      materials.black

    );

    building.position.y = 13;

    group.add(building);


    // ========================================================
    // GOLD BUILDING TRIM
    // ========================================================

    [-9, 9].forEach(x => {

      const trim = new THREE.Mesh(

        new THREE.BoxGeometry(
          0.2,
          26,
          0.2
        ),

        materials.gold

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

    // Fixed pattern instead of Math.random().
    // This avoids changing the building every reload.

    const windowPattern = [
      [0, 1, 2, 4],
      [0, 2, 3, 4],
      [1, 2, 4],
      [0, 1, 3, 4],
      [0, 2, 3],
      [0, 1, 2, 4],
      [1, 3, 4]
    ];

    for (let row = 0; row < 7; row++) {

      windowPattern[row].forEach(col => {

        const win = new THREE.Mesh(

          new THREE.BoxGeometry(
            1.4,
            1.6,
            0.1
          ),

          materials.window

        );

        win.position.set(
          -7 + col * 3.5,
          21 - row * 2.6,
          7.06
        );

        group.add(win);

      });

    }


    // ========================================================
    // MAIN SIGN
    // ========================================================

    const signTex = new THREE.CanvasTexture(
      createSignTexture()
    );

    signTex.anisotropy = 2;

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

    marqueeTex.anisotropy = 2;

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
    // LOBBY GLASS
    // ========================================================

    const lobbyGlow = new THREE.Mesh(

      new THREE.BoxGeometry(
        10,
        6,
        0.3
      ),

      materials.lobby

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
        20
      ),

      materials.gold

    );

    lobbyEmblem.position.set(
      0,
      3.5,
      6.9
    );

    group.add(lobbyEmblem);


    // ========================================================
    // RED CARPET
    // ========================================================

    const carpet = new THREE.Mesh(

      new THREE.PlaneGeometry(
        5,
        8
      ),

      materials.red

    );

    carpet.rotation.x = -Math.PI / 2;

    carpet.position.set(
      0,
      0.03,
      10.5
    );

    group.add(carpet);


    // ========================================================
    // VELVET ROPE
    // ========================================================

    const ropeZ = [8.5, 11.5];

    [-2.5, 2.5].forEach(x => {

      ropeZ.forEach(z => {

        group.add(
          buildStanchion(
            x,
            z,
            materials,
            geometries
          )
        );

      });

      buildRope(
        x,
        ropeZ[0],
        x,
        ropeZ[1],
        group,
        materials
      );

    });


    // ========================================================
    // VIP MARBLE PLAZA
    // ========================================================

    // IMPORTANT:
    // Local HQ coordinates only.
    // Do NOT add HQ_POSITION again.

    const plaza = new THREE.Mesh(

      new THREE.BoxGeometry(
        22,
        0.08,
        18
      ),

      materials.marble

    );

    plaza.position.set(
      0,
      0.04,
      10
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
        x,
        0.09,
        10
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

      materials.darkBlack

    );

    loungeFloor.position.set(
      14,
      0.08,
      8
    );

    group.add(loungeFloor);


    const loungeSeatGeometry =
      new THREE.BoxGeometry(
        2,
        0.7,
        2
      );


    [
      [-5, -3],
      [5, -3],
      [-5, 3],
      [5, 3]
    ].forEach(([x, z]) => {

      const seat = new THREE.Mesh(
        loungeSeatGeometry,
        materials.darkBlack
      );

      seat.position.set(
        14 + x,
        0.45,
        8 + z
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
        20
      ),

      materials.darkBlack

    );

    table.position.set(
      14,
      0.7,
      8
    );

    group.add(table);


    // ========================================================
    // ROUNDABOUT
    // ========================================================

    const roundabout = new THREE.Mesh(

      new THREE.CylinderGeometry(
        8,
        8,
        0.15,
        32
      ),

      materials.darkBlack

    );

    roundabout.position.set(
      2,
      0.1,
      -24
    );

    group.add(roundabout);


    const ring = new THREE.Mesh(

      new THREE.TorusGeometry(
        5,
        0.12,
        8,
        32
      ),

      materials.gold

    );

    ring.rotation.x = Math.PI / 2;

    ring.position.set(
      2,
      0.25,
      -24
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

      new THREE.MeshStandardMaterial({
        color: 0x220000,
        roughness: 0.5
      })

    );

    barrier.position.set(
      0,
      0.3,
      15
    );

    group.add(barrier);


    // ========================================================
    // VIP WATERFRONT PROMENADE
    // ========================================================

    buildWaterfrontPromenade(
      group,
      materials,
      geometries
    );


    // ========================================================
    // FINAL ADD
    // ========================================================

    scene.add(group);

  },


  update() {}

};
