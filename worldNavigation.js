// LAMBO CITY — data-driven district route planner
// Pure graph logic: no scene access, timers, or gameplay side effects.
function segmentAllowed(segment, mode, permissions) {
  const segmentMode = segment.mode || "vehicle";
  if (mode === "pedestrian") {
    if (segmentMode !== "pedestrian" && segmentMode !== "shared") return false;
  } else if (mode === "service") {
    if (!["service", "vehicle", "shared"].includes(segmentMode)) return false;
  } else if (mode === "vehicle") {
    if (segmentMode !== "vehicle" && segmentMode !== "shared") return false;
  } else {
    return false;
  }

  if (segment.access === "permission-controlled") {
    const required = segment.requiredAccess;
    return !!required && permissions.has(required);
  }
  return segment.access !== "closed";
}

export function findRoute(district, fromId, toId, options = {}) {
  const nodes = district?.roadNetwork?.nodes;
  const segments = district?.roadNetwork?.segments;
  if (!Array.isArray(nodes) || !Array.isArray(segments)) {
    return { found: false, reason: "INVALID_ROAD_NETWORK", nodeIds: [], segmentIds: [], distance: 0 };
  }
  const nodeById = new Map(nodes.map(node => [node.id, node]));
  if (!nodeById.has(fromId) || !nodeById.has(toId)) {
    return { found: false, reason: "UNKNOWN_ENDPOINT", nodeIds: [], segmentIds: [], distance: 0 };
  }
  if (fromId === toId) {
    return { found: true, reason: null, nodeIds: [fromId], segmentIds: [], distance: 0 };
  }

  const mode = options.mode || "vehicle";
  const permissions = new Set(Array.isArray(options.permissions) ? options.permissions : []);
  const adjacency = new Map(nodes.map(node => [node.id, []]));
  for (const segment of segments) {
    if (!segmentAllowed(segment, mode, permissions)) continue;
    const from = nodeById.get(segment.from), to = nodeById.get(segment.to);
    if (!from || !to) continue;
    const distance = Math.hypot(to.x - from.x, to.z - from.z);
    if (!Number.isFinite(distance) || distance <= 0) continue;
    adjacency.get(segment.from).push({ nodeId: segment.to, segment, distance });
    adjacency.get(segment.to).push({ nodeId: segment.from, segment, distance });
  }

  const distances = new Map(nodes.map(node => [node.id, Infinity]));
  const previous = new Map();
  const visited = new Set();
  distances.set(fromId, 0);

  while (visited.size < nodes.length) {
    let current = null, best = Infinity;
    for (const [id, distance] of distances) {
      if (!visited.has(id) && distance < best) {
        current = id;
        best = distance;
      }
    }
    if (current === null || current === toId) break;
    visited.add(current);
    for (const edge of adjacency.get(current) || []) {
      if (visited.has(edge.nodeId)) continue;
      const candidate = best + edge.distance;
      if (candidate < distances.get(edge.nodeId)) {
        distances.set(edge.nodeId, candidate);
        previous.set(edge.nodeId, { from: current, segmentId: edge.segment.id });
      }
    }
  }

  if (!Number.isFinite(distances.get(toId))) {
    return { found: false, reason: "NO_ALLOWED_ROUTE", nodeIds: [], segmentIds: [], distance: 0 };
  }

  const nodeIds = [toId], segmentIds = [];
  let cursor = toId;
  while (cursor !== fromId) {
    const step = previous.get(cursor);
    if (!step) return { found: false, reason: "BROKEN_ROUTE_CHAIN", nodeIds: [], segmentIds: [], distance: 0 };
    segmentIds.unshift(step.segmentId);
    nodeIds.unshift(step.from);
    cursor = step.from;
  }
  return { found: true, reason: null, nodeIds, segmentIds, distance: distances.get(toId) };
}

export default { findRoute };
