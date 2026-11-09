// LAMBO CITY — modular World System registry
// Validates and manages district definitions independently of the game engine.
// Nothing is built automatically at startup; callers explicitly request a build.

import { validateDistrict } from "./worldDistrictSchema.js";
import { buildDistrictGeometry } from "./worldBuilder.js";
import { findRoute as findDistrictRoute, findWorldRoute as findCityRoute } from "./worldNavigation.js";
import { sampleTerrainHeight } from "./worldTerrainBuilder.js";

export default class WorldSystem {
  constructor(options = {}) {
    this.options = options;
    this.districts = new Map();
    this.roots = new Map();
    this.connections = new Map();
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
    const externalMaterials = new Set(root.userData.externalMaterials || []);
    const disposedMaterials = new Set();
    root.traverse?.(object => {
      object.geometry?.dispose?.();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (!material || externalMaterials.has(material) || disposedMaterials.has(material)) continue;
        material.dispose?.();
        disposedMaterials.add(material);
      }
    });
    this.roots.delete(id);
    return true;
  }

  unregisterDistrict(id) {
    this.removeDistrict(id);
    for (const [connectionId, connection] of this.connections) {
      if (connection.from?.districtId === id || connection.to?.districtId === id) this.connections.delete(connectionId);
    }
    return this.districts.delete(id);
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

  registerConnection(connection) {
    if (!connection || typeof connection.id !== "string" || !connection.id.trim()) {
      return { registered: false, reason: "INVALID_CONNECTION_ID" };
    }
    if (this.connections.has(connection.id)) {
      return { registered: false, reason: "DUPLICATE_CONNECTION_ID" };
    }
    const fromDistrict = this.districts.get(connection.from?.districtId);
    const toDistrict = this.districts.get(connection.to?.districtId);
    const hasNode = (district, nodeId) =>
      !!district?.roadNetwork?.nodes?.some(node => node.id === nodeId);
    if (!hasNode(fromDistrict, connection.from?.nodeId) || !hasNode(toDistrict, connection.to?.nodeId)) {
      return { registered: false, reason: "UNKNOWN_CONNECTION_ENDPOINT" };
    }
    if (!["vehicle", "pedestrian", "shared", "service"].includes(connection.mode || "vehicle")) {
      return { registered: false, reason: "INVALID_CONNECTION_MODE" };
    }
    if (connection.access === "permission-controlled" &&
        (typeof connection.requiredAccess !== "string" || !connection.requiredAccess.trim())) {
      return { registered: false, reason: "MISSING_REQUIRED_ACCESS" };
    }
    if (connection.access === "permission-controlled") {
      const fromHasTier = (fromDistrict.accessTiers || []).some(tier => tier.id === connection.requiredAccess);
      const toHasTier = (toDistrict.accessTiers || []).some(tier => tier.id === connection.requiredAccess);
      if (!fromHasTier || !toHasTier) {
        return { registered: false, reason: "UNKNOWN_REQUIRED_ACCESS_TIER" };
      }
    }
    if (connection.access !== undefined && !["public", "permission-controlled", "closed"].includes(connection.access)) {
      return { registered: false, reason: "INVALID_CONNECTION_ACCESS" };
    }
    this.connections.set(connection.id, connection);
    return { registered: true, id: connection.id };
  }

  unregisterConnection(id) {
    return this.connections.delete(id);
  }

  findWorldRoute(fromDistrictId, fromNodeId, toDistrictId, toNodeId, routeOptions = {}) {
    return findCityRoute(
      Array.from(this.districts.entries()),
      Array.from(this.connections.values()),
      fromDistrictId,
      fromNodeId,
      toDistrictId,
      toNodeId,
      routeOptions
    );
  }

  getGroundHeight(id, x, z) {
    const district = this.districts.get(id);
    if (!district || !Number.isFinite(x) || !Number.isFinite(z)) return null;
    const root = this.roots.get(id);
    const groundY = Number.isFinite(root?.userData?.groundTopY)
      ? root.userData.groundTopY
      : (Number.isFinite(this.options.groundTopY) ? this.options.groundTopY : 0.64);
    return sampleTerrainHeight(district, x, z, groundY);
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
      builtDistricts: Array.from(this.roots.keys()),
      registeredConnections: Array.from(this.connections.keys())
    };
  }
}
