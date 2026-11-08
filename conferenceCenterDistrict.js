import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import CITY_MAP from "./cityMap.js";

// LAMBO CITY — Arena District
// One coordinated landmark, complete square boulevard, connected arrival
// approach, and low-rise coastal villa frontage. Existing protected city
// anchors remain outside this module and are not repositioned.

const PLAN = CITY_MAP.districts.arenaDistrict;

function box(root, name, size, position, material, options = {}) {
  const geometryKey = size.join("x");
  const geometry = box.geometries.get(geometryKey) || new THREE.BoxGeometry(...size);
  box.geometries.set(geometryKey, geometry);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = options.castShadow === true;
  mesh.receiveShadow = options.receiveShadow === true;
  root.add(mesh);
  return mesh;
}
box.geometries = new Map();

function makeSignTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#080b10";
  ctx.fillRect(0, 0, 1024, 256);
  ctx.strokeStyle = "#c9a85f";
  ctx.lineWidth = 8;
  ctx.strokeRect(12, 12, 1000, 232);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#d9bd79";
  ctx.font = "600 54px Georgia, serif";
  ctx.fillText("LAMBO CITY", 512, 86);
  ctx.fillStyle = "#f4f0e7";
  ctx.font = "600 82px Georgia, serif";
  ctx.fillText("CONVENTION CENTER", 512, 174);
  return new THREE.CanvasTexture(canvas);
}

function addVilla(root, materials, id, x, z, rotation = 0) {
  const villa = new THREE.Group();
  villa.name = "lamboCityVilla_" + id;
  villa.position.set(x, 0, z);
  villa.rotation.y = rotation;
  root.add(villa);

  const { villaWall, villaGlass, villaGold, villaRoof, landscape } = materials;
  box(villa, "villa_" + id + "_podium", [13, 0.8, 11], [0, 0.8, 0], villaRoof);
  box(villa, "villa_" + id + "_lower", [12, 4.2, 9.8], [0, 3.1, 0], villaWall);
  box(villa, "villa_" + id + "_upper", [11.6, 4.0, 9.4], [0, 7.2, 0], villaWall);
  box(villa, "villa_" + id + "_roof", [12.6, 0.65, 10.4], [0, 9.55, 0], villaRoof);
  // Ocean-facing glass and continuous balconies.
  box(villa, "villa_" + id + "_glass_front_lower", [9.4, 2.5, 0.12], [0, 3.1, -5.43], villaGlass);
  box(villa, "villa_" + id + "_glass_front_upper", [9.4, 2.4, 0.12], [0, 7.15, -5.13], villaGlass);
  box(villa, "villa_" + id + "_balcony_lower", [13.2, 0.22, 2.0], [0, 4.9, -6.1], villaGold);
  box(villa, "villa_" + id + "_balcony_upper", [12.8, 0.22, 1.8], [0, 8.9, -5.8], villaGold);
  box(villa, "villa_" + id + "_planter", [2.0, 0.7, 1.5], [-4.4, 1.55, -5.6], landscape);
  box(villa, "villa_" + id + "_entry", [3.2, 2.7, 0.18], [0, 2.35, 5.48], villaGold);
  return villa;
}

