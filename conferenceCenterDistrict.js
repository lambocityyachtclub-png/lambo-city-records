import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import CITY_MAP from "./cityMap.js";

// LAMBO CITY — Conference Center District
// Modular expansion north of the store-side boardwalk.
// Keeps the existing marina, dock approach, and boardwalk geometry intact.

const MAP = CITY_MAP.districts.conferenceCenter;
const DISTRICT = {
  roadX: MAP.accessRoadX,
  roadStartZ: MAP.accessRoadStartZ,
  roadEndZ: MAP.accessRoadEndZ,
  groundX: MAP.districtGround.centerX,
  groundZ: MAP.districtGround.centerZ,
  buildingX: MAP.centerX,
  buildingZ: MAP.centerZ
};

function makeSignTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#090b10";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#c6a45b";
  ctx.lineWidth = 8;
  ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#d9bd79";
  ctx.font = "600 58px Georgia, serif";
  ctx.fillText("LAMBO CITY", 512, 91);
  ctx.fillStyle = "#f4f0e7";
  ctx.font = "500 74px Georgia, serif";
  ctx.fillText("CONFERENCE CENTER", 512, 174);
  return new THREE.CanvasTexture(canvas);
}

function addBox(scene, name, size, position, material) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size[0], size[1], size[2]),
    material
  );
  mesh.name = name;
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

