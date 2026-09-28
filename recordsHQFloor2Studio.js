// recordsHQFloor2Studio.js
// LAMBO CITY RECORDS
// FLOOR 2 — LAMBO CITY DIGITAL STUDIO
//
// PHASE 1 — PHYSICAL STUDIO ARCHITECTURE
//
// IMPORTANT:
// - Uses the existing Floor 2 architectural slab.
// - Does NOT create another floor.
// - Does NOT modify the elevator.
// - Does NOT modify collision.
// - Does NOT modify Floor 1.
// - Does NOT modify Floor 3.
// - Does NOT create the Studio App yet.
//
// NORTH STAR:
//
// CREATE BEAT
//      ↓
// ARRANGE
//      ↓
// RECORD VOCALS
//      ↓
// EDIT
//      ↓
// MIX
//      ↓
// MASTER
//      ↓
// EXPORT
//      ↓
// SONG ARCHIVE
//      ↓
// OPTIONAL FUTURE PUBLISHING → LAMBO CITY RADIO
//
// Physical stations are intentionally separated so the room
// can later become the physical interface for the Studio App.
//
// NO LISTENING LOUNGE.
// Rooftop handles listening / relaxation / VIP music culture.

import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";

const HQ_X = 28;
const HQ_Z = 22;
const FLOOR_Y = 12.28;

