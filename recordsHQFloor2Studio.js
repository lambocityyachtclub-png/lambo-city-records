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

    

    // The primary producer workstation now occupies the former
    // mix-control position: one desk for MPC, mixing and mastering.
    // Left-wall producer cockpit beside the Floor 2 elevator.
    // The chair faces outward through the stage-side glazing.
    const beatX = -6.15;
    const beatZ = -4.25;
    const beatAngle = -Math.PI / 2;

    // Main production desk

    box(
      beatLab,
      new THREE.BoxGeometry(
        3.75,
        0.18,
        1.35
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
        3.8,
        0.05,
        0.06
      ),
      gold,
      beatX,
      1.04,
      beatZ - 0.62,
      beatAngle
    );


   
    // LAMBO CITY — SIDE-BY-SIDE MPC + MIXER

    const mpcClickable = new THREE.Group();

    mpcClickable.name = "floor2MPCClickable";
    mpcClickable.userData.studioStation = "beatLab";

    // Align the equipment with the existing production desk
    mpcClickable.position.set(beatX, 0, beatZ);
    mpcClickable.rotation.y = beatAngle;

    // MPC body — left side of the workstation
    box(
      mpcClickable,
      new THREE.BoxGeometry(0.62, 0.12, 1.05),
      black,
      -0.32,
      1.085,
      -0.35
    );

    // 16 illuminated MPC pads
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        box(
          mpcClickable,
          new THREE.BoxGeometry(0.105, 0.045, 0.15),
          goldGlow,
          -0.53 + col * 0.14,
          1.17,
          -0.69 + row * 0.21
        );
      }
    }

    // Mixer — directly beside the MPC on the same desk
    box(
      mpcClickable,
      new THREE.BoxGeometry(0.48, 0.08, 1.05),
      dark,
      0.30,
      1.065,
      -0.35
    );

    // Mixer controls
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        cylinder(
          mpcClickable,
          new THREE.CylinderGeometry(0.045, 0.045, 0.045, 12),
          col === 0 ? goldGlow : black,
          0.15 + col * 0.15,
          1.125,
          -0.68 + row * 0.22
        );
      }
    }

    // Gold accent along the mixer
    box(
      mpcClickable,
      new THREE.BoxGeometry(0.035, 0.025, 0.85),
      goldGlow,
      0.30,
      1.12,
      -0.35
    );

    // Preserve the existing clickable workstation interaction
    beatLab.add(mpcClickable);






    // Production screen

    // =========================================================
    // LAMBO CITY — PRIMARY PRODUCER COCKPIT
    // Producer chair + symmetrical studio monitor speakers
    // =========================================================

    const producerCockpit = new THREE.Group();

    producerCockpit.name =
      "floor2PrimaryProducerCockpit";

    producerCockpit.position.set(
      beatX,
      0,
      beatZ
    );

    producerCockpit.rotation.y =
      beatAngle;

    // ---------------------------------------------------------
    // LEFT STUDIO MONITOR
    // ---------------------------------------------------------

    const leftSpeaker = new THREE.Group();

    leftSpeaker.name =
      "floor2LeftStudioMonitor";

    box(
      leftSpeaker,
      new THREE.BoxGeometry(0.42, 0.78, 0.62),
      black,
      -1.13,
      1.40,
      0.52
    );

    // Speaker driver faces the seated producer

    const leftDriver = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.17,
        0.17,
        0.045,
        24
      ),
      dark
    );

    leftDriver.rotation.z =
      Math.PI / 2;

    leftDriver.position.set(
      -0.90,
      1.43,
      0.52
    );

    leftSpeaker.add(leftDriver);

    const leftTweeter = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.065,
        0.065,
        0.05,
        20
      ),
      goldGlow
    );

    leftTweeter.rotation.z =
      Math.PI / 2;

    leftTweeter.position.set(
      -0.89,
      1.68,
      0.52
    );

    leftSpeaker.add(leftTweeter);

    producerCockpit.add(leftSpeaker);

    // ---------------------------------------------------------
    // RIGHT STUDIO MONITOR
    // ---------------------------------------------------------

    const rightSpeaker = new THREE.Group();

    rightSpeaker.name =
      "floor2RightStudioMonitor";

    box(
      rightSpeaker,
      new THREE.BoxGeometry(0.42, 0.78, 0.62),
      black,
      1.43,
      1.40,
      0.52
    );

    const rightDriver = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.17,
        0.17,
        0.045,
        24
      ),
      dark
    );

    rightDriver.rotation.z =
      Math.PI / 2;

    rightDriver.position.set(
      1.66,
      1.43,
      0.52
    );

    rightSpeaker.add(rightDriver);

    const rightTweeter = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.065,
        0.065,
        0.05,
        20
      ),
      goldGlow
    );

    rightTweeter.rotation.z =
      Math.PI / 2;

    rightTweeter.position.set(
      1.67,
      1.68,
      0.52
    );

    rightSpeaker.add(rightTweeter);

    producerCockpit.add(rightSpeaker);

    // ---------------------------------------------------------
    // PRODUCER CHAIR
    // Faces the MPC and production display.
    // ---------------------------------------------------------

    const producerChair = new THREE.Group();

    producerChair.name =
      "floor2ProducerChair";

    // Central seat cushion

    box(
      producerChair,
      new THREE.BoxGeometry(
        1.05,
        0.24,
        1.05
      ),
      black,
      2.05,
      0.91,
      0.15
    );

    // Gold seat trim

    box(
      producerChair,
      new THREE.BoxGeometry(
        1.08,
        0.055,
        1.08
      ),
      gold,
      2.05,
      0.80,
      0.15
    );

    // Upholstered backrest.
    // Positioned behind the seated producer.

    box(
      producerChair,
      new THREE.BoxGeometry(
        0.30,
        1.12,
        1.02
      ),
      black,
      2.54,
      1.48,
      0.15
    );

    // Backrest gold accent

    box(
      producerChair,
      new THREE.BoxGeometry(
        0.08,
        0.85,
        0.72
      ),
      gold,
      2.70,
      1.48,
      0.15
    );

    // Armrests

    [-0.48, 0.48].forEach(offset => {

      box(
        producerChair,
        new THREE.BoxGeometry(
          0.72,
          0.12,
          0.13
        ),
        dark,
        2.08,
        1.17,
        0.15 + offset
      );

    });

    // Central chair support

    cylinder(
      producerChair,
      new THREE.CylinderGeometry(
        0.09,
        0.12,
        0.48,
        16
      ),
      gold,
      2.05,
      0.48,
      0.15
    );

    // Five-star chair base

    cylinder(
      producerChair,
      new THREE.CylinderGeometry(
        0.48,
        0.48,
        0.10,
        24
      ),
      black,
      2.05,
      0.20,
      0.15
    );

    // Gold base hub

    cylinder(
      producerChair,
      new THREE.CylinderGeometry(
        0.15,
        0.15,
        0.12,
        20
      ),
      goldGlow,
      2.05,
      0.26,
      0.15
    );

    producerCockpit.add(producerChair);

    // ---------------------------------------------------------
    // PRESERVE WORKSTATION REFERENCES
    // ---------------------------------------------------------

    producerCockpit.userData.studioStation =
      "beatLab";

    producerCockpit.userData.mpcTarget =
      "floor2MPCClickable";

    producerCockpit.userData.viewDirection =
      "outward-toward-exterior-stage";

    producerCockpit.userData.wallSide =
      "left-elevator-entry-wall";

    producerCockpit.userData.exteriorViewPreserved =
      true;

    beatLab.add(producerCockpit);

    
    // Keep the display in the cockpit's local coordinate space.
    // This makes it rotate and stay centered with the speaker pair
    // and the seated producer instead of drifting off-axis.
    box(
      producerCockpit,
      new THREE.BoxGeometry(
        0.08,
        1.0,
        1.55
      ),
      glass,
      0.56,
      1.82,
      0.15
    );

    box(
      producerCockpit,
      new THREE.BoxGeometry(
        0.75,
        0.05,
        0.05
      ),
      goldGlow,
      0.56,
      2.35,
      0.15
    );

    label(
      beatLab,
      "PRODUCER • MPC • MIX • MASTER",
      0,
      3.28,
      1.95,
      5.4
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
    // 5. MIX / MASTER WORKSTATION
    //
    // The former rear-center mix-control position is now the
    // single producer cockpit. MPC, mix and mastering share the
    // same desk, chair, monitor display and speaker pair.
    // =========================================================

    const controlRoom = new THREE.Group();
    controlRoom.name = "floor2ControlRoomArchitecture";

    // Keep the rear acoustic feature wall and gold trim.
    // The old oversized, separate console and three-screen bank
    // are removed so they do not compete with the main desk.

    box(
      controlRoom,
      new THREE.BoxGeometry(6.9, 3.7, 0.22),
      glass,
      0,
      2.0,
      -6.55
    );

    box(
      controlRoom,
      new THREE.BoxGeometry(6.7, 0.07, 0.08),
      gold,
      0,
      3.72,
      -6.38
    );

    label(
      controlRoom,
      "LAMBO CITY • PRODUCER CONTROL",
      0,
      3.15,
      -6.38,
      5.4
    );

    group.add(controlRoom);

    // Dedicated physical mix/master controls sit ON the same
    // producer desk as the MPC. This remains a distinct raycast
    // target so tapping the controls opens the MIX workspace,
    // while the MPC itself retains its Beat Lab interaction.

    const mixMasterControls = new THREE.Group();
    mixMasterControls.name = "floor2MixMasterControls";
    mixMasterControls.position.set(beatX, 0, beatZ);
    mixMasterControls.rotation.y = beatAngle;

    // Compact mastering section at the front end of the desk.
    box(
      mixMasterControls,
      new THREE.BoxGeometry(0.92, 0.08, 0.72),
      black,
      -0.08,
      1.105,
      1.12
    );

    box(
      mixMasterControls,
      new THREE.BoxGeometry(0.94, 0.025, 0.74),
      gold,
      -0.08,
      1.155,
      1.12
    );

    // Four mastering / output controls.
    [-0.38, -0.13, 0.13, 0.38].forEach(x => {
      cylinder(
        mixMasterControls,
        new THREE.CylinderGeometry(0.055, 0.055, 0.055, 16),
        goldGlow,
        x - 0.08,
        1.215,
        1.12
      );
    });

    // Small output-meter strip beside the mastering controls.
    box(
      mixMasterControls,
      new THREE.BoxGeometry(0.58, 0.035, 0.12),
      glass,
      -0.08,
      1.205,
      1.42
    );

    label(
      mixMasterControls,
      "MIX • MASTER",
      -0.08,
      2.05,
      1.12,
      2.1
    );

    group.add(mixMasterControls);

    // Both workflow references intentionally resolve to this
    // single physical control surface; there is no second
    // mastering station elsewhere in the room.
    const mastering = mixMasterControls;

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

    [1.1, 2.7, 4.3]
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

      controlRoom:
        mixMasterControls,

      mastering:
        mixMasterControls,

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