export default {
  init(scene, context = {}) {
    if (scene.getObjectByName("lamboCityConferenceCenterDistrict")) return;

    const root = new THREE.Group();
    root.name = "lamboCityConferenceCenterDistrict";
    scene.add(root);

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x342a22,
      roughness: 1
    });
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x17191d,
      roughness: 0.92
    });
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0xb8ad98,
      roughness: 0.78
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x10151c,
      roughness: 0.34,
      metalness: 0.48
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x78b9c8,
      roughness: 0.16,
      metalness: 0.28,
      transparent: true,
      opacity: 0.58
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xc6a45b,
      roughness: 0.28,
      metalness: 0.78,
      emissive: 0x38270b,
      emissiveIntensity: 0.32
    });
    const lightMat = new THREE.MeshStandardMaterial({
      color: 0xd8c18b,
      emissive: 0x8a6a2d,
      emissiveIntensity: 0.65,
      roughness: 0.3,
      metalness: 0.55
    });

    // New land pad beyond the existing boardwalk. It does not replace
    // or extend the original marina ground slabs.
    addBox(
      root,
      "conferenceDistrictGround",
      [54, 0.5, 62],
      [DISTRICT.groundX, 0.4, DISTRICT.groundZ],
      groundMat
    );

    // Continuous land connector: the old boardwalk land ends at Z=45
    // and the Conference Center district begins at Z=64. This apron joins
    // both land plates beneath the road so the approach is not suspended
    // over the ocean. Its 0.5-unit overlaps eliminate visible ground seams.
    addBox(
      root,
      "conferenceDistrictLandConnector",
      [54, 0.5, 19],
      [DISTRICT.groundX, 0.4, 54.5],
      groundMat
    );

    // Store-side access road: this joins the existing east-west boardwalk
    // street at Z=46 and continues onto the connected district land.
    addBox(
      root,
      "conferenceDistrictAccessRoad",
      [8, 0.18, DISTRICT.roadEndZ - DISTRICT.roadStartZ],
      [DISTRICT.roadX, 0.68, (DISTRICT.roadStartZ + DISTRICT.roadEndZ) / 2],
      roadMat
    );

    const laneMat = new THREE.MeshStandardMaterial({
      color: 0xe0bd69,
      emissive: 0x6a4b16,
      emissiveIntensity: 0.25
    });
    for (let z = 50; z <= 74; z += 8) {
      addBox(root, "conferenceRoadDash_" + z, [0.22, 0.035, 3.2], [DISTRICT.roadX, 0.79, z], laneMat);
    }

    // Continuous pedestrian sidewalks flank the new vehicle street.
    // They stay on the district land and lead toward the arrival plaza.
    addBox(root, "conferenceRoadSidewalkWest", [2.8, 0.14, 30], [DISTRICT.roadX - 7.5, 0.72, 65], stoneMat);
    addBox(root, "conferenceRoadSidewalkEast", [2.8, 0.14, 30], [DISTRICT.roadX + 7.5, 0.72, 65], stoneMat);

    // Curbs and a small arrival forecourt.
    addBox(root, "conferenceRoadCurbWest", [0.35, 0.24, 34], [DISTRICT.roadX - 4.15, 0.65, 63], stoneMat);
    addBox(root, "conferenceRoadCurbEast", [0.35, 0.24, 34], [DISTRICT.roadX + 4.15, 0.65, 63], stoneMat);
    addBox(root, "conferenceArrivalPlaza", [34, 0.24, 16], [-43, 0.66, 84], stoneMat);
    addBox(root, "conferenceEntryWalk", [8, 0.12, 7], [-43, 0.78, 78.5], darkMat);

    // Arrival marker: restrained stone piers and a gold lintel.
    addBox(root, "conferenceGateWest", [1.1, 5.5, 1.1], [-43 - 6.5, 3.4, 77], stoneMat);
    addBox(root, "conferenceGateEast", [1.1, 5.5, 1.1], [-43 + 6.5, 3.4, 77], stoneMat);
    addBox(root, "conferenceGateHeader", [14, 0.55, 1.1], [-43, 6.0, 77], goldMat);

    // Conference Center footprint: 26 x 22. The south-facing entrance
    // remains physically open; no monolithic wall blocks the doorway.
    const bx = DISTRICT.buildingX;
    const bz = DISTRICT.buildingZ;
    const frontZ = bz - 11;
    const rearZ = bz + 11;
    const leftX = bx - 13;
    const rightX = bx + 13;

    addBox(root, "conferenceCenterFoundation", [28, 0.55, 24], [bx, 0.9, bz], darkMat);
    addBox(root, "conferenceCenterWestWall", [1.1, 13, 22], [leftX + 0.55, 7.5, bz], stoneMat);
    addBox(root, "conferenceCenterEastWall", [1.1, 13, 22], [rightX - 0.55, 7.5, bz], stoneMat);
    addBox(root, "conferenceCenterRearWall", [26, 13, 1.1], [bx, 7.5, rearZ - 0.55], darkMat);

    // Front facade wings leave a generous central entrance.
    addBox(root, "conferenceCenterFrontWest", [8.5, 13, 1.1], [bx - 8.75, 7.5, frontZ + 0.55], darkMat);
    addBox(root, "conferenceCenterFrontEast", [8.5, 13, 1.1], [bx + 8.75, 7.5, frontZ + 0.55], darkMat);
    addBox(root, "conferenceCenterEntranceHeader", [9, 3.1, 1.1], [bx, 13.0, frontZ + 0.55], darkMat);

    // Tall glass lobby doors and side glazing.
    addBox(root, "conferenceCenterLobbyFloor", [17, 0.12, 15], [bx, 1.25, bz - 1.8], stoneMat);
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x172832,
      roughness: 0.12,
      metalness: 0.42,
      transparent: true,
      opacity: 0.78
    });
    addBox(root, "conferenceCenterDoorLeft", [3.0, 8.5, 0.18], [bx - 1.55, 5.7, frontZ + 0.12], doorMat);
    addBox(root, "conferenceCenterDoorRight", [3.0, 8.5, 0.18], [bx + 1.55, 5.7, frontZ + 0.12], doorMat);
    addBox(root, "conferenceCenterDoorMullion", [0.16, 8.5, 0.22], [bx, 5.7, frontZ + 0.04], goldMat);

    // Window bands on the side elevations.
    for (let level = 0; level < 3; level++) {
      const y = 4.0 + level * 4.0;
      addBox(root, "conferenceWindowWest_" + level, [0.08, 2.2, 13], [leftX + 1.13, y, bz - 1], glassMat);
      addBox(root, "conferenceWindowEast_" + level, [0.08, 2.2, 13], [rightX - 1.13, y, bz - 1], glassMat);
    }

    // Roof canopy, perimeter gold reveal, and front columns.
    addBox(root, "conferenceCenterRoof", [28, 0.85, 24], [bx, 14.35, bz], darkMat);
    addBox(root, "conferenceCenterRoofGoldLine", [28.2, 0.14, 24.2], [bx, 14.0, bz], goldMat);
    [-10.8, 10.8].forEach((offset, index) => {
      addBox(root, "conferenceFacadeColumn_" + index, [0.72, 12.8, 0.9], [bx + offset, 7.3, frontZ - 0.1], goldMat);
    });

    // Illuminated, legible facade sign. Canvas texture keeps this
    // self-contained and avoids external font or model dependencies.
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(17.5, 3.8, 0.35),
      new THREE.MeshStandardMaterial({
        map: makeSignTexture(),
        emissive: 0x3b2b10,
        emissiveIntensity: 0.4,
        metalness: 0.25,
        roughness: 0.4
      })
    );
    sign.name = "conferenceCenterFacadeSign";
    sign.position.set(bx, 17.0, frontZ - 0.05);
    root.add(sign);

    // Low-glow entry lighting uses emissive materials only (no new
    // point lights), keeping the district inexpensive on iPad.
    [-5.8, 5.8].forEach((offset, index) => {
      addBox(root, "conferenceEntrySconce_" + index, [0.22, 2.2, 0.25], [bx + offset, 6.1, frontZ - 0.24], lightMat);
    });

    // Landscaping frames the plaza without occupying the access lane.
    const planterMat = new THREE.MeshStandardMaterial({ color: 0x242629, roughness: 0.8 });
    const shrubMat = new THREE.MeshStandardMaterial({ color: 0x244b36, roughness: 0.95 });
    [-13, 13].forEach((offset, index) => {
      addBox(root, "conferencePlanter_" + index, [5.2, 0.65, 3.2], [bx + offset, 0.95, 83.5], planterMat);
      const shrub = new THREE.Mesh(new THREE.SphereGeometry(1.25, 8, 6), shrubMat);
      shrub.position.set(bx + offset, 2.0, 83.5);
      shrub.scale.set(1.5, 0.7, 1.0);
      shrub.name = "conferencePlanterShrub_" + index;
      root.add(shrub);
    });

    // Register only the architectural boundaries. The south entrance
    // is deliberately left open for player access.
    const collision = context.systems && context.systems.collision;
    if (collision && typeof collision.registerBox === "function") {
      const wallY = { minY: 0, maxY: 14.2, level: "conference-center" };
      collision.registerBox("conferenceCenterWestWall", {
        x: leftX + 0.55, z: bz, width: 1.1, depth: 22, ...wallY
      });
      collision.registerBox("conferenceCenterEastWall", {
        x: rightX - 0.55, z: bz, width: 1.1, depth: 22, ...wallY
      });
      collision.registerBox("conferenceCenterRearWall", {
        x: bx, z: rearZ - 0.55, width: 26, depth: 1.1, ...wallY
      });
      collision.registerBox("conferenceCenterFrontWest", {
        x: bx - 8.75, z: frontZ + 0.55, width: 8.5, depth: 1.1, ...wallY
      });
      collision.registerBox("conferenceCenterFrontEast", {
        x: bx + 8.75, z: frontZ + 0.55, width: 8.5, depth: 1.1, ...wallY
      });
    }

    this._root = root;
  },

  update() {}
};