// =============================================================
// HELPERS
// =============================================================

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
  z,
  rotationY = 0
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

  mesh.rotation.y =
    rotationY;

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
  width = 4.5
) {

  const canvas =
    document.createElement(
      "canvas"
    );

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

  context.textAlign =
    "center";

  context.textBaseline =
    "middle";

  context.fillStyle =
    "#ffd36a";

  context.fillText(
    text,
    384,
    80
  );

  const texture =
    new THREE.CanvasTexture(
      canvas
    );

  texture.colorSpace =
    THREE.SRGBColorSpace;

  const signMaterial =
    new THREE.MeshBasicMaterial({

      map: texture,

      transparent: true,

      side:
        THREE.DoubleSide

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
// INIT
// =============================================================

export default {

  init(scene) {

    const group =
      new THREE.Group();

    group.name =
      "recordsHQFloor2Studio";

    group.position.set(
      HQ_X,
      FLOOR_Y,
      HQ_Z
    );

    // =========================================================
    // MATERIALS
    // =========================================================

    const black =
      material(
        0x070910,
        {
          roughness: 0.27,
          metalness: 0.72
        }
      );

    const dark =
      material(
        0x11131b,
        {
          roughness: 0.38,
          metalness: 0.45
        }
      );

    const gold =
      material(
        0xffd36a,
        {
          roughness: 0.25,
          metalness: 0.82,
          emissive: 0xff9d00,
          emissiveIntensity: 0.5
        }
      );

    const goldGlow =
      material(
        0xffbd45,
        {
          roughness: 0.28,
          metalness: 0.55,
          emissive: 0xff8500,
          emissiveIntensity: 1.3
        }
      );

    const glass =
      new THREE.MeshStandardMaterial({

        color:
          0x55bfff,

        emissive:
          0x123c60,

        emissiveIntensity:
          0.3,

        transparent: true,

        opacity: 0.28,

        roughness: 0.1,

        metalness: 0.2,

        side:
          THREE.DoubleSide

      });

    const red =
      material(
        0x6d0b18,
        {
          roughness: 0.4,
          metalness: 0.2
        }
      );

    const white =
      material(
        0xdce5ee,
        {
          roughness: 0.3,
          metalness: 0.1
        }
      );

    // =========================================================
    // FLOOR 2 IDENTITY
    // =========================================================

    label(
      group,
      "LAMBO CITY DIGITAL STUDIO",
      0,
      3.9,
      6.65,
      7.8
    );

    box(
      group,
      new THREE.BoxGeometry(
        6.4,
        0.04,
        0.07
      ),
      goldGlow,
      0,
      0.12,
      5.9
    );

    label(
      group,
      "CREATE • RECORD • PRODUCE",
      0,
      3.05,
      -6.45,
      7.4
    );

    // =========================================================
    // 1. MPC / BEAT LAB
    //
    // Left-middle.
    //
    // Angled inward so the artist sits naturally toward the
    // room / exterior view rather than facing a flat wall.
    // =========================================================

    const beatLab =
      new THREE.Group();

    beatLab.name =
      "floor2BeatLab";

    const beatX =
      -5.65;

    const beatZ =
      -0.55;

    const beatAngle =
      Math.PI * 0.12;

    // Main production desk

    box(
      beatLab,
      new THREE.BoxGeometry(
        1.35,
        0.18,
        3.75
      ),
      dark,
      beatX,
      0.92,
      beatZ,
      beatAngle
    );

    // Gold desk edge

    box(
      beatLab,
      new THREE.BoxGeometry(
        0.06,
        0.05,
        3.8
      ),
      gold,
      beatX + 0.62,
      1.04,
      beatZ,
      beatAngle
    );

    // MPC

    box(
      beatLab,
      new THREE.BoxGeometry(
        0.95,
        0.16,
        1.18
      ),
      black,
      beatX,
      1.08,
      -1.45,
      beatAngle
    );

    // MPC pads

    for (
      let row = 0;
      row < 4;
      row++
    ) {

      for (
        let col = 0;
        col < 4;
        col++
      ) {

        box(
          beatLab,
          new THREE.BoxGeometry(
            0.14,
            0.05,
            0.14
          ),
          goldGlow,
          beatX - 0.27 +
            col * 0.18,
          1.19,
          -1.82 +
            row * 0.20,
          beatAngle
        );

      }

    }

    // Production screen

    box(
      beatLab,
      new THREE.BoxGeometry(
        0.08,
        1.0,
        1.55
      ),
      glass,
      beatX + 0.56,
      1.82,
      0.15,
      beatAngle
    );

    box(
      beatLab,
      new THREE.BoxGeometry(
        0.75,
        0.05,
        0.05
      ),
      goldGlow,
      beatX + 0.56,
      2.35,
      0.15,
      beatAngle
    );

    label(
      beatLab,
      "MPC • BEAT LAB",
      -5.55,
      3.28,
      -2.65,
      4.0
    );

    group.add(
      beatLab
    );

    // =========================================================
    // 2. INSTRUMENT / PIANO STATION
    //
    // Right-middle.
    //
    // Deliberately angled rather than pushed flat against a wall.
    // =========================================================

    const piano =
      new THREE.Group();

    piano.name =
      "floor2InstrumentStation";

    const pianoX =
      5.35;

    const pianoZ =
      -0.55;

    const pianoAngle =
      -Math.PI * 0.12;

    box(
      piano,
      new THREE.BoxGeometry(
        1.25,
        0.62,
        4.15
      ),
      black,
      pianoX,
      0.68,
      pianoZ,
      pianoAngle
    );

    box(
      piano,
      new THREE.BoxGeometry(
        1.3,
        0.07,
        4.2
      ),
      gold,
      pianoX,
      1.02,
      pianoZ,
      pianoAngle
    );

    // Keys

    for (
      let i = 0;
      i < 16;
      i++
    ) {

      box(
        piano,
        new THREE.BoxGeometry(
          0.52,
          0.06,
          0.19
        ),
        i % 2 === 0
          ? glass
          : white,
        pianoX - 0.12,
        1.10,
        -1.90 +
          i * 0.22,
        pianoAngle
      );

    }

    // Instrument display

    box(
      piano,
      new THREE.BoxGeometry(
        0.08,
        1.0,
        1.65
      ),
      glass,
      pianoX - 0.52,
      1.82,
      -0.35,
      pianoAngle
    );

    box(
      piano,
      new THREE.BoxGeometry(
        0.05,
        0.05,
        1.75
      ),
      goldGlow,
      pianoX - 0.57,
      2.36,
      -0.35,
      pianoAngle
    );

    label(
      piano,
      "PIANO • INSTRUMENTS",
      5.25,
      3.28,
      2.0,
      5.0
    );

    group.add(
      piano
    );

    // =========================================================
    // 3. VOCAL RECORDING BOOTH
    //
    // Front-left corner.
    //
    // Clear glass sightline.
    // Acoustic wall behind performer.
    // Microphone points toward controlled rear corner.
    // =========================================================

    const booth =
      new THREE.Group();

    booth.name =
      "floor2RecordingBooth";

    const boothX =
      -4.65;

    const boothZ =
      3.75;

    // Floor

    box(
      booth,
      new THREE.BoxGeometry(
        4.45,
        0.06,
        3.25
      ),
      dark,
      boothX,
      0.08,
      boothZ
    );

    // Rear acoustic wall

    box(
      booth,
      new THREE.BoxGeometry(
        4.4,
        3.45,
        0.18
      ),
      black,
      boothX,
      1.8,
      boothZ + 1.52
    );

    // Left wall

    box(
      booth,
      new THREE.BoxGeometry(
        0.18,
        3.45,
        3.15
      ),
      black,
      boothX - 2.12,
      1.8,
      boothZ
    );

    // Acoustic panels

    [
      -1.20,
      0,
      1.20
    ].forEach(
      x => {

        box(
          booth,
          new THREE.BoxGeometry(
            0.82,
            1.5,
            0.10
          ),
          red,
          boothX + x,
          1.72,
          boothZ + 1.42
        );

      }
    );

    // Front glass

    box(
      booth,
      new THREE.BoxGeometry(
        4.12,
        3.15,
        0.10
      ),
      glass,
      boothX,
      1.8,
      boothZ - 1.52
    );

    // Right glass

    box(
      booth,
      new THREE.BoxGeometry(
        0.10,
        3.15,
        3.05
      ),
      glass,
      boothX + 2.12,
      1.8,
      boothZ
    );

    // Gold framing

    box(
      booth,
      new THREE.BoxGeometry(
        4.5,
        0.08,
        0.08
      ),
      gold,
      boothX,
      3.47,
      boothZ - 1.57
    );

    [-2.12, 2.12].forEach(
      offset => {

        box(
          booth,
          new THREE.BoxGeometry(
            0.08,
            3.2,
            0.08
          ),
          gold,
          boothX + offset,
          1.8,
          boothZ - 1.57
        );

      }
    );

    // Microphone

    const micX =
      boothX + 1.05;

    const micZ =
      boothZ + 0.72;

    box(
      booth,
      new THREE.BoxGeometry(
        0.06,
        1.5,
        0.06
      ),
      black,
      micX,
      0.92,
      micZ
    );

    cylinder(
      booth,
      new THREE.CylinderGeometry(
        0.22,
        0.22,
        0.08,
        16
      ),
      black,
      micX,
      0.14,
      micZ
    );

    cylinder(
      booth,
      new THREE.CylinderGeometry(
        0.075,
        0.075,
        0.38,
        16
      ),
      gold,
      micX,
      1.82,
      micZ
    );

    cylinder(
      booth,
      new THREE.CylinderGeometry(
        0.10,
        0.10,
        0.16,
        16
      ),
      black,
      micX,
      2.05,
      micZ
    );

    label(
      booth,
      "VOCAL RECORDING",
      boothX,
      3.86,
      boothZ - 1.62,
      4.8
    );

    group.add(
      booth
    );

    // =========================================================
    // 4. RECORDING / EDITING WORKSTATION
    //
    // Front-right.
    //
    // This becomes the future DAW / editing interaction point.
    // =========================================================

    const editing =
      new THREE.Group();

    editing.name =
      "floor2RecordingEditingStation";

    const editX =
      3.85;

    const editZ =
      4.35;

    const editAngle =
      -Math.PI * 0.08;

    // Desk

    box(
      editing,
      new THREE.BoxGeometry(
        3.15,
        0.14,
        0.95
      ),
      dark,
      editX,
      0.88,
      editZ,
      editAngle
    );

    // Gold desk edge

    box(
      editing,
      new THREE.BoxGeometry(
        3.1,
        0.05,
        0.05
      ),
      gold,
      editX,
      1.00,
      editZ - 0.44,
      editAngle
    );

    // Main DAW display

    box(
      editing,
      new THREE.BoxGeometry(
        1.65,
        0.90,
        0.08
      ),
      glass,
      editX,
      1.55,
      editZ + 0.05,
      editAngle
    );

    // Display frame

    box(
      editing,
      new THREE.BoxGeometry(
        1.78,
        0.05,
        0.05
      ),
      goldGlow,
      editX,
      2.03,
      editZ + 0.05,
      editAngle
    );

    // Small controller

    box(
      editing,
      new THREE.BoxGeometry(
        0.75,
        0.08,
        0.48
      ),
      black,
      editX,
      1.05,
      editZ - 0.18,
      editAngle
    );

    // Knobs

    for (
      let i = 0;
      i < 4;
      i++
    ) {

      cylinder(
        editing,
        new THREE.CylinderGeometry(
          0.05,
          0.05,
          0.04,
          12
        ),
        goldGlow,
        editX - 0.24 +
          i * 0.16,
        1.13,
        editZ - 0.18
      );

    }

    label(
      editing,
      "RECORD • EDIT",
      editX,
      2.75,
      editZ - 0.55,
      4.0
    );

    group.add(
      editing
    );

    // =========================================================
    // 5. CONTROL ROOM / MIXING CONSOLE
    //
    // Rear center.
    //
    // The main production command center.
    // =========================================================

    const controlRoom =
      new THREE.Group();

    controlRoom.name =
      "floor2ControlRoom";

    // Rear wall

    box(
      controlRoom,
      new THREE.BoxGeometry(
        6.9,
        3.7,
        0.22
      ),
      black,
      0,
      2.0,
      -6.55
    );

    // Gold architectural trim

    box(
      controlRoom,
      new THREE.BoxGeometry(
        6.7,
        0.07,
        0.08
      ),
      gold,
      0,
      3.72,
      -6.38
    );

    // Main console

    box(
      controlRoom,
      new THREE.BoxGeometry(
        5.5,
        0.82,
        1.45
      ),
      dark,
      0,
      0.55,
      -4.85
    );

    box(
      controlRoom,
      new THREE.BoxGeometry(
        5.55,
        0.08,
        1.5
      ),
      gold,
      0,
      1.01,
      -4.85
    );

    // Three main displays

    [-1.7, 0, 1.7].forEach(
      x => {

        box(
          controlRoom,
          new THREE.BoxGeometry(
            1.3,
            0.88,
            0.08
          ),
          glass,
          x,
          1.65,
          -5.15
        );

        box(
          controlRoom,
          new THREE.BoxGeometry(
            1.38,
            0.05,
            0.05
          ),
          goldGlow,
          x,
          2.13,
          -5.11
        );

      }
    );

    // Mixing controller

    box(
      controlRoom,
      new THREE.BoxGeometry(
        1.5,
        0.08,
        0.72
      ),
      black,
      0,
      1.08,
      -4.05
    );

    [-0.45, -0.15, 0.15, 0.45]
      .forEach(
        x => {

          cylinder(
            controlRoom,
            new THREE.CylinderGeometry(
              0.06,
              0.06,
              0.04,
              12
            ),
            goldGlow,
            x,
            1.15,
            -4.05
          );

        }
      );

    label(
      controlRoom,
      "MIX • CONTROL",
      0,
      3.15,
      -6.38,
      4.4
    );

    group.add(
      controlRoom
    );

    // =========================================================
    // 6. MASTERING STATION
    //
    // Rear-right.
    //
    // Separate from the main mixing console so mastering reads
    // as its own final-stage workflow.
    // =========================================================

    const mastering =
      new THREE.Group();

    mastering.name =
      "floor2MasteringStation";

    const masterX =
      5.35;

    const masterZ =
      -4.65;

    // Console

    box(
      mastering,
      new THREE.BoxGeometry(
        2.35,
        0.78,
        0.95
      ),
      dark,
      masterX,
      0.78,
      masterZ
    );

    box(
      mastering,
      new THREE.BoxGeometry(
        2.42,
        0.07,
        1.0
      ),
      gold,
      masterX,
      1.20,
      masterZ
    );

    // Mastering display

    box(
      mastering,
      new THREE.BoxGeometry(
        1.7,
        0.88,
        0.08
      ),
      glass,
      masterX,
      1.78,
      masterZ + 0.25
    );

    box(
      mastering,
      new THREE.BoxGeometry(
        1.82,
        0.05,
        0.05
      ),
      goldGlow,
      masterX,
      2.25,
      masterZ + 0.25
    );

    // Mastering controls

    [-0.65, -0.22, 0.22, 0.65]
      .forEach(
        x => {

          cylinder(
            mastering,
            new THREE.CylinderGeometry(
              0.055,
              0.055,
              0.05,
              12
            ),
            goldGlow,
            masterX + x,
            1.28,
            masterZ - 0.22
          );

        }
      );

    label(
      mastering,
      "MASTERING",
      masterX,
      2.82,
      masterZ - 0.62,
      3.5
    );

    group.add(
      mastering
    );

    // =========================================================
    // 7. SONG ARCHIVE / STUDIO LIBRARY
    //
    // Front-center/right.
    //
    // This is deliberately physical but non-functional for now.
    //
    // Future:
    // Projects
    // Sessions
    // Drafts
    // Finished Songs
    // Exports
    // Stems
    // Favorites
    // Published to Radio
    // =========================================================

    const archive =
      new THREE.Group();

    archive.name =
      "floor2SongArchive";

    const archiveX =
      0.85;

    const archiveZ =
      5.65;

    // Low archive console

    box(
      archive,
      new THREE.BoxGeometry(
        2.7,
        0.75,
        0.72
      ),
      dark,
      archiveX,
      0.72,
      archiveZ
    );

    // Gold top

    box(
      archive,
      new THREE.BoxGeometry(
        2.78,
        0.07,
        0.78
      ),
      gold,
      archiveX,
      1.12,
      archiveZ
    );

    // Archive display

    box(
      archive,
      new THREE.BoxGeometry(
        1.75,
        0.82,
        0.08
      ),
      glass,
      archiveX,
      1.65,
      archiveZ + 0.18
    );

    // Archive indicators

    [
      -0.55,
      -0.18,
      0.18,
      0.55
    ].forEach(
      x => {

        box(
          archive,
          new THREE.BoxGeometry(
            0.20,
            0.06,
            0.08
          ),
          goldGlow,
          archiveX + x,
          1.28,
          archiveZ - 0.18
        );

      }
    );

    label(
      archive,
      "SONG ARCHIVE",
      archiveX,
      2.68,
      archiveZ - 0.50,
      4.0
    );

    group.add(
      archive
    );

    // =========================================================
    // 8. MOBILE STUDIO
    //
    // Compact station for laptop + headphones.
    //
    // This is the physical placeholder for future recording
    // directly through the artist's own device.
    // =========================================================

    const mobile =
      new THREE.Group();

    mobile.name =
      "floor2MobileStudio";

    const mobileX =
      -0.10;

    const mobileZ =
      5.72;

    box(
      mobile,
      new THREE.BoxGeometry(
        2.1,
        0.14,
        0.72
      ),
      dark,
      mobileX,
      0.88,
      mobileZ
    );

    // Laptop

    box(
      mobile,
      new THREE.BoxGeometry(
        1.18,
        0.08,
        0.62
      ),
      black,
      mobileX,
      1.02,
      mobileZ
    );

    box(
      mobile,
      new THREE.BoxGeometry(
        1.18,
        0.72,
        0.07
      ),
      glass,
      mobileX,
      1.40,
      mobileZ + 0.28
    );

    // Headphone stand

    cylinder(
      mobile,
      new THREE.CylinderGeometry(
        0.055,
        0.055,
        0.62,
        12
      ),
      gold,
      mobileX + 0.82,
      1.28,
      mobileZ
    );

    cylinder(
      mobile,
      new THREE.CylinderGeometry(
        0.20,
        0.20,
        0.06,
        16
      ),
      black,
      mobileX + 0.82,
      0.97,
      mobileZ
    );

    label(
      mobile,
      "MOBILE STUDIO",
      mobileX,
      2.58,
      mobileZ - 0.40,
      4.0
    );

    group.add(
      mobile
    );

    // =========================================================
    // 9. ACOUSTIC TREATMENT
    //
    // Kept minimal.
    //
    // The room should still feel like a premium architectural
    // space, not a wall covered in random panels.
    // =========================================================

    const acoustic =
      new THREE.Group();

    acoustic.name =
      "floor2AcousticTreatment";

    [-4.7, -2.9, -1.0]
      .forEach(
        z => {

          box(
            acoustic,
            new THREE.BoxGeometry(
              0.10,
              1.25,
              0.68
            ),
            red,
            -6.95,
            1.65,
            z
          );

        }
      );

    [ -4.7, -2.9 ]
      .forEach(
        z => {

          box(
            acoustic,
            new THREE.BoxGeometry(
              0.10,
              1.25,
              0.68
            ),
            red,
            6.95,
            1.65,
            z
          );

        }
      );

    group.add(
      acoustic
    );

    // =========================================================
    // 10. CENTRAL WORKFLOW GUIDE
    //
    // The center intentionally remains open.
    //
    // This space becomes important later when Studio App mode
    // activates and interaction overlays appear.
    // =========================================================

    box(
      group,
      new THREE.BoxGeometry(
        4.5,
        0.035,
        0.06
      ),
      goldGlow,
      0,
      0.10,
      0.55
    );

    // =========================================================
    // 11. CEILING ARCHITECTURAL DETAILS
    // =========================================================

    const ceiling =
      new THREE.Group();

    ceiling.name =
      "floor2CeilingDetails";

    [-5.5, 0, 5.5]
      .forEach(
        x => {

          box(
            ceiling,
            new THREE.BoxGeometry(
              2.2,
              0.05,
              0.12
            ),
            goldGlow,
            x,
            3.75,
            0.7
          );

          box(
            ceiling,
            new THREE.BoxGeometry(
              0.12,
              0.05,
              2.2
            ),
            goldGlow,
            x,
            3.75,
            0.7
          );

        }
      );

    group.add(
      ceiling
    );

    // =========================================================
    // 12. AMBIENT STUDIO LIGHT
    // =========================================================

    const light =
      new THREE.PointLight(
        0xffc36b,
        1.15,
        16
      );

    light.position.set(
      0,
      3.4,
      0
    );

    group.add(
      light
    );

    // =========================================================
    // STUDIO METADATA
    //
    // These are intentionally future-facing.
    // No Studio App is activated yet.
    // =========================================================

    group.userData.studioStations = {

      beatLab,

      instrumentStation: piano,

      vocalBooth: booth,

      recordingEditing:
        editing,

      controlRoom,

      mastering,

      songArchive:
        archive,

      mobileStudio:
        mobile

    };

    group.userData.studioMode =
      "physical";

    group.userData.futureStudioApp =
      true;

    group.userData.workflow = [

      "CREATE_BEAT",

      "ARRANGE",

      "RECORD_VOCALS",

      "EDIT",

      "MIX",

      "MASTER",

      "EXPORT",

      "SONG_ARCHIVE",

      "OPTIONAL_RADIO_PUBLISH"

    ];

    // =========================================================
    // ADD TO SCENE
    // =========================================================

    scene.add(
      group
    );

    window.__lamboCityFloor2Studio =
      group;

    return group;

  },

  update() {}

};
