// LAMBO CITY — distance-based district streaming and LOD
// Shared world, marina, collision, and navigation stay active.
// The Arena District swaps between detailed visuals, a lightweight far
// proxy, and hidden distant visuals. Geometry remains allocated in this
// first safe phase; collision is never disabled by visual streaming.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import CITY_MAP from "./cityMap.js";

const ARENA_ROOT_NAME = "lamboCityConferenceCenterDistrict";
const STREAM_IN_RADIUS = 250;
const STREAM_OUT_RADIUS = 285;
const DETAIL_IN_RADIUS = 125;
const DETAIL_OUT_RADIUS = 145;

function addProxyBox(root, name, size, position, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  root.add(mesh);
}

function buildArenaProxy(scene) {
  const plan = CITY_MAP.districts.arenaDistrict;
  const arena = plan.arena;
  const boulevard = plan.boulevard;
  const cx = arena.centerX;
  const cz = arena.centerZ;
  const halfW = boulevard.outerWidth / 2;
  const halfD = boulevard.outerDepth / 2;
  const westX = cx - halfW;
  const eastX = cx + halfW;
  const southZ = cz - halfD;
  const northZ = cz + halfD;

  const root = new THREE.Group();
  root.name = "lamboCityArenaFarLOD";
  root.visible = false;
  scene.add(root);

  const land = new THREE.MeshBasicMaterial({ color: 0x39332b });
  const road = new THREE.MeshBasicMaterial({ color: 0x15191f });
  const arenaBody = new THREE.MeshBasicMaterial({ color: 0x202a34 });
  const roof = new THREE.MeshBasicMaterial({ color: 0xc7a45b });
  const villas = new THREE.MeshBasicMaterial({ color: 0xb9ad98 });

  addProxyBox(root, "arenaLODGround",
    [plan.ground.width, 0.35, plan.ground.depth],
    [plan.ground.centerX, 0.67, plan.ground.centerZ], land);

  const roadY = 0.83;
  addProxyBox(root, "arenaLODSouthRoad",
    [boulevard.outerWidth + boulevard.roadWidth, 0.12, boulevard.roadWidth],
    [cx, roadY, southZ], road);
  addProxyBox(root, "arenaLODNorthRoad",
    [boulevard.outerWidth + boulevard.roadWidth, 0.12, boulevard.roadWidth],
    [cx, roadY, northZ], road);
  addProxyBox(root, "arenaLODWestRoad",
    [boulevard.roadWidth, 0.12, boulevard.outerDepth],
    [westX, roadY, cz], road);
  addProxyBox(root, "arenaLODEastRoad",
    [boulevard.roadWidth, 0.12, boulevard.outerDepth],
    [eastX, roadY, cz], road);

  const sidewalk = new THREE.MeshBasicMaterial({ color: 0xb9ad98 });
  const sw = boulevard.sidewalkWidth;
  const sideOffset = boulevard.roadWidth / 2 + sw / 2;
  addProxyBox(root, "arenaLODSouthSidewalk",
    [boulevard.outerWidth + boulevard.roadWidth + sw * 2, 0.12, sw],
    [cx, roadY, southZ - sideOffset], sidewalk);
  addProxyBox(root, "arenaLODNorthSidewalk",
    [boulevard.outerWidth + boulevard.roadWidth + sw * 2, 0.12, sw],
    [cx, roadY, northZ + sideOffset], sidewalk);
  addProxyBox(root, "arenaLODWestSidewalk",
    [sw, 0.12, boulevard.outerDepth + boulevard.roadWidth + sw * 2],
    [westX - sideOffset, roadY, cz], sidewalk);
  addProxyBox(root, "arenaLODEastSidewalk",
    [sw, 0.12, boulevard.outerDepth + boulevard.roadWidth + sw * 2],
    [eastX + sideOffset, roadY, cz], sidewalk);

  const access = CITY_MAP.districts.conferenceCenter;
  const approachEnd = cz - arena.footprintDepth / 2 - 1;
  addProxyBox(root, "arenaLODAccessRoad",
    [8, 0.12, approachEnd - access.accessRoadStartZ],
    [access.accessRoadX, roadY, (access.accessRoadStartZ + approachEnd) / 2], road);
  const plaza = new THREE.MeshBasicMaterial({ color: 0xaaa18e });
  addProxyBox(root, "arenaLODArrivalPlaza",
    [30, 0.16, 13],
    [cx, roadY + 0.02, cz - arena.footprintDepth / 2 - 5.5], plaza);

  addProxyBox(root, "arenaLODBuildingMass",
    [arena.footprintWidth, 21, arena.footprintDepth],
    [cx, 11.5, cz], arenaBody);
  addProxyBox(root, "arenaLODRoof",
    [arena.footprintWidth + 5, 1.4, arena.footprintDepth + 5],
    [cx, 22.8, cz], roof);

  // Six simplified parcel masses preserve the district silhouette.
  [
    [-98.5, 80], [-98.5, 112],
    [12.5, 80], [12.5, 112],
    [-58, 148], [-28, 148]
  ].forEach(([x, z], index) => {
    addProxyBox(root, "arenaLODVilla_" + index,
      [12.5, 9, 10.5], [x, 5.2, z], villas);
  });

  return root;
}

export default {
  init(scene) {
    this._scene = scene;
    this._arenaRoot = scene?.getObjectByName(ARENA_ROOT_NAME) || null;
    this._proxyRoot = scene ? buildArenaProxy(scene) : null;
    this._arenaActive = true;
    this._detailed = true;

    const arena = CITY_MAP.districts.arenaDistrict.arena;
    this._arenaCenter = { x: arena.centerX, z: arena.centerZ };

    if (this._arenaRoot) this._arenaRoot.visible = true;
    if (this._proxyRoot) this._proxyRoot.visible = false;
  },

  update(delta, context) {
    if (!this._arenaRoot) {
      this._arenaRoot = this._scene?.getObjectByName(ARENA_ROOT_NAME) || null;
      if (!this._arenaRoot) return;
    }

    const player = context?.player;
    if (!player?.position) return;

    const dx = player.position.x - this._arenaCenter.x;
    const dz = player.position.z - this._arenaCenter.z;
    const distanceSq = dx * dx + dz * dz;

    // Separate enter/exit radii prevent flicker at both transitions.
    const nextActive = this._arenaActive
      ? distanceSq <= STREAM_OUT_RADIUS * STREAM_OUT_RADIUS
      : distanceSq <= STREAM_IN_RADIUS * STREAM_IN_RADIUS;

    const nextDetailed = this._detailed
      ? distanceSq <= DETAIL_OUT_RADIUS * DETAIL_OUT_RADIUS
      : distanceSq <= DETAIL_IN_RADIUS * DETAIL_IN_RADIUS;

    this._arenaActive = nextActive;
    this._detailed = nextActive && nextDetailed;

    // Collision remains registered regardless of visual representation.
    this._arenaRoot.visible = this._detailed;
    if (this._proxyRoot) {
      this._proxyRoot.visible = this._arenaActive && !this._detailed;
    }
  },

  getStatus() {
    return {
      arenaActive: this._arenaActive,
      arenaDetailed: this._detailed,
      farLodVisible: !!this._proxyRoot?.visible,
      detailEnterRadius: DETAIL_IN_RADIUS,
      detailExitRadius: DETAIL_OUT_RADIUS,
      streamEnterRadius: STREAM_IN_RADIUS,
      streamExitRadius: STREAM_OUT_RADIUS
    };
  }
};
