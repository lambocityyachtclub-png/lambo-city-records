// recordsHQFloor1.js
// LAMBO CITY RECORDS
// FLOOR 1 — RECORDS EXPERIENCE
//
// Clean architectural Floor 1 layout.
//
// DESIGN:
// - Open entrance
// - Left-wall video installation
// - Right-wall merchandise
// - Open central circulation
// - Completely clear elevator approach
//
// IMPORTANT:
// - Uses the existing HQ floor architecture.
// - Does not create a second architectural floor.
// - Does not move the elevator.
// - Does not change player movement.
// - Does not create collision.
//
// Floor plan:
//
//              REAR / ELEVATOR
//
//       VIDEO WALL        ELEVATOR
//       LEFT SIDE          CLEAR
//
//              OPEN SPACE
//
//                         MERCH
//                         RIGHT
//
//              ENTRANCE
//              BOARDWALK

import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";

const HQ_X = 28;
const HQ_Z = 22;
const FLOOR_Y = 1.28;


// ============================================================
// MATERIAL
// ============================================================

function material(color, options = {}) {

  return new THREE.MeshStandardMaterial({

    color,

    roughness:
      options.roughness ?? 0.4,

    metalness:
      options.metalness ?? 0.35,

    emissive:
      options.emissive ?? 0x000000,

    emissiveIntensity:
      options.emissiveIntensity ?? 0

  });

}


// ============================================================
// BOX
// ============================================================

