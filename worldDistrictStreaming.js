// LAMBO CITY — distance-based district detail and far-proxy streaming
// Distant districts stay visible as cheap instanced massing. Full detail builds
// near the player; the far proxy is created before detail is removed to avoid gaps.
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
    const proxyInRadius = Number.isFinite(options.proxyInRadius) && options.proxyInRadius >= streamInRadius
      ? options.proxyInRadius : Math.max(900, streamInRadius + 100);
    const requestedProxyOutRadius = Number.isFinite(options.proxyOutRadius) ? options.proxyOutRadius : proxyInRadius + 100;
    this.options = {
      streamInRadius,
      streamOutRadius: requestedOutRadius > streamInRadius ? requestedOutRadius : streamInRadius + 35,
      proxyInRadius,
      proxyOutRadius: requestedProxyOutRadius > proxyInRadius ? requestedProxyOutRadius : proxyInRadius + 100,
      maxBuildsPerUpdate: Math.min(2, Math.max(1, Math.floor(options.maxBuildsPerUpdate || 1))),
      maxRemovalsPerUpdate: Math.min(2, Math.max(1, Math.floor(options.maxRemovalsPerUpdate || 1))),
      maxProxyBuildsPerUpdate: Math.min(2, Math.max(1, Math.floor(options.maxProxyBuildsPerUpdate || 1))),
      maxProxyRemovalsPerUpdate: Math.min(2, Math.max(1, Math.floor(options.maxProxyRemovalsPerUpdate || 1))),
      maxDetailedParcels: Number.isInteger(options.maxDetailedParcels)
        ? Math.max(0, Math.min(64, options.maxDetailedParcels)) : 24,
      maxFocusUpdatesPerUpdate: Math.min(2, Math.max(1, Math.floor(options.maxFocusUpdatesPerUpdate || 1)))
    };
    this.worldSystem = null;
  }

  init(worldSystem) {
    if (!worldSystem || typeof worldSystem.getDistrictIds !== "function" ||
        typeof worldSystem.getDistrict !== "function" ||
        typeof worldSystem.isDistrictBuilt !== "function" ||
        typeof worldSystem.isDistrictProxied !== "function" ||
        typeof worldSystem.updateDistrictDetailFocus !== "function" ||
        typeof worldSystem.buildDistrictProxy !== "function" ||
        typeof worldSystem.removeDistrictProxy !== "function") {
      throw new Error("WorldDistrictStreaming requires an initialized WorldSystem with proxy support.");
    }
    this.worldSystem = worldSystem;
    return this;
  }

  update(delta, context = {}) {
    if (!this.worldSystem) return { built: [], removed: [], proxied: [], unproxied: [], errors: [], skipped: "NOT_INITIALIZED" };
    const position = context.playerPosition || context.player?.position || context.position;
    if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.z)) {
      return { built: [], removed: [], proxied: [], unproxied: [], errors: [], skipped: "NO_PLAYER_POSITION" };
    }

    const detailBuilds = [], detailRemovals = [], proxyBuilds = [], proxyRemovals = [], focusUpdates = [];
    for (const id of this.worldSystem.getDistrictIds()) {
      const district = this.worldSystem.getDistrict(id);
      if (!district?.bounds) continue;
      const distance = distanceToBounds(district.bounds, position.x, position.z);
      const built = this.worldSystem.isDistrictBuilt(id);
      const proxied = this.worldSystem.isDistrictProxied(id);

      if (built) {
        if (distance > this.options.streamOutRadius) {
          detailRemovals.push({ id, distance });
          if (!proxied && distance <= this.options.proxyOutRadius) proxyBuilds.push({ id, distance });
        } else {
          if (proxied) proxyRemovals.push({ id, distance });
          focusUpdates.push({ id, distance });
        }
        continue;
      }

      if (distance <= this.options.streamInRadius) {
        detailBuilds.push({ id, distance });
        if (proxied) proxyRemovals.push({ id, distance });
      } else if (distance <= this.options.proxyInRadius) {
        if (!proxied) proxyBuilds.push({ id, distance });
      } else if (proxied && distance > this.options.proxyOutRadius) {
        proxyRemovals.push({ id, distance });
      }
    }

    detailBuilds.sort((a, b) => a.distance - b.distance);
    detailRemovals.sort((a, b) => b.distance - a.distance);
    proxyBuilds.sort((a, b) => a.distance - b.distance);
    proxyRemovals.sort((a, b) => b.distance - a.distance);
    focusUpdates.sort((a, b) => a.distance - b.distance);
    const built = [], removed = [], proxied = [], unproxied = [], refreshed = [], errors = [];

    // Build the far proxy before removing nearby full detail so the district
    // never disappears between the two levels.
    for (const candidate of proxyBuilds.slice(0, this.options.maxProxyBuildsPerUpdate)) {
      try {
        this.worldSystem.buildDistrictProxy(candidate.id);
        proxied.push(candidate.id);
      } catch (error) {
        errors.push({ id: candidate.id, stage: "proxy-build", message: String(error?.message || error) });
      }
    }
    for (const candidate of detailBuilds.slice(0, this.options.maxBuildsPerUpdate)) {
      try {
        this.worldSystem.buildDistrict(candidate.id, {
          focusPosition: { x: position.x, z: position.z },
          maxDetailedParcels: this.options.maxDetailedParcels
        });
        built.push(candidate.id);
        if (this.worldSystem.removeDistrictProxy(candidate.id)) unproxied.push(candidate.id);
      } catch (error) {
        errors.push({ id: candidate.id, stage: "detail-build", message: String(error?.message || error) });
      }
    }
    for (const candidate of focusUpdates.slice(0, this.options.maxFocusUpdatesPerUpdate)) {
      try {
        if (this.worldSystem.updateDistrictDetailFocus(candidate.id, position)) refreshed.push(candidate.id);
      } catch (error) {
        errors.push({ id: candidate.id, stage: "detail-refresh", message: String(error?.message || error) });
      }
    }
    for (const candidate of detailRemovals.slice(0, this.options.maxRemovalsPerUpdate)) {
      if (candidate.distance <= this.options.proxyOutRadius &&
          !this.worldSystem.isDistrictProxied(candidate.id)) {
        errors.push({
          id: candidate.id,
          stage: "detail-remove",
          message: "Kept full detail because its far proxy was not ready."
        });
        continue;
      }
      try {
        if (this.worldSystem.removeDistrict(candidate.id)) removed.push(candidate.id);
      } catch (error) {
        errors.push({ id: candidate.id, stage: "detail-remove", message: String(error?.message || error) });
      }
    }
    for (const candidate of proxyRemovals.slice(0, this.options.maxProxyRemovalsPerUpdate)) {
      try {
        if (this.worldSystem.removeDistrictProxy(candidate.id)) unproxied.push(candidate.id);
      } catch (error) {
        errors.push({ id: candidate.id, stage: "proxy-remove", message: String(error?.message || error) });
      }
    }

    return {
      built, removed, proxied, unproxied, refreshed, errors,
      nearestBuildDistance: detailBuilds[0]?.distance ?? null,
      nearestProxyDistance: proxyBuilds[0]?.distance ?? null
    };
  }
}

export { distanceToBounds };
