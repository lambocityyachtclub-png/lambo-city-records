// LAMBO CITY — World District Contract Validator
// Data-only validation. This module never creates scene objects or changes gameplay.

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
  const boundsValid = !!bounds && typeof bounds === "object" &&
    REQUIRED_BOUNDS.every(key => Number.isFinite(bounds[key])) &&
    bounds.minX < bounds.maxX && bounds.minZ < bounds.maxZ;

  if (!bounds || typeof bounds !== "object") {
    issues.push(issue("MISSING_BOUNDS", "District must define its map boundaries."));
  } else {
    for (const key of REQUIRED_BOUNDS) {
      if (!Number.isFinite(bounds[key])) {
        issues.push(issue("INVALID_BOUND_" + key.toUpperCase(), "Boundary " + key + " must be a finite number."));
      }
    }
    if (REQUIRED_BOUNDS.every(key => Number.isFinite(bounds[key])) &&
        (bounds.minX >= bounds.maxX || bounds.minZ >= bounds.maxZ)) {
      issues.push(issue("INVERTED_BOUNDS", "Minimum boundaries must be smaller than maximum boundaries."));
    }
  }

  const network = district.roadNetwork;
  if (!network || !Array.isArray(network.nodes) || !Array.isArray(network.segments)) {
    issues.push(issue("MISSING_ROAD_NETWORK", "District must define road nodes and connecting segments."));
  } else {
    const nodeIds = new Set();
    const nodeById = new Map();
    for (const node of network.nodes) {
      if (!node || typeof node.id !== "string" || !node.id.trim()) {
        issues.push(issue("INVALID_ROAD_NODE", "Every road node needs a unique id."));
        continue;
      }
      if (nodeIds.has(node.id)) issues.push(issue("DUPLICATE_ROAD_NODE", "Road node id is repeated: " + node.id));
      nodeIds.add(node.id);
      nodeById.set(node.id, node);
      if (!Number.isFinite(node.x) || !Number.isFinite(node.z)) {
        issues.push(issue("INVALID_ROAD_NODE_POSITION", "Road node " + node.id + " needs finite x and z coordinates."));
      } else if (boundsValid && (node.x < bounds.minX || node.x > bounds.maxX || node.z < bounds.minZ || node.z > bounds.maxZ)) {
        issues.push(issue("ROAD_NODE_OUT_OF_BOUNDS", "Road node " + node.id + " falls outside the district boundaries."));
      }
    }

    const segmentIds = new Set();
    const adjacency = new Map(Array.from(nodeIds, id => [id, []]));
    for (const segment of network.segments) {
      if (!segment || typeof segment.id !== "string" || !segment.id.trim()) {
        issues.push(issue("INVALID_ROAD_SEGMENT", "Every road segment needs an id."));
        continue;
      }
      if (segmentIds.has(segment.id)) issues.push(issue("DUPLICATE_ROAD_SEGMENT", "Road segment id is repeated: " + segment.id));
      segmentIds.add(segment.id);
      if (!nodeIds.has(segment.from) || !nodeIds.has(segment.to)) {
        issues.push(issue("BROKEN_ROAD_CONNECTION", "Road segment " + segment.id + " references a missing endpoint."));
        continue;
      }
      if (segment.from === segment.to) {
        issues.push(issue("ZERO_LENGTH_ROAD", "Road segment " + segment.id + " connects a node to itself."));
        continue;
      }
      if (segment.access !== undefined && !["public", "permission-controlled"].includes(segment.access)) {
        issues.push(issue("INVALID_ROAD_ACCESS", "Road segment " + segment.id + " has an unsupported access policy."));
      }
      if (segment.access === "permission-controlled" &&
          (typeof segment.requiredAccess !== "string" || !segment.requiredAccess.trim())) {
        issues.push(issue("MISSING_REQUIRED_ACCESS", "Restricted road segment " + segment.id + " must declare its required access tier."));
      }
      if (segment.gate !== undefined) {
        if (segment.access !== "permission-controlled" ||
            !segment.gate || typeof segment.gate.id !== "string" || !segment.gate.id.trim()) {
          issues.push(issue("INVALID_ACCESS_GATE", "A physical gate must have an id and belong to a permission-controlled road."));
        } else if (Number.isFinite(segment.gate.offset) && nodeIds.has(segment.from) && nodeIds.has(segment.to)) {
          const from = nodeById.get(segment.from), to = nodeById.get(segment.to);
          const length = Math.hypot(to.x - from.x, to.z - from.z);
          if (segment.gate.offset < 0 || segment.gate.offset >= length) {
            issues.push(issue("ACCESS_GATE_OUT_OF_SEGMENT", "Gate on segment " + segment.id + " must be placed within the road segment."));
          }
        } else if (segment.gate.offset !== undefined) {
          issues.push(issue("INVALID_ACCESS_GATE_OFFSET", "Gate offset on segment " + segment.id + " must be a finite number."));
        }
      }
      if (![ "vehicle", "pedestrian", "shared", "service" ].includes(segment.mode)) {
        issues.push(issue("INVALID_ROAD_MODE", "Road segment " + segment.id + " has an unsupported travel mode."));
      }
      if (segment.width !== undefined && (!Number.isFinite(segment.width) || segment.width <= 0)) {
        issues.push(issue("INVALID_ROAD_WIDTH", "Road segment " + segment.id + " must have a positive width."));
      }
      if (segment.lanes !== undefined && (!Number.isInteger(segment.lanes) || segment.lanes < 1)) {
        issues.push(issue("INVALID_LANE_COUNT", "Road segment " + segment.id + " must have a positive whole-number lane count."));
      }

      const from = nodeById.get(segment.from);
      const to = nodeById.get(segment.to);
      if (from && to && Number.isFinite(from.x) && Number.isFinite(from.z) &&
          Number.isFinite(to.x) && Number.isFinite(to.z) &&
          Math.hypot(to.x - from.x, to.z - from.z) < 0.01) {
        issues.push(issue("ZERO_LENGTH_ROAD", "Road segment " + segment.id + " is too short to build."));
      }
      adjacency.get(segment.from)?.push(segment.to);
      adjacency.get(segment.to)?.push(segment.from);
    }

    // A district road graph must be one connected network, not isolated road islands.
    if (nodeIds.size > 1 && network.segments.length > 0) {
      const first = nodeIds.values().next().value;
      const visited = new Set([first]);
      const queue = [first];
      while (queue.length) {
        const current = queue.shift();
        for (const next of adjacency.get(current) || []) {
          if (!visited.has(next)) {
            visited.add(next);
            queue.push(next);
          }
        }
      }
      if (visited.size !== nodeIds.size) {
        issues.push(issue("DISCONNECTED_ROAD_NETWORK", "Every road node must connect to the same district road network."));
      }
    } else if (nodeIds.size > 0 && network.segments.length === 0) {
      issues.push(issue("ROAD_NETWORK_HAS_NO_SEGMENTS", "Road nodes exist, but no road segments connect them."));
    }
  }


  // Parcel footprints must fit within the district boundary before buildings
  // are generated. Rotation is converted to an axis-aligned map footprint.
  if (Array.isArray(district.parcels)) {
    const parcelIds = new Set();
    for (const parcel of district.parcels) {
      if (!parcel || typeof parcel.id !== "string" || !parcel.id.trim()) {
        issues.push(issue("INVALID_PARCEL", "Every parcel needs a valid id."));
        continue;
      }
      if (parcelIds.has(parcel.id)) issues.push(issue("DUPLICATE_PARCEL_ID", "Parcel id is repeated: " + parcel.id));
      parcelIds.add(parcel.id);
      if (!parcel.center || !Number.isFinite(parcel.center.x) || !Number.isFinite(parcel.center.z)) {
        issues.push(issue("INVALID_PARCEL_CENTER", "Parcel " + parcel.id + " needs a finite map position."));
        continue;
      }
      const width = parcel.footprint?.width ?? 13;
      const depth = parcel.footprint?.depth ?? 11;
      const rotation = Number.isFinite(parcel.rotationY) ? parcel.rotationY : 0;
      if (!Number.isFinite(width) || !Number.isFinite(depth) || width <= 0 || depth <= 0) {
        issues.push(issue("INVALID_PARCEL_FOOTPRINT", "Parcel " + parcel.id + " needs positive footprint dimensions."));
        continue;
      }
      if (boundsValid) {
        const halfX = (Math.abs(Math.cos(rotation)) * width + Math.abs(Math.sin(rotation)) * depth) / 2;
        const halfZ = (Math.abs(Math.sin(rotation)) * width + Math.abs(Math.cos(rotation)) * depth) / 2;
        if (parcel.center.x - halfX < bounds.minX || parcel.center.x + halfX > bounds.maxX ||
            parcel.center.z - halfZ < bounds.minZ || parcel.center.z + halfZ > bounds.maxZ) {
          issues.push(issue("PARCEL_OUT_OF_BOUNDS", "Parcel " + parcel.id + " extends beyond the district boundary."));
        }
      }
    }
  }

  // Landscape zones must remain inside the district and clear of parcel footprints.
  if (Array.isArray(district.landscapeZones)) {
    const zoneIds = new Set();
    for (const zone of district.landscapeZones) {
      if (!zone || typeof zone.id !== "string" || !zone.id.trim()) {
        issues.push(issue("INVALID_LANDSCAPE_ZONE", "Every landscape zone needs a valid id."));
        continue;
      }
      if (zoneIds.has(zone.id)) issues.push(issue("DUPLICATE_LANDSCAPE_ZONE", "Landscape zone id is repeated: " + zone.id));
      zoneIds.add(zone.id);
      if (!zone.center || !Number.isFinite(zone.center.x) || !Number.isFinite(zone.center.z) ||
          !Number.isFinite(zone.width) || !Number.isFinite(zone.depth) || zone.width <= 0 || zone.depth <= 0) {
        issues.push(issue("INVALID_LANDSCAPE_ZONE_SIZE", "Landscape zone " + zone.id + " needs a finite center and positive dimensions."));
        continue;
      }
      const minX = zone.center.x - zone.width / 2, maxX = zone.center.x + zone.width / 2;
      const minZ = zone.center.z - zone.depth / 2, maxZ = zone.center.z + zone.depth / 2;
      if (boundsValid && (minX < bounds.minX || maxX > bounds.maxX || minZ < bounds.minZ || maxZ > bounds.maxZ)) {
        issues.push(issue("LANDSCAPE_ZONE_OUT_OF_BOUNDS", "Landscape zone " + zone.id + " extends beyond district boundaries."));
      }
      for (const parcel of district.parcels || []) {
        if (!parcel?.center || !Number.isFinite(parcel.center.x) || !Number.isFinite(parcel.center.z)) continue;
        const parcelWidth = parcel.footprint?.width ?? 13;
        const parcelDepth = parcel.footprint?.depth ?? 11;
        const angle = Number.isFinite(parcel.rotationY) ? parcel.rotationY : 0;
        const halfX = (Math.abs(Math.cos(angle)) * parcelWidth + Math.abs(Math.sin(angle)) * parcelDepth) / 2;
        const halfZ = (Math.abs(Math.sin(angle)) * parcelWidth + Math.abs(Math.cos(angle)) * parcelDepth) / 2;
        if (minX < parcel.center.x + halfX && maxX > parcel.center.x - halfX &&
            minZ < parcel.center.z + halfZ && maxZ > parcel.center.z - halfZ) {
          issues.push(issue("LANDSCAPE_PARCEL_OVERLAP", "Landscape zone " + zone.id + " overlaps parcel " + parcel.id + "."));
        }
      }
    }
  }

  if (district.accessTiers !== undefined) {
    if (!Array.isArray(district.accessTiers)) {
      issues.push(issue("INVALID_ACCESS_TIERS", "District access tiers must be an array."));
    } else {
      const tierIds = new Set();
      for (const tier of district.accessTiers) {
        if (!tier || typeof tier.id !== "string" || !tier.id.trim() ||
            !Number.isInteger(tier.rank) || tier.rank < 0) {
          issues.push(issue("INVALID_ACCESS_TIER", "Each access tier needs a unique id and a non-negative whole-number rank."));
          continue;
        }
        if (tierIds.has(tier.id)) issues.push(issue("DUPLICATE_ACCESS_TIER", "Access tier id is repeated: " + tier.id));
        tierIds.add(tier.id);
      }
      for (const segment of district.roadNetwork?.segments || []) {
        if (segment.access === "permission-controlled" && !tierIds.has(segment.requiredAccess)) {
          issues.push(issue("UNKNOWN_REQUIRED_ACCESS_TIER", "Road segment " + segment.id + " references an access tier not declared by the district."));
        }
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
