// LAMBO CITY — vehicle-only road boundary and turning-space rules
// Pure map math. Vehicle footprints must remain on permitted road surfaces;
// sidewalks and pedestrian-only links are never treated as drivable pavement.

const DEFAULT_CLEARANCE = 0.35;

function projectToSegment(point, from, to) {
  const dx = to.x - from.x, dz = to.z - from.z;
  const lengthSquared = dx * dx + dz * dz;
  if (lengthSquared <= 1e-8) return null;
  const rawT = ((point.x - from.x) * dx + (point.z - from.z) * dz) / lengthSquared;
  const t = Math.max(0, Math.min(1, rawT));
  const x = from.x + dx * t, z = from.z + dz * t;
  return {
    t, x, z,
    distance: Math.hypot(point.x - x, point.z - z),
    halfWidth: 0
  };
}

function segmentIsAllowed(segment, options) {
  const mode = segment.mode || "vehicle";
  if (mode === "pedestrian") return false;
  if (mode === "service" && !options.permissions.has(segment.requiredAccess || "service")) return false;
  if (segment.mode !== undefined && !["vehicle", "shared", "service"].includes(mode)) return false;
  if (segment.access === "closed") return false;
  if (segment.access === "permission-controlled" &&
      !options.permissions.has(segment.requiredAccess)) return false;
  if (segment.gate && !options.openGates.has(segment.gate.id)) return false;
  return true;
}

export function getVehicleRoadSurface(district, point, options = {}) {
  if (!district?.roadNetwork || !Number.isFinite(point?.x) || !Number.isFinite(point?.z)) return null;
  const permissions = new Set(Array.isArray(options.permissions) ? options.permissions : []);
  const openGates = options.openGates instanceof Set ? options.openGates : new Set(options.openGates || []);
  const nodes = new Map(district.roadNetwork.nodes.map(node => [node.id, node]));
  const clearance = Number.isFinite(options.clearance) ? Math.max(0, options.clearance) : DEFAULT_CLEARANCE;
  let best = null;

  for (const segment of district.roadNetwork.segments) {
    if (segment.navigationOnly === true || !segmentIsAllowed(segment, { permissions, openGates })) continue;
    const from = nodes.get(segment.from), to = nodes.get(segment.to);
    if (!from || !to) continue;
    const projected = projectToSegment(point, from, to);
    if (!projected) continue;
    const width = Number.isFinite(segment.width) ? segment.width :
      (Number.isFinite(district.roadNetwork.roadWidth) ? district.roadNetwork.roadWidth : 9);
    const usableHalfWidth = Math.max(0, width / 2 - clearance);
    if (projected.distance <= usableHalfWidth && projected.t >= 0 && projected.t <= 1) {
      const candidate = {
        type: "road",
        segmentId: segment.id,
        center: { x: projected.x, z: projected.z },
        distanceToCenter: projected.distance,
        usableHalfWidth,
        topY: Number.isFinite(segment.fromTopY) && Number.isFinite(segment.toTopY)
          ? segment.fromTopY + (segment.toTopY - segment.fromTopY) * projected.t
          : (Number.isFinite(options.roadTopY) ? options.roadTopY : 0.77)
      };
      if (!best || candidate.distanceToCenter < best.distanceToCenter) best = candidate;
    }
  }

  // Widened, explicitly declared junction aprons are drivable road surface.
  for (const node of district.roadNetwork.nodes) {
    const area = node.turningArea;
    if (!area || !Number.isFinite(area.width) || !Number.isFinite(area.depth)) continue;
    const halfWidth = area.width / 2 - clearance;
    const halfDepth = area.depth / 2 - clearance;
    if (Math.abs(point.x - node.x) <= halfWidth && Math.abs(point.z - node.z) <= halfDepth) {
      const candidate = {
        type: "turning-area",
        nodeId: node.id,
        center: { x: node.x, z: node.z },
        usableHalfWidth: halfWidth,
        topY: Number.isFinite(node.topY) ? node.topY : (Number.isFinite(options.roadTopY) ? options.roadTopY : 0.77)
      };
      if (!best || candidate.type === "turning-area") best = candidate;
    }
  }
  return best;
}

export function isVehicleFootprintOnRoad(district, vehicle, options = {}) {
  if (!vehicle || !Number.isFinite(vehicle.x) || !Number.isFinite(vehicle.z)) return false;
  const length = Number.isFinite(vehicle.length) ? vehicle.length : 4.8;
  const width = Number.isFinite(vehicle.width) ? vehicle.width : 2.1;
  const heading = Number.isFinite(vehicle.heading) ? vehicle.heading : 0;
  const halfLength = length / 2;
  const halfWidth = width / 2;
  const forward = { x: Math.sin(heading), z: Math.cos(heading) };
  const side = { x: Math.cos(heading), z: -Math.sin(heading) };
  const samples = [
    [0, 0],
    [-halfLength, -halfWidth], [-halfLength, halfWidth],
    [halfLength, -halfWidth], [halfLength, halfWidth],
    [0, -halfWidth], [0, halfWidth],
    [-halfLength, 0], [halfLength, 0]
  ];
  return samples.every(([along, across]) => {
    const point = {
      x: vehicle.x + forward.x * along + side.x * across,
      z: vehicle.z + forward.z * along + side.z * across
    };
    return !!getVehicleRoadSurface(district, point, options);
  });
}

export function isVehicleMoveOnRoad(district, current, next, options = {}) {
  if (!current || !next ||
      ![current.x, current.z, next.x, next.z].every(Number.isFinite)) return false;
  const distance = Math.hypot(next.x - current.x, next.z - current.z);
  const maxStep = Number.isFinite(options.maxStep) ? Math.max(0.2, options.maxStep) : 0.75;
  let angleDelta = (next.heading ?? current.heading ?? 0) - (current.heading ?? 0);
  while (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
  while (angleDelta < -Math.PI) angleDelta += Math.PI * 2;
  const vehicleLength = Number.isFinite(next.length) ? next.length : (current.length || 4.8);
  const rotationTravel = Math.abs(angleDelta) * vehicleLength / 2;
  const steps = Math.max(1, Math.min(96, Math.ceil(Math.max(distance, rotationTravel) / maxStep)));
  for (let index = 0; index <= steps; index++) {
    const t = index / steps;
    const vehicle = {
      x: current.x + (next.x - current.x) * t,
      z: current.z + (next.z - current.z) * t,
      heading: (current.heading ?? 0) + angleDelta * t,
      length: Number.isFinite(next.length) ? next.length : current.length,
      width: Number.isFinite(next.width) ? next.width : current.width,
      turningRadius: Number.isFinite(next.turningRadius) ? next.turningRadius : current.turningRadius
    };
    if (!isVehicleFootprintOnRoad(district, vehicle, options)) return false;
  }
  return true;
}

export function getMinimumUTurnSpace(vehicle = {}) {
  const length = Number.isFinite(vehicle.length) ? vehicle.length : 4.8;
  const width = Number.isFinite(vehicle.width) ? vehicle.width : 2.1;
  const turningRadius = Number.isFinite(vehicle.turningRadius) ? vehicle.turningRadius : 6.5;
  return {
    minimumWidth: Math.max(14, turningRadius * 2 + width + 1),
    minimumDepth: Math.max(14, turningRadius * 2 + length * 0.35),
    turningRadius,
    clearance: DEFAULT_CLEARANCE
  };
}

export default {
  getVehicleRoadSurface,
  isVehicleFootprintOnRoad,
  isVehicleMoveOnRoad,
  getMinimumUTurnSpace
};
