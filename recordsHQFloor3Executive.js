// recordsHQFloor3Executive.js
// LAMBO CITY RECORDS
// FLOOR 3 — MEETINGS + EXECUTIVE
//
// Phase 1 interior visual layer.
//
// IMPORTANT:
// - Uses the existing Floor 3 architectural slab.
// - Does NOT create another floor.
// - Does NOT modify the elevator.
// - Does NOT modify collision.
// - Does NOT modify Floor 1.
// - Does NOT modify Floor 2.
// - Visual environment only.
//
// FLOOR 3 THEME:
// Premium LAMBO CITY RECORDS executive / meetings level.

import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";

const HQ_X = 28;
const HQ_Z = 22;
const FLOOR_Y = 20.28;


// =============================================================
// MATERIAL HELPERS
// =============================================================

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.4,
    metalness: options.metalness ?? 0.35,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity:
      options.emissiveIntensity ?? 0
  });
}


function box(
  parent,
  geometry,
  mat,
  x,
  y,
  z
) {
  const mesh = new THREE.Mesh(
    geometry,
    mat
  );

  mesh.position.set(
    x,
    y,
    z
  );

  parent.add(mesh);

  return mesh;
}


function cylinder(
  parent,
  geometry,
  mat,
  x,
  y,
  z
) {
  const mesh = new THREE.Mesh(
    geometry,
    mat
  );

  mesh.position.set(
    x,
    y,
    z
  );

  parent.add(mesh);

  return mesh;
}


// =============================================================
// TEXT LABEL
// =============================================================

function label(
  parent,
  text,
  x,
  y,
  z,
  width = 5
) {
  const canvas =
    document.createElement("canvas");

  canvas.width = 768;
  canvas.height = 160;

  const context =
    canvas.getContext("2d");

  context.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  context.font =
    "bold 46px Arial";

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#ffd36a";

  context.fillText(
    text,
    384,
    80
  );

  const texture =
    new THREE.CanvasTexture(canvas);

  texture.colorSpace =
    THREE.SRGBColorSpace;

  const signMaterial =
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });

  const sign =
    new THREE.Mesh(
      new THREE.PlaneGeometry(
        width,
        0.85
      ),
      signMaterial
    );

  sign.position.set(
    x,
    y,
    z
  );

  parent.add(sign);

  return sign;
}


// =============================================================
// EXPORT
// =============================================================

