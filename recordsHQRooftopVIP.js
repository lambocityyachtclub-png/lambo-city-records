// recordsHQRooftopVIP.js
// LAMBO CITY RECORDS
// ROOFTOP — VIP LOUNGE
//
// Phase 1 interior / rooftop visual layer.
//
// IMPORTANT:
// - Uses the existing rooftop architectural slab.
// - Does NOT create another floor.
// - Does NOT modify Floor 3.
// - Does NOT modify Floor 2.
// - Does NOT modify Floor 1.
// - Does NOT modify the elevator.
// - Does NOT modify collision.
// - Visual environment only.
//
// ROOFTOP THEME:
// Premium LAMBO CITY RECORDS VIP destination.
// Executive skyline lounge / music / luxury / sunset atmosphere.

import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";

const HQ_X = 28;
const HQ_Z = 22;
const ROOFTOP_Y = 26.30;


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
      "recordsHQRooftopVIP";

    group.position.set(
      HQ_X,
      ROOFTOP_Y,
      HQ_Z
    );


    // =========================================================
    // MATERIALS
    // =========================================================

    const black =
      material(0x070910, {
        roughness: 0.24,
        metalness: 0.75
      });

    const dark =
      material(0x11131b, {
        roughness: 0.34,
        metalness: 0.5
      });

    const gold =
      material(0xffd36a, {
        roughness: 0.23,
        metalness: 0.86,
        emissive: 0xff9d00,
        emissiveIntensity: 0.5
      });

    const goldGlow =
      material(0xffbd45, {
        roughness: 0.24,
        metalness: 0.6,
        emissive: 0xff8500,
        emissiveIntensity: 1.35
      });

    const glass =
      new THREE.MeshStandardMaterial({
        color: 0x63c9ff,
        emissive: 0x16466b,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.25,
        roughness: 0.08,
        metalness: 0.2,
        side: THREE.DoubleSide
      });

    const leather =
      material(0x171015, {
        roughness: 0.7,
        metalness: 0.08
      });

    const red =
      material(0x620b17, {
        roughness: 0.42,
        metalness: 0.18
      });

    const white =
      material(0xd9d9d9, {
        roughness: 0.32,
        metalness: 0.2
      });


    // =========================================================
    // VIP ARRIVAL / IDENTITY
    // =========================================================

    label(
      group,
      "VIP LOUNGE",
      0,
      3.65,
      6.6,
      5.8
    );

    box(
      group,
      new THREE.BoxGeometry(
        5.2,
        0.04,
        0.08
      ),
      goldGlow,
      0,
      0.12,
      5.95
    );


    // =========================================================
    // CENTRAL VIP LOUNGE
    // =========================================================

    const lounge =
      new THREE.Group();

    lounge.name =
      "rooftopVIPLounge";


    // Main luxury sofa

    box(
      lounge,
      new THREE.BoxGeometry(
        5.0,
        0.75,
        1.35
      ),
      black,
      0,
      0.72,
      1.9
    );


    // Sofa back

    box(
      lounge,
      new THREE.BoxGeometry(
        4.75,
        0.9,
        0.35
      ),
      red,
      0,
      1.28,
      2.42
    );


    // Sofa arms

    box(
      lounge,
      new THREE.BoxGeometry(
        0.3,
        0.9,
        1.25
      ),
      black,
      -2.38,
      1.05,
      1.9
    );

    box(
      lounge,
      new THREE.BoxGeometry(
        0.3,
        0.9,
        1.25
      ),
      black,
      2.38,
      1.05,
      1.9
    );


    // VIP coffee table

    box(
      lounge,
      new THREE.BoxGeometry(
        2.2,
        0.14,
        1.15
      ),
      gold,
      0,
      1.02,
      -0.15
    );


    // Table pedestal

    box(
      lounge,
      new THREE.BoxGeometry(
        0.22,
        0.85,
        0.22
      ),
      black,
      0,
      0.55,
      -0.15
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
      0,
      1.12,
      -0.15
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
      0,
      1.17,
      -0.15
    );


    label(
      lounge,
      "LAMBO CITY VIP",
      0,
      2.65,
      2.48,
      5.0
    );

    group.add(lounge);


    // =========================================================
    // VIP BAR
    // =========================================================

    const bar =
      new THREE.Group();

    bar.name =
      "rooftopVIPBar";


    // Main bar

    box(
      bar,
      new THREE.BoxGeometry(
        5.0,
        1.05,
        1.15
      ),
      dark,
      -5.25,
      0.72,
      -2.7
    );


    // Gold countertop

    box(
      bar,
      new THREE.BoxGeometry(
        5.15,
        0.12,
        1.2
      ),
      gold,
      -5.25,
      1.3,
      -2.7
    );


    // Front accent

    box(
      bar,
      new THREE.BoxGeometry(
        4.3,
        0.08,
        0.08
      ),
      goldGlow,
      -5.25,
      0.62,
      -3.3
    );


    // Back display wall

    box(
      bar,
      new THREE.BoxGeometry(
        5.0,
        2.6,
        0.16
      ),
      black,
      -5.25,
      1.8,
      -3.35
    );


    // Bottle/display shapes

    [-6.8, -5.75, -4.75, -3.7].forEach(
      x => {

        cylinder(
          bar,
          new THREE.CylinderGeometry(
            0.13,
            0.17,
            0.72,
            12
          ),
          glass,
          x,
          2.05,
          -3.22
        );

      }
    );


    label(
      bar,
      "VIP",
      -5.25,
      3.05,
      -3.22,
      2.8
    );

    group.add(bar);


    // =========================================================
    // DJ / MUSIC CORNER
    // =========================================================

    const music =
      new THREE.Group();

    music.name =
      "rooftopMusicCorner";


    // DJ console

    box(
      music,
      new THREE.BoxGeometry(
        3.5,
        0.8,
        1.05
      ),
      black,
      5.0,
      0.75,
      -3.1
    );


    // Gold console edge

    box(
      music,
      new THREE.BoxGeometry(
        3.5,
        0.06,
        0.08
      ),
      goldGlow,
      5.0,
      1.18,
      -3.65
    );


    // Turntables

    [-0.75, 0.75].forEach(
      x => {

        cylinder(
          music,
          new THREE.CylinderGeometry(
            0.4,
            0.4,
            0.06,
            24
          ),
          dark,
          5.0 + x,
          1.2,
          -3.1
        );

        cylinder(
          music,
          new THREE.CylinderGeometry(
            0.08,
            0.08,
            0.08,
            16
          ),
          goldGlow,
          5.0 + x,
          1.25,
          -3.1
        );

      }
    );


    // DJ backdrop

    box(
      music,
      new THREE.BoxGeometry(
        4.0,
        2.8,
        0.14
      ),
      black,
      5.0,
      2.0,
      -3.65
    );


    label(
      music,
      "LAMBO CITY RADIO",
      5.0,
      2.55,
      -3.52,
      5.2
    );


    label(
      music,
      "VIP SESSION",
      5.0,
      1.45,
      -3.52,
      3.8
    );

    group.add(music);


    // =========================================================
    // VIP DINING AREA
    // =========================================================

    const dining =
      new THREE.Group();

    dining.name =
      "rooftopVIPDining";


    // Dining table

    box(
      dining,
      new THREE.BoxGeometry(
        3.2,
        0.2,
        1.5
      ),
      dark,
      -1.0,
      1.0,
      -3.0
    );


    // Gold tabletop accent

    box(
      dining,
      new THREE.BoxGeometry(
        2.8,
        0.04,
        0.08
      ),
      gold,
      -1.0,
      1.13,
      -3.0
    );


    // Table base

    box(
      dining,
      new THREE.BoxGeometry(
        0.25,
        0.85,
        0.25
      ),
      black,
      -1.0,
      0.55,
      -3.0
    );


    // Dining chairs

    [
      [-1.0, -4.0],
      [-1.0, -2.0],
      [-2.9, -3.0],
      [0.9, -3.0]
    ].forEach(
      ([x, z]) => {

        box(
          dining,
          new THREE.BoxGeometry(
            0.72,
            0.5,
            0.72
          ),
          leather,
          x,
          0.62,
          z
        );

      }
    );


    label(
      dining,
      "VIP DINING",
      -1.0,
      2.45,
      -3.0,
      3.8
    );

    group.add(dining);


    // =========================================================
    // SKYLINE GLASS RAILING
    // =========================================================

    const railing =
      new THREE.Group();

    railing.name =
      "rooftopSkylineRailing";


    // Rear railing

    box(
      railing,
      new THREE.BoxGeometry(
        17.0,
        1.45,
        0.08
      ),
      glass,
      0,
      1.2,
      -6.35
    );


    // Left railing

    box(
      railing,
      new THREE.BoxGeometry(
        0.08,
        1.45,
        12.5
      ),
      glass,
      -8.35,
      1.2,
      0
    );


    // Right railing

    box(
      railing,
      new THREE.BoxGeometry(
        0.08,
        1.45,
        12.5
      ),
      glass,
      8.35,
      1.2,
      0
    );


    // Gold top rails

    box(
      railing,
      new THREE.BoxGeometry(
        17.2,
        0.08,
        0.08
      ),
      gold,
      0,
      1.95,
      -6.32
    );

    box(
      railing,
      new THREE.BoxGeometry(
        0.08,
        0.08,
        12.7
      ),
      gold,
      -8.32,
      1.95,
      0
    );

    box(
      railing,
      new THREE.BoxGeometry(
        0.08,
        0.08,
        12.7
      ),
      gold,
      8.32,
      1.95,
      0
    );


    // Vertical railing posts

    [-7, -3.5, 0, 3.5, 7].forEach(
      x => {

        box(
          railing,
          new THREE.BoxGeometry(
            0.07,
            1.9,
            0.07
          ),
          goldGlow,
          x,
          1.0,
          -6.3
        );

      }
    );

    group.add(railing);


    // =========================================================
    // VIP PLANTERS
    // =========================================================

    const landscaping =
      new THREE.Group();

    landscaping.name =
      "rooftopVIPLandscaping";


    [
      [-7.0, 3.8],
      [7.0, 3.8],
      [-7.0, -4.5],
      [7.0, -4.5]
    ].forEach(
      ([x, z]) => {

        // Planter

        box(
          landscaping,
          new THREE.BoxGeometry(
            0.9,
            0.65,
            0.9
          ),
          black,
          x,
          0.35,
          z
        );


        // Plant trunk

        cylinder(
          landscaping,
          new THREE.CylinderGeometry(
            0.07,
            0.1,
            1.0,
            10
          ),
          dark,
          x,
          1.0,
          z
        );


        // Crown

        const crown =
          new THREE.Mesh(
            new THREE.SphereGeometry(
              0.55,
              12,
              8
            ),
            new THREE.MeshStandardMaterial({
              color: 0x183c27,
              roughness: 0.8,
              metalness: 0.05
            })
          );

        crown.position.set(
          x,
          1.65,
          z
        );

        landscaping.add(crown);

      }
    );

    group.add(landscaping);


    // =========================================================
    // VIP FIRE / LOUNGE FEATURE
    // =========================================================

    const fire =
      new THREE.Group();

    fire.name =
      "rooftopVIPFireFeature";


    // Fire bowl

    cylinder(
      fire,
      new THREE.CylinderGeometry(
        0.9,
        0.7,
        0.35,
        24
      ),
      black,
      0,
      0.3,
      4.15
    );


    // Inner glow

    cylinder(
      fire,
      new THREE.CylinderGeometry(
        0.55,
        0.4,
        0.08,
        24
      ),
      goldGlow,
      0,
      0.5,
      4.15
    );


    const fireLight =
      new THREE.PointLight(
        0xff8a28,
        0.9,
        8
      );

    fireLight.position.set(
      0,
      1.15,
      4.15
    );

    fire.add(fireLight);

    group.add(fire);


    // =========================================================
    // VIP BRANDING WALL
    // =========================================================

    const branding =
      new THREE.Group();

    branding.name =
      "rooftopVIPBranding";


    box(
      branding,
      new THREE.BoxGeometry(
        5.5,
        2.7,
        0.14
      ),
      black,
      0,
      2.0,
      5.85
    );


    box(
      branding,
      new THREE.BoxGeometry(
        5.15,
        0.08,
        0.08
      ),
      gold,
      0,
      3.3,
      5.7
    );

    box(
      branding,
      new THREE.BoxGeometry(
        5.15,
        0.08,
        0.08
      ),
      gold,
      0,
      0.7,
      5.7
    );


    label(
      branding,
      "LAMBO CITY",
      0,
      2.35,
      5.7,
      4.6
    );

    label(
      branding,
      "RECORDS VIP",
      0,
      1.35,
      5.7,
      4.8
    );

    group.add(branding);


    // =========================================================
    // ROOFTOP FLOOR GUIDES
    // =========================================================

    box(
      group,
      new THREE.BoxGeometry(
        6.0,
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
        5.0
      ),
      goldGlow,
      -3.0,
      0.1,
      0
    );

    box(
      group,
      new THREE.BoxGeometry(
        0.06,
        0.035,
        5.0
      ),
      goldGlow,
      3.0,
      0.1,
      0
    );


    // =========================================================
    // ROOFTOP LIGHTING
    // =========================================================

    const mainLight =
      new THREE.PointLight(
        0xffc36b,
        1.25,
        18
      );

    mainLight.position.set(
      0,
      3.4,
      0
    );

    group.add(mainLight);


    const loungeLight =
      new THREE.PointLight(
        0xffb84d,
        0.65,
        10
      );

    loungeLight.position.set(
      -4,
      2.5,
      2
    );

    group.add(loungeLight);


    // =========================================================
    // ROOFTOP EDGE LIGHTING
    // =========================================================

    [
      [-7.5, -5.95],
      [-3.75, -5.95],
      [0, -5.95],
      [3.75, -5.95],
      [7.5, -5.95]
    ].forEach(
      ([x, z]) => {

        const edgeLight =
          new THREE.PointLight(
            0xffb84d,
            0.28,
            4
          );

        edgeLight.position.set(
          x,
          1.1,
          z
        );

        group.add(edgeLight);

      }
    );


    // =========================================================
    // ADD ROOFTOP TO SCENE
    // =========================================================

    scene.add(group);

    return group;
  },


  update() {}

};
