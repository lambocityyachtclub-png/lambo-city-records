// LAMBO CITY — lazy host bridge for generated districts
// The host is registered with the engine but does no world work at startup.
// A future city-building interface can explicitly initialize and populate it.
import WorldSystemRuntime from "./worldSystemRuntime.js";

let scene = null;
let context = null;
let runtime = null;
let initialization = null;

const host = {
  init(activeScene, activeContext = {}) {
    scene = activeScene || null;
    context = activeContext || {};
    if (typeof window !== "undefined") {
      window.__lamboCityWorldSystem = this.api;
    }
    return this;
  },

  async initialize(configuration = {}) {
    if (runtime?.ready) return runtime;
    if (initialization) return initialization;
    if (!scene || typeof scene.add !== "function") {
      throw new Error("LAMBO CITY World System host needs the initialized game scene.");
    }

    const candidate = new WorldSystemRuntime();
    initialization = candidate.init(scene, context, configuration)
      .then(() => {
        runtime = candidate;
        return runtime;
      })
      .catch(error => {
        candidate.dispose();
        runtime = null;
        throw error;
      })
      .finally(() => {
        initialization = null;
      });
    return initialization;
  },

  isReady() {
    return !!runtime?.ready;
  },

  getRuntime() {
    return runtime;
  },

  registerDistrict(districtOrRecipe, options = {}) {
    if (!runtime?.ready) return { registered: false, reason: "NOT_INITIALIZED" };
    return runtime.registerDistrict(districtOrRecipe, options);
  },

  registerConnection(connection) {
    if (!runtime?.ready) return { registered: false, reason: "NOT_INITIALIZED" };
    return runtime.registerConnection(connection);
  },

  buildDistrict(id, options = {}) {
    const world = runtime?.ready ? runtime.getWorldSystem() : null;
    if (!world) throw new Error("Initialize the LAMBO CITY World System before building a district.");
    return world.buildDistrict(id, options);
  },

  findRoute(districtId, fromNodeId, toNodeId, options = {}) {
    const world = runtime?.ready ? runtime.getWorldSystem() : null;
    return world
      ? world.findRoute(districtId, fromNodeId, toNodeId, options)
      : { found: false, reason: "NOT_INITIALIZED", nodeIds: [], segmentIds: [], distance: 0 };
  },

  findWorldRoute(fromDistrictId, fromNodeId, toDistrictId, toNodeId, options = {}) {
    return runtime
      ? runtime.findWorldRoute(fromDistrictId, fromNodeId, toDistrictId, toNodeId, options)
      : { found: false, reason: "NOT_INITIALIZED", nodes: [], steps: [], distance: 0 };
  },

  setGateAccess(districtId, gateId, permissions = []) {
    return runtime?.ready
      ? runtime.setGateAccess(districtId, gateId, permissions)
      : false;
  },

  getGroundHeightAt(x, z) {
    return runtime?.ready ? runtime.getGroundHeightAt(x, z) : null;
  },

  getStatus() {
    return runtime?.getStatus() || {
      ready: false,
      registeredDistrictIds: [],
      registeredDistricts: [],
      builtDistricts: [],
      proxiedDistricts: [],
      registeredConnections: []
    };
  },

  unregisterDistrict(id) {
    return runtime?.ready ? runtime.unregisterDistrict(id) : false;
  },

  dispose() {
    runtime?.dispose();
    runtime = null;
    initialization = null;
  },

  update(delta, activeContext = {}) {
    if (runtime?.ready) runtime.update(delta, activeContext);
  }
};

host.api = Object.freeze({
  initialize: configuration => host.initialize(configuration),
  isReady: () => host.isReady(),
  registerDistrict: (districtOrRecipe, options) => host.registerDistrict(districtOrRecipe, options),
  registerConnection: connection => host.registerConnection(connection),
  buildDistrict: (id, options) => host.buildDistrict(id, options),
  findRoute: (districtId, fromNodeId, toNodeId, options) => host.findRoute(districtId, fromNodeId, toNodeId, options),
  findWorldRoute: (fromDistrictId, fromNodeId, toDistrictId, toNodeId, options) =>
    host.findWorldRoute(fromDistrictId, fromNodeId, toDistrictId, toNodeId, options),
  setGateAccess: (districtId, gateId, permissions) => host.setGateAccess(districtId, gateId, permissions),
  getGroundHeightAt: (x, z) => host.getGroundHeightAt(x, z),
  getStatus: () => host.getStatus(),
  unregisterDistrict: id => host.unregisterDistrict(id),
  dispose: () => host.dispose()
});

export default host;
