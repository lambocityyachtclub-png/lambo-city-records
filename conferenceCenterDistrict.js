import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import CITY_MAP from "./cityMap.js";

// LAMBO CITY — Arena / Conference Center District
// Builds the approved landmark, complete four-sided boulevard, public realm,
// and low-rise villa parcels. Protected waterfront and HQ coordinates are untouched.

const PLAN = CITY_MAP.districts.arenaDistrict;
const CENTER = PLAN.arena;
const ROAD = PLAN.boulevard;
const ROOT_NAME = "lamboCityConferenceCenterDistrict";
const geometryCache = new Map();

function boxGeometry(width, height, depth) {
  const key = [width, height, depth].join(":");
  if (!geometryCache.has(key)) geometryCache.set(key, new THREE.BoxGeometry(width, height, depth));
  return geometryCache.get(key);
}

function addBox(parent, name, size, position, material, options = {}) {
  const mesh = new THREE.Mesh(boxGeometry(size[0], size[1], size[2]), material);
  mesh.name = name;
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = options.castShadow === true;
  mesh.receiveShadow = options.receiveShadow !== false;
  if (options.rotationY) mesh.rotation.y = options.rotationY;
  parent.add(mesh);
  return mesh;
}

function addCylinder(parent, name, radiusTop, radiusBottom, height, position, material, segments = 8) {
  const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function makeSignTexture(title, subtitle) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 1024, 320);
  gradient.addColorStop(0, "#080b10");
  gradient.addColorStop(0.5, "#20252b");
  gradient.addColorStop(1, "#080b10");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 320);
  ctx.strokeStyle = "#c9a96a";
  ctx.lineWidth = 7;
  ctx.strokeRect(15, 15, 994, 290);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#d8bd83";
  ctx.font = "600 44px Georgia, serif";
  ctx.fillText(title, 512, 105);
  ctx.fillStyle = "#f6f2e9";
  ctx.font = "500 72px Georgia, serif";
  ctx.fillText(subtitle, 512, 207);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function makeDisplayTexture(label) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 1024, 512);
  gradient.addColorStop(0, "#101923");
  gradient.addColorStop(0.52, "#263b45");
  gradient.addColorStop(1, "#10151c");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 512);
  ctx.strokeStyle = "#c6a45b";
  ctx.lineWidth = 12;
  ctx.strokeRect(24, 24, 976, 464);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#e5d2a4";
  ctx.font = "600 54px Georgia, serif";
  ctx.fillText("LAMBO CITY", 512, 188);
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 88px Georgia, serif";
  ctx.fillText(label, 512, 292);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function addRoadMark(parent, name, width, depth, x, z, material) {
  return addBox(parent, name, [width, 0.035, depth], [x, 0.795, z], material);
}

