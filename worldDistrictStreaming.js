// LAMBO CITY — on-demand district streaming
// Registers no scene objects at startup. District geometry is built near the
// player and removed after leaving, while blueprint data and route links remain.
function distanceToBounds(bounds, x, z) {
  const dx = Math.max(bounds.minX - x, 0, x - bounds.maxX);
  const dz = Math.max(bounds.minZ - z, 0, z - bounds.maxZ);
  return Math.hypot(dx, dz);
}

export default class WorldDistrictStreaming {
  constructor(options = {}) {
    const streamInRadius = Number.isFinite(options.streamInRadius) && options.streamInRadius >= 0
      ? options.streamInRadius : 250;
    const requestedOutRadius = Number.isFinite(options.streamOutRadius) ? options.streamOutRadius : 285;
    this.options = {
      streamInRadius,
      streamOutRadius: requestedOutRadius > streamInRadius ? requestedOutRadius : streamInRadius + 35,
      maxBuildsPerUpdate: Math.min(2, Math.max(1, Math.floor(options.maxBuildsPerUpdate || 1))),
      maxRemovalsPerUpdate: Math.min(2, Math.max(1, Math.floor(options.maxRemovalsPerUpdate || 1)))
    };
    this.worldSystem = null;
  }

  init(worldSystem) {
    if (!worldSystem || typeof worldSystem.getDistrictIds !== "function" ||
        typeof worldSystem.getDistrict !== "function" ||
        typeof worldSystem.isDistrictBuilt !== "function") {
      throw new Error("WorldDistrictStreaming requires an initialized WorldSystem.");
    }
    this.worldSystem = worldSystem;
    return this;
  }

  update(delta, context = {}) {
    if (!this.worldSystem) return { built: [], removed: [], errors: [], skipped: "NOT_INITIALIZED" };
    const position = context.playerPosition || context.player?.position || context.position;
    if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.z)) {
      return { built: [], removed: [], errors: [], skipped: "NO_PLAYER_POSITION" };
    }

    const buildCandidates = [];
    const removeCandidates = [];
    for (const id of this.worldSystem.getDistrictIds()) {
      const district = this.worldSystem.getDistrict(id);
      if (!district?.bounds) continue;
      const distance = distanceToBounds(district.bounds, position.x, position.z);
      const built = this.worldSystem.isDistrictBuilt(id);
      if (!built && distance <= this.options.streamInRadius) buildCandidates.push({ id, distance });
      else if (built && distance > this.options.streamOutRadius) removeCandidates.push({ id, distance });
    }

    buildCandidates.sort((a, b) => a.distance - b.distance);
    removeCandidates.sort((a, b) => b.distance - a.distance);
    const built = [], removed = [], errors = [];

    for (const candidate of buildCandidates.slice(0, this.options.maxBuildsPerUpdate)) {
      try {
        this.worldSystem.buildDistrict(candidate.id);
        built.push(candidate.id);
      } catch (error) {
        errors.push({ id: candidate.id, message: String(error?.message || error) });
      }
    }
    for (const candidate of removeCandidates.slice(0, this.options.maxRemovalsPerUpdate)) {
      try {
        if (this.worldSystem.removeDistrict(candidate.id)) removed.push(candidate.id);
      } catch (error) {
        errors.push({ id: candidate.id, message: String(error?.message || error) });
      }
    }

    return { built, removed, errors, nearestBuildDistance: buildCandidates[0]?.distance ?? null };
  }
}

export { distanceToBounds };
