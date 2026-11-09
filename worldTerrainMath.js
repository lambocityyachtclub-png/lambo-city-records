// LAMBO CITY — pure terrain height math shared by the renderer and tests.
export function sampleTerrainHeight(district, x, z, fallbackY = 0.64) {
  let height = fallbackY;
  for (const zone of district?.terrainZones || []) {
    if (!zone?.center || !Number.isFinite(zone.center.x) || !Number.isFinite(zone.center.z)) continue;
    const dx = Math.abs(x - zone.center.x), dz = Math.abs(z - zone.center.z);
    if (dx > zone.width / 2 || dz > zone.depth / 2) continue;
    const edgeDistance = Math.min(zone.width / 2 - dx, zone.depth / 2 - dz);
    const transition = Math.max(0, Number.isFinite(zone.transitionWidth) ? zone.transitionWidth : 1);
    const t = transition > 0 ? Math.max(0, Math.min(1, edgeDistance / transition)) : 1;
    const blend = t * t * (3 - 2 * t);
    const edgeY = Number.isFinite(zone.edgeY) ? zone.edgeY : fallbackY + 0.005;
    const topY = Number.isFinite(zone.topY) ? zone.topY : edgeY;
    height = edgeY + (topY - edgeY) * blend;
  }
  return height;
}


const ROAD_SURFACE_CACHE = new WeakMap();

function getRoadSurfaceCache(district, defaultRoadWidth) {
  let byWidth = ROAD_SURFACE_CACHE.get(district);
  if (!byWidth) {
    byWidth = new Map();
    ROAD_SURFACE_CACHE.set(district, byWidth);
  }
  if (byWidth.has(defaultRoadWidth)) return byWidth.get(defaultRoadWidth);

  const nodes = new Map((district?.roadNetwork?.nodes || []).map(node => [node.id, node]));
  const segments = [];
  const junctionWidths = new Map();
  const junctionDegrees = new Map();
  for (const segment of district?.roadNetwork?.segments || []) {
    if (segment.navigationOnly === true) continue;
    const from = nodes.get(segment.from), to = nodes.get(segment.to);
    if (!from || !to) continue;
    const dx = to.x - from.x, dz = to.z - from.z;
    const lengthSquared = dx * dx + dz * dz;
    if (lengthSquared <= 0) continue;
    const width = Number.isFinite(segment.width) ? segment.width : defaultRoadWidth;
    const pedestrianSurface = segment.mode === "pedestrian" && segment.physicalSurface === "sidewalk";
    segments.push({
      fromX: from.x, fromZ: from.z, dx, dz, lengthSquared, width,
      pedestrianOnly: segment.mode === "pedestrian",
      pedestrianSurface,
      fromTopY: Number.isFinite(segment.fromTopY) ? segment.fromTopY : null,
      toTopY: Number.isFinite(segment.toTopY) ? segment.toTopY : null
    });
    if (!pedestrianSurface) {
      for (const nodeId of [segment.from, segment.to]) {
        junctionWidths.set(nodeId, Math.max(junctionWidths.get(nodeId) || 0, width));
        junctionDegrees.set(nodeId, (junctionDegrees.get(nodeId) || 0) + 1);
      }
    }
  }
  const junctions = [];
  for (const [nodeId, width] of junctionWidths) {
    const node = nodes.get(nodeId);
    if (node && junctionDegrees.get(nodeId) >= 2) junctions.push({ x: node.x, z: node.z, width });
  }
  const cache = { segments, junctions };
  byWidth.set(defaultRoadWidth, cache);
  return cache;
}

export function sampleRoadSurfaceHeight(district, x, z, surfaceOptions = {}) {
  if (!Number.isFinite(x) || !Number.isFinite(z) || !district || typeof district !== "object") return null;
  const roadBaseTopY = Number.isFinite(surfaceOptions.roadTopY) ? surfaceOptions.roadTopY : 0.77;
  const sidewalkBaseTopY = Number.isFinite(surfaceOptions.sidewalkTopY) ? surfaceOptions.sidewalkTopY : roadBaseTopY + 0.03;
  const defaultRoadWidth = Number.isFinite(surfaceOptions.roadWidth) ? surfaceOptions.roadWidth : 9;
  const sidewalkWidth = Number.isFinite(surfaceOptions.sidewalkWidth) ? surfaceOptions.sidewalkWidth : 3;
  const cache = getRoadSurfaceCache(district, defaultRoadWidth);
  let onRoad = false, onSidewalk = false;
  let roadHeight = roadBaseTopY, sidewalkHeight = sidewalkBaseTopY;

  for (const segment of cache.segments) {
    const t = ((x - segment.fromX) * segment.dx + (z - segment.fromZ) * segment.dz) / segment.lengthSquared;
    if (t < 0 || t > 1) continue;
    const nearestX = segment.fromX + t * segment.dx;
    const nearestZ = segment.fromZ + t * segment.dz;
    const distance = Math.hypot(x - nearestX, z - nearestZ);
    const interpolatedTopY = segment.fromTopY !== null && segment.toTopY !== null
      ? segment.fromTopY + (segment.toTopY - segment.fromTopY) * t
      : null;
    if (segment.pedestrianSurface) {
      if (distance <= segment.width / 2) {
        onSidewalk = true;
        if (interpolatedTopY !== null) sidewalkHeight = interpolatedTopY;
      }
    } else if (distance <= segment.width / 2) {
      onRoad = true;
      if (interpolatedTopY !== null) roadHeight = interpolatedTopY;
    } else if (surfaceOptions.buildSidewalks !== false && !segment.pedestrianOnly &&
               distance <= segment.width / 2 + sidewalkWidth) {
      onSidewalk = true;
      if (interpolatedTopY !== null) sidewalkHeight = interpolatedTopY +
        (sidewalkBaseTopY - roadBaseTopY);
    }
  }
  for (const junction of cache.junctions) {
    if (Math.abs(x - junction.x) <= junction.width / 2 &&
        Math.abs(z - junction.z) <= junction.width / 2) onRoad = true;
  }
  if (onRoad) return roadHeight;
  if (onSidewalk) return sidewalkHeight;
  return null;
}

export default { sampleTerrainHeight, sampleRoadSurfaceHeight };