function addVilla(parent, materials, collision, spec, index) {
  const { x, z, facing } = spec;
  const group = new THREE.Group();
  group.name = "arenaDistrictVilla_" + index;
  parent.add(group);

  const width = 12;
  const depth = 10;
  const height = 8.2;
  addBox(group, "villa_" + index + "_plinth", [12.6, 0.55, 10.6], [x, 0.95, z], materials.villaStone);
  addBox(group, "villa_" + index + "_mainVolume", [width, height, depth], [x, 5.05, z], materials.villaWall, { castShadow: true });
  addBox(group, "villa_" + index + "_roof", [12.8, 0.55, 10.8], [x, 9.35, z], materials.darkMetal);

  // Recessed window bands and a restrained champagne-metal roof reveal.
  addBox(group, "villa_" + index + "_windowBand", [12.08, 2.1, 0.12], [x, 5.45, z - 5.07], materials.villaGlass);
  addBox(group, "villa_" + index + "_windowBandRear", [12.08, 2.1, 0.12], [x, 5.45, z + 5.07], materials.villaGlass);
  addBox(group, "villa_" + index + "_roofReveal", [12.9, 0.12, 10.9], [x, 9.02, z], materials.gold);

  let balconyPosition;
  let balconySize;
  if (facing === "west") {
    balconyPosition = [x - 6.8, 3.85, z];
    balconySize = [1.8, 0.22, 7.0];
  } else if (facing === "east") {
    balconyPosition = [x + 6.8, 3.85, z];
    balconySize = [1.8, 0.22, 7.0];
  } else {
    balconyPosition = [x, 3.85, z + 5.8];
    balconySize = [8.0, 0.22, 1.8];
  }
  addBox(group, "villa_" + index + "_outwardBalcony", balconySize, balconyPosition, materials.darkMetal);
  if (facing === "west" || facing === "east") {
    const outward = facing === "west" ? -1 : 1;
    addBox(group, "villa_" + index + "_balconyRail", [0.12, 0.85, 7.0], [balconyPosition[0] + outward * 0.85, 4.38, z], materials.glassRail);
    for (let n = 0; n < 4; n++) {
      addBox(group, "villa_" + index + "_balconyPost_" + n, [0.1, 0.82, 0.1], [balconyPosition[0] + outward * 0.85, 4.35, z - 2.8 + n * 1.85], materials.gold);
    }
  } else {
    addBox(group, "villa_" + index + "_balconyRail", [8.0, 0.85, 0.12], [x, 4.38, balconyPosition[2] + 0.85], materials.glassRail);
    for (let n = 0; n < 5; n++) {
      addBox(group, "villa_" + index + "_balconyPost_" + n, [0.1, 0.82, 0.1], [x - 3.2 + n * 1.6, 4.35, balconyPosition[2] + 0.85], materials.gold);
    }
  }

  // Entries face the boulevard; balconies and primary glazing face outward.
  if (facing === "west") {
    addBox(group, "villa_" + index + "_entry", [0.16, 3.0, 1.7], [x + 6.08, 2.35, z], materials.villaGlass);
    addBox(group, "villa_" + index + "_entryCanopy", [1.3, 0.18, 3.0], [x + 5.55, 4.05, z], materials.gold);
  } else if (facing === "east") {
    addBox(group, "villa_" + index + "_entry", [0.16, 3.0, 1.7], [x - 6.08, 2.35, z], materials.villaGlass);
    addBox(group, "villa_" + index + "_entryCanopy", [1.3, 0.18, 3.0], [x - 5.55, 4.05, z], materials.gold);
  } else {
    addBox(group, "villa_" + index + "_entry", [1.7, 3.0, 0.16], [x, 2.35, z - 5.08], materials.villaGlass);
    addBox(group, "villa_" + index + "_entryCanopy", [3.0, 0.18, 1.3], [x, 4.05, z - 5.55], materials.gold);
  }

  if (collision && typeof collision.registerBox === "function") {
    const wallOptions = { minY: 0, maxY: height + 1, level: "arena-villas" };
    collision.registerBox("arenaVilla_" + index + "_north", { x, z: z + 4.95, width: 12, depth: 0.2, ...wallOptions });
    collision.registerBox("arenaVilla_" + index + "_southLeft", { x: x - 3.6, z: z - 4.95, width: 4.8, depth: 0.2, ...wallOptions });
    collision.registerBox("arenaVilla_" + index + "_southRight", { x: x + 3.6, z: z - 4.95, width: 4.8, depth: 0.2, ...wallOptions });
    if (facing === "west") {
      collision.registerBox("arenaVilla_" + index + "_west", { x: x - 5.95, z, width: 0.2, depth: 10, ...wallOptions });
      collision.registerBox("arenaVilla_" + index + "_eastFront", { x: x + 5.95, z: z - 3.1, width: 0.2, depth: 3.8, ...wallOptions });
      collision.registerBox("arenaVilla_" + index + "_eastRear", { x: x + 5.95, z: z + 3.1, width: 0.2, depth: 3.8, ...wallOptions });
    } else if (facing === "east") {
      collision.registerBox("arenaVilla_" + index + "_east", { x: x + 5.95, z, width: 0.2, depth: 10, ...wallOptions });
      collision.registerBox("arenaVilla_" + index + "_westFront", { x: x - 5.95, z: z - 3.1, width: 0.2, depth: 3.8, ...wallOptions });
      collision.registerBox("arenaVilla_" + index + "_westRear", { x: x - 5.95, z: z + 3.1, width: 0.2, depth: 3.8, ...wallOptions });
    } else {
      collision.registerBox("arenaVilla_" + index + "_west", { x: x - 5.95, z, width: 0.2, depth: 10, ...wallOptions });
      collision.registerBox("arenaVilla_" + index + "_east", { x: x + 5.95, z, width: 0.2, depth: 10, ...wallOptions });
    }
  }
}

