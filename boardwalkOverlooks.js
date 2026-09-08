// boardwalkOverlooks.js
// LAMBO CITY — Cinematic Boardwalk Endpoints
//
// PURPOSE:
// The MARINA BOARDWALK street (marina.js: STREET_Z=46, x from -45 to 45)
// currently just stops at both ends with no resolution — the road and
// sidewalk meshes end mid-air with nothing to mark them as intentional
// destinations. This file caps both open ends with a small waterfront
// overlook deck + railing, so the boardwalk reads as:
//
//   STORE AREA -> BOARDWALK -> WATERFRONT OVERLOOK   (west end, x < -45)
//   RECORDS HQ -> BOARDWALK -> WATERFRONT OVERLOOK   (east end, x > 45)
//
// Both sit past the ground plates' edge (world.js grounds end at z:45),
// which is exactly where the water plane (water.js) is already visible —
// so no new water geometry is needed, only a deck + edge treatment.
//
// DOES NOT touch marina.js, dock.js, world.js, or recordsHQ.js. Purely
// additive geometry plugged onto the two existing open ends. Materials
// mirror the two neighboring landmarks: dock.js's wood/lantern palette on
// the store side, recordsHQ.js's marble/gold/glass palette on the HQ side.
//
// PERFORMANCE:
// - One shared PointLight (store-side lanterns only, thinned/animated
//   the same way dock.js does it).
// - HQ side uses emissive-only materials, no new PointLight — matching
//   recordsHQ.js's own "no new PointLights" policy.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import Collision from "./collision.js";

// Matches marina.js exactly (STREET_Z / STREET_X_MIN / STREET_X_MAX).
const STREET_Z      = 46;
const STREET_Z_MIN  = STREET_Z - 9;              // 37 — south edge of street complex
const STREET_Z_MAX  = STREET_Z + 9;              // 55 — north (water-facing) edge
const STREET_DEPTH  = STREET_Z_MAX - STREET_Z_MIN; // 18

const WEST_EDGE = -45; // marina.js STREET_X_MIN
const EAST_EDGE = 45;  // marina.js STREET_X_MAX
const DECK_LEN  = 13;  // how far each overlook extends past the street

const DECK_TOP = 0.7;  // matches marina.js sidewalk top surface (0.55 + 0.3/2)

let time = 0;
let lanternLights = [];

