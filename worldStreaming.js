// LAMBO CITY — distance-based district streaming and LOD
// Shared world, marina, collision, and navigation stay active.
// The Arena District swaps between detailed visuals, a lightweight far
// proxy, and hidden distant visuals. Geometry remains allocated in this
// first safe phase; collision is never disabled by visual streaming.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import CITY_MAP from "./cityMap.js";

const ARENA_ROOT_NAME = "lamboCityConferenceCenterLandmark";
const STREAM_IN_RADIUS = 900;
const STREAM_OUT_RADIUS = 1000;
const DETAIL_IN_RADIUS = 30;
const DETAIL_OUT_RADIUS = 45;

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
  const cx = arena.centerX;
  const cz = arena.centerZ;
  const root = new THREE.Group();
  root.name = "lamboCityArenaFarLOD";
  root.visible = false;
  scene.add(root);

  // The World System supplies the distant road, terrain, and villa proxy.
  // This small companion proxy represents only the protected arena landmark.
  const arenaBody = new THREE.MeshBasicMaterial({ color: 0x202a34 });
  const roof = new THREE.MeshBasicMaterial({ color: 0xc7a45b });
  addProxyBox(root, "arenaLODBuildingMass",
    [arena.footprintWidth, 21, arena.footprintDepth],
    [cx, 11.5, cz], arenaBody);
  addProxyBox(root, "arenaLODRoof",
    [arena.footprintWidth + 5, 1.4, arena.footprintDepth + 5],
    [cx, 22.8, cz], roof);
  return root;
}
export default {
  init(scene) {
    this._scene = scene;
    this._arenaRoot = scene?.getObjectByName(ARENA_ROOT_NAME) || null;
    this._proxyRoot = scene ? buildArenaProxy(scene) : null;
    this._arenaActive = false;
    this._detailed = false;

    this._arenaBounds = CITY_MAP.districts.arenaDistrict.bounds;

    if (this._arenaRoot) this._arenaRoot.visible = false;
    if (this._proxyRoot) this._proxyRoot.visible = false;
  },

  update(delta, context) {
    if (!this._arenaRoot) {
      this._arenaRoot = this._scene?.getObjectByName(ARENA_ROOT_NAME) || null;
      if (!this._arenaRoot) return;
    }

    const player = context?.player;
    if (!player?.position) return;

    const bounds = this._arenaBounds;
    const dx = Math.max(bounds.minX - player.position.x, 0, player.position.x - bounds.maxX);
    const dz = Math.max(bounds.minZ - player.position.z, 0, player.position.z - bounds.maxZ);
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