function addStreetLight(parent, materials, name, x, z, rotation = 0) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(x, 0.65, z);
  group.rotation.y = rotation;
  parent.add(group);
  addCylinder(group, name + "_pole", 0.09, 0.13, 6.6, [0, 3.3, 0], materials.darkMetal, 8);
  addBox(group, name + "_arm", [1.25, 0.12, 0.12], [0.52, 6.35, 0], materials.darkMetal);
  addBox(group, name + "_fixture", [0.72, 0.18, 0.42], [0.95, 6.22, 0], materials.emissiveLight);
}

function addTree(parent, materials, name, x, z, scale = 1) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(x, 0.65, z);
  group.scale.setScalar(scale);
  parent.add(group);
  addCylinder(group, name + "_trunk", 0.18, 0.28, 2.8, [0, 1.4, 0], materials.trunk, 7);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(1.35, 8, 6), materials.leaves);
  crown.name = name + "_crown";
  crown.position.set(0, 3.25, 0);
  crown.scale.set(1.0, 1.2, 0.95);
  crown.castShadow = true;
  group.add(crown);
}

export default {
  init(scene, context = {}) {
    if (scene.getObjectByName(ROOT_NAME)) return;

    const root = new THREE.Group();
    root.name = ROOT_NAME;
    scene.add(root);

    const materials = {
      ground: new THREE.MeshStandardMaterial({ color: 0x35322d, roughness: 0.98 }),
      road: new THREE.MeshStandardMaterial({ color: 0x15191e, roughness: 0.94 }),
      roadEdge: new THREE.MeshStandardMaterial({ color: 0x343a40, roughness: 0.82 }),
      sidewalk: new THREE.MeshStandardMaterial({ color: 0xb7ad9b, roughness: 0.78 }),
      curb: new THREE.MeshStandardMaterial({ color: 0xd0c6b4, roughness: 0.82 }),
      stone: new THREE.MeshStandardMaterial({ color: 0x9e988d, roughness: 0.74 }),
      darkMetal: new THREE.MeshStandardMaterial({ color: 0x10151b, roughness: 0.3, metalness: 0.72 }),
      gold: new THREE.MeshStandardMaterial({ color: 0xc6a45b, roughness: 0.27, metalness: 0.82, emissive: 0x38270b, emissiveIntensity: 0.22 }),
      glass: new THREE.MeshStandardMaterial({ color: 0x79b8c8, roughness: 0.12, metalness: 0.32, transparent: true, opacity: 0.5, depthWrite: false }),
      glassRail: new THREE.MeshStandardMaterial({ color: 0xa9d5df, roughness: 0.12, metalness: 0.22, transparent: true, opacity: 0.48, depthWrite: false }),
      facade: new THREE.MeshStandardMaterial({ color: 0x202832, roughness: 0.48, metalness: 0.55 }),
      facadeLight: new THREE.MeshStandardMaterial({ color: 0x414b53, roughness: 0.38, metalness: 0.5 }),
      emissiveLight: new THREE.MeshStandardMaterial({ color: 0xe8d4a0, emissive: 0xffcf75, emissiveIntensity: 1.1, roughness: 0.3 }),
      lane: new THREE.MeshStandardMaterial({ color: 0xd4b36c, emissive: 0x594016, emissiveIntensity: 0.2, roughness: 0.7 }),
      crosswalk: new THREE.MeshStandardMaterial({ color: 0xe6e2d8, roughness: 0.9 }),
      planter: new THREE.MeshStandardMaterial({ color: 0x252a2c, roughness: 0.82 }),
      shrub: new THREE.MeshStandardMaterial({ color: 0x294a38, roughness: 0.96 }),
      trunk: new THREE.MeshStandardMaterial({ color: 0x594638, roughness: 1 }),
      leaves: new THREE.MeshStandardMaterial({ color: 0x315744, roughness: 0.95 }),
      villaWall: new THREE.MeshStandardMaterial({ color: 0xd0c9bc, roughness: 0.78 }),
      villaStone: new THREE.MeshStandardMaterial({ color: 0x77766f, roughness: 0.84 }),
      villaGlass: new THREE.MeshStandardMaterial({ color: 0x47707c, roughness: 0.13, metalness: 0.28, transparent: true, opacity: 0.62, depthWrite: false })
    };

    const originX = ROAD.centerX;
    const originZ = ROAD.centerZ;
    const halfRoadX = ROAD.outerWidth / 2;
    const halfRoadZ = ROAD.outerDepth / 2;
    const roadCenterOffsetX = halfRoadX - ROAD.roadWidth / 2;
    const roadCenterOffsetZ = halfRoadZ - ROAD.roadWidth / 2;
    const westRoadX = originX - roadCenterOffsetX;
    const eastRoadX = originX + roadCenterOffsetX;
    const southRoadZ = originZ - roadCenterOffsetZ;
    const northRoadZ = originZ + roadCenterOffsetZ;
    const horizontalLength = ROAD.outerWidth - ROAD.roadWidth;
    const verticalLength = ROAD.outerDepth - ROAD.roadWidth;

    // Continuous surveyed land pad and the short connector to the existing boardwalk.
    const land = PLAN.ground;
    addBox(root, "arenaDistrictGround", [land.width, 0.5, land.depth], [land.centerX, 0.4, land.centerZ], materials.ground);
    addBox(root, "arenaDistrictBoardwalkConnector", [54, 0.5, 15], [originX, 0.4, 52.5], materials.ground);

    // Four connected road legs overlap at their corners to form one complete loop.
    addBox(root, "arenaBoulevardSouth", [horizontalLength, 0.18, ROAD.roadWidth], [originX, 0.68, southRoadZ], materials.road);
    addBox(root, "arenaBoulevardNorth", [horizontalLength, 0.18, ROAD.roadWidth], [originX, 0.68, northRoadZ], materials.road);
    addBox(root, "arenaBoulevardWest", [ROAD.roadWidth, 0.18, verticalLength], [westRoadX, 0.68, originZ], materials.road);
    addBox(root, "arenaBoulevardEast", [ROAD.roadWidth, 0.18, verticalLength], [eastRoadX, 0.68, originZ], materials.road);

    // Store-side approach enters the south boulevard leg; it does not cross the arena footprint.
    const approachStartZ = CITY_MAP.districts.conferenceCenter.accessRoadStartZ;
    const approachEndZ = southRoadZ + ROAD.roadWidth / 2;
    addBox(root, "arenaBoulevardStoreApproach", [8, 0.18, approachEndZ - approachStartZ], [-37, 0.68, (approachStartZ + approachEndZ) / 2], materials.road);

    // Continuous inner pedestrian promenades and raised curb edges.
    const innerSidewalkOffsetX = halfRoadX - ROAD.roadWidth - ROAD.sidewalkWidth / 2;
    const innerSidewalkOffsetZ = halfRoadZ - ROAD.roadWidth - ROAD.sidewalkWidth / 2;
    const sidewalkThickness = 0.14;
    addBox(root, "arenaBoulevardInnerSidewalkWest", [ROAD.sidewalkWidth, sidewalkThickness, verticalLength], [originX - innerSidewalkOffsetX, 0.76, originZ], materials.sidewalk);
    addBox(root, "arenaBoulevardInnerSidewalkEast", [ROAD.sidewalkWidth, sidewalkThickness, verticalLength], [originX + innerSidewalkOffsetX, 0.76, originZ], materials.sidewalk);
    addBox(root, "arenaBoulevardInnerSidewalkSouth", [horizontalLength, sidewalkThickness, ROAD.sidewalkWidth], [originX, 0.76, originZ - innerSidewalkOffsetZ], materials.sidewalk);
    addBox(root, "arenaBoulevardInnerSidewalkNorth", [horizontalLength, sidewalkThickness, ROAD.sidewalkWidth], [originX, 0.76, originZ + innerSidewalkOffsetZ], materials.sidewalk);

    // Curb returns at all four corners make the loop read as a connected street, not four loose slabs.
    const cornerX = halfRoadX - ROAD.roadWidth / 2;
    const cornerZ = halfRoadZ - ROAD.roadWidth / 2;
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        addBox(root, "arenaBoulevardCornerCurb_" + sx + "_" + sz, [1.0, 0.22, 1.0], [originX + sx * cornerX, 0.79, originZ + sz * cornerZ], materials.curb);
      }
    }

    // Dashed center lines, crosswalks, and stop bars.
    for (let n = 0; n < 9; n++) {
      const x = originX - 31 + n * 7.75;
      addRoadMark(root, "arenaSouthLaneDash_" + n, 3.2, 0.2, x, southRoadZ, materials.lane);
      addRoadMark(root, "arenaNorthLaneDash_" + n, 3.2, 0.2, x, northRoadZ, materials.lane);
    }
    for (let n = 0; n < 7; n++) {
      const z = originZ - 26 + n * 8.7;
      addRoadMark(root, "arenaWestLaneDash_" + n, 0.2, 3.2, westRoadX, z, materials.lane);
      addRoadMark(root, "arenaEastLaneDash_" + n, 0.2, 3.2, eastRoadX, z, materials.lane);
    }
    for (let n = 0; n < 6; n++) {
      const x = originX - 2.25 + n * 0.9;
      addRoadMark(root, "arenaSouthCrosswalk_" + n, 0.62, 4.4, x, southRoadZ, materials.crosswalk);
      addRoadMark(root, "arenaNorthCrosswalk_" + n, 0.62, 4.4, x, northRoadZ, materials.crosswalk);
      const z = originZ - 2.25 + n * 0.9;
      addRoadMark(root, "arenaWestCrosswalk_" + n, 4.4, 0.62, westRoadX, z, materials.crosswalk);
      addRoadMark(root, "arenaEastCrosswalk_" + n, 4.4, 0.62, eastRoadX, z, materials.crosswalk);
    }

    // Outer sidewalk links and landscaped corner pockets.
    addBox(root, "arenaOuterWalkWest", [3, 0.13, ROAD.outerDepth], [originX - halfRoadX - 1.5, 0.74, originZ], materials.sidewalk);
    addBox(root, "arenaOuterWalkEast", [3, 0.13, ROAD.outerDepth], [originX + halfRoadX + 1.5, 0.74, originZ], materials.sidewalk);
    addBox(root, "arenaOuterWalkSouth", [ROAD.outerWidth, 0.13, 3], [originX, 0.74, originZ - halfRoadZ - 1.5], materials.sidewalk);
    addBox(root, "arenaOuterWalkNorth", [ROAD.outerWidth, 0.13, 3], [originX, 0.74, originZ + halfRoadZ + 1.5], materials.sidewalk);

    // Monumental arena: 54 x 44 footprint with a tall glass-and-stone facade.
    const bx = CENTER.centerX;
    const bz = CENTER.centerZ;
    const halfW = CENTER.footprintWidth / 2;
    const halfD = CENTER.footprintDepth / 2;
    const frontZ = bz - halfD;
    const rearZ = bz + halfD;
    const leftX = bx - halfW;
    const rightX = bx + halfW;
    const wallHeight = 18.5;
    addBox(root, "arenaFoundation", [CENTER.footprintWidth, 0.7, CENTER.footprintDepth], [bx, 1.0, bz], materials.darkMetal, { castShadow: true });
    addBox(root, "arenaWestFacade", [1.0, wallHeight, CENTER.footprintDepth], [leftX + 0.5, 10.55, bz], materials.facade, { castShadow: true });
    addBox(root, "arenaEastFacade", [1.0, wallHeight, CENTER.footprintDepth], [rightX - 0.5, 10.55, bz], materials.facade, { castShadow: true });
    addBox(root, "arenaRearFacade", [CENTER.footprintWidth, wallHeight, 1.0], [bx, 10.55, rearZ - 0.5], materials.facade, { castShadow: true });

    // South facade wings leave a generous, clearly readable public entrance.
    addBox(root, "arenaSouthFacadeWest", [17, wallHeight, 1.0], [bx - 18.5, 10.55, frontZ + 0.5], materials.facade, { castShadow: true });
    addBox(root, "arenaSouthFacadeEast", [17, wallHeight, 1.0], [bx + 18.5, 10.55, frontZ + 0.5], materials.facade, { castShadow: true });
    addBox(root, "arenaEntranceHeader", [20, 4.2, 1.2], [bx, 18.2, frontZ + 0.45], materials.darkMetal, { castShadow: true });

    // Large curtain-wall glass fields and champagne-metal vertical fins.
    for (let n = 0; n < 6; n++) {
      const x = leftX + 5 + n * 8.8;
      addBox(root, "arenaRearGlass_" + n, [6.2, 11.5, 0.12], [x, 10.2, rearZ - 1.02], materials.glass);
      addBox(root, "arenaFrontGlass_" + n, [6.2, 10.8, 0.12], [x, 9.5, frontZ + 1.05], materials.glass);
      addBox(root, "arenaRearFin_" + n, [0.18, 16.5, 0.2], [x + 3.25, 10.0, rearZ - 1.18], materials.gold);
    }
    for (let n = 0; n < 5; n++) {
      const z = frontZ + 5 + n * 8.5;
      addBox(root, "arenaWestGlass_" + n, [0.12, 11.5, 6.0], [leftX + 1.02, 10.2, z], materials.glass);
      addBox(root, "arenaEastGlass_" + n, [0.12, 11.5, 6.0], [rightX - 1.02, 10.2, z], materials.glass);
      addBox(root, "arenaWestFin_" + n, [0.2, 16.5, 0.18], [leftX + 1.18, 10.0, z + 3.1], materials.gold);
      addBox(root, "arenaEastFin_" + n, [0.2, 16.5, 0.18], [rightX - 1.18, 10.0, z + 3.1], materials.gold);
    }

    // Deep roof canopy and layered crown establish the landmark silhouette.
    addBox(root, "arenaRoofCrown", [56, 1.2, 46], [bx, 20.3, bz], materials.darkMetal, { castShadow: true });
    addBox(root, "arenaRoofGoldReveal", [56.4, 0.16, 46.4], [bx, 19.58, bz], materials.gold);
    addBox(root, "arenaRoofUpperCap", [49, 0.55, 40], [bx, 21.05, bz], materials.facadeLight);
    addBox(root, "arenaSouthCanopy", [26, 0.55, 5.5], [bx, 17.1, frontZ - 2.2], materials.darkMetal, { castShadow: true });
    for (let n = 0; n < 4; n++) {
      addBox(root, "arenaEntryColumn_" + n, [0.7, 15.2, 0.9], [bx - 9 + n * 6, 8.6, frontZ - 0.35], materials.gold);
    }

    // Tall lobby glazing and framed entrance doors.
    addBox(root, "arenaEntryGlassLeft", [8.5, 9.0, 0.18], [bx - 5.0, 5.4, frontZ + 0.12], materials.glass);
    addBox(root, "arenaEntryGlassRight", [8.5, 9.0, 0.18], [bx + 5.0, 5.4, frontZ + 0.12], materials.glass);
    addBox(root, "arenaEntryDoorMullion", [0.16, 9.0, 0.24], [bx, 5.4, frontZ + 0.02], materials.gold);

    // Large integrated digital display faces on the arena's west and east elevations.
    const displayMaterialWest = new THREE.MeshStandardMaterial({ map: makeDisplayTexture("CONFERENCE"), emissive: 0x25313a, emissiveIntensity: 0.45, roughness: 0.36, metalness: 0.28 });
    const displayMaterialEast = new THREE.MeshStandardMaterial({ map: makeDisplayTexture("LAMBO CITY"), emissive: 0x25313a, emissiveIntensity: 0.45, roughness: 0.36, metalness: 0.28 });
    addBox(root, "arenaWestDigitalDisplay", [0.24, 7.5, 17], [leftX - 0.18, 12.0, bz], displayMaterialWest);
    addBox(root, "arenaEastDigitalDisplay", [0.24, 7.5, 17], [rightX + 0.18, 12.0, bz], displayMaterialEast);

    const facadeSign = new THREE.Mesh(boxGeometry(25, 3.4, 0.35), new THREE.MeshStandardMaterial({
      map: makeSignTexture("LAMBO CITY", "CONFERENCE CENTER"),
      emissive: 0x35280f,
      emissiveIntensity: 0.38,
      roughness: 0.38,
      metalness: 0.3
    }));
    facadeSign.name = "arenaConferenceCenterSign";
    facadeSign.position.set(bx, 18.4, frontZ - 0.62);
    root.add(facadeSign);

    // A broad arrival forecourt, shallow accessible steps, and formal planters.
    addBox(root, "arenaArrivalPlaza", [42, 0.18, 7], [bx, 0.78, frontZ - 5.8], materials.stone);
    for (let n = 0; n < 3; n++) {
      addBox(root, "arenaEntryStep_" + n, [24, 0.18, 0.9], [bx, 0.78 + n * 0.16, frontZ - 2.1 + n * 0.8], materials.sidewalk);
    }
    for (const side of [-1, 1]) {
      addBox(root, "arenaEntryPlanter_" + side, [5.2, 0.75, 3.0], [bx + side * 18.5, 1.05, frontZ - 5.8], materials.planter);
      const shrub = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 6), materials.shrub);
      shrub.name = "arenaEntryShrub_" + side;
      shrub.position.set(bx + side * 18.5, 1.95, frontZ - 5.8);
      shrub.scale.set(1.45, 0.72, 0.95);
      root.add(shrub);
    }

    // Street furniture: restrained emissive fixtures avoid adding costly point lights.
    const lightPoints = [
      [westRoadX, southRoadZ], [eastRoadX, southRoadZ],
      [westRoadX, northRoadZ], [eastRoadX, northRoadZ],
      [originX - 20, southRoadZ - 7], [originX + 20, southRoadZ - 7],
      [originX - 20, northRoadZ + 7], [originX + 20, northRoadZ + 7]
    ];
    lightPoints.forEach((point, index) => addStreetLight(root, materials, "arenaBoulevardStreetLight_" + index, point[0], point[1], index % 2 ? Math.PI : 0));

    // Coastal landscaping frames the streets and keeps villa parcels legible.
    const treePoints = [
      [-88, 76, 0.95], [-88, 105, 1.0], [-88, 128, 0.9],
      [2, 76, 0.95], [2, 105, 1.0], [2, 128, 0.9],
      [-76, 141, 0.9], [-48, 141, 0.9], [-18, 141, 0.9]
    ];
    treePoints.forEach((point, index) => addTree(root, materials, "arenaDistrictTree_" + index, point[0], point[1], point[2]));

    // Eight low-rise villas remain outside the boulevard on west, north and east parcels.
    const collision = context.systems && context.systems.collision;
    const villaSpecs = [
      { x: -97, z: 78, facing: "west" },
      { x: -97, z: 112, facing: "west" },
      { x: 10, z: 78, facing: "east" },
      { x: 10, z: 112, facing: "east" },
      { x: -84, z: 148, facing: "north" },
      { x: -56, z: 148, facing: "north" },
      { x: -28, z: 148, facing: "north" },
      { x: 0, z: 148, facing: "north" }
    ];
    villaSpecs.forEach((spec, index) => addVilla(root, materials, collision, spec, index));

    // Collision follows only real architectural walls. Road surfaces and public plazas remain walkable.
    if (collision && typeof collision.registerBox === "function") {
      const wall = { minY: 0, maxY: 19.5, level: "arena-district" };
      collision.registerBox("arenaWestFacadeCollision", { x: leftX + 0.5, z: bz, width: 1.0, depth: CENTER.footprintDepth, ...wall });
      collision.registerBox("arenaEastFacadeCollision", { x: rightX - 0.5, z: bz, width: 1.0, depth: CENTER.footprintDepth, ...wall });
      collision.registerBox("arenaRearFacadeCollision", { x: bx, z: rearZ - 0.5, width: CENTER.footprintWidth, depth: 1.0, ...wall });
      collision.registerBox("arenaSouthFacadeWestCollision", { x: bx - 18.5, z: frontZ + 0.5, width: 17, depth: 1.0, ...wall });
      collision.registerBox("arenaSouthFacadeEastCollision", { x: bx + 18.5, z: frontZ + 0.5, width: 17, depth: 1.0, ...wall });
    }

    this._root = root;
  },

  update() {}
};
