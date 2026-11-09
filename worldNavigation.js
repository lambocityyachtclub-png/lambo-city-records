// LAMBO CITY — scalable, permission-aware district route planner
// A* search uses a binary min-heap; no scene access or gameplay side effects.
class MinHeap {
  constructor() { this.items = []; }
  push(item) {
    const items = this.items;
    items.push(item);
    let index = items.length - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (items[parent].score <= item.score) break;
      items[index] = items[parent];
      index = parent;
    }
    items[index] = item;
  }
  pop() {
    const items = this.items;
    if (!items.length) return null;
    const first = items[0];
    const last = items.pop();
    if (items.length) {
      let index = 0;
      while (true) {
        const left = index * 2 + 1, right = left + 1;
        if (left >= items.length) break;
        let child = left;
        if (right < items.length && items[right].score < items[left].score) child = right;
        if (items[child].score >= last.score) break;
        items[index] = items[child];
        index = child;
      }
      items[index] = last;
    }
    return first;
  }
  get size() { return this.items.length; }
}

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
    return !!segment.requiredAccess && permissions.has(segment.requiredAccess);
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
    adjacency.get(segment.from).push({ nodeId: segment.to, segmentId: segment.id, distance });
    adjacency.get(segment.to).push({ nodeId: segment.from, segmentId: segment.id, distance });
  }

  const heuristic = id => {
    const a = nodeById.get(id), b = nodeById.get(toId);
    return Math.hypot(b.x - a.x, b.z - a.z);
  };
  const open = new MinHeap();
  const gScore = new Map(nodes.map(node => [node.id, Infinity]));
  const previous = new Map();
  const closed = new Set();
  gScore.set(fromId, 0);
  open.push({ id: fromId, score: heuristic(fromId) });

  while (open.size) {
    const current = open.pop().id;
    if (closed.has(current)) continue;
    if (current === toId) break;
    closed.add(current);

    for (const edge of adjacency.get(current) || []) {
      if (closed.has(edge.nodeId)) continue;
      const candidate = gScore.get(current) + edge.distance;
      if (candidate < gScore.get(edge.nodeId)) {
        gScore.set(edge.nodeId, candidate);
        previous.set(edge.nodeId, { from: current, segmentId: edge.segmentId });
        open.push({ id: edge.nodeId, score: candidate + heuristic(edge.nodeId) });
      }
    }
  }

  if (!Number.isFinite(gScore.get(toId))) {
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
  return { found: true, reason: null, nodeIds, segmentIds, distance: gScore.get(toId) };
}


export function findWorldRoute(districtEntries, connections, fromDistrictId, fromNodeId, toDistrictId, toNodeId, options = {}) {
  const nodes = new Map();
  const adjacency = new Map();
  const keyFor = (districtId, nodeId) => JSON.stringify([districtId, nodeId]);

  for (const [districtId, district] of districtEntries || []) {
    for (const node of district?.roadNetwork?.nodes || []) {
      const key = keyFor(districtId, node.id);
      nodes.set(key, { key, districtId, nodeId: node.id, x: node.x, z: node.z });
      adjacency.set(key, []);
    }
  }

  const mode = options.mode || "vehicle";
  const permissions = new Set(Array.isArray(options.permissions) ? options.permissions : []);
  const addEdge = (fromKey, toKey, edge, distance) => {
    if (!nodes.has(fromKey) || !nodes.has(toKey) || !Number.isFinite(distance) || distance <= 0) return;
    adjacency.get(fromKey).push({ toKey, edge, distance });
    adjacency.get(toKey).push({ toKey: fromKey, edge, distance });
  };

  for (const [districtId, district] of districtEntries || []) {
    for (const segment of district?.roadNetwork?.segments || []) {
      if (!segmentAllowed(segment, mode, permissions)) continue;
      const fromKey = keyFor(districtId, segment.from);
      const toKey = keyFor(districtId, segment.to);
      const from = nodes.get(fromKey), to = nodes.get(toKey);
      if (!from || !to) continue;
      addEdge(fromKey, toKey, {
        type: "district", districtId, segmentId: segment.id
      }, Math.hypot(to.x - from.x, to.z - from.z));
    }
  }

  for (const connection of connections || []) {
    const synthetic = {
      mode: connection.mode || "vehicle",
      access: connection.access,
      requiredAccess: connection.requiredAccess
    };
    if (!segmentAllowed(synthetic, mode, permissions)) continue;
    const fromKey = keyFor(connection.from?.districtId, connection.from?.nodeId);
    const toKey = keyFor(connection.to?.districtId, connection.to?.nodeId);
    const from = nodes.get(fromKey), to = nodes.get(toKey);
    if (!from || !to) continue;
    const distance = Math.hypot(to.x - from.x, to.z - from.z);
    addEdge(fromKey, toKey, { type: "connection", connectionId: connection.id }, distance);
  }

  const startKey = keyFor(fromDistrictId, fromNodeId);
  const endKey = keyFor(toDistrictId, toNodeId);
  if (!nodes.has(startKey) || !nodes.has(endKey)) {
    return { found: false, reason: "UNKNOWN_ENDPOINT", nodes: [], steps: [], distance: 0 };
  }
  if (startKey === endKey) {
    return { found: true, reason: null, nodes: [nodes.get(startKey)], steps: [], distance: 0 };
  }

  const heuristic = key => {
    const a = nodes.get(key), b = nodes.get(endKey);
    return Math.hypot(b.x - a.x, b.z - a.z);
  };
  const open = new MinHeap();
  const gScore = new Map(Array.from(nodes.keys(), key => [key, Infinity]));
  const previous = new Map();
  const closed = new Set();
  gScore.set(startKey, 0);
  open.push({ id: startKey, score: heuristic(startKey) });

  while (open.size) {
    const current = open.pop().id;
    if (closed.has(current)) continue;
    if (current === endKey) break;
    closed.add(current);
    for (const edge of adjacency.get(current) || []) {
      if (closed.has(edge.toKey)) continue;
      const candidate = gScore.get(current) + edge.distance;
      if (candidate < gScore.get(edge.toKey)) {
        gScore.set(edge.toKey, candidate);
        previous.set(edge.toKey, { from: current, edge: edge.edge });
        open.push({ id: edge.toKey, score: candidate + heuristic(edge.toKey) });
      }
    }
  }

  if (!Number.isFinite(gScore.get(endKey))) {
    return { found: false, reason: "NO_ALLOWED_ROUTE", nodes: [], steps: [], distance: 0 };
  }

  const pathNodes = [nodes.get(endKey)], steps = [];
  let cursor = endKey;
  while (cursor !== startKey) {
    const step = previous.get(cursor);
    if (!step) return { found: false, reason: "BROKEN_ROUTE_CHAIN", nodes: [], steps: [], distance: 0 };
    steps.unshift(step.edge);
    pathNodes.unshift(nodes.get(step.from));
    cursor = step.from;
  }
  return { found: true, reason: null, nodes: pathNodes, steps, distance: gScore.get(endKey) };
}

export default { findRoute, findWorldRoute };
