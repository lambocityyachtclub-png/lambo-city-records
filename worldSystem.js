// LAMBO CITY — modular World System registry
// Validates and manages district definitions independently of the game engine.
// Nothing is built automatically at startup; callers explicitly request a build.

import { validateDistrict } from "./worldDistrictSchema.js";
import { buildDistrictGeometry, updateDistrictParcelFocus } from "./worldBuilder.js";
import { buildDistrictProxy, disposeDistrictProxy } from "./worldDistrictProxyBuilder.js";
import { findRoute as findDistrictRoute, findWorldRoute as findCityRoute } from "./worldNavigation.js";
import { sampleTerrainHeight, sampleRoadSurfaceHeight } from "./worldTerrainMath.js";
import { buildPhysicalConnection, disposePhysicalConnection } from "./worldConnectionBuilder.js";

export default class WorldSystem {
  constructor(options = {}) {
    this.options = options;
    this.districts = new Map();
    this.roots = new Map();
    this.proxyRoots = new Map();
    this.connections = new Map();
    this.connectionRoots = new Map();
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
    if (this.roots.has(id)) {
      this.removeDistrictProxy(id);
      return this.roots.get(id);
    }

    const root = buildDistrictGeometry(this.scene, district, {
      ...buildOptions,
      collision: buildOptions.collision || this.collision
    });
    this.roots.set(id, root);
    this.removeDistrictProxy(id);
    return root;
  }

  updateDistrictDetailFocus(id, position, options = {}) {
    const root = this.roots.get(id);
    const district = this.districts.get(id);
    if (!root || !district) return false;
    return updateDistrictParcelFocus(root, district, position, options);
  }

  buildDistrictProxy(id, proxyOptions = {}) {
    if (!this.scene) throw new Error("WorldSystem must be initialized with a scene before building proxies.");
    const district = this.districts.get(id);
    if (!district) throw new Error("Unknown district: " + id);
    if (this.proxyRoots.has(id)) return this.proxyRoots.get(id);
    const root = buildDistrictProxy(this.scene, district, {
      groundTopY: Number.isFinite(this.options.groundTopY) ? this.options.groundTopY :
        (Number.isFinite(district.groundTopY) ? district.groundTopY : 0.64),
      ...proxyOptions
    });
    if (root) this.proxyRoots.set(id, root);
    return root;
  }

  removeDistrictProxy(id) {
    const root = this.proxyRoots.get(id);
    if (!root) return false;
    disposeDistrictProxy(this.scene, root);
    this.proxyRoots.delete(id);
    return true;
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
    for (const material of root.userData.ownedMaterials || []) {
      if (!material || externalMaterials.has(material) || disposedMaterials.has(material)) continue;
      material.dispose?.();
      disposedMaterials.add(material);
    }
    this.roots.delete(id);
    return true;
  }

