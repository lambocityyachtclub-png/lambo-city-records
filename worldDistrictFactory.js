// LAMBO CITY — compact district recipe compiler
// Turns a small layout recipe into a complete data-only district blueprint.
// Geometry, collision, and routing are generated later by WorldSystem.
function finite(value, label) {
  if (!Number.isFinite(value)) throw new Error("District recipe requires a finite " + label + ".");
  return value;
}

export function createDistrictFromRecipe(recipe) {
  if (!recipe || typeof recipe.id !== "string" || !recipe.id.trim()) {
    throw new Error("District recipe requires a unique id.");
  }
  if (typeof recipe.name !== "string" || !recipe.name.trim()) {
    throw new Error("District recipe requires a readable name.");
  }
  const bounds = recipe.bounds;
  if (!bounds || !["minX", "maxX", "minZ", "maxZ"].every(key => Number.isFinite(bounds[key])) ||
      bounds.minX >= bounds.maxX || bounds.minZ >= bounds.maxZ) {
    throw new Error("District recipe requires valid world-space bounds.");
  }

  const loop = recipe.roadLoop;
  if (!loop?.bounds) throw new Error("District recipe requires a rectangular roadLoop.bounds.");
  const loopBounds = loop.bounds;
  if (!["minX", "maxX", "minZ", "maxZ"].every(key => Number.isFinite(loopBounds[key])) ||
      loopBounds.minX >= loopBounds.maxX || loopBounds.minZ >= loopBounds.maxZ) {
    throw new Error("Road loop bounds are invalid.");
  }
  if (loopBounds.minX < bounds.minX || loopBounds.maxX > bounds.maxX ||
      loopBounds.minZ < bounds.minZ || loopBounds.maxZ > bounds.maxZ) {
    throw new Error("Road loop must remain inside the district bounds.");
  }

  const roadWidth = loop.width === undefined ? 9 : finite(loop.width, "road width");
  const sidewalkWidth = loop.sidewalkWidth === undefined ? 3 : finite(loop.sidewalkWidth, "sidewalk width");
  if (roadWidth <= 0 || sidewalkWidth < 0) throw new Error("Road and sidewalk widths must be valid.");
  const nodes = [], segments = [], nodeIds = new Set();
  const addNode = node => {
    if (nodeIds.has(node.id)) throw new Error("Duplicate generated road node: " + node.id);
    nodeIds.add(node.id);
    nodes.push(node);
  };
  const addSegment = segment => segments.push(segment);

  const corners = {
    southWest: { id: "boulevard-south-west", x: loopBounds.minX, z: loopBounds.minZ },
    southEast: { id: "boulevard-south-east", x: loopBounds.maxX, z: loopBounds.minZ },
    northEast: { id: "boulevard-north-east", x: loopBounds.maxX, z: loopBounds.maxZ },
    northWest: { id: "boulevard-north-west", x: loopBounds.minX, z: loopBounds.maxZ }
  };

  const junctions = Array.isArray(loop.junctions) ? loop.junctions : [];
  for (const junction of junctions) {
    if (!junction || typeof junction.id !== "string" || !["south", "east", "north", "west"].includes(junction.side)) {
      throw new Error("Road-loop junctions need an id and a valid side.");
    }
    const position = finite(junction.position, "junction position");
    let node;
    if (junction.side === "south" || junction.side === "north") {
      if (position <= loopBounds.minX || position >= loopBounds.maxX) throw new Error("Junction must lie inside its road-loop side.");
      node = { id: junction.id, x: position, z: junction.side === "south" ? loopBounds.minZ : loopBounds.maxZ };
    } else {
      if (position <= loopBounds.minZ || position >= loopBounds.maxZ) throw new Error("Junction must lie inside its road-loop side.");
      node = { id: junction.id, x: junction.side === "west" ? loopBounds.minX : loopBounds.maxX, z: position };
    }
    addNode(node);
  }

  Object.values(corners).forEach(addNode);
  const sideDefinitions = [
    { side: "south", start: corners.southWest, end: corners.southEast, sort: (a, b) => a.x - b.x },
    { side: "east", start: corners.southEast, end: corners.northEast, sort: (a, b) => a.z - b.z },
    { side: "north", start: corners.northEast, end: corners.northWest, sort: (a, b) => b.x - a.x },
    { side: "west", start: corners.northWest, end: corners.southWest, sort: (a, b) => b.z - a.z }
  ];
  for (const side of sideDefinitions) {
    const sideNodes = [side.start, ...junctions
      .filter(item => item.side === side.side)
      .map(item => nodes.find(node => node.id === item.id))
      .sort(side.sort), side.end];
    for (let index = 0; index < sideNodes.length - 1; index++) {
      addSegment({
        id: side.side + "-boulevard-" + (index + 1),
        from: sideNodes[index].id,
        to: sideNodes[index + 1].id,
        mode: loop.mode || "vehicle",
        width: roadWidth,
        lanes: Number.isInteger(loop.lanes) ? loop.lanes : 2,
        loop: true
      });
    }
  }

  if (loop.pedestrianLoop !== false) {
    const offset = roadWidth / 2 + sidewalkWidth / 2;
    const walkNodes = [
      { id: "walk-south-west", x: loopBounds.minX - offset, z: loopBounds.minZ - offset, surface: "sidewalk" },
      { id: "walk-south-east", x: loopBounds.maxX + offset, z: loopBounds.minZ - offset, surface: "sidewalk" },
      { id: "walk-north-east", x: loopBounds.maxX + offset, z: loopBounds.maxZ + offset, surface: "sidewalk" },
      { id: "walk-north-west", x: loopBounds.minX - offset, z: loopBounds.maxZ + offset, surface: "sidewalk" }
    ];
    walkNodes.forEach(addNode);
    for (let index = 0; index < walkNodes.length; index++) {
      addSegment({
        id: "pedestrian-loop-" + (index + 1),
        from: walkNodes[index].id,
        to: walkNodes[(index + 1) % walkNodes.length].id,
        mode: "pedestrian",
        navigationOnly: true
      });
    }
    addSegment({
      id: "pedestrian-loop-connector",
      from: corners.southWest.id,
      to: walkNodes[0].id,
      mode: "pedestrian",
      navigationOnly: true
    });
  }

  if (recipe.serviceAccess) {
    const access = recipe.serviceAccess;
    const entry = access.entry, arrival = access.arrival;
    if (!entry || !arrival || typeof access.connectTo !== "string") {
      throw new Error("Service access requires entry, arrival, and connectTo node definitions.");
    }
    addNode({ id: entry.id, x: finite(entry.x, "service entry x"), z: finite(entry.z, "service entry z") });
    addNode({ id: arrival.id, x: finite(arrival.x, "service arrival x"), z: finite(arrival.z, "service arrival z") });
    if (!nodeIds.has(access.connectTo)) throw new Error("Service access references an unknown road junction.");
    const requiredAccess = access.requiredAccess || "service";
    addSegment({
      id: "restricted-service-entry",
      from: entry.id,
      to: access.connectTo,
      mode: "service",
      width: Number.isFinite(access.width) ? access.width : 8,
      access: "permission-controlled",
      requiredAccess,
      gate: access.gate ? {
        id: access.gate.id,
        offset: Number.isFinite(access.gate.offset) ? access.gate.offset : 1.4
      } : undefined
    });
    addSegment({
      id: "restricted-service-arrival",
      from: access.connectTo,
      to: arrival.id,
      mode: "service",
      width: Number.isFinite(access.width) ? access.width : 8,
      access: "permission-controlled",
      requiredAccess
    });
  }

  const parcels = [];
  for (const band of recipe.parcelBands || []) {
    if (!band || !["north", "south", "east", "west"].includes(band.side)) {
      throw new Error("Parcel bands must use north, south, east, or west.");
    }
    const count = band.count === undefined ? 0 : band.count;
    if (!Number.isInteger(count) || count < 0) throw new Error("Parcel-band count must be a non-negative whole number.");
    const start = finite(band.start, "parcel-band start");
    const spacing = finite(band.spacing, "parcel-band spacing");
    if (count > 1 && spacing === 0) throw new Error("Parcel-band spacing cannot be zero when generating multiple parcels.");
    const fixed = finite(band.fixed, "parcel-band fixed coordinate");
    const styles = Array.isArray(band.styles) && band.styles.length ? band.styles : [band.style || "coastal-villa"];
    const footprint = band.footprint || { width: 13, depth: 11 };
    if (!Number.isFinite(footprint.width) || !Number.isFinite(footprint.depth) || footprint.width <= 0 || footprint.depth <= 0) {
      throw new Error("Parcel-band footprints need positive width and depth.");
    }
    for (let index = 0; index < count; index++) {
      const along = start + spacing * index;
      const center = band.side === "west" || band.side === "east"
        ? { x: fixed, z: along }
        : { x: along, z: fixed };
      parcels.push({
        id: (band.idPrefix || band.side + "-parcel") + "-" + (index + 1),
        center,
        footprint: { width: footprint.width, depth: footprint.depth },
        style: styles[index % styles.length],
        rotationY: Number.isFinite(band.rotationY) ? band.rotationY : 0,
        ...(Number.isFinite(band.floors) ? { floors: band.floors } : {}),
        ...(band.use ? { use: band.use } : {})
      });
    }
  }

  return {
    id: recipe.id,
    name: recipe.name,
    type: recipe.type || "district",
    bounds: { ...bounds },
    roadNetwork: { sidewalkWidth, nodes, segments },
    parcels,
    landmarks: Array.isArray(recipe.landmarks) ? recipe.landmarks : [],
    terrainZones: Array.isArray(recipe.terrainZones) ? recipe.terrainZones : [],
    landscapeZones: Array.isArray(recipe.landscapeZones) ? recipe.landscapeZones : [],
    accessTiers: Array.isArray(recipe.accessTiers) ? recipe.accessTiers : []
  };
}

export default { createDistrictFromRecipe };
