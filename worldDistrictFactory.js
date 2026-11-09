// LAMBO CITY — compact district recipe compiler
// Turns a small layout recipe into a complete data-only district blueprint.
// Geometry, collision, and routing are generated later by WorldSystem.
// Hard limits keep a single recipe safe for iPad-class memory and frame budgets.
const MAX_GRID_ROWS = 16;
const MAX_GRID_COLUMNS = 16;
const MAX_LOOP_JUNCTIONS = 64;
const MAX_DISTRICT_PARCELS = 256;
function finite(value, label) {
  if (!Number.isFinite(value)) throw new Error("District recipe requires a finite " + label + ".");
  return value;
}

export function createGridDistrictFromRecipe(recipe) {
  if (!recipe || typeof recipe.id !== "string" || !recipe.id.trim() ||
      typeof recipe.name !== "string" || !recipe.name.trim()) {
    throw new Error("Grid district recipe requires an id and name.");
  }
  const bounds = recipe.bounds, grid = recipe.roadGrid;
  if (!bounds || !grid?.bounds) throw new Error("Grid recipe requires district and roadGrid bounds.");
  for (const box of [bounds, grid.bounds]) {
    if (!["minX", "maxX", "minZ", "maxZ"].every(key => Number.isFinite(box[key])) ||
        box.minX >= box.maxX || box.minZ >= box.maxZ) {
      throw new Error("Grid recipe contains invalid bounds.");
    }
  }
  const roadWidth = grid.width === undefined ? 8 : finite(grid.width, "grid road width");
  const sidewalkWidth = grid.sidewalkWidth === undefined ? 3 : finite(grid.sidewalkWidth, "grid sidewalk width");
  const rows = grid.rows, columns = grid.columns;
  if (roadWidth <= 0 || sidewalkWidth < 0 || !Number.isInteger(rows) || rows < 2 || rows > MAX_GRID_ROWS ||
      !Number.isInteger(columns) || columns < 2 || columns > MAX_GRID_COLUMNS) {
    throw new Error("Grid recipe needs positive road dimensions and between 2 and " + MAX_GRID_ROWS + " rows and columns.");
  }
  const margin = roadWidth / 2 + sidewalkWidth + 1;
  if (grid.bounds.minX - margin < bounds.minX || grid.bounds.maxX + margin > bounds.maxX ||
      grid.bounds.minZ - margin < bounds.minZ || grid.bounds.maxZ + margin > bounds.maxZ) {
    throw new Error("Grid roads and sidewalks need clearance inside district bounds.");
  }

  const xPositions = Array.from({ length: columns }, (_, index) =>
    grid.bounds.minX + (grid.bounds.maxX - grid.bounds.minX) * index / (columns - 1));
  const zPositions = Array.from({ length: rows }, (_, index) =>
    grid.bounds.minZ + (grid.bounds.maxZ - grid.bounds.minZ) * index / (rows - 1));
  const nodes = [], segments = [], nodeId = (row, column) => "grid-r" + row + "-c" + column;
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      nodes.push({ id: nodeId(row, column), x: xPositions[column], z: zPositions[row] });
    }
  }

  const addRoad = (id, from, to) => {
    segments.push({ id, from, to, mode: grid.mode || "vehicle", width: roadWidth, lanes: Number.isInteger(grid.lanes) ? grid.lanes : 2 });
    if (grid.pedestrianRoutes !== false) {
      segments.push({ id: id + "-walk", from, to, mode: "pedestrian", width: roadWidth, navigationOnly: true });
    }
  };
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns - 1; column++) {
      addRoad("grid-horizontal-" + row + "-" + column, nodeId(row, column), nodeId(row, column + 1));
    }
  }
  for (let column = 0; column < columns; column++) {
    for (let row = 0; row < rows - 1; row++) {
      addRoad("grid-vertical-" + row + "-" + column, nodeId(row, column), nodeId(row + 1, column));
    }
  }

  const spacingX = (grid.bounds.maxX - grid.bounds.minX) / (columns - 1);
  const spacingZ = (grid.bounds.maxZ - grid.bounds.minZ) / (rows - 1);
  const parcelMargin = Number.isFinite(grid.parcelMargin) ? Math.max(0, grid.parcelMargin) : 2;
  const footprint = grid.parcelFootprint || {
    width: spacingX - roadWidth - sidewalkWidth * 2 - parcelMargin * 2,
    depth: spacingZ - roadWidth - sidewalkWidth * 2 - parcelMargin * 2
  };
  if (!Number.isFinite(footprint.width) || !Number.isFinite(footprint.depth) ||
      footprint.width < 4 || footprint.depth < 4) {
    throw new Error("Grid blocks are too small for the requested parcel footprints.");
  }
  const styles = Array.isArray(grid.parcelStyles) && grid.parcelStyles.length
    ? grid.parcelStyles : ["luxury-apartment", "retail-promenade", "urban-park"];
  const parcels = [];
  for (let row = 0; row < rows - 1; row++) {
    for (let column = 0; column < columns - 1; column++) {
      const index = row * (columns - 1) + column;
      parcels.push({
        id: "grid-parcel-" + row + "-" + column,
        center: {
          x: (xPositions[column] + xPositions[column + 1]) / 2,
          z: (zPositions[row] + zPositions[row + 1]) / 2
        },
        footprint: { width: footprint.width, depth: footprint.depth },
        style: styles[index % styles.length],
        rotationY: Number.isFinite(grid.rotationY) ? grid.rotationY : 0,
        ...(Number.isFinite(grid.floors) ? { floors: grid.floors } : {}),
        ...(grid.use ? { use: grid.use } : {})
      });
    }
  }

  if (recipe.serviceAccess) {
    const access = recipe.serviceAccess;
    if (!access.entry || !access.arrival || typeof access.connectTo !== "string") {
      throw new Error("Grid service access requires entry, arrival, and connectTo.");
    }
    const knownNodes = new Set(nodes.map(node => node.id));
    if (!knownNodes.has(access.connectTo)) throw new Error("Grid service access references an unknown intersection.");
    nodes.push(
      { id: access.entry.id, x: finite(access.entry.x, "service entry x"), z: finite(access.entry.z, "service entry z") },
      { id: access.arrival.id, x: finite(access.arrival.x, "service arrival x"), z: finite(access.arrival.z, "service arrival z") }
    );
    const requiredAccess = access.requiredAccess || "service";
    segments.push({
      id: "grid-restricted-service-entry", from: access.entry.id, to: access.connectTo,
      mode: "service", width: Number.isFinite(access.width) ? access.width : 8,
      access: "permission-controlled", requiredAccess,
      ...(access.gate ? { gate: { id: access.gate.id, offset: Number.isFinite(access.gate.offset) ? access.gate.offset : 1.4 } } : {})
    });
    segments.push({
      id: "grid-restricted-service-arrival", from: access.connectTo, to: access.arrival.id,
      mode: "service", width: Number.isFinite(access.width) ? access.width : 8,
      access: "permission-controlled", requiredAccess
    });
  }

  return {
    id: recipe.id,
    name: recipe.name,
    type: recipe.type || "grid-district",
    bounds: { ...bounds },
    roadNetwork: { sidewalkWidth, nodes, segments },
    parcels,
    landmarks: Array.isArray(recipe.landmarks) ? recipe.landmarks : [],
    terrainZones: Array.isArray(recipe.terrainZones) ? recipe.terrainZones : [],
    landscapeZones: Array.isArray(recipe.landscapeZones) ? recipe.landscapeZones : [],
    accessTiers: Array.isArray(recipe.accessTiers) ? recipe.accessTiers : []
  };
}

export function createDistrictFromRecipe(recipe) {
  if (recipe?.roadLayout === "grid" || recipe?.roadGrid) return createGridDistrictFromRecipe(recipe);
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
  if (junctions.length > MAX_LOOP_JUNCTIONS) throw new Error("A road loop may contain at most " + MAX_LOOP_JUNCTIONS + " junctions.");
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
    if (parcels.length + count > MAX_DISTRICT_PARCELS) {
      throw new Error("A district recipe may generate at most " + MAX_DISTRICT_PARCELS + " parcels.");
    }
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

export default { createDistrictFromRecipe, createGridDistrictFromRecipe };
