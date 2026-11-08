// LAMBO CITY — World District Contract Validator
// Data-only foundation. This module does not create scene objects or change gameplay.
// A district must pass validation before a builder is allowed to construct it.

const REQUIRED_TEXT = ["id", "name", "type"];
const REQUIRED_BOUNDS = ["minX", "maxX", "minZ", "maxZ"];

function issue(code, message, severity = "error") {
  return { code, message, severity };
}

export function validateDistrict(district, options = {}) {
  const issues = [];
  if (!district || typeof district !== "object" || Array.isArray(district)) {
    return { valid: false, issues: [issue("DISTRICT_NOT_OBJECT", "District must be an object.")] };
  }

  for (const key of REQUIRED_TEXT) {
    if (typeof district[key] !== "string" || !district[key].trim()) {
      issues.push(issue("MISSING_" + key.toUpperCase(), "District is missing a valid " + key + "."));
    }
  }

  const bounds = district.bounds;
  if (!bounds || typeof bounds !== "object") {
    issues.push(issue("MISSING_BOUNDS", "District must define its map boundaries."));
  } else {
    for (const key of REQUIRED_BOUNDS) {
      if (!Number.isFinite(bounds[key])) {
        issues.push(issue("INVALID_BOUND_" + key.toUpperCase(), "Boundary " + key + " must be a finite number."));
      }
    }
    if (REQUIRED_BOUNDS.every(key => Number.isFinite(bounds[key]))) {
      if (bounds.minX >= bounds.maxX || bounds.minZ >= bounds.maxZ) {
        issues.push(issue("INVERTED_BOUNDS", "Minimum boundaries must be smaller than maximum boundaries."));
      }
    }
  }

  const network = district.roadNetwork;
  if (!network || !Array.isArray(network.nodes) || !Array.isArray(network.segments)) {
    issues.push(issue("MISSING_ROAD_NETWORK", "District must define road nodes and connecting segments."));
  } else {
    const nodeIds = new Set();
    for (const node of network.nodes) {
      if (!node || typeof node.id !== "string" || !node.id.trim()) {
        issues.push(issue("INVALID_ROAD_NODE", "Every road node needs a unique id."));
        continue;
      }
      if (nodeIds.has(node.id)) issues.push(issue("DUPLICATE_ROAD_NODE", "Road node id is repeated: " + node.id));
      nodeIds.add(node.id);
      if (!Number.isFinite(node.x) || !Number.isFinite(node.z)) {
        issues.push(issue("INVALID_ROAD_NODE_POSITION", "Road node " + node.id + " needs finite x and z coordinates."));
      }
    }

    const segmentIds = new Set();
    for (const segment of network.segments) {
      if (!segment || typeof segment.id !== "string" || !segment.id.trim()) {
        issues.push(issue("INVALID_ROAD_SEGMENT", "Every road segment needs an id."));
        continue;
      }
      if (segmentIds.has(segment.id)) issues.push(issue("DUPLICATE_ROAD_SEGMENT", "Road segment id is repeated: " + segment.id));
      segmentIds.add(segment.id);
      if (!nodeIds.has(segment.from) || !nodeIds.has(segment.to)) {
        issues.push(issue("BROKEN_ROAD_CONNECTION", "Road segment " + segment.id + " references a missing endpoint."));
      }
      if (segment.from === segment.to) {
        issues.push(issue("ZERO_LENGTH_ROAD", "Road segment " + segment.id + " connects a node to itself."));
      }
      if (!["vehicle", "pedestrian", "shared", "service"].includes(segment.mode)) {
        issues.push(issue("INVALID_ROAD_MODE", "Road segment " + segment.id + " has an unsupported travel mode."));
      }
    }
  }

  const protectedIds = new Set(options.protectedLandmarks || []);
  for (const landmarkId of district.overlapsProtectedLandmarks || []) {
    if (protectedIds.has(landmarkId)) {
      issues.push(issue("PROTECTED_LANDMARK_OVERLAP", "District overlaps protected landmark: " + landmarkId));
    }
  }

  for (const crossing of district.waterCrossings || []) {
    if (!crossing || crossing.approvedStructure !== true) {
      issues.push(issue("UNAPPROVED_WATER_CROSSING", "A road or path crossing water must declare an approved bridge, pier, or other structure."));
    }
  }

  const errors = issues.filter(item => item.severity === "error");
  return { valid: errors.length === 0, issues };
}

export function validateWorld(world) {
  const issues = [];
  if (!world || !Array.isArray(world.districts)) {
    return { valid: false, issues: [issue("INVALID_WORLD", "World must contain a districts array.")] };
  }

  const ids = new Set();
  for (const district of world.districts) {
    const result = validateDistrict(district, { protectedLandmarks: world.protectedLandmarks || [] });
    for (const item of result.issues) issues.push({ districtId: district?.id || null, ...item });
    if (district?.id) {
      if (ids.has(district.id)) issues.push(issue("DUPLICATE_DISTRICT_ID", "District id is repeated: " + district.id));
      ids.add(district.id);
    }
  }

  return { valid: issues.every(item => item.severity !== "error"), issues };
}

export default { validateDistrict, validateWorld };
