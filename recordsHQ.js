// recordsHQ.js
// LAMBO CITY RECORDS Headquarters VIP Expansion
//
// HQ LOCATION LOCKED:
// x:28 z:22
//
// Includes:
// - cohesive three-floor glass-and-bronze HQ facade
// - permanent crown identity signage
// - clear public entrance and rear elevator portal
// - exterior plaza and private patio
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
  canvas.width = 1536;
  canvas.height = 256;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, 1536, 256);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 112px Arial";
  ctx.shadowColor = "#b88e55";
  ctx.shadowBlur = 14;
  ctx.fillStyle = "#e7c58a";
  ctx.fillText("LAMBO CITY RECORDS", 768, 128);
  ctx.shadowBlur = 0;
  return canvas;
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

  promenade.position.set(-7, .12, 18);

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

  borderLeft.position.set(-12.85, .19, 18);

  group.add(borderLeft);


  const borderRight = new THREE.Mesh(
    new THREE.BoxGeometry(
      .32,
      .18,
      18
    ),
    promenadeEdge
  );

  borderRight.position.set(-1.15, .19, 18);

  group.add(borderRight);


  // ----------------------------------------------------------
  // GOLD INLAY LINES
  // ----------------------------------------------------------

  // The promenade remains a continuous stone walk; no decorative
  // gold stripes compete with the HQ facade or pedestrian route.


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

  endCap.position.set(-7, .2, 27);

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

  glassRail.position.set(-7, .82, 26.6);

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

  railTop.position.set(-7, 1.48, 26.6);

  group.add(railTop);


  // Six decorative light pillars were removed to keep the street
  // and sidewalk beside the boardwalk completely unobstructed.

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

    planter.position.set(x, .36, z);

    group.add(planter);


    const plant = new THREE.Mesh(
      plantGeometry,
      plantMat
    );

    plant.position.set(x, 1.12, z);

    group.add(plant);
  });


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

  waterfrontPlaza.position.set(-7, .13, 29);

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

  plazaFront.position.set(-7, .22, 31.35);

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

    seat.position.set(x, .42, z);

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


    // The previous translucent full-volume box has been removed.
    // The facade is built from actual curtain-wall glazing, bronze
    // mullions, floor bands and a restrained architectural crown.

    // ========================================================
    // GLASS CURTAIN WALL — wraps the two side faces and the back of
    // the tower in the same glass used on the new boardwalk overlooks
    // (boardwalkOverlooks.js), so the look carries around the whole
    // building instead of just the street-facing entrance, which keeps
    // its own sign/marquee/window-grid look untouched.
    // ========================================================

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xa9c1d0,
      emissive: 0x101c28,
      emissiveIntensity: .12,
      transparent: true,
      opacity: .24,
      roughness: .16,
      metalness: .28,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const facadeDark = new THREE.MeshStandardMaterial({
      color: 0x11151b,
      roughness: .38,
      metalness: .62
    });

    const facadeBronze = new THREE.MeshStandardMaterial({
      color: 0xb88e55,
      roughness: .28,
      metalness: .82,
      emissive: 0x2a1708,
      emissiveIntensity: .16
    });

    const addFacadePanel = (geometry, material, x, y, z) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      group.add(mesh);
      return mesh;
    };

    [-9.05, 9.05].forEach(x => {

      const sideGlass = new THREE.Mesh(
        new THREE.BoxGeometry(.15, 24, 13),
        glassMat
      );
      sideGlass.position.set(x, 13, 0);
      group.add(sideGlass);

      // Vertical bronze mullions divide the side curtain wall into
      // evenly spaced architectural bays.
      [-5.2, -1.75, 1.75, 5.2].forEach(z => {
        const verticalMullion = new THREE.Mesh(
          new THREE.BoxGeometry(.12, 24, .12),
          facadeBronze
        );
        verticalMullion.position.set(x, 13, z);
        group.add(verticalMullion);
      });

      // Horizontal lines align with the three-floor structure.
      [1.3, 25.8].forEach(y => {
        const mullion = new THREE.Mesh(
          new THREE.BoxGeometry(.18, .1, 13.1),
          facadeBronze
        );
        mullion.position.set(x, y, 0);
        group.add(mullion);
      });

    });

    // The rear curtain wall is split around the real 4.2-unit
    // elevator-to-HQ doorway. No glass crosses the passenger route.
    const rearLeftGlass = new THREE.Mesh(
      new THREE.BoxGeometry(1.70, 24, .15),
      glassMat
    );
    rearLeftGlass.position.set(-8.05, 13, -7.05);
    group.add(rearLeftGlass);

    const rearRightGlass = new THREE.Mesh(
      new THREE.BoxGeometry(11.70, 24, .15),
      glassMat
    );
    rearRightGlass.position.set(3.05, 13, -7.05);
    group.add(rearRightGlass);

    [-7.20, -2.80].forEach(x => {
      addFacadePanel(
        new THREE.BoxGeometry(.12, 25.6, .18),
        facadeBronze,
        x,
        13,
        -7.02
      );
    });

    // Gold back-corner trim, mirroring the existing front trim so the
    // wrap reads as one continuous gold-edged form
    [-9, 9].forEach(x => {

      const backTrim = new THREE.Mesh(
        new THREE.BoxGeometry(.2, 26, .2),
        facadeBronze
      );
      backTrim.position.set(x, 13, -7.05);
      group.add(backTrim);

    });


    // ========================================================
    // FRONT CURTAIN WALL — CONSISTENT THREE-LEVEL FACADE
    // ========================================================
    // Ground-floor glazing stays outside the ten-unit public entry.
    // Upper floors use one aligned glass grid with restrained bronze
    // mullions so the exterior reads as a single designed property.

    [-7, 7].forEach(x => {
      addFacadePanel(
        new THREE.BoxGeometry(4.0, 4.7, .12),
        glassMat,
        x,
        3.55,
        7.02
      );
    });

    addFacadePanel(
      new THREE.BoxGeometry(17.8, 7.45, .12),
      glassMat,
      0,
      16.15,
      7.02
    );

    addFacadePanel(
      new THREE.BoxGeometry(17.8, 3.75, .12),
      glassMat,
      0,
      22.05,
      7.02
    );

    // The structural bronze piers in recordsHQFoundation.js carry
    // the outer bays. Only the center mullion is added here.
    addFacadePanel(
      new THREE.BoxGeometry(.085, 7.35, .16),
      facadeBronze,
      0,
      16.15,
      7.12
    );
    addFacadePanel(
      new THREE.BoxGeometry(.085, 3.7, .16),
      facadeBronze,
      0,
      22.05,
      7.12
    );

    [12.2, 20.2].forEach(y => {
      addFacadePanel(
        new THREE.BoxGeometry(18.35, .32, .42),
        facadeDark,
        0,
        y,
        7.10
      );
      addFacadePanel(
        new THREE.BoxGeometry(18.2, .035, .06),
        facadeBronze,
        0,
        y + .17,
        7.36
      );

      [-9.05, 9.05].forEach(x => {
        addFacadePanel(
          new THREE.BoxGeometry(.42, .32, 14.1),
          facadeDark,
          x,
          y,
          0
        );
        addFacadePanel(
          new THREE.BoxGeometry(.06, .035, 13.9),
          facadeBronze,
          x + Math.sign(x) * .24,
          y + .17,
          0
        );
      });

      // Keep both rear fascia and its bronze pinstripe split at the
      // elevator-to-HQ doorway.
      addFacadePanel(
        new THREE.BoxGeometry(1.70, .32, .42),
        facadeDark,
        -8.05,
        y,
        -7.10
      );
      addFacadePanel(
        new THREE.BoxGeometry(1.65, .035, .06),
        facadeBronze,
        -8.05,
        y + .17,
        -7.36
      );
      addFacadePanel(
        new THREE.BoxGeometry(11.70, .32, .42),
        facadeDark,
        3.05,
        y,
        -7.10
      );
      addFacadePanel(
        new THREE.BoxGeometry(11.65, .035, .06),
        facadeBronze,
        3.05,
        y + .17,
        -7.36
      );
    });

    // A quiet canopy gives the public entrance a believable threshold.
    addFacadePanel(
      new THREE.BoxGeometry(10.4, .20, 1.25),
      facadeDark,
      0,
      6.15,
      7.62
    );
    addFacadePanel(
      new THREE.BoxGeometry(10.2, .045, .08),
      facadeBronze,
      0,
      6.03,
      8.20
    );

    // ========================================================
    // MAIN ARCHITECTURAL IDENTITY — TOP OF BUILDING
    // ========================================================
    const signTex = new THREE.CanvasTexture(createSignTexture());
    signTex.colorSpace = THREE.SRGBColorSpace;

    addFacadePanel(
      new THREE.BoxGeometry(13.2, 2.1, .34),
      facadeDark,
      0,
      25.05,
      7.48
    );

    addFacadePanel(
      new THREE.BoxGeometry(13.0, .055, .08),
      facadeBronze,
      0,
      26.08,
      7.65
    );
    addFacadePanel(
      new THREE.BoxGeometry(13.0, .055, .08),
      facadeBronze,
      0,
      24.02,
      7.65
    );
    [-6.48, 6.48].forEach(x => {
      addFacadePanel(
        new THREE.BoxGeometry(.055, 2.06, .08),
        facadeBronze,
        x,
        25.05,
        7.65
      );
    });

    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(12.6, 1.95),
      new THREE.MeshBasicMaterial({
        map: signTex,
        toneMapped: false
      })
    );
    sign.position.set(0, 25.05, 7.68);
    group.add(sign);

    // The scrolling slogan marquee was removed. The building carries
    // one permanent architectural identity at its crown.

    // The center ten-unit opening remains unobstructed. The adjacent
    // curtain-wall panels and canopy form the entrance architecture.

    // ========================================================
    // VIP MARBLE PLAZA
    // ========================================================
    const plaza = new THREE.Mesh(
      new THREE.BoxGeometry(22, .08, 18),
      new THREE.MeshStandardMaterial({
        color: 0xd6d1c7,
        roughness: .32,
        metalness: .12
      })
    );
    plaza.position.set(0, .04, 10);
    group.add(plaza);


    // No bright parallel gold strips cross the entrance plaza.

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

    // The patio sits outside the rear/east corner of Records HQ,
    // beside the exterior elevator landing and dock approach.
    loungeFloor.position.set(15, .08, -7.85);

    group.add(loungeFloor);

    // Dedicated stone walk connects the patio terrace to its elevator
    // portal. It stays outside the building and leaves the dock route clear.
    const patioWalk = new THREE.Mesh(
      new THREE.BoxGeometry(12.8, .12, 3.8),
      new THREE.MeshStandardMaterial({
        color: 0x29292e,
        roughness: .42,
        metalness: .22
      })
    );
    patioWalk.position.set(3.75, .12, -7.85);
    group.add(patioWalk);

    const patioWalkGold = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffb000,
      emissiveIntensity: .65,
      metalness: .72,
      roughness: .3
    });

    [-1.82, 1.82].forEach(offset => {
      const inlay = new THREE.Mesh(
        new THREE.BoxGeometry(12.6, .035, .055),
        patioWalkGold
      );
      inlay.position.set(3.75, .205, -7.85 + offset);
      group.add(inlay);
    });


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

      seat.position.set(15 + pos[0], .45, -7.85 + pos[1]);

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

    table.position.set(15, .7, -7.85);

    group.add(table);


    // ========================================================
    // ROUNDABOUT APPROACH — CONTINUOUS CONNECTION FROM PATIO WALK
    // ========================================================
    // The patio walkway ends near local X=10. Extend the paved approach
    // all the way to the southwest side of the existing roundabout.
    // This overlaps both surfaces so there is no visible gap.
    const roundaboutApproach = new THREE.Mesh(
      new THREE.BoxGeometry(15.5, 0.12, 3.8),
      new THREE.MeshStandardMaterial({
        color: 0x29292e,
        roughness: 0.42,
        metalness: 0.22
      })
    );
    roundaboutApproach.position.set(17.0, 0.12, -6.45);
    roundaboutApproach.rotation.y = -0.20;
    group.add(roundaboutApproach);

    const approachGold = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffb000,
      emissiveIntensity: 0.55,
      metalness: 0.72,
      roughness: 0.3
    });

    [-1.78, 1.78].forEach(offset => {
      const edge = new THREE.Mesh(
        new THREE.BoxGeometry(15.2, 0.035, 0.055),
        approachGold
      );
      edge.position.set(
        17.0 + Math.sin(-0.20) * offset,
        0.205,
        -6.45 + Math.cos(-0.20) * offset
      );
      edge.rotation.y = -0.20;
      group.add(edge);
    });

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

        color: 0x6d4327,
        roughness: .72,
        metalness: .02

      })

    );

    // Local coordinates place the turnaround beside the HQ-side path.
    roundabout.position.set(30, .1, -2);

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

    ring.position.set(30, .25, -2);

    group.add(ring);


    // The old cross-plaza VIP barrier was removed; the entrance and
    // boardwalk-to-HQ route remain visually continuous.

    // Keep the original street and sidewalk clear. The decorative HQ
    // waterfront promenade overlay is intentionally not attached here.


    // ========================================================
    // FINAL ADD
    // ========================================================

    scene.add(group);

  },


  update() {}

};
