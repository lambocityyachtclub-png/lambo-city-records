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

// Six live participants total per Executive Clubroom session.
// Seat and screen positions share this slot map so the room layout,
// future avatar seating, and live video grid stay in sync.
const FLOOR3_CONFERENCE_SLOTS = [
  { seat: [-2.35, 1.45, 0], tile: [-3.25, 1.35] },
  { seat: [-0.78, 1.45, 0], tile: [0, 1.35] },
  { seat: [0.78, 1.45, 0], tile: [3.25, 1.35] },
  { seat: [2.35, 1.45, 0], tile: [-3.25, 3.0] },
  { seat: [-3.62, -1.48, Math.PI / 2], tile: [0, 3.0] },
  { seat: [3.62, -1.48, -Math.PI / 2], tile: [3.25, 3.0] }
];
export const FLOOR3_CONFERENCE_CAPACITY = FLOOR3_CONFERENCE_SLOTS.length;


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

function label() {
  // Floor 3 uses architecture, materials and lighting for identity.
  // Floating canvas text has been intentionally removed.
  return null;
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


    // The former floating arrival label and floor marker were removed.
    // The rear elevator landing opens into an uninterrupted circulation aisle.

    // =========================================================
    // EXECUTIVE CONFERENCE TABLE    // =========================================================
    // EXECUTIVE CONFERENCE TABLE — SIX SEATS, CLEAR ARRIVAL AISLE
    // =========================================================
    const meeting = new THREE.Group();
    meeting.name = "floor3ExecutiveMeetingRoom";
    meeting.position.set(1.2, 0, 0.4);

    box(meeting, new THREE.BoxGeometry(6.2, 0.22, 1.75), black, 0, 1.02, 0);
    box(meeting, new THREE.BoxGeometry(6.12, 0.045, 1.66), dark, 0, 1.15, 0);
    box(meeting, new THREE.BoxGeometry(6.18, 0.035, 0.045), gold, 0, 1.17, -0.82);
    box(meeting, new THREE.BoxGeometry(6.18, 0.035, 0.045), gold, 0, 1.17, 0.82);
    box(meeting, new THREE.BoxGeometry(1.25, 0.82, 1.15), black, 0, 0.52, 0);
    box(meeting, new THREE.BoxGeometry(2.1, 0.025, 0.16), goldGlow, 0, 1.19, 0);

    meeting.userData.conferenceCapacity = FLOOR3_CONFERENCE_CAPACITY;
    FLOOR3_CONFERENCE_SLOTS.forEach((slot, index) => {
      const [x, z, rotationY] = slot.seat;
      const chair = new THREE.Group();
      chair.name = "floor3ConferenceSeat-" + (index + 1);
      chair.userData.conferenceSlotIndex = index;
      chair.position.set(x, 0, z);
      chair.rotation.y = rotationY;
      box(chair, new THREE.BoxGeometry(0.9, 0.22, 0.82), leather, 0, 0.57, 0);
      box(chair, new THREE.BoxGeometry(0.88, 0.76, 0.16), leather, 0, 0.98, 0.34);
      box(chair, new THREE.BoxGeometry(0.10, 0.48, 0.72), black, -0.43, 0.76, 0.02);
      box(chair, new THREE.BoxGeometry(0.10, 0.48, 0.72), black, 0.43, 0.76, 0.02);
      box(chair, new THREE.BoxGeometry(0.12, 0.54, 0.12), gold, 0, 0.27, 0);
      meeting.add(chair);
    });
    group.add(meeting);


    // =========================================================
    // EXECUTIVE MEDIA WALL — LARGE SIX-PERSON CONFERENCE DISPLAY
    // =========================================================
    const presentation = new THREE.Group();
    presentation.name = "floor3PresentationWall";
    // Mount the conference display on the front wall, facing the room.
    // The rear elevator aisle remains completely open.
    presentation.rotation.y = Math.PI;

    const walnut = material(0x39271e, { roughness: 0.58, metalness: 0.12 });
    const acoustic = material(0x252832, { roughness: 0.94, metalness: 0.02 });

    // One clean architectural frame makes the larger display the room's focal point.
    box(presentation, new THREE.BoxGeometry(11.2, 4.45, 0.24), walnut, 0, 2.2, -5.88);
    box(presentation, new THREE.BoxGeometry(10.65, 4.18, 0.10), acoustic, 0, 2.2, -5.70);
    box(presentation, new THREE.BoxGeometry(10.72, 0.075, 0.08), gold, 0, 4.43, -5.60);
    box(presentation, new THREE.BoxGeometry(10.72, 0.075, 0.08), gold, 0, 0.0, -5.60);
    [-5.35, 5.35].forEach(x => box(presentation, new THREE.BoxGeometry(0.075, 4.35, 0.08), gold, x, 2.2, -5.60));

    const displayGlass = new THREE.MeshStandardMaterial({
      color: 0x080d16,
      emissive: 0x101b2b,
      emissiveIntensity: 0.55,
      roughness: 0.16,
      metalness: 0.34
    });
    box(presentation, new THREE.BoxGeometry(10.25, 3.85, 0.075), displayGlass, 0, 2.3, -5.53);

    presentation.userData.conferenceCapacity = FLOOR3_CONFERENCE_CAPACITY;
    const tileMats = [0x152534, 0x24202a, 0x1b2a30, 0x25222b, 0x182832, 0x29251f]
      .map(color => material(color, { roughness: 0.32, metalness: 0.22 }));

    FLOOR3_CONFERENCE_SLOTS.forEach((slot, tileIndex) => {
      const [x, y] = slot.tile;
      const tile = new THREE.Group();
      tile.name = "floor3ConferenceScreenSlot-" + (tileIndex + 1);
      tile.userData.conferenceSlotIndex = tileIndex;
      tile.position.set(x, y, -5.475);
      box(tile, new THREE.BoxGeometry(3.0, 1.55, 0.035), tileMats[tileIndex], 0, 0, 0);

      const avatarMat = material(
        [0xb58b67, 0x9bafba, 0xc49a76, 0x8b9a9f, 0xc6a17d, 0xa6a0b6][tileIndex],
        { roughness: 0.82, metalness: 0.02 }
      );
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 12), avatarMat);
      head.position.set(0, 0.17, 0.045);
      tile.add(head);

      const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 10), avatarMat);
      shoulders.scale.set(1.12, 0.56, 0.5);
      shoulders.position.set(0, -0.39, 0.035);
      tile.add(shoulders);

      const liveDot = new THREE.Mesh(
        new THREE.CircleGeometry(0.05, 12),
        new THREE.MeshBasicMaterial({ color: 0x71d6a1 })
      );
      liveDot.position.set(-1.30, -0.62, 0.065);
      tile.add(liveDot);
      box(tile, new THREE.BoxGeometry(0.62, 0.04, 0.018), gold, 1.02, -0.62, 0.06);
      presentation.add(tile);
    });

    box(presentation, new THREE.BoxGeometry(1.45, 0.12, 0.16), black, 0, 0.17, -5.43);
    box(presentation, new THREE.BoxGeometry(9.8, 0.035, 0.06), goldGlow, 0, 0.18, -5.35);

    // Restrained vertical timber accents sit outside the screen and keep the aisle open.
    for (let i = 0; i < 7; i++) {
      const rightSlatX = 5.78 + i * 0.18;
      const leftSlatX = -6.05 - i * 0.18;
      box(presentation, new THREE.BoxGeometry(0.075, 3.2, 0.12), walnut, rightSlatX, 2.0, -5.53);
      box(presentation, new THREE.BoxGeometry(0.075, 3.2, 0.12), walnut, leftSlatX, 2.0, -5.53);
    }

    const mediaGlow = new THREE.PointLight(0x8bb8ff, 0.28, 8);
    mediaGlow.position.set(0, 2.5, -4.35);
    presentation.add(mediaGlow);
    group.add(presentation);


    // The former side-boardroom table and chairs were removed.
    // The main six-seat conference suite is the single meeting zone.

        // =========================================================
    // EXECUTIVE LOUNGE
    // =========================================================

    const lounge =
      new THREE.Group();

    lounge.name =
      "floor3ExecutiveLounge";
    lounge.position.set(1.3, 0, 0);


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
    office.position.set(2.0, 0, -8.5);


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


    // The separate interior branding wall was removed. The permanent
    // LAMBO CITY RECORDS identity remains on the exterior crown.

    // =========================================================
    // OPEN CENTRAL CIRCULATION
    // =========================================================
    // No raised markers, rails, or decorative strips cross the walking floor.

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
