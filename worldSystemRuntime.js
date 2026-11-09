// LAMBO CITY — lazy runtime bridge for engine integration
// Nothing loads or builds until init() is explicitly called by the host game.
export default class WorldSystemRuntime {
  constructor(options = {}) {
    this.options = options;
    this.worldSystem = null;
    this.streaming = null;
    this.registeredDistrictIds = [];
    this.createDistrictFromRecipe = null;
    this.ready = false;
  }

  async init(scene, context = {}, configuration = {}) {
    if (this.ready) return this;
    if (!scene || typeof scene.add !== "function") {
      throw new Error("WorldSystemRuntime needs a live Three.js scene.");
    }

    const [
      { default: WorldSystem },
      { default: WorldDistrictStreaming },
      { createDistrictFromRecipe }
    ] = await Promise.all([
      import("./worldSystem.js"),
      import("./worldDistrictStreaming.js"),
      import("./worldDistrictFactory.js")
    ]);

    this.createDistrictFromRecipe = createDistrictFromRecipe;
    this.worldSystem = new WorldSystem(configuration.worldOptions || this.options.worldOptions || {});

    try {
      this.worldSystem.init(scene, context);
      for (const item of configuration.districts || []) {
        const isRecipe = item && (item.roadLayout === "grid" || item.roadGrid || item.roadLoop);
        const district = isRecipe ? createDistrictFromRecipe(item) : item;
        const result = this.worldSystem.registerDistrict(district);
        if (!result.registered) {
          const details = result.validation?.issues?.map(issue => issue.code + ": " + issue.message).join("; ");
          throw new Error("District " + (district?.id || "unknown") + " was rejected: " + (details || result.reason || "unknown validation error"));
        }
        this.registeredDistrictIds.push(district.id);
      }

      for (const connection of configuration.connections || []) {
        const result = this.worldSystem.registerConnection(connection);
        if (!result.registered) {
          throw new Error("District connection " + (connection?.id || "unknown") + " was rejected: " + result.reason);
        }
      }

      this.streaming = new WorldDistrictStreaming(
        configuration.streamingOptions || this.options.streamingOptions || {}
      ).init(this.worldSystem);
      this.ready = true;
      return this;
    } catch (error) {
      this.dispose();
      throw error;
    }
  }

  update(delta, context = {}) {
    if (!this.ready || !this.streaming) {
      return { built: [], removed: [], proxied: [], unproxied: [], refreshed: [], errors: [], skipped: "NOT_READY" };
    }
    return this.streaming.update(delta, context);
  }

  getWorldSystem() {
    return this.worldSystem;
  }

  getStatus() {
    const worldStatus = this.worldSystem?.getStatus?.() || {
      registeredDistricts: [],
      builtDistricts: [],
      proxiedDistricts: [],
      registeredConnections: []
    };
    return {
      ready: this.ready,
      registeredDistrictIds: [...this.registeredDistrictIds],
      ...worldStatus
    };
  }


  registerDistrict(districtOrRecipe, options = {}) {
    if (!this.ready || !this.worldSystem) return { registered: false, reason: "NOT_READY" };
    let district;
    try {
      const isRecipe = districtOrRecipe &&
        (districtOrRecipe.roadLayout === "grid" || districtOrRecipe.roadGrid || districtOrRecipe.roadLoop);
      district = isRecipe
        ? this.createDistrictFromRecipe(districtOrRecipe)
        : districtOrRecipe;
    } catch (error) {
      return { registered: false, reason: "INVALID_RECIPE", message: String(error?.message || error) };
    }
    const result = this.worldSystem.registerDistrict(district, options);
    if (result.registered && !this.registeredDistrictIds.includes(district.id)) {
      this.registeredDistrictIds.push(district.id);
    }
    return { ...result, district: result.registered ? district : undefined };
  }

  unregisterDistrict(id) {
    if (!this.ready || !this.worldSystem) return false;
    const removed = this.worldSystem.unregisterDistrict(id);
    if (removed) this.registeredDistrictIds = this.registeredDistrictIds.filter(value => value !== id);
    return removed;
  }

  registerConnection(connection) {
    if (!this.ready || !this.worldSystem) return { registered: false, reason: "NOT_READY" };
    return this.worldSystem.registerConnection(connection);
  }

  unregisterConnection(id) {
    if (!this.ready || !this.worldSystem) return false;
    return this.worldSystem.unregisterConnection(id);
  }

  getDistrictBuildStats(id) {
    return this.ready ? this.worldSystem.getDistrictBuildStats(id) : null;
  }

  getDistrictAtPosition(x, z) {
    return this.ready ? this.worldSystem.getDistrictAtPosition(x, z) : null;
  }

  getGroundHeightAt(x, z) {
    return this.ready ? this.worldSystem.getGroundHeightAt(x, z) : null;
  }

  findWorldRoute(fromDistrictId, fromNodeId, toDistrictId, toNodeId, options = {}) {
    if (!this.ready) {
      return { found: false, reason: "NOT_READY", nodes: [], steps: [], distance: 0 };
    }
    return this.worldSystem.findWorldRoute(fromDistrictId, fromNodeId, toDistrictId, toNodeId, options);
  }

  setGateAccess(districtId, gateId, permissions = []) {
    if (!this.ready) return false;
    return this.worldSystem.setGateAccess(districtId, gateId, permissions);
  }

  dispose() {
    if (this.worldSystem) {
      for (const id of [...this.registeredDistrictIds].reverse()) {
        try { this.worldSystem.unregisterDistrict(id); } catch (_) { /* continue cleaning other districts */ }
      }
    }
    this.registeredDistrictIds = [];
    this.streaming = null;
    this.worldSystem = null;
    this.createDistrictFromRecipe = null;
    this.ready = false;
  }
}
