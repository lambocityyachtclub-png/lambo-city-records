// LAMBO CITY — modular World System registry
// Validates and manages district definitions independently of the game engine.
// Nothing is built automatically at startup; callers explicitly request a build.

import { validateDistrict } from "./worldDistrictSchema.js";
import { buildDistrictGeometry } from "./worldBuilder.js";
import { findRoute as findDistrictRoute } from "./worldNavigation.js";

export default class WorldSystem {
  constructor(options = {}) {
    this.options = options;
    this.districts = new Map();
    this.roots = new Map();
    this.scene = null;
    this.collision = null;
    this.protectedLandmarks = options.protectedLandmarks || [];
  }

  init(scene, context = {}) {
    this.scene = scene || null;
    this.collision = context.systems?.collision || this.options.collision || null;
    return this;
  }

  registerDistrict(district) {
    const result = validateDistrict(district, {
      protectedLandmarks: this.protectedLandmarks
    });
    if (!result.valid) {
      return { registered: false, validation: result };
    }
    if (this.districts.has(district.id)) {
      return {
        registered: false,
        validation: {
          valid: false,
          issues: [{ code: "DISTRICT_ALREADY_REGISTERED", message: "District is already registered: " + district.id, severity: "error" }]
        }
      };
    }
    this.districts.set(district.id, district);
    return { registered: true, validation: result };
  }

  buildDistrict(id, buildOptions = {}) {
    if (!this.scene) throw new Error("WorldSystem must be initialized with a scene before building.");
    const district = this.districts.get(id);
    if (!district) throw new Error("Unknown district: " + id);
    if (this.roots.has(id)) return this.roots.get(id);

    const root = buildDistrictGeometry(this.scene, district, {
      ...buildOptions,
      collision: buildOptions.collision || this.collision
    });
    this.roots.set(id, root);
    return root;
  }

  removeDistrict(id) {
    const root = this.roots.get(id);
    if (!root) return false;
    this.scene?.remove(root);
    for (const gate of root.userData.accessGates || []) gate.destroy?.();
    const collision = root.userData.collisionSystem || this.collision;
    if (collision && typeof collision.unregister === "function") {
      for (const name of root.userData.collisionIds || []) collision.unregister(name);
    }
    root.traverse?.(object => {
      if (object.geometry && object.geometry.dispose) object.geometry.dispose();
    });
    this.roots.delete(id);
    return true;
  }

  setGateAccess(id, gateId, permissions = []) {
    const root = this.roots.get(id);
    if (!root) return { updated: false, reason: "DISTRICT_NOT_BUILT" };
    const gate = (root.userData.accessGates || []).find(item => item.id === gateId);
    if (!gate) return { updated: false, reason: "UNKNOWN_GATE" };
    return { updated: true, gate: gate.setPermissions(permissions) };
  }

  getGateStatuses(id) {
    const root = this.roots.get(id);
    if (!root) return [];
    return (root.userData.accessGates || []).map(gate => gate.getStatus());
  }

  findRoute(id, fromNodeId, toNodeId, routeOptions = {}) {
    const district = this.districts.get(id);
    if (!district) {
      return { found: false, reason: "UNKNOWN_DISTRICT", nodeIds: [], segmentIds: [], distance: 0 };
    }
    return findDistrictRoute(district, fromNodeId, toNodeId, routeOptions);
  }

  getDistrictIds() {
    return Array.from(this.districts.keys());
  }

  getStatus() {
    return {
      registeredDistricts: this.getDistrictIds(),
      builtDistricts: Array.from(this.roots.keys())
    };
  }
}