function box(
  parent,
  geometry,
  mat,
  x,
  y,
  z
) {

  const mesh =
    new THREE.Mesh(
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


// ============================================================
// CYLINDER
// ============================================================

function cylinder(
  parent,
  geometry,
  mat,
  x,
  y,
  z
) {

  const mesh =
    new THREE.Mesh(
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


// ============================================================
// WALL LABEL
// ============================================================

function label(
  parent,
  text,
  x,
  y,
  z,
  width = 3.5
) {

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width = 512;
  canvas.height = 128;

  const ctx =
    canvas.getContext(
      "2d"
    );

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.font =
    "bold 38px Arial";

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";

  ctx.fillStyle =
    "#ffd36a";

  ctx.fillText(
    text,
    256,
    64
  );

  const texture =
    new THREE.CanvasTexture(
      canvas
    );

  texture.colorSpace =
    THREE.SRGBColorSpace;

  const mat =
    new THREE.MeshBasicMaterial({

      map: texture,

      transparent: true,

      side:
        THREE.DoubleSide

    });

  const mesh =
    new THREE.Mesh(

      new THREE.PlaneGeometry(
        width,
        0.55
      ),

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


// ============================================================
// SYSTEM
// ============================================================

export default {

  init(scene) {

    const group =
      new THREE.Group();

    group.name =
      "recordsHQFloor1";

    group.position.set(
      HQ_X,
      FLOOR_Y,
      HQ_Z
    );


    // ========================================================
    // MATERIALS
    // ========================================================

    const black =
      material(
        0x080a10,
        {
          roughness: 0.3,
          metalness: 0.65
        }
      );


    const gold =
      material(
        0xffd36a,
        {
          roughness: 0.25,
          metalness: 0.8,
          emissive: 0xff9d00,
          emissiveIntensity: 0.38
        }
      );


    const goldGlow =
      material(
        0xffc14a,
        {
          roughness: 0.3,
          metalness: 0.55,
          emissive: 0xff8500,
          emissiveIntensity: 1.0
        }
      );


    const white =
      material(
        0xf2eee5,
        {
          roughness: 0.45,
          metalness: 0.1
        }
      );


    const red =
      material(
        0x720b18,
        {
          roughness: 0.4,
          metalness: 0.2
        }
      );


    const screen =
      new THREE.MeshStandardMaterial({

        color: 0x11151c,

        emissive: 0x101b2d,

        emissiveIntensity: 0.65,

        roughness: 0.15,

        metalness: 0.35

      });


    // ========================================================
    // EXISTING FLOOR WALKING SURFACE
    // ========================================================

    const floor =
      new THREE.Mesh(

        new THREE.BoxGeometry(
          17.9,
          0.08,
          13.8
        ),

        black

      );

    floor.position.set(
      0,
      0.035,
      0
    );

    group.add(floor);


    // ========================================================
    // MINIMAL ARCHITECTURAL FLOOR TRIM
    // ========================================================
    //
    // Only perimeter trim.
    // No floating guides.
    // No center floor symbols.
    //

    box(
      group,
      new THREE.BoxGeometry(
        17.75,
        0.035,
        0.07
      ),
      gold,
      0,
      0.07,
      6.82
    );


    box(
      group,
      new THREE.BoxGeometry(
        17.75,
        0.035,
        0.07
      ),
      gold,
      0,
      0.07,
      -6.82
    );


    box(
      group,
      new THREE.BoxGeometry(
        0.07,
        0.035,
        13.65
      ),
      gold,
      -8.82,
      0.07,
      0
    );


    box(
      group,
      new THREE.BoxGeometry(
        0.07,
        0.035,
        13.65
      ),
      gold,
      8.82,
      0.07,
      0
    );


    // ========================================================
    // ENTRANCE ARRIVAL ZONE
    // ========================================================
    //
    // Front entrance is approximately local Z = +6.8.
    //
    // Keep this entire area open.
    //

    box(
      group,
      new THREE.BoxGeometry(
        7.0,
        0.025,
        0.06
      ),
      goldGlow,
      0,
      0.10,
      5.95
    );


    label(
      group,
      "LAMBO CITY RECORDS",
      0,
      0.35,
      5.72,
      5.2
    );


    // ========================================================
    // LEFT WALL — VIDEO INSTALLATION
    // ========================================================
    //
    // World:
    // X ≈ 19.5
    //
    // The display is attached to the architectural left wall
    // instead of occupying walking space.
    //
    // It faces inward toward the room.
    //

    const videoWall =
      new THREE.Group();

    videoWall.name =
      "floor1VideoWall";


    const videoX =
      -8.48;

    const videoZ =
      -1.0;


    // Main architectural panel.

    box(
      videoWall,
      new THREE.BoxGeometry(
        0.18,
        3.2,
        5.4
      ),
      black,
      videoX,
      1.75,
      videoZ
    );


    // Screen.

    const videoScreen =
      new THREE.Mesh(

        new THREE.BoxGeometry(
          0.06,
          2.35,
          4.35
        ),

        screen

      );

    videoScreen.position.set(
      videoX + 0.12,
      1.9,
      videoZ
    );

    videoScreen.rotation.y =
      Math.PI / 2;

    videoWall.add(
      videoScreen
    );


    // Screen frame.

    box(
      videoWall,
      new THREE.BoxGeometry(
        0.08,
        2.65,
        4.65
      ),
      gold,
      videoX + 0.17,
      1.9,
      videoZ
    );


    // Inner screen placed in front of frame.

    box(
      videoWall,
      new THREE.BoxGeometry(
        0.05,
        2.35,
        4.35
      ),
      screen,
      videoX + 0.22,
      1.9,
      videoZ
    );


    label(
      videoWall,
      "LAMBO CITY RECORDS",
      videoX + 0.24,
      3.35,
      videoZ,
      4.2
    );


    label(
      videoWall,
      "WATCH + LISTEN",
      videoX + 0.25,
      0.55,
      videoZ,
      3.0
    );


    // Small architectural console.
    // Kept tight against the wall.

    box(
      videoWall,
      new THREE.BoxGeometry(
        0.65,
        0.55,
        2.0
      ),
      black,
      videoX + 0.35,
      0.48,
      videoZ
    );


    box(
      videoWall,
      new THREE.BoxGeometry(
        0.08,
        0.05,
        1.65
      ),
      goldGlow,
      videoX + 0.70,
      0.78,
      videoZ
    );


    group.add(
      videoWall
    );


    // ========================================================
    // RIGHT WALL — MERCHANDISE
    // ========================================================
    //
    // Merchandise is now architectural rather than a large
    // freestanding wall in front of the entrance.
    //

    const merch =
      new THREE.Group();

    merch.name =
      "floor1MerchandiseWall";


    const merchX =
      8.48;

    const merchZ =
      0.4;


    // Slim merchandise wall.

    box(
      merch,
      new THREE.BoxGeometry(
        0.18,
        3.15,
        5.8
      ),
      black,
      merchX,
      1.75,
      merchZ
    );


    // Gold frame.

    box(
      merch,
      new THREE.BoxGeometry(
        0.08,
        2.8,
        5.35
      ),
      gold,
      merchX - 0.12,
      1.8,
      merchZ
    );


    // Apparel shelves.

    [-1.65, 0, 1.65]
      .forEach((z) => {

        box(
          merch,
          new THREE.BoxGeometry(
            0.85,
            0.08,
            1.35
          ),
          gold,
          merchX - 0.45,
          1.15,
          merchZ + z
        );

      });


    // Small apparel blocks.

    [-1.65, 0, 1.65]
      .forEach((z, index) => {

        box(
          merch,
          new THREE.BoxGeometry(
            0.42,
            0.65,
            0.55
          ),
          index === 1
            ? red
            : white,
          merchX - 0.62,
          1.55,
          merchZ + z
        );

      });


    // Hats.

    [-1.65, 0, 1.65]
      .forEach((z, index) => {

        cylinder(
          merch,
          new THREE.CylinderGeometry(
            0.22,
            0.25,
            0.15,
            20
          ),
          index === 1
            ? red
            : black,
          merchX - 0.58,
          2.35,
          merchZ + z
        );

      });


    // Vinyl display.

    cylinder(
      merch,
      new THREE.CylinderGeometry(
        0.42,
        0.42,
        0.07,
        32
      ),
      black,
      merchX - 0.60,
      3.15,
      merchZ
    );


    cylinder(
      merch,
      new THREE.CylinderGeometry(
        0.12,
        0.12,
        0.075,
        24
      ),
      goldGlow,
      merchX - 0.60,
      3.15,
      merchZ
    );


    label(
      merch,
      "MERCH",
      merchX - 0.20,
      3.85,
      merchZ,
      2.5
    );


    // ========================================================
    // SMALL MERCH COUNTER
    // ========================================================
    //
    // Counter is now against the right side instead of
    // blocking the entrance.
    //

    box(
      merch,
      new THREE.BoxGeometry(
        0.9,
        0.75,
        2.0
      ),
      black,
      merchX - 0.55,
      0.45,
      3.25
    );


    box(
      merch,
      new THREE.BoxGeometry(
        1.0,
        0.08,
        2.1
      ),
      gold,
      merchX - 0.55,
      0.86,
      3.25
    );


    label(
      merch,
      "RECORDS",
      merchX - 0.15,
      0.72,
      3.25,
      2.0
    );


    group.add(
      merch
    );


    // ========================================================
    // ELEVATOR CLEAR ZONE
    // ========================================================
    //
    // IMPORTANT:
    // Nothing decorative is placed here.
    //
    // Elevator world position:
    // X = 23
    // Z = 14.15
    //
    // Local:
    // X = -5
    // Z = -7.85
    //
    // We leave the entire rear-left approach open.
    //

    const elevatorMarker =
      new THREE.Group();

    elevatorMarker.name =
      "floor1ElevatorArrival";


    // Extremely subtle landing indicator.
    // Kept flush with the floor.

    box(
      elevatorMarker,
      new THREE.BoxGeometry(
        2.7,
        0.025,
        1.25
      ),
      gold,
      -5,
      0.09,
      -6.45
    );


    group.add(
      elevatorMarker
    );


    // ========================================================
    // CEILING LIGHTS
    // ========================================================
    //
    // Clean architectural lighting.
    // No X shapes.
    // No floating symbols.
    //

    const ceilingLights =
      new THREE.Group();

    ceilingLights.name =
      "floor1CeilingLights";


    box(
      ceilingLights,
      new THREE.BoxGeometry(
        5.5,
        0.05,
        0.10
      ),
      goldGlow,
      0,
      3.75,
      -3.8
    );


    box(
      ceilingLights,
      new THREE.BoxGeometry(
        5.5,
        0.05,
        0.10
      ),
      goldGlow,
      0,
      3.75,
      1.0
    );


    group.add(
      ceilingLights
    );


    // ========================================================
    // AMBIENT LIGHT
    // ========================================================

    const light =
      new THREE.PointLight(
        0xffc36b,
        0.85,
        12
      );


    light.position.set(
      0,
      3.3,
      0
    );


    group.add(
      light
    );


    // ========================================================
    // ADD TO SCENE
    // ========================================================

    scene.add(
      group
    );


    return group;

  },


  update() {}

};