export default {
  init(scene) {
    this._buildStoreOverlook(scene);
    this._buildRecordsOverlook(scene);
    this._registerColliders();
  },

  // ==========================================================
  // STORE-SIDE OVERLOOK (west end, x < -45)
  // Casual wood/lantern pier — matches dock.js's palette.
  // ==========================================================
  _buildStoreOverlook(scene) {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xa0693a, roughness: 0.85 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x5c3d1e, roughness: 1 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x3a2510, roughness: 0.8 });
    const postMat = new THREE.MeshStandardMaterial({ color: 0x5c3d1e, roughness: 1 });
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0d, roughness: 0.9 });

    const cx = WEST_EDGE - DECK_LEN / 2; // -51.5, deck center
    const outerX = WEST_EDGE - DECK_LEN; // -58, the far tip

    // DECK PLANKING — continues the street out to the point
    const deck = new THREE.Mesh(new THREE.BoxGeometry(DECK_LEN, 0.3, STREET_DEPTH), woodMat);
    deck.position.set(cx, 0.55, STREET_Z);
    scene.add(deck);

    // DARK TRIM SKIRT under the deck lip
    const trim = new THREE.Mesh(new THREE.BoxGeometry(DECK_LEN, 0.08, STREET_DEPTH + 0.4), trimMat);
    trim.position.set(cx, 0.4, STREET_Z);
    scene.add(trim);

    // GATE / RAILING — caps the point, facing west over open water
    [STREET_Z_MIN + 1.5, STREET_Z - 3, STREET_Z + 3, STREET_Z_MAX - 1.5].forEach(z => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.4, 8), postMat);
      post.position.set(outerX, DECK_TOP + 0.7, z);
      scene.add(post);
    });
    const railTop = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, STREET_DEPTH - 1.6), railMat);
    railTop.position.set(outerX, DECK_TOP + 1.35, STREET_Z);
    scene.add(railTop);
    const railMid = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, STREET_DEPTH - 1.6), railMat);
    railMid.position.set(outerX, DECK_TOP + 0.75, STREET_Z);
    scene.add(railMid);

    // SHORT SIDE RAILS along the two long edges, so the point reads as enclosed
    [STREET_Z_MIN + 0.2, STREET_Z_MAX - 0.2].forEach(z => {
      const sideRail = new THREE.Mesh(new THREE.BoxGeometry(DECK_LEN - 1, 0.5, 0.1), railMat);
      sideRail.position.set(cx - 0.5, DECK_TOP + 0.6, z);
      scene.add(sideRail);
    });

    // LANTERN POSTS — same fixture style as dock.js, one shared PointLight
    [STREET_Z - 5, STREET_Z + 5].forEach((z, i) => {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 2.2, 6),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
      );
      pole.position.set(outerX + 1.6, DECK_TOP + 1.1, z);
      scene.add(pole);
      const lantern = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.5, 0.4),
        new THREE.MeshStandardMaterial({ color: 0xffcc44, emissive: 0xffaa00, emissiveIntensity: 2.5 })
      );
      lantern.position.set(outerX + 1.6, DECK_TOP + 2.3, z);
      scene.add(lantern);
      if (i === 0) {
        const glow = new THREE.PointLight(0xffaa33, 3, 16);
        glow.position.copy(lantern.position);
        scene.add(glow);
        lanternLights.push(glow);
      }
    });

    // BENCHES facing the water
    [STREET_Z - 3.5, STREET_Z + 3.5].forEach(z => {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.45, 0.6), benchMat);
      bench.position.set(cx + 3, DECK_TOP + 0.22, z);
      scene.add(bench);
    });

    // PALMS marking the entrance where the deck meets the street
    [STREET_Z - 6, STREET_Z + 6].forEach(z => this._buildPalm(scene, WEST_EDGE - 1.5, z, 8));
  },

  // Small helper, matches palms.js color palette (not exported there, so
  // reproduced locally rather than duplicating the whole palms.js system).
  _buildPalm(scene, x, z, h) {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 1 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x1a5c2a, roughness: 0.8 });
    const palm = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, h, 8), trunkMat);
    trunk.position.y = h / 2;
    palm.add(trunk);
    [0, 0.6, 1.1].forEach((yOff, i) => {
      const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.9 - i * 0.35, 7, 5), leafMat);
      leaves.position.y = h + yOff;
      leaves.scale.set(1, 0.5, 1);
      palm.add(leaves);
    });
    palm.position.set(x, DECK_TOP, z);
    scene.add(palm);
  },

  // ==========================================================
  // RECORDS HQ-SIDE OVERLOOK (east end, x > 45)
  // Premium marble/gold/glass terrace — matches recordsHQ.js's palette.
  // ==========================================================
  _buildRecordsOverlook(scene) {
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x202024, roughness: 0.48, metalness: 0.18 });
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0x111114, roughness: 0.38, metalness: 0.35 });
    const gold = new THREE.MeshStandardMaterial({
      color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 1.15, roughness: 0.3, metalness: 0.7
    });
    const glass = new THREE.MeshStandardMaterial({
      color: 0x87dfff, emissive: 0x155d73, emissiveIntensity: 0.35,
      transparent: true, opacity: 0.42, roughness: 0.12, metalness: 0.15
    });
    const planterMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7, metalness: 0.15 });
    const plantMat = new THREE.MeshStandardMaterial({ color: 0x174f42, roughness: 0.9 });
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.42, metalness: 0.25 });

    const cx = EAST_EDGE + DECK_LEN / 2; // 51.5, deck center
    const outerX = EAST_EDGE + DECK_LEN; // 58, the far tip

    // MARBLE DECK — continues the street out to the point
    const deck = new THREE.Mesh(new THREE.BoxGeometry(DECK_LEN, 0.3, STREET_DEPTH), stoneMat);
    deck.position.set(cx, 0.55, STREET_Z);
    scene.add(deck);

    // DARK EDGE SKIRT under the deck lip
    const edge = new THREE.Mesh(new THREE.BoxGeometry(DECK_LEN, 0.08, STREET_DEPTH + 0.4), edgeMat);
    edge.position.set(cx, 0.4, STREET_Z);
    scene.add(edge);

    // GOLD INLAY LINES running the length of the deck
    [-4, 0, 4].forEach(offset => {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, STREET_DEPTH - 1), gold);
      line.position.set(cx + offset, DECK_TOP + 0.05, STREET_Z);
      scene.add(line);
    });

    // GLASS GUARD RAIL + GOLD RAIL TOP — caps the point over the water
    const glassRail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.25, STREET_DEPTH - 2), glass);
    glassRail.position.set(outerX, DECK_TOP + 0.625, STREET_Z);
    scene.add(glassRail);
    const railTop = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, STREET_DEPTH - 1.6), gold);
    railTop.position.set(outerX, DECK_TOP + 1.29, STREET_Z);
    scene.add(railTop);

    // GOLD LIGHT PILLARS flanking the rail — emissive only, no new PointLight
    [STREET_Z_MIN + 2, STREET_Z_MAX - 2].forEach(z => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.5, 0.28), gold);
      pillar.position.set(outerX - 0.7, DECK_TOP + 0.75, z);
      scene.add(pillar);
    });

    // GLASS SIDE FENCES along the two long edges — same glass as the tip
    // rail, so the point reads as enclosed on 3 sides, not just capped.
    [STREET_Z_MIN + 0.5, STREET_Z_MAX - 0.5].forEach(z => {
      const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(DECK_LEN - 1, 0.9, 0.1), glass);
      sideGlass.position.set(cx - 0.5, DECK_TOP + 0.45, z);
      scene.add(sideGlass);
      const sideGold = new THREE.Mesh(new THREE.BoxGeometry(DECK_LEN - 1, 0.06, 0.12), gold);
      sideGold.position.set(cx - 0.5, DECK_TOP + 0.9, z);
      scene.add(sideGold);
    });

    // LUXURY PLANTERS
    [[cx - 3, STREET_Z_MIN + 3], [cx - 3, STREET_Z_MAX - 3]].forEach(([x, z]) => {
      const planter = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.34, 0.48, 12), planterMat);
      planter.position.set(x, DECK_TOP + 0.24, z);
      scene.add(planter);
      const plant = new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.15, 7), plantMat);
      plant.position.set(x, DECK_TOP + 0.48 + 0.575, z);
      scene.add(plant);
    });

    // CENTRAL EMBLEM inlay, echoing recordsHQ.js's gold emblem
    const emblem = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.08, 32), gold);
    emblem.rotation.x = Math.PI / 2;
    emblem.position.set(cx, DECK_TOP + 0.04, STREET_Z);
    scene.add(emblem);

    // SEATING BLOCKS
    [[cx + 2, STREET_Z - 4], [cx + 2, STREET_Z + 4]].forEach(([x, z]) => {
      const seat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 0.8), seatMat);
      seat.position.set(x, DECK_TOP + 0.225, z);
      scene.add(seat);
    });
  },

  // ==========================================================
  // COLLISION — blockers along the tip rail AND both side rails on
  // each overlook, so the deck is fully enclosed on 3 sides (the 4th
  // side, where it meets the street, is the entrance and stays open).
  // Uses the existing collision.js public API only; collision.js
  // itself is untouched.
  // ==========================================================
  _registerColliders() {
    const westCx = WEST_EDGE - DECK_LEN / 2;   // -51.5, matches _buildStoreOverlook's cx
    const eastCx = EAST_EDGE + DECK_LEN / 2;   // 51.5, matches _buildRecordsOverlook's cx

    // Tip rails — extended to the deck's full depth (was 2 short of it,
    // which left a gap at each corner the player could slip through).
    Collision.registerBox("overlookRailWest", {
      x: WEST_EDGE - DECK_LEN - 0.3,
      z: STREET_Z,
      width: 1,
      depth: STREET_DEPTH
    });
    Collision.registerBox("overlookRailEast", {
      x: EAST_EDGE + DECK_LEN + 0.3,
      z: STREET_Z,
      width: 1,
      depth: STREET_DEPTH
    });

    // Side rails — previously visual-only (the sideRail meshes had no
    // matching collider), which is what let players walk straight
    // through them onto the water. Matches the sideRail mesh geometry.
    [STREET_Z_MIN + 0.2, STREET_Z_MAX - 0.2].forEach((z, i) => {
      Collision.registerBox(`overlookSideWest${i}`, {
        x: westCx - 0.5,
        z,
        width: DECK_LEN - 1,
        depth: 1
      });
    });
    [STREET_Z_MIN + 0.5, STREET_Z_MAX - 0.5].forEach((z, i) => {
      Collision.registerBox(`overlookSideEast${i}`, {
        x: eastCx - 0.5,
        z,
        width: DECK_LEN - 1,
        depth: 1
      });
    });
  },

  update(delta) {
    time += delta;
    lanternLights.forEach((l, i) => {
      l.intensity = 3 + Math.sin(time * 1.8 + i * 0.4) * 0.6;
    });
  }
};
