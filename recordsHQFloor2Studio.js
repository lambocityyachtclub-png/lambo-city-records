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

function label() {
  // Interior identity is communicated through architecture and
  // functional displays, not floating canvas text.
  return null;
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

    // Clear, low-tint architectural glass for the exterior windows.
    const windowGlass = new THREE.MeshStandardMaterial({
      color: 0xc6d3dc,
      emissive: 0x101820,
      emissiveIntensity: 0.06,
      transparent: true,
      opacity: 0.10,
      roughness: 0.12,
      metalness: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    // Near-clear booth glazing keeps the vocalist and acoustic
    // treatment readable from the control room.
    const boothGlass = new THREE.MeshStandardMaterial({
      color: 0xe3edf2,
      emissive: 0x17232c,
      emissiveIntensity: 0.04,
      transparent: true,
      opacity: 0.075,
      roughness: 0.08,
      metalness: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false
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

    const producerWood =
      material(
        0x76543b,
        {
          roughness: 0.52,
          metalness: 0.10
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

    // =========================================================
    // 1. MPC / BEAT LAB
    //
    // Main control-room side, facing the exterior stage glazing.
    // =========================================================

    const beatLab =
      new THREE.Group();

    beatLab.name =
      "floor2BeatLab";

    

    // The producer faces the exterior stage through the rear glazing.
    // The desk, MPC and mix/master surface share one physical cockpit.
    const beatX = 1.1;
    const beatZ = -3.7;
    const beatAngle = 0;

    // Main producer desk — broad, shallow and aligned with the window wall.
    box(
      beatLab,
      new THREE.BoxGeometry(5.35, 0.18, 1.55),
      producerWood,
      beatX,
      0.94,
      beatZ
    );

    box(
      beatLab,
      new THREE.BoxGeometry(5.42, 0.055, 1.58),
      gold,
      beatX,
      1.035,
      beatZ
    );

    // Dark pedestal supports keep the desk visually grounded.
    [-2.05, 2.05].forEach(offset => {
      box(
        beatLab,
        new THREE.BoxGeometry(0.48, 0.88, 1.12),
        black,
        beatX + offset,
        0.48,
        beatZ
      );
    });

    // MPC is a distinct selectable surface on the left side of this desk.
    const mpcClickable = new THREE.Group();
    mpcClickable.name = "floor2MPCClickable";
    mpcClickable.userData.studioStation = "beatLab";
    mpcClickable.position.set(beatX - 1.25, 0, beatZ);
    box(
      mpcClickable,
      new THREE.BoxGeometry(1.05, 0.12, 1.08),
      black,
      0,
      1.105,
      0.02
    );

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        box(
          mpcClickable,
          new THREE.BoxGeometry(0.17, 0.045, 0.17),
          goldGlow,
          -0.31 + col * 0.205,
          1.19,
          -0.29 + row * 0.205
        );
      }
    }

    // Small vintage-style transport / encoder strip beside the pads.
    [-0.34, -0.10, 0.14, 0.38].forEach((x, index) => {
      cylinder(
        mpcClickable,
        new THREE.CylinderGeometry(0.055, 0.055, 0.055, 14),
        index === 0 ? goldGlow : dark,
        x,
        1.19,
        0.48
      );
    });
    beatLab.add(mpcClickable);

    // Main control-room cockpit: speakers, display and centered producer chair.
    const producerCockpit = new THREE.Group();
    producerCockpit.name = "floor2PrimaryProducerCockpit";
    producerCockpit.position.set(beatX, 0, beatZ);

    [-2.25, 2.25].forEach((x, index) => {
      const speaker = new THREE.Group();
      speaker.name = index === 0
        ? "floor2LeftStudioMonitor"
        : "floor2RightStudioMonitor";

      box(
        speaker,
        new THREE.BoxGeometry(0.48, 0.82, 0.58),
        black,
        x,
        1.48,
        -0.28
      );

      const woofer = new THREE.Mesh(
        new THREE.CylinderGeometry(0.17, 0.17, 0.055, 24),
        dark
      );
      woofer.rotation.x = Math.PI / 2;
      woofer.position.set(x, 1.48, 0.025);
      speaker.add(woofer);

      const tweeter = new THREE.Mesh(
        new THREE.CylinderGeometry(0.065, 0.065, 0.06, 20),
        goldGlow
      );
      tweeter.rotation.x = Math.PI / 2;
      tweeter.position.set(x, 1.76, 0.025);
      speaker.add(tweeter);

      producerCockpit.add(speaker);
    });

    // Wide production display faces the seated producer (+Z).
    [-0.48, 0.48].forEach(x => {
      box(
        producerCockpit,
        new THREE.BoxGeometry(0.90, 1.08, 0.09),
        glass,
        x,
        1.88,
        -0.92
      );
      box(
        producerCockpit,
        new THREE.BoxGeometry(0.96, 0.055, 0.12),
        goldGlow,
        x,
        2.44,
        -0.92
      );
    });

    // Chair is centered behind the desk, facing the exterior windows (-Z).
    const producerChair = new THREE.Group();
    producerChair.name = "floor2ProducerChair";
    box(
      producerChair,
      new THREE.BoxGeometry(1.12, 0.22, 1.02),
      black,
      0,
      0.94,
      1.55
    );
    box(
      producerChair,
      new THREE.BoxGeometry(1.16, 0.055, 1.06),
      gold,
      0,
      0.82,
      1.55
    );
    box(
      producerChair,
      new THREE.BoxGeometry(1.05, 1.08, 0.24),
      black,
      0,
      1.48,
      2.02
    );
    box(
      producerChair,
      new THREE.BoxGeometry(0.72, 0.86, 0.055),
      gold,
      0,
      1.48,
      2.16
    );
    [-0.52, 0.52].forEach(x => {
      box(
        producerChair,
        new THREE.BoxGeometry(0.16, 0.12, 0.78),
        dark,
        x,
        1.17,
        1.52
      );
    });
    cylinder(
      producerChair,
      new THREE.CylinderGeometry(0.10, 0.13, 0.48, 16),
      gold,
      0,
      0.48,
      1.55
    );
    cylinder(
      producerChair,
      new THREE.CylinderGeometry(0.48, 0.48, 0.10, 24),
      black,
      0,
      0.20,
      1.55
    );
    producerCockpit.add(producerChair);

    producerCockpit.userData.studioStation = "beatLab";
    producerCockpit.userData.mpcTarget = "floor2MPCClickable";
    producerCockpit.userData.viewDirection = "toward-exterior-stage-windows";
    producerCockpit.userData.exteriorViewPreserved = true;
    beatLab.add(producerCockpit);

    label(
      beatLab,
      "LAMBO CITY • MPC • MIX • MASTER",
      beatX,
      3.18,
      beatZ - 1.45,
      5.6
    );

    group.add(
      beatLab
    );

    // =========================================================
    // 2. INSTRUMENT / PIANO STATION
    //
    // Right-front, within easy reach of the seated producer.
    // =========================================================

    const piano =
      new THREE.Group();

    piano.name =
      "floor2InstrumentStation";

    const pianoX =
      5.25;

    const pianoZ =
      -3.2;

    const pianoAngle =
      0;

    box(
      piano,
      new THREE.BoxGeometry(
        4.15,
        0.62,
        1.25
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
        4.2,
        0.07,
        1.3
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
          0.19,
          0.06,
          0.52
        ),
        i % 2 === 0
          ? glass
          : white,
        pianoX - 1.90 +
          i * 0.22,
        1.10,
        pianoZ + 0.05,
        pianoAngle
      );

    }

    // Instrument display

    box(
      piano,
      new THREE.BoxGeometry(
        1.65,
        1.0,
        0.08
      ),
      glass,
      pianoX,
      1.82,
      pianoZ - 0.78,
      pianoAngle
    );

    box(
      piano,
      new THREE.BoxGeometry(
        1.75,
        0.05,
        0.05
      ),
      goldGlow,
      pianoX,
      2.36,
      pianoZ - 0.78,
      pianoAngle
    );

    label(
      piano,
      "PIANO • INSTRUMENTS",
      pianoX,
      3.28,
      pianoZ - 1.0,
      5.0
    );

    group.add(
      piano
    );

    // =========================================================
    // 3. VOCAL RECORDING BOOTH
    //
    // Behind-right of the seated producer.
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
      4.8;

    const boothZ =
      3.65;

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
      boothGlass,
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
      boothGlass,
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

    // Warm interior lighting reveals the microphone and burgundy panels.
    const boothInteriorLight = new THREE.PointLight(0xffbd78, 0.85, 5.8);
    boothInteriorLight.position.set(boothX, 2.75, boothZ + 0.15);
    booth.add(boothInteriorLight);

    // Distinct illuminated identity sign above the booth glazing.
    box(
      booth,
      new THREE.BoxGeometry(2.15, 0.34, 0.08),
      black,
      boothX,
      3.78,
      boothZ - 1.62
    );
    box(
      booth,
      new THREE.BoxGeometry(1.98, 0.035, 0.10),
      goldGlow,
      boothX,
      3.59,
      boothZ - 1.62
    );
    label(
      booth,
      "VOCAL BOOTH • RECORDING",
      boothX,
      3.84,
      boothZ - 1.68,
      3.9
    );

    group.add(
      booth
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

    // Panoramic three-bay glazing faces the exterior stage and water.
    // A 2.6-unit open portal aligns with the elevator exit path.
    // This prevents the character from walking through the window wall.
    [
      // The elevator-side left pane is intentionally removed.
      // The player's shoulder/body was clipping its edge during entry.
      { x: 2.825, width: 10.95 }
    ].forEach(({ x, width }) => {
      box(
        controlRoom,
        new THREE.BoxGeometry(width, 3.55, 0.16),
        windowGlass,
        x,
        2.05,
        -6.88
      );
      box(
        controlRoom,
        new THREE.BoxGeometry(width, 0.075, 0.20),
        gold,
        x,
        3.86,
        -6.82
      );
      box(
        controlRoom,
        new THREE.BoxGeometry(width, 0.075, 0.20),
        gold,
        x,
        0.28,
        -6.82
      );
    });

    // Exterior glazing mullions and gold jambs around the open entry.
    [-2.65, 0, 5.5, 8.25].forEach(x => {
      box(
        controlRoom,
        new THREE.BoxGeometry(0.12, 3.72, 0.16),
        gold,
        x,
        2.05,
        -6.82
      );
    });

    label(
      controlRoom,
      "LAMBO CITY • PRODUCER CONTROL",
      0,
      3.55,
      -6.55,
      5.4
    );

    group.add(controlRoom);

    // The glass partition beside the producer desk has been removed
    // completely. Keep this side of the workstation open so the
    // elevator-to-chair route feels like one continuous room.

    // Solid acoustic side walls give the room a more substantial,
    // architectural scale and balance the panoramic rear glazing.
    [-8.88, 8.88].forEach(x => {
      box(
        controlRoom,
        new THREE.BoxGeometry(0.18, 3.55, 12.65),
        dark,
        x,
        1.98,
        0
      );

      [-5.1, -1.7, 1.7, 5.1].forEach(z => {
        box(
          controlRoom,
          new THREE.BoxGeometry(0.07, 2.75, 0.055),
          gold,
          x + (x < 0 ? 0.10 : -0.10),
          2.02,
          z
        );
      });

      box(
        controlRoom,
        new THREE.BoxGeometry(0.10, 0.07, 12.5),
        goldGlow,
        x + (x < 0 ? 0.10 : -0.10),
        0.30,
        0
      );
    });

    // Dedicated physical mix/master controls sit ON the same
    // producer desk as the MPC. This remains a distinct raycast
    // target so tapping the controls opens the MIX workspace,
    // while the MPC itself retains its Beat Lab interaction.

    const mixMasterControls = new THREE.Group();
    mixMasterControls.name = "floor2MixMasterControls";
    mixMasterControls.position.set(beatX + 1.12, 0, beatZ);
    mixMasterControls.rotation.y = beatAngle;

    // Compact mastering section at the front end of the desk.
    box(
      mixMasterControls,
      new THREE.BoxGeometry(0.92, 0.08, 0.72),
      black,
      -0.08,
      1.105,
      0.12
    );

    box(
      mixMasterControls,
      new THREE.BoxGeometry(0.94, 0.025, 0.74),
      gold,
      -0.08,
      1.155,
      0.12
    );

    // Four mastering / output controls.
    [-0.38, -0.13, 0.13, 0.38].forEach(x => {
      cylinder(
        mixMasterControls,
        new THREE.CylinderGeometry(0.055, 0.055, 0.055, 16),
        goldGlow,
        x - 0.08,
        1.215,
        0.12
      );
    });

    // Small output-meter strip beside the mastering controls.
    box(
      mixMasterControls,
      new THREE.BoxGeometry(0.58, 0.035, 0.12),
      glass,
      -0.08,
      1.205,
      0.42
    );

    label(
      mixMasterControls,
      "MIX • MASTER",
      -0.08,
      2.05,
      0.12,
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
    // Rear-left live-room perimeter.
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
      -5.45;

    const archiveZ =
      5.35;

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
    // 8. CO-PILOT STUDIO CONTROLS
    //
    // The digital studio is part of the primary producer cockpit.
    // It shares the cockpit's existing display pair; no second
    // laptop screen or separate computer is placed on the desk.
    // This low-profile touch surface remains the clickable entry
    // point for the vocal/mobile workflow.
    // =========================================================

    const mobile =
      new THREE.Group();

    mobile.name =
      "floor2MobileStudio";

    const mobileX =
      2.65;

    const mobileZ =
      -3.72;

    // Flush co-pilot control pad — integrated into the main desk.
    box(
      mobile,
      new THREE.BoxGeometry(
        1.18,
        0.075,
        0.58
      ),
      black,
      mobileX,
      1.075,
      mobileZ
    );

    // Restrained gold perimeter makes the touch area readable
    // without introducing another screen or competing display.
    box(
      mobile,
      new THREE.BoxGeometry(
        1.22,
        0.025,
        0.035
      ),
      gold,
      mobileX,
      1.125,
      mobileZ - 0.29
    );
    box(
      mobile,
      new THREE.BoxGeometry(
        1.22,
        0.025,
        0.035
      ),
      gold,
      mobileX,
      1.125,
      mobileZ + 0.29
    );

    // Compact tactile controls for the co-pilot vocal workflow.
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        box(
          mobile,
          new THREE.BoxGeometry(0.16, 0.025, 0.13),
          (row === 0 && col === 0) ? goldGlow : dark,
          mobileX - 0.28 + col * 0.28,
          1.13,
          mobileZ - 0.075 + row * 0.16
        );
      }
    }

    // Keep the headphone dock on the outer co-pilot edge.
    cylinder(
      mobile,
      new THREE.CylinderGeometry(
        0.055,
        0.055,
        0.48,
        12
      ),
      gold,
      mobileX + 0.78,
      1.34,
      mobileZ
    );

    cylinder(
      mobile,
      new THREE.CylinderGeometry(
        0.18,
        0.18,
        0.06,
        16
      ),
      black,
      mobileX + 0.78,
      1.10,
      mobileZ
    );

    // Attach to the same physical cockpit assembly as the MPC,
    // speakers and shared production displays.
    beatLab.add(mobile);

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

    // Amber inlaid floor paths visually connect the live room and control room.
    const controlFloorCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.9, 0.14, 5.8),
      new THREE.Vector3(1.4, 0.14, 4.0),
      new THREE.Vector3(2.9, 0.14, 1.8),
      new THREE.Vector3(2.5, 0.14, -0.6),
      new THREE.Vector3(4.0, 0.14, -3.8),
      new THREE.Vector3(7.1, 0.14, -5.7)
    ]);
    const controlFloorLine = new THREE.Mesh(
      new THREE.TubeGeometry(controlFloorCurve, 56, 0.022, 8, false),
      goldGlow
    );
    controlFloorLine.name = "floor2ControlRoomAmberInlay";
    group.add(controlFloorLine);

    const liveFloorCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-8.0, 0.14, 5.8),
      new THREE.Vector3(-6.7, 0.14, 3.8),
      new THREE.Vector3(-7.0, 0.14, 1.0),
      new THREE.Vector3(-6.2, 0.14, -1.7),
      new THREE.Vector3(-7.8, 0.14, -4.0),
      new THREE.Vector3(-8.0, 0.14, -5.8)
    ]);
    const liveFloorLine = new THREE.Mesh(
      new THREE.TubeGeometry(liveFloorCurve, 56, 0.022, 8, false),
      goldGlow
    );
    liveFloorLine.name = "floor2LiveRoomAmberInlay";
    group.add(liveFloorLine);

    // =========================================================
    // 11. CEILING ARCHITECTURAL DETAILS
    // =========================================================

    const ceiling =
      new THREE.Group();

    ceiling.name =
      "floor2CeilingDetails";

    // Floating acoustic soffit above the control-room desk.
    box(
      ceiling,
      new THREE.BoxGeometry(10.2, 0.12, 12.8),
      dark,
      3.55,
      5.82,
      0
    );
    box(
      ceiling,
      new THREE.BoxGeometry(10.35, 0.045, 0.10),
      goldGlow,
      3.55,
      5.74,
      0
    );

    // Angled acoustic ceiling plane and two skylights over the live room.
    const liveRoomCeiling = box(
      ceiling,
      new THREE.BoxGeometry(7.0, 0.12, 12.8),
      dark,
      -5.2,
      5.80,
      0
    );
    liveRoomCeiling.rotation.z = -0.08;
    [-2.7, 2.7].forEach(z => {
      box(
        ceiling,
        new THREE.BoxGeometry(1.75, 0.045, 1.45),
        windowGlass,
        -5.4,
        5.88,
        z
      );
      box(
        ceiling,
        new THREE.BoxGeometry(1.88, 0.035, 0.07),
        goldGlow,
        -5.4,
        5.92,
        z - 0.76
      );
    });

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
            5.55,
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
            5.55,
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
