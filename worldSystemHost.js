// LAMBO CITY — lazy host bridge for generated districts.
// The host is registered with the engine but does no world work until explicitly initialized.
import WorldSystemRuntime from "./worldSystemRuntime.js";

export function createWorldSystemHost({ createRuntime = () => new WorldSystemRuntime() } = {}) {
  let scene = null;
  let context = null;
  let runtime = null;
  let initialization = null;
  let generation = 0;

  const host = {
    init(activeScene, activeContext = {}) {
      const nextScene = activeScene || null;
      if (scene !== nextScene) {
        generation += 1;
        runtime?.dispose();
        runtime = null;
        initialization = null;
      }
      scene = nextScene;
      context = activeContext || {};
      if (typeof window !== "undefined") {
        window.__lamboCityWorldSystem = this.api;
      }
      return this;
    },

    initialize(configuration = {}) {
      if (runtime?.ready) return Promise.resolve(runtime);
      if (initialization) return initialization;
      if (!scene || typeof scene.add !== "function") {
        return Promise.reject(new Error("LAMBO CITY World System host needs the initialized game scene."));
      }

      const activeScene = scene;
      const activeContext = context;
      const activeGeneration = generation;
      const candidate = createRuntime();
      let pending;
      pending = Promise.resolve(candidate.init(activeScene, activeContext, configuration))
        .then(() => {
          if (activeGeneration !== generation || scene !== activeScene) {
            candidate.dispose();
            throw new Error("LAMBO CITY World System initialization was cancelled.");
          }
          runtime = candidate;
          return runtime;
        })
        .catch(error => {
          candidate.dispose();
          if (activeGeneration === generation && runtime === candidate) runtime = null;
          throw error;
        })
        .finally(() => {
          if (initialization === pending) initialization = null;
        });
      initialization = pending;
      return pending;
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

    getGateStatuses(districtId) {
      return runtime?.ready ? runtime.getGateStatuses(districtId) : [];
    },

    getOpenGateIds(districtId) {
      return runtime?.ready ? runtime.getOpenGateIds(districtId) : [];
    },

    setGateAccess(districtId, gateId, permissions = []) {
      return runtime?.ready ? runtime.setGateAccess(districtId, gateId, permissions) : false;
    },

    getGroundHeightAt(x, z) {
      return runtime?.ready ? runtime.getGroundHeightAt(x, z) : null;
    },

    getVehicleRoadSurfaceAt(districtId, point, options = {}) {
      return runtime?.ready ? runtime.getVehicleRoadSurfaceAt(districtId, point, options) : null;
    },

    isVehicleFootprintOnRoad(districtId, vehicle, options = {}) {
      return runtime?.ready && runtime.isVehicleFootprintOnRoad(districtId, vehicle, options);
    },

    isVehicleMoveOnRoad(districtId, current, next, options = {}) {
      return runtime?.ready && runtime.isVehicleMoveOnRoad(districtId, current, next, options);
    },

    createVehicleController(districtId, initialState = {}, options = {}) {
      return runtime?.ready ? runtime.createVehicleController(districtId, initialState, options) : null;
    },

    buildVehicleUTurnPath(districtId, nodeId, vehicle = {}, options = {}) {
      return runtime?.ready
        ? runtime.buildVehicleUTurnPath(districtId, nodeId, vehicle, options)
        : { valid: false, reason: "NOT_READY", points: [] };
    },

    getVehicleTurnSpace(vehicle = {}) {
      return runtime?.ready ? runtime.getVehicleTurnSpace(vehicle) : null;
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
      generation += 1;
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
    getGateStatuses: districtId => host.getGateStatuses(districtId),
    getOpenGateIds: districtId => host.getOpenGateIds(districtId),
    setGateAccess: (districtId, gateId, permissions) => host.setGateAccess(districtId, gateId, permissions),
    getGroundHeightAt: (x, z) => host.getGroundHeightAt(x, z),
    getVehicleRoadSurfaceAt: (districtId, point, options) => host.getVehicleRoadSurfaceAt(districtId, point, options),
    isVehicleFootprintOnRoad: (districtId, vehicle, options) => host.isVehicleFootprintOnRoad(districtId, vehicle, options),
    isVehicleMoveOnRoad: (districtId, current, next, options) => host.isVehicleMoveOnRoad(districtId, current, next, options),
    createVehicleController: (districtId, initialState, options) => host.createVehicleController(districtId, initialState, options),
    buildVehicleUTurnPath: (districtId, nodeId, vehicle, options) => host.buildVehicleUTurnPath(districtId, nodeId, vehicle, options),
    getVehicleTurnSpace: vehicle => host.getVehicleTurnSpace(vehicle),
    getStatus: () => host.getStatus(),
    unregisterDistrict: id => host.unregisterDistrict(id),
    dispose: () => host.dispose()
  });

  return host;
}

const host = createWorldSystemHost();
export default host;