export default {

  init(scene) {

    const group =
      new THREE.Group();

    group.name =
      "recordsHQFloor3Executive";

    group.position.set(
      HQ_X,
      FLOOR_Y,
      HQ_Z
    );


    // =========================================================
    // MATERIALS
    // =========================================================

    const black =
      material(0x070910, {
        roughness: 0.25,
        metalness: 0.72
      });

    const dark =
      material(0x11131b, {
        roughness: 0.34,
        metalness: 0.48
      });

    const charcoal =
      material(0x1a1c24, {
        roughness: 0.5,
        metalness: 0.3
      });

    const gold =
      material(0xffd36a, {
        roughness: 0.24,
        metalness: 0.84,
        emissive: 0xff9d00,
        emissiveIntensity: 0.48
      });

    const goldGlow =
      material(0xffbd45, {
        roughness: 0.25,
        metalness: 0.58,
        emissive: 0xff8500,
        emissiveIntensity: 1.25
      });

    const glass =
      new THREE.MeshStandardMaterial({
        color: 0x55bfff,
        emissive: 0x123c60,
        emissiveIntensity: 0.26,
        transparent: true,
        opacity: 0.22,
        roughness: 0.1,
        metalness: 0.22,
        side: THREE.DoubleSide
      });

    const leather =
      material(0x171015, {
        roughness: 0.72,
        metalness: 0.08
      });

    const red =
      material(0x5d0b16, {
        roughness: 0.42,
        metalness: 0.18
      });


    // =========================================================
    // FLOOR 3 ARRIVAL / IDENTITY
    // =========================================================

    label(
      group,
      "MEETINGS + EXECUTIVE",
      0,
      3.85,
      6.65,
      8.2
    );

    box(
      group,
      new THREE.BoxGeometry(
        5.8,
        0.04,
        0.07
      ),
      goldGlow,
      0,
      0.12,
      5.95
    );


    // =========================================================
    // CENTRAL EXECUTIVE MEETING TABLE
    // =========================================================

    const meeting =
      new THREE.Group();

    meeting.name =
      "floor3ExecutiveMeetingRoom";


    // Main table

    box(
      meeting,
      new THREE.BoxGeometry(
        7.2,
        0.28,
        2.15
      ),
      dark,
      0,
      1.0,
      0.15
    );

    // Gold table edge

    box(
      meeting,
      new THREE.BoxGeometry(
        7.25,
        0.06,
        0.08
      ),
      gold,
      0,
      1.17,
      -0.91
    );

    box(
      meeting,
      new THREE.BoxGeometry(
        7.25,
        0.06,
        0.08
      ),
      gold,
      0,
      1.17,
      1.21
    );


    // Table pedestal

    box(
      meeting,
      new THREE.BoxGeometry(
        1.2,
        0.9,
        1.0
      ),
      black,
      0,
      0.48,
      0.15
    );


    // Center table feature

    box(
      meeting,
      new THREE.BoxGeometry(
        2.2,
        0.05,
        0.32
      ),
      goldGlow,
      0,
      1.18,
      0.15
    );


    // Meeting chairs

    const chairPositions = [
      [-3.7, 0.0],
      [-1.85, 0.0],
      [1.85, 0.0],
      [3.7, 0.0],
      [0.0, -1.9],
      [0.0, 2.15]
    ];

    chairPositions.forEach(
      ([x, z], index) => {

        box(
          meeting,
          new THREE.BoxGeometry(
            1.15,
            0.62,
            0.95
          ),
          leather,
          x,
          0.68,
          z
        );

        box(
          meeting,
          new THREE.BoxGeometry(
            1.08,
            1.0,
            0.18
          ),
          leather,
          x,
          1.05,
          z + (
            index < 4
              ? (z > 0 ? 0.32 : -0.32)
              : 0
          )
        );

      }
    );


    label(
      meeting,
      "EXECUTIVE MEETING",
      0,
      2.9,
      1.3,
      5.8
    );

    group.add(meeting);


    // =========================================================
    // EXECUTIVE PRESENTATION WALL
    // =========================================================

    const presentation =
      new THREE.Group();

    presentation.name =
      "floor3PresentationWall";


    // Back wall

    box(
      presentation,
      new THREE.BoxGeometry(
        7.4,
        3.6,
        0.22
      ),
      black,
      0,
      2.0,
      -5.85
    );


    // Gold wall frame

    box(
      presentation,
      new THREE.BoxGeometry(
        7.0,
        0.08,
        0.08
      ),
      gold,
      0,
      3.65,
      -5.68
    );

    box(
      presentation,
      new THREE.BoxGeometry(
        0.08,
        3.45,
        0.08
      ),
      gold,
      -3.48,
      2.0,
      -5.68
    );

    box(
      presentation,
      new THREE.BoxGeometry(
        0.08,
        3.45,
        0.08
      ),
      gold,
      3.48,
      2.0,
      -5.68
    );


    // Main presentation screen

    box(
      presentation,
      new THREE.BoxGeometry(
        5.5,
        2.25,
        0.08
      ),
      glass,
      0,
      2.15,
      -5.67
    );


    // Screen gold border

    box(
      presentation,
      new THREE.BoxGeometry(
        5.7,
        0.07,
        0.06
      ),
      goldGlow,
      0,
      3.3,
      -5.61
    );

    box(
      presentation,
      new THREE.BoxGeometry(
        5.7,
        0.07,
        0.06
      ),
      goldGlow,
      0,
      1.0,
      -5.61
    );


    label(
      presentation,
      "LAMBO CITY RECORDS",
      0,
      2.25,
      -5.55,
      5.2
    );


    label(
      presentation,
      "EXECUTIVE PRESENTATION",
      0,
      3.82,
      -5.55,
      6.0
    );

    group.add(presentation);


    // =========================================================
    // GLASS EXECUTIVE CONFERENCE ROOM
    // =========================================================

    const conference =
      new THREE.Group();

    conference.name =
      "floor3GlassConferenceRoom";


    // Rear glass wall

    box(
      conference,
      new THREE.BoxGeometry(
        5.0,
        3.5,
        0.12
      ),
      glass,
      -6.0,
      1.85,
      1.7
    );


    // Side glass walls

    box(
      conference,
      new THREE.BoxGeometry(
        0.12,
        3.5,
        3.8
      ),
      glass,
      -8.45,
      1.85,
      -0.15
    );

    box(
      conference,
      new THREE.BoxGeometry(
        0.12,
        3.5,
        3.8
      ),
      glass,
      -3.55,
      1.85,
      -0.15
    );


    // Gold upper frame

    box(
      conference,
      new THREE.BoxGeometry(
        5.1,
        0.08,
        0.08
      ),
      gold,
      -6.0,
      3.58,
      1.68
    );


    // Conference table

    box(
      conference,
      new THREE.BoxGeometry(
        3.4,
        0.22,
        1.35
      ),
      dark,
      -6.0,
      0.95,
      0.0
    );


    // Conference table center strip

    box(
      conference,
      new THREE.BoxGeometry(
        2.4,
        0.04,
        0.08
      ),
      goldGlow,
      -6.0,
      1.09,
      0.0
    );


    // Conference chairs

    [-1.0, 0, 1.0].forEach(
      z => {

        box(
          conference,
          new THREE.BoxGeometry(
            0.72,
            0.48,
            0.65
          ),
          leather,
          -6.0,
          0.58,
          z
        );

      }
    );


    label(
      conference,
      "BOARDROOM",
      -6.0,
      3.95,
      1.65,
      4.0
    );

    group.add(conference);


    // =========================================================
    // EXECUTIVE LOUNGE
    // =========================================================

    const lounge =
      new THREE.Group();

    lounge.name =
      "floor3ExecutiveLounge";


    // Sofa

    box(
      lounge,
      new THREE.BoxGeometry(
        4.0,
        0.7,
        1.25
      ),
      black,
      5.0,
      0.65,
      -2.0
    );

    box(
      lounge,
      new THREE.BoxGeometry(
        3.75,
        0.85,
        0.38
      ),
      red,
      5.0,
      1.25,
      -2.45
    );


    // Lounge table

    box(
      lounge,
      new THREE.BoxGeometry(
        1.6,
        0.12,
        0.95
      ),
      gold,
      5.0,
      0.95,
      0.15
    );


    // Table base

    box(
      lounge,
      new THREE.BoxGeometry(
        0.14,
        0.9,
        0.14
      ),
      black,
      5.0,
      0.5,
      0.15
    );


    // Decorative record

    cylinder(
      lounge,
      new THREE.CylinderGeometry(
        0.55,
        0.55,
        0.06,
        32
      ),
      black,
      5.0,
      1.06,
      0.15
    );

    cylinder(
      lounge,
      new THREE.CylinderGeometry(
        0.07,
        0.07,
        0.08,
        16
      ),
      goldGlow,
      5.0,
      1.12,
      0.15
    );


    label(
      lounge,
      "EXECUTIVE LOUNGE",
      5.0,
      2.55,
      -2.45,
      5.0
    );

    group.add(lounge);


    // =========================================================
    // EXECUTIVE DESK / OFFICE
    // =========================================================

    const office =
      new THREE.Group();

    office.name =
      "floor3ExecutiveOffice";


    // Desk

    box(
      office,
      new THREE.BoxGeometry(
        3.5,
        0.22,
        1.55
      ),
      dark,
      5.0,
      0.95,
      3.9
    );


    // Gold desk edge

    box(
      office,
      new THREE.BoxGeometry(
        3.5,
        0.05,
        0.08
      ),
      gold,
      5.0,
      1.09,
      3.15
    );


    // Desk pedestal

    box(
      office,
      new THREE.BoxGeometry(
        0.65,
        0.8,
        0.75
      ),
      black,
      5.0,
      0.5,
      3.9
    );


    // Executive chair

    box(
      office,
      new THREE.BoxGeometry(
        1.0,
        0.55,
        0.9
      ),
      leather,
      5.0,
      0.65,
      5.0
    );

    box(
      office,
      new THREE.BoxGeometry(
        0.9,
        1.15,
        0.18
      ),
      leather,
      5.0,
      1.15,
      5.35
    );


    // Desk display

    box(
      office,
      new THREE.BoxGeometry(
        1.45,
        0.75,
        0.06
      ),
      glass,
      5.0,
      1.55,
      3.75
    );


    label(
      office,
      "EXECUTIVE",
      5.0,
      2.65,
      3.85,
      3.8
    );

    group.add(office);


    // =========================================================
    // EXECUTIVE BRANDING WALL
    // =========================================================

    const branding =
      new THREE.Group();

    branding.name =
      "floor3BrandingWall";


    box(
      branding,
      new THREE.BoxGeometry(
        4.8,
        2.8,
        0.16
      ),
      black,
      -2.0,
      2.0,
      5.75
    );


    box(
      branding,
      new THREE.BoxGeometry(
        4.5,
        0.08,
        0.08
      ),
      gold,
      -2.0,
      3.35,
      5.62
    );


    box(
      branding,
      new THREE.BoxGeometry(
        4.5,
        0.08,
        0.08
      ),
      gold,
      -2.0,
      0.65,
      5.62
    );


    label(
      branding,
      "LAMBO CITY",
      -2.0,
      2.2,
      5.62,
      4.0
    );


    label(
      branding,
      "RECORDS",
      -2.0,
      1.25,
      5.62,
      3.4
    );

    group.add(branding);


    // =========================================================
    // GOLD FLOOR GUIDES
    // =========================================================

    box(
      group,
      new THREE.BoxGeometry(
        6.5,
        0.035,
        0.06
      ),
      goldGlow,
      0,
      0.1,
      0
    );

    box(
      group,
      new THREE.BoxGeometry(
        0.06,
        0.035,
        4.0
      ),
      goldGlow,
      -3.4,
      0.1,
      -2.0
    );

    box(
      group,
      new THREE.BoxGeometry(
        0.06,
        0.035,
        4.0
      ),
      goldGlow,
      3.4,
      0.1,
      -2.0
    );


    // =========================================================
    // CEILING DETAILS
    // =========================================================

    const ceiling =
      new THREE.Group();

    ceiling.name =
      "floor3ExecutiveCeiling";


    [-5.5, 0, 5.5].forEach(
      x => {

        box(
          ceiling,
          new THREE.BoxGeometry(
            2.6,
            0.05,
            0.14
          ),
          goldGlow,
          x,
          3.8,
          0.8
        );

        box(
          ceiling,
          new THREE.BoxGeometry(
            0.14,
            0.05,
            2.6
          ),
          goldGlow,
          x,
          3.8,
          0.8
        );

      }
    );

    group.add(ceiling);


    // =========================================================
    // AMBIENT EXECUTIVE LIGHTING
    // =========================================================

    const light =
      new THREE.PointLight(
        0xffc36b,
        1.2,
        17
      );

    light.position.set(
      0,
      3.35,
      0
    );

    group.add(light);


    // Secondary lounge light

    const loungeLight =
      new THREE.PointLight(
        0xffb84d,
        0.65,
        10
      );

    loungeLight.position.set(
      5,
      2.8,
      -2
    );

    group.add(loungeLight);


    // =========================================================
    // ADD FLOOR 3 TO SCENE
    // =========================================================

    scene.add(group);

    return group;
  },


  update() {}

};