export default {
  init(scene, context = {}) {
    if (scene.getObjectByName("lamboCityConferenceCenterDistrict")) return;

    const root = new THREE.Group();
    root.name = "lamboCityConferenceCenterDistrict";
    scene.add(root);

    const arena = PLAN.arena;
    const boulevard = PLAN.boulevard;
    const cx = arena.centerX;
    const cz = arena.centerZ;
    const halfRoadX = boulevard.outerWidth / 2;
    const halfRoadZ = boulevard.outerDepth / 2;
    const westX = cx - halfRoadX;
    const eastX = cx + halfRoadX;
    const southZ = cz - halfRoadZ;
    const northZ = cz + halfRoadZ;

    const materials = {
      land: new THREE.MeshStandardMaterial({ color: 0x39332b, roughness: 1 }),
      road: new THREE.MeshStandardMaterial({ color: 0x15191f, roughness: 0.94 }),
      roadMark: new THREE.MeshStandardMaterial({ color: 0xd8b96e, emissive: 0x594016, emissiveIntensity: 0.18, roughness: 0.7 }),
      sidewalk: new THREE.MeshStandardMaterial({ color: 0xb9ad98, roughness: 0.82 }),
      curb: new THREE.MeshStandardMaterial({ color: 0x77736c, roughness: 0.9 }),
      arenaDark: new THREE.MeshStandardMaterial({ color: 0x101720, roughness: 0.34, metalness: 0.56 }),
      arenaStone: new THREE.MeshStandardMaterial({ color: 0x777b7c, roughness: 0.68, metalness: 0.18 }),
      glass: new THREE.MeshStandardMaterial({ color: 0x79b8c9, roughness: 0.12, metalness: 0.34, transparent: true, opacity: 0.48 }),
      gold: new THREE.MeshStandardMaterial({ color: 0xc7a45b, roughness: 0.28, metalness: 0.8, emissive: 0x33230a, emissiveIntensity: 0.32 }),
      display: new THREE.MeshStandardMaterial({ color: 0x3c173d, emissive: 0x6f1c79, emissiveIntensity: 0.72, roughness: 0.3 }),
      plaza: new THREE.MeshStandardMaterial({ color: 0xaaa18e, roughness: 0.88 }),
      villaWall: new THREE.MeshStandardMaterial({ color: 0xd4cbb9, roughness: 0.76 }),
      villaGlass: new THREE.MeshStandardMaterial({ color: 0x6fa9bb, roughness: 0.1, metalness: 0.24, transparent: true, opacity: 0.56 }),
      villaGold: new THREE.MeshStandardMaterial({ color: 0x9d875d, roughness: 0.34, metalness: 0.68 }),
      villaRoof: new THREE.MeshStandardMaterial({ color: 0x343a3d, roughness: 0.68, metalness: 0.24 }),
      landscape: new THREE.MeshStandardMaterial({ color: 0x344c3d, roughness: 0.95 })
    };

    // Continuous district foundation overlaps the existing north land by
    // one unit. The foundation is on surveyed land, not over open water.
    box(root, "arenaDistrictGround", [PLAN.ground.width, 0.5, PLAN.ground.depth],
      [PLAN.ground.centerX, PLAN.ground.topY - 0.25, PLAN.ground.centerZ],
      materials.land);

    // Four road legs meet with overlapping corners, forming a true closed
    // two-way loop rather than four disconnected visual road segments.
    const roadY = 0.79;
    box(root, "arenaBoulevardSouth", [boulevard.outerWidth + boulevard.roadWidth, 0.18, boulevard.roadWidth],
      [cx, roadY, southZ], materials.road);
    box(root, "arenaBoulevardNorth", [boulevard.outerWidth + boulevard.roadWidth, 0.18, boulevard.roadWidth],
      [cx, roadY, northZ], materials.road);
    box(root, "arenaBoulevardWest", [boulevard.roadWidth, 0.18, boulevard.outerDepth],
      [westX, roadY, cz], materials.road);
    box(root, "arenaBoulevardEast", [boulevard.roadWidth, 0.18, boulevard.outerDepth],
      [eastX, roadY, cz], materials.road);

    // Sidewalk bands sit outside the road loop and remain connected at all
    // four corners. Their overlap closes the pedestrian circuit.
    const sw = boulevard.sidewalkWidth;
    const sideOffset = boulevard.roadWidth / 2 + sw / 2;
    box(root, "arenaSidewalkSouth", [boulevard.outerWidth + boulevard.roadWidth + sw * 2, 0.14, sw],
      [cx, 0.82, southZ - sideOffset], materials.sidewalk);
    box(root, "arenaSidewalkNorth", [boulevard.outerWidth + boulevard.roadWidth + sw * 2, 0.14, sw],
      [cx, 0.82, northZ + sideOffset], materials.sidewalk);
    box(root, "arenaSidewalkWest", [sw, 0.14, boulevard.outerDepth + boulevard.roadWidth + sw * 2],
      [westX - sideOffset, 0.82, cz], materials.sidewalk);
    box(root, "arenaSidewalkEast", [sw, 0.14, boulevard.outerDepth + boulevard.roadWidth + sw * 2],
      [eastX + sideOffset, 0.82, cz], materials.sidewalk);

    // Gold centerline dashes, repeated at measured intervals.
    for (let x = westX + 7; x < eastX - 4; x += 14) {
      box(root, "arenaBoulevardSouthMark_" + Math.round(x), [4.2, 0.035, 0.16], [x, 0.9, southZ], materials.roadMark);
      box(root, "arenaBoulevardNorthMark_" + Math.round(x), [4.2, 0.035, 0.16], [x, 0.9, northZ], materials.roadMark);
    }
    for (let z = southZ + 7; z < northZ - 4; z += 14) {
      box(root, "arenaBoulevardWestMark_" + Math.round(z), [0.16, 0.035, 4.2], [westX, 0.9, z], materials.roadMark);
      box(root, "arenaBoulevardEastMark_" + Math.round(z), [0.16, 0.035, 4.2], [eastX, 0.9, z], materials.roadMark);
    }

    // Existing approach road joins the south loop and continues to a
    // pedestrian/vehicle drop-off plaza at the arena's south entrance.
    const access = CITY_MAP.districts.conferenceCenter;
    const approachEnd = cz - arena.footprintDepth / 2 - 1;
    box(root, "conferenceDistrictAccessRoad", [8, 0.18, approachEnd - access.accessRoadStartZ],
      [access.accessRoadX, roadY, (access.accessRoadStartZ + approachEnd) / 2], materials.road);
    box(root, "arenaArrivalPlaza", [30, 0.22, 13], [cx, 0.78, cz - arena.footprintDepth / 2 - 5.5], materials.plaza);
    box(root, "arenaEntryPromenade", [20, 0.12, 7], [cx, 0.91, cz - arena.footprintDepth / 2 - 1.5], materials.sidewalk);

    // Landmark foundation and monumental architecture.
    const aw = arena.footprintWidth;
    const ad = arena.footprintDepth;
    const front = cz - ad / 2;
    const back = cz + ad / 2;
    const left = cx - aw / 2;
    const right = cx + aw / 2;
    const wallHeight = 25;
    box(root, "arenaFoundation", [aw + 2, 1.0, ad + 2], [cx, 1.0, cz], materials.arenaDark);
    box(root, "arenaWestMass", [1.8, wallHeight, ad], [left + 0.9, 13.5, cz], materials.arenaDark);
    box(root, "arenaEastMass", [1.8, wallHeight, ad], [right - 0.9, 13.5, cz], materials.arenaDark);
    box(root, "arenaRearMass", [aw, wallHeight, 1.8], [cx, 13.5, back - 0.9], materials.arenaDark);
    // South facade wings leave a broad, clearly legible public entrance.
    box(root, "arenaSouthWestMass", [17, wallHeight, 1.8], [left + 8.5, 13.5, front + 0.9], materials.arenaDark);
    box(root, "arenaSouthEastMass", [17, wallHeight, 1.8], [right - 8.5, 13.5, front + 0.9], materials.arenaDark);
    box(root, "arenaEntranceHeader", [20, 5.2, 2.0], [cx, 23.4, front + 0.9], materials.arenaDark);

    // Layered glass curtain walls and gold structural ribs.
    for (let level = 0; level < 4; level++) {
      const y = 4.2 + level * 5.2;
      box(root, "arenaWestGlassBand_" + level, [0.12, 2.8, 29], [left + 1.86, y, cz - 1], materials.glass);
      box(root, "arenaEastGlassBand_" + level, [0.12, 2.8, 29], [right - 1.86, y, cz - 1], materials.glass);
      box(root, "arenaRearGlassBand_" + level, [39, 2.8, 0.12], [cx, y, back - 1.86], materials.glass);
    }
    for (let x = left + 5; x <= right - 5; x += 10) {
      box(root, "arenaFacadeRib_" + Math.round(x), [0.48, wallHeight, 0.5], [x, 13.5, front - 0.12], materials.gold);
    }
    box(root, "arenaRoofCanopy", [aw + 5, 1.6, ad + 5], [cx, 27.0, cz], materials.arenaDark);
    box(root, "arenaRoofGoldReveal", [aw + 5.4, 0.22, ad + 5.4], [cx, 26.05, cz], materials.gold);
    box(root, "arenaRoofCrown", [aw - 8, 1.2, ad - 8], [cx, 28.35, cz], materials.arenaStone);

    // Integrated digital facade screens and the main illuminated sign.
    box(root, "arenaSouthDisplay", [31, 8, 0.35], [cx, 18.5, front - 0.22], materials.display);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(34, 4.4, 0.45),
      new THREE.MeshStandardMaterial({ map: makeSignTexture(), emissive: 0x35270e, emissiveIntensity: 0.48, roughness: 0.4, metalness: 0.35 }));
    sign.name = "arenaConventionCenterSign";
    sign.position.set(cx, 32.2, front - 0.28);
    root.add(sign);

    // Restrained emissive entry markers; no additional real-time lights.
    [-9.8, 9.8].forEach((offset, i) => {
      box(root, "arenaEntryGoldPier_" + i, [0.8, 15, 1.1], [cx + offset, 8.5, front - 0.65], materials.gold);
    });

    // Five low-rise coastal villa residences sit beyond the boulevard.
    // South approach remains open; the arena remains the dominant landmark.
    addVilla(root, materials, "WestOne", -98.5, 80, Math.PI / 2);
    addVilla(root, materials, "WestTwo", -98.5, 112, Math.PI / 2);
    addVilla(root, materials, "EastOne", 12.5, 80, -Math.PI / 2);
    addVilla(root, materials, "EastTwo", 12.5, 112, -Math.PI / 2);
    addVilla(root, materials, "NorthOne", -58, 148, 0);
    addVilla(root, materials, "NorthTwo", -28, 148, 0);

    // Collision matches the arena shell. The south entrance stays open.
    const collision = context.systems && context.systems.collision;
    if (collision && typeof collision.registerBox === "function") {
      const bounds = { minY: 0, maxY: wallHeight + 1, level: "arena-district" };
      collision.registerBox("arenaWestMass", { x: left + 0.9, z: cz, width: 1.8, depth: ad, ...bounds });
      collision.registerBox("arenaEastMass", { x: right - 0.9, z: cz, width: 1.8, depth: ad, ...bounds });
      collision.registerBox("arenaRearMass", { x: cx, z: back - 0.9, width: aw, depth: 1.8, ...bounds });
      collision.registerBox("arenaSouthWestMass", { x: left + 8.5, z: front + 0.9, width: 17, depth: 1.8, ...bounds });
      collision.registerBox("arenaSouthEastMass", { x: right - 8.5, z: front + 0.9, width: 17, depth: 1.8, ...bounds });
    }

    this._root = root;
  },

  update() {}
};