  unregisterDistrict(id) {
    this.removeDistrict(id);
    this.removeDistrictProxy(id);
    for (const [connectionId, connection] of this.connections) {
      if (connection.from?.districtId === id || connection.to?.districtId === id) {
        this.unregisterConnection(connectionId);
      }
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
    let connectorRoot = null;
    if (connection.physical?.enabled === true) {
      if (!this.scene) return { registered: false, reason: "SCENE_NOT_INITIALIZED" };
      const fromNode = fromDistrict.roadNetwork.nodes.find(node => node.id === connection.from.nodeId);
      const toNode = toDistrict.roadNetwork.nodes.find(node => node.id === connection.to.nodeId);
      try {
        connectorRoot = buildPhysicalConnection(this.scene, connection, fromNode, toNode);
      } catch (error) {
        return { registered: false, reason: String(error?.message || error) };
      }
    }
    this.connections.set(connection.id, connection);
    if (connectorRoot) this.connectionRoots.set(connection.id, connectorRoot);
    return {
      registered: true,
      id: connection.id,
      physical: !!connectorRoot
    };
  }

  unregisterConnection(id) {
    const registered = this.connections.delete(id);
    const root = this.connectionRoots.get(id);
    if (root) disposePhysicalConnection(this.scene, root);
    this.connectionRoots.delete(id);
    return registered;
  }

  findWorldRoute(fromDistrictId, fromNodeId, toDistrictId, toNodeId, routeOptions = {}) {
    return findCityRoute(
      Array.from(this.districts.entries()),
      Array.from(this.connections.values()),
      fromDistrictId,
      fromNodeId,
      toDistrictId,
      toNodeId,
      { ...routeOptions, openGates: this.getOpenGateKeys() }
    );
  }

  getDistrictAtPosition(x, z) {
    if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
    let match = null;
    let matchArea = Infinity;
    for (const district of this.districts.values()) {
      const bounds = district?.bounds;
      if (!bounds || x < bounds.minX || x > bounds.maxX || z < bounds.minZ || z > bounds.maxZ) continue;
      const area = (bounds.maxX - bounds.minX) * (bounds.maxZ - bounds.minZ);
      if (area < matchArea) {
        match = district;
        matchArea = area;
      }
    }
    return match;
  }

  getGroundHeightAt(x, z) {
    if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
    const district = this.getDistrictAtPosition(x, z);
    if (district) return this.getGroundHeight(district.id, x, z);
    return this.getPhysicalConnectionHeightAt(x, z);
  }

  getPhysicalConnectionHeightAt(x, z) {
    let onRoad = false;
    let onSidewalk = false;
    let roadHeight = 0.77;
    let sidewalkHeight = 0.82;

    for (const connection of this.connections.values()) {
      const physical = connection?.physical;
      if (physical?.enabled !== true || physical.surface !== "land" ||
          physical.surfaceVerified !== true || !Array.isArray(physical.path)) continue;
      const mode = connection.mode || "vehicle";
      const width = Number.isFinite(physical.width) ? physical.width : 9;
      const roadWidth = mode === "pedestrian" ? Math.min(width, 6) : width;
      const sidewalkWidth = Number.isFinite(physical.sidewalkWidth) ? physical.sidewalkWidth : 3;
      const currentRoadHeight = Number.isFinite(physical.roadTopY) ? physical.roadTopY : 0.77;
      const currentSidewalkHeight = Number.isFinite(physical.sidewalkTopY)
        ? physical.sidewalkTopY : currentRoadHeight + 0.05;
      for (let index = 0; index < physical.path.length - 1; index++) {
        const from = physical.path[index], to = physical.path[index + 1];
        const dx = to.x - from.x, dz = to.z - from.z;
        const lengthSquared = dx * dx + dz * dz;
        if (lengthSquared <= 0) continue;
        const t = ((x - from.x) * dx + (z - from.z) * dz) / lengthSquared;
        if (t < 0 || t > 1) continue;
        const nearestX = from.x + t * dx;
        const nearestZ = from.z + t * dz;
        const distance = Math.hypot(x - nearestX, z - nearestZ);
        if (distance <= roadWidth / 2) {
          onRoad = true;
          roadHeight = currentRoadHeight;
        } else if (mode !== "pedestrian" && physical.sidewalks !== false &&
                   sidewalkWidth > 0 && distance <= roadWidth / 2 + sidewalkWidth) {
          onSidewalk = true;
          sidewalkHeight = currentSidewalkHeight;
        }
      }
    }
    return onRoad ? roadHeight : (onSidewalk ? sidewalkHeight : null);
  }

  getGroundHeight(id, x, z) {
    const district = this.districts.get(id);
    if (!district || !Number.isFinite(x) || !Number.isFinite(z)) return null;
    const root = this.roots.get(id);
    const groundY = Number.isFinite(root?.userData?.groundTopY)
      ? root.userData.groundTopY
      : (Number.isFinite(this.options.groundTopY) ? this.options.groundTopY :
        (Number.isFinite(district.groundTopY) ? district.groundTopY : 0.64));
    const surfaceOptions = root?.userData?.surfaceHeights || {
      roadTopY: Number.isFinite(this.options.roadTopY) ? this.options.roadTopY : 0.77,
      sidewalkTopY: Number.isFinite(this.options.sidewalkTopY)
        ? this.options.sidewalkTopY
        : (Number.isFinite(this.options.roadTopY) ? this.options.roadTopY : 0.77) + 0.03,
      roadWidth: Number.isFinite(this.options.roadWidth) ? this.options.roadWidth : 9,
      sidewalkWidth: Number.isFinite(district.roadNetwork?.sidewalkWidth)
        ? district.roadNetwork.sidewalkWidth : 3,
      buildSidewalks: true
    };
    const roadHeight = sampleRoadSurfaceHeight(district, x, z, surfaceOptions);
    return roadHeight === null
      ? sampleTerrainHeight(district, x, z, groundY)
      : roadHeight;
  }

  getOpenGateKeys() {
    const openGates = new Set();
    for (const [districtId, district] of this.districts) {
      const statuses = new Map(
        (this.roots.get(districtId)?.userData.accessGates || [])
          .map(gate => [gate.id, gate.getStatus().open === true])
      );
      for (const segment of district?.roadNetwork?.segments || []) {
        if (segment.gate && statuses.get(segment.gate.id) === true) {
          openGates.add(JSON.stringify([districtId, segment.gate.id]));
        }
      }
    }
    return openGates;
  }

  findRoute(id, fromNodeId, toNodeId, routeOptions = {}) {
    const district = this.districts.get(id);
    if (!district) {
      return { found: false, reason: "UNKNOWN_DISTRICT", nodeIds: [], segmentIds: [], distance: 0 };
    }
    return findDistrictRoute(district, fromNodeId, toNodeId, {
      ...routeOptions,
      openGates: this.getOpenGateKeys()
    });
  }

  getDistrict(id) {
    return this.districts.get(id) || null;
  }

  getDistrictBuildStats(id) {
    const root = this.roots.get(id);
    if (!root) return null;
    return {
      roadCount: root.userData.roadCount || 0,
      roadInstanceCount: root.userData.roadInstanceCount || 0,
      junctionCount: root.userData.junctionCount || 0,
      sidewalkCount: root.userData.sidewalkCount || 0,
      terrainSegmentsX: root.userData.terrainSegmentsX || 0,
      terrainSegmentsZ: root.userData.terrainSegmentsZ || 0,
      terrainVertexCount: root.userData.terrainVertexCount || 0,
      terrainTriangleCount: root.userData.terrainTriangleCount || 0,
      parcelCount: root.userData.parcelCount || 0,
      buildingCount: root.userData.buildingCount || 0,
      detailParcelCount: root.userData.detailParcelCount || 0,
      detailBatchCount: root.userData.detailBatchCount || 0,
      detailSourceMeshCount: root.userData.detailSourceMeshCount || 0,
      proxyParcelCount: root.userData.proxyParcelCount || 0,
      proxyBatchCount: root.userData.proxyBatchCount || 0,
      detailParcelIds: [...(root.userData.detailParcelIds || [])],
      parcelFocusPosition: root.userData.parcelFocusPosition
        ? { ...root.userData.parcelFocusPosition } : null
    };
  }


  isDistrictBuilt(id) {
    return this.roots.has(id);
  }

  isDistrictProxied(id) {
    return this.proxyRoots.has(id);
  }

  getDistrictIds() {
    return Array.from(this.districts.keys());
  }

  getStatus() {
    return {
      registeredDistricts: this.getDistrictIds(),
      builtDistricts: Array.from(this.roots.keys()),
      proxiedDistricts: Array.from(this.proxyRoots.keys()),
      registeredConnections: Array.from(this.connections.keys())
    };
  }
}
