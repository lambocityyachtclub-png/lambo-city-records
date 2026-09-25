// recordsHQMediaDetails.js
// LAMBO CITY RECORDS
// HQ — FLOOR 1 MEDIA EXPERIENCE DETAIL LAYER
//
// Phase 1:
// - Premium Music + Video station enhancement
// - Visual-only presentation layer
// - Works with the existing stageVideo.js system
//
// IMPORTANT:
// - Does NOT create another video player.
// - Does NOT create another audio system.
// - Does NOT change collision.
// - Does NOT change the Floor 1 elevation.
// - Does NOT move the existing elevator.
// - Does NOT replace the existing Music + Video station.
//
// Existing station location:
// HQ world position = (28, 22)
// Local station center = (-5.55, -3.25)
//
// This module is visual only.

import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";

const HQ_X = 28;
const HQ_Z = 22;
const FLOOR_Y = 1.28;

const MEDIA_X = -5.55;
const MEDIA_Z = -3.25;

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
    canvas.getContext("2d");

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
        0.65
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

export default {

  init(scene) {

    const group =
      new THREE.Group();

    group.name =
      "recordsHQMediaDetails";

    group.position.set(
      HQ_X,
      FLOOR_Y,
      HQ_Z
    );

    // ==================================================
    // MATERIALS
    // ==================================================

    const black =
      material(0x05060a, {

        roughness: 0.25,

        metalness: 0.75

      });

    const gold =
      material(0xffd36a, {

        roughness: 0.22,

        metalness: 0.85,

        emissive: 0xff9d00,

        emissiveIntensity: 0.45

      });

    const goldGlow =
      material(0xffb52e, {

        roughness: 0.2,

        metalness: 0.7,

        emissive: 0xff8500,

        emissiveIntensity: 1.2

      });

    const red =
      material(0x720b18, {

        roughness: 0.35,

        metalness: 0.25

      });

    const screen =
      new THREE.MeshStandardMaterial({

        color: 0x11151c,

        emissive: 0x101b2d,

        emissiveIntensity: 0.5,

        roughness: 0.15,

        metalness: 0.35

      });

    const white =
      material(0xf2eee5, {

        roughness: 0.45,

        metalness: 0.08

      });

    // ==================================================
    // MEDIA WALL FRAME
    //
    // Adds a premium architectural frame around
    // the existing Music + Video screen.
    // ==================================================

    box(

      group,

      new THREE.BoxGeometry(
        4.75,
        3.0,
        0.12
      ),

      black,

      MEDIA_X,
      1.65,
      MEDIA_Z + 0.18

    );

    // ==================================================
    // GOLD SCREEN BORDER
    // ==================================================

    box(

      group,

      new THREE.BoxGeometry(
        4.05,
        0.055,
        0.08
      ),

      goldGlow,

      MEDIA_X,
      3.02,
      MEDIA_Z + 0.10

    );

    box(

      group,

      new THREE.BoxGeometry(
        4.05,
        0.055,
        0.08
      ),

      goldGlow,

      MEDIA_X,
      0.28,
      MEDIA_Z + 0.10

    );

    box(

      group,

      new THREE.BoxGeometry(
        0.055,
        2.7,
        0.08
      ),

      goldGlow,

      MEDIA_X - 2.02,
      1.65,
      MEDIA_Z + 0.10

    );

    box(

      group,

      new THREE.BoxGeometry(
        0.055,
        2.7,
        0.08
      ),

      goldGlow,

      MEDIA_X + 2.02,
      1.65,
      MEDIA_Z + 0.10

    );

    // ==================================================
    // MEDIA TITLE
    // ==================================================

    label(

      group,

      "LAMBO CITY RECORDS",

      MEDIA_X,
      3.45,
      MEDIA_Z + 0.05,

      4.8

    );

    label(

      group,

      "WATCH + LISTEN",

      MEDIA_X,
      2.92,
      MEDIA_Z + 0.05,

      3.2

    );

    // ==================================================
    // SPEAKER TOWERS
    // ==================================================

    [-7.65, -3.45]
      .forEach((x) => {

        box(

          group,

          new THREE.BoxGeometry(
            0.62,
            2.35,
            0.58
          ),

          black,

          x,
          1.45,
          MEDIA_Z

        );

        box(

          group,

          new THREE.BoxGeometry(
            0.68,
            0.08,
            0.64
          ),

          gold,

          x,
          2.65,
          MEDIA_Z

        );

        cylinder(

          group,

          new THREE.CylinderGeometry(
            0.16,
            0.16,
            0.06,
            20
          ),

          goldGlow,

          x,
          1.75,
          MEDIA_Z - 0.31

        );

        cylinder(

          group,

          new THREE.CylinderGeometry(
            0.11,
            0.11,
            0.06,
            20
          ),

          red,

          x,
          1.28,
          MEDIA_Z - 0.31

        );

      });

    // ==================================================
    // CONTROL CONSOLE
    //
    // Visual representation of the listening station.
    // ==================================================

    box(

      group,

      new THREE.BoxGeometry(
        3.25,
        0.62,
        0.72
      ),

      black,

      MEDIA_X,
      0.62,
      MEDIA_Z - 1.45

    );

    box(

      group,

      new THREE.BoxGeometry(
        3.35,
        0.06,
        0.78
      ),

      gold,

      MEDIA_X,
      0.96,
      MEDIA_Z - 1.45

    );

    // ==================================================
    // CONTROL LIGHTS
    // ==================================================

    [-1.0, -0.5, 0, 0.5, 1.0]
      .forEach((x) => {

        cylinder(

          group,

          new THREE.CylinderGeometry(
            0.045,
            0.045,
            0.035,
            12
          ),

          goldGlow,

          MEDIA_X + x,
          1.02,
          MEDIA_Z - 1.45

        );

      });

    // ==================================================
    // CENTRAL PLAY BUTTON
    //
    // Visual only.
    // Actual interaction remains in stageVideo.js.
    // ==================================================

    cylinder(

      group,

      new THREE.CylinderGeometry(
        0.23,
        0.23,
        0.06,
        24
      ),

      red,

      MEDIA_X,
      1.04,
      MEDIA_Z - 1.45

    );

    cylinder(

      group,

      new THREE.CylinderGeometry(
        0.09,
        0.09,
        0.065,
        20
      ),

      goldGlow,

      MEDIA_X,
      1.07,
      MEDIA_Z - 1.45

    );

    // ==================================================
    // ALBUM DISPLAY
    // ==================================================

    box(

      group,

      new THREE.BoxGeometry(
        1.25,
        1.25,
        0.10
      ),

      black,

      MEDIA_X + 2.55,
      1.65,
      MEDIA_Z - 0.20

    );

    box(

      group,

      new THREE.BoxGeometry(
        1.05,
        1.05,
        0.025
      ),

      red,

      MEDIA_X + 2.55,
      1.65,
      MEDIA_Z - 0.145

    );

    cylinder(

      group,

      new THREE.CylinderGeometry(
        0.22,
        0.22,
        0.035,
        24
      ),

      goldGlow,

      MEDIA_X + 2.55,
      1.65,
      MEDIA_Z - 0.11

    );

    label(

      group,

      "LAMBO CITY",

      MEDIA_X + 2.55,
      2.45,
      MEDIA_Z - 0.05,

      2.1

    );

    // ==================================================
    // LOW FLOOR LIGHTING
    // ==================================================

    box(

      group,

      new THREE.BoxGeometry(
        4.6,
        0.035,
        0.06
      ),

      goldGlow,

      MEDIA_X,
      0.09,
      MEDIA_Z - 1.95

    );

    // ==================================================
    // MEDIA AMBIENT LIGHT
    // ==================================================

    const mediaLight =
      new THREE.PointLight(
        0xffb84d,
        0.65,
        8
      );

    mediaLight.position.set(
      MEDIA_X,
      2.7,
      MEDIA_Z
    );

    group.add(
      mediaLight
    );

    // ==================================================
    // ADD TO SCENE
    // ==================================================

    scene.add(group);

    return group;

  },

  update() {}

};
