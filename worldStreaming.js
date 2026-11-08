// LAMBO CITY — lightweight district visibility streaming
// Keeps the shared world, marina, collision, and navigation systems alive.
// Only the self-contained Arena District visual root is distance-culled.
// This first phase intentionally retains geometry in memory; it avoids
// unsafe disposal/rebuild cycles until district ownership is fully split.

import CITY_MAP from "./cityMap.js";

const ARENA_ROOT_NAME = "lamboCityConferenceCenterDistrict";
const LOAD_RADIUS = 250;
const UNLOAD_RADIUS = 285;
const LOAD_RADIUS_SQ = LOAD_RADIUS * LOAD_RADIUS;
const UNLOAD_RADIUS_SQ = UNLOAD_RADIUS * UNLOAD_RADIUS;

export default {
  init(scene) {
    this._scene = scene;
    this._arenaRoot = scene?.getObjectByName(ARENA_ROOT_NAME) || null;
    this._arenaVisible = true;

    // Keep thresholds tied to the master map rather than guessed locations.
    this._arenaCenter = {
      x: CITY_MAP.districts.arenaDistrict.arena.centerX,
      z: CITY_MAP.districts.arenaDistrict.arena.centerZ
    };

    if (this._arenaRoot) this._arenaRoot.visible = true;
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

    // Hysteresis prevents rapid show/hide flicker at the district edge.
    const shouldBeVisible = this._arenaVisible
      ? distanceSq <= UNLOAD_RADIUS_SQ
      : distanceSq <= LOAD_RADIUS_SQ;

    if (shouldBeVisible !== this._arenaVisible) {
      this._arenaVisible = shouldBeVisible;
      this._arenaRoot.visible = shouldBeVisible;
    }
  },

  getStatus() {
    return {
      arenaVisible: this._arenaVisible,
      loadRadius: LOAD_RADIUS,
      unloadRadius: UNLOAD_RADIUS
    };
  }
};
