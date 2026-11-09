# LAMBO CITY World System

The World System is the reusable foundation for adding named districts without hand-building every road, parcel, and connection. It is opt-in: registering a district does not build it, and the current system is not started by the live game.

## Main pieces

- `worldDistrictSchema.js` checks district data before it can be registered.
- `worldDistrictFactory.js` compiles compact road-loop and parcel-band recipes into connected district blueprints.
- `worldSystem.js` stores districts, builds/removes their generated scene roots, manages access gates, and routes between districts.
- `worldBuilder.js` creates road surfaces, junctions, and sidewalks as instanced batches, plus parcel geometry and optional collision blockers.
- `worldTerrainBuilder.js` creates the district ground, colored grade surfaces, raised/lowered transitions, and low-cost planting. Terrain mesh resolution is capped at 192×192 segments per district; `worldTerrainMath.js` supplies cached terrain, road, and sidewalk height queries.
- `worldParcelBuilder.js` builds the nearest parcel archetypes in detail and batches distant parcel silhouettes into instanced meshes. Generated parcel details do not cast individual dynamic shadows by default, reducing iPad rendering cost.
- `worldDistrictProxyBuilder.js` creates very low-cost far-distance district proxies with instanced roads, landmark silhouettes, buildings, and park patches.
- `worldAccessGate.js` creates physical gates and updates their collision state when an access tier is granted.
- `worldConnectionBuilder.js` creates optional instanced road/sidewalk geometry for explicitly verified land connectors between districts; it refuses water crossings.
- `worldNavigation.js` provides A* routing inside one district and across registered district connectors.
- `worldDistrictStreaming.js` keeps distant districts visible as far proxies, swaps to full district detail near the player, and returns to the proxy before removing full detail. Separate distance bands prevent flicker and blank gaps.
- Nearby parcel detail follows the player inside large districts; detailed parcel meshes are grouped by material and geometry into a small number of instanced draws. The detailed parcel budget is capped independently from the instanced distant parcel batches.
- `worldSystemHost.js` is registered with `main.js` and `engine.js` as a lightweight, no-build bridge. It publishes the explicit `window.__lamboCityWorldSystem` API; only a deliberate `initialize()` call loads `worldSystemRuntime.js`, registers blueprints/recipes, and enables per-frame streaming updates.
- `worldDistricts/conferenceCenter.js` is the first district blueprint.
- `world-system-preview.html` is the isolated validation and browser-side check harness.
- `world-district-composer.html` is an isolated visual authoring tool for composing and regenerating neighborhoods from high-level briefs; it never writes to live gameplay.

## High-level district briefs

For a faster starting point, use `createDistrictFromBrief` or pass a `brief` to `createDistrictFromRecipe`. A brief describes the neighborhood rather than listing every road and parcel:

```js
const district = createDistrictFromRecipe({
  id: "beverly-shores",
  name: "Beverly Shores",
  brief: {
    character: "mixed-use",
    density: "medium",
    center: { x: 420, z: 260 },
    size: { width: 180, depth: 180 }
  }
});
```

Supported characters are `coastal`, `mixed-use`, `retail`, and `park`. Density presets create a 3×3, 4×4, or 5×5 street grid for low, medium, or high density. The composer chooses a matching parcel mix, road width, sidewalk width, and public/resident/service tier definitions. Center, dimensions, road widths, parcel styles, terrain zones, and landscape zones can be overridden. The result is still data-only and must pass `validateDistrict` before it can be registered or built.

The runtime host accepts the same brief through its explicit `registerDistrict` API after initialization. This creates a practical foundation for a future visual city-builder: a user can specify the neighborhood's identity, scale, and density without hand-authoring every intersection or parcel. It is a structured brief compiler, not a free-form natural-language AI prompt parser.

## Visual district composer

Open `world-district-composer.html` to use the visual authoring tool. It exposes the high-level brief fields—name, neighborhood character, density, width, and depth—then compiles and validates a new district and renders it with the same World System geometry builder. The controls also support touch-sized layouts and orbit/pinch/pan navigation. Each generated district brief can be copied or selected for reuse as a compact recipe. This is a development tool, not a live-game editor; it does not publish, save, or activate districts in the production city.

## Supported parcel styles

Set `style` on each parcel:

- `coastal-villa`
- `luxury-apartment`
- `retail-promenade`
- `urban-park`

An urban park is walkable and does not receive a building collision blocker. These are first-pass massing archetypes; final architecture and detail passes remain separate.

## District data

For repeatable neighborhoods, start with `createDistrictFromRecipe(recipe)`. The factory supports either a rectangular perimeter loop with optional junctions and parcel bands, or a rectangular street grid with automatically generated blocks and parcel centers. Both can include pedestrian routes and a restricted service entry. To protect iPad memory and frame time, a single grid is limited to 16 rows by 16 columns, loop recipes to 64 extra junctions, and parcel-band recipes to 256 parcels. The factory generates road nodes/segments and parcel positions; the schema then checks the result before registration. Use a hand-authored blueprint only when a district needs a custom landmark or unusual road layout.

A district blueprint contains:

- A unique `id`, a readable `name`, and rectangular `bounds`.
- A `roadNetwork` with unique nodes and connected segments.
- Optional `navigationOnly: true` segments for pedestrian or other route links that must not generate another road surface.
- Optional `terrainZones` with center, width, depth, edge elevation, top elevation, transition width, and a surface color.
- Optional `landscapeZones` for small planted courtyards.
- `parcels` with center, footprint, style, and optional rotation/floor count.
- `accessTiers` and restricted-road metadata.

Terrain zones must stay within the district, avoid parcel footprints, and not overlap one another. The validator also checks rotated parcel footprints against road and sidewalk corridors, landscape planting density, and color values. Terrain zones receive their own low-poly finish meshes and use the same height formula as the underlying terrain. Landscape courtyards follow their local terrain elevation and use instanced low-poly planting to keep draw calls controlled. `getDistrictAtPosition(x, z)` identifies the registered district under a world coordinate, and `getGroundHeightAt(x, z)` returns its sampled terrain height or the road/sidewalk top where appropriate. The runtime host exposes the same coordinate-based queries. `player.js` uses them only while the host is explicitly active, adjusting player height over generated ground, roads, and sidewalks; when the host is inactive, the existing player floor behavior is unchanged.

## Boardwalk-to-Convention street and sidewalk tie-in

The first district uses the mapped Boardwalk street and sidewalk endpoints rather than creating a visually adjacent but disconnected path. The service road starts exactly at the mapped Boardwalk road edge, with a small geometry overlap to avoid a seam, and grades from the mapped street surface (0.66) to the Convention boulevard road surface (0.77). The sidewalk connection uses a dedicated pedestrian strip on the west side of the gated service road, so pedestrians do not have to walk in or cross the vehicle lane. It joins the existing north Boardwalk sidewalk (top 0.70) to the south boulevard sidewalk (top 0.82) with a gradual ramp. The opposite service-road sidewalk remains on the east side. Ground-height sampling follows both road and sidewalk grades, including their endpoints.

## Vehicle-only road rules and turning space

Vehicle road checks are separate from pedestrian ground-height checks. Only permitted vehicle, shared, or authorized service segments count as drivable. Pedestrian-only routes and sidewalks are excluded. Vehicle footprint checks sample the center, four corners, and side midpoints. Swept movement checks sample the whole path between the current and proposed position at short intervals, so a fast move cannot skip over the curb boundary. The driving controller must reject or constrain a move if any sample leaves the drivable road or declared turning apron. Permission-controlled and gated service roads require the matching permission and an open physical gate.

The Conference Center boulevard declares 18×18 map-unit turning aprons at its two north corners, with the adjacent sidewalks set farther back so the widened turning pavement does not consume the footpath. Raised curb strips define the vehicle edge and stop before the turning aprons and intersections, leaving the curb returns open. The default passenger-car planning envelope is approximately 16.1×14.7 map units for a 4.8×2.1-unit car with a 6.5-unit turning radius; the 18×18 aprons provide additional clearance.

Important current limitation: `cars.js` currently creates parked decorative cars only; there is no player-controlled vehicle-driving controller in the existing game. These road-boundary and turn-space APIs are now exposed through the World System host for the driving controller to use. They do not falsely imply that vehicle driving is already implemented.

## Access tiers and gates

The first blueprint declares three tiers:

1. `public` — open streets and promenades.
2. `resident` — residents and invited guests.
3. `service` — authorized maintenance and emergency access.

A restricted segment uses `access: "permission-controlled"` and a `requiredAccess` tier. Add a `gate` definition when a physical barrier is needed. The gate starts closed, and `setGateAccess(districtId, gateId, permissions)` opens it only when the required tier is present. The gate collider is removed while open and restored when closed.

These tiers are an access-control foundation, not yet connected to player profiles, ownership, invitations, or account credentials.

## Connections and routing

Use `registerConnection` to connect a node in one registered district to a node in another. Connections are route-graph links; they do not automatically create a bridge, road mesh, or water crossing. Physical connector geometry must be explicitly designed and validated.

Use `findRoute` for one district and `findWorldRoute` for a route across registered districts. Route modes are vehicle, pedestrian, and service. Restricted edges are only included when the caller supplies the required permission. If a segment also has a physical gate, the route planner additionally requires that gate to be physically open; having a permission tier alone never routes a player through a closed barrier.

## Physical inter-district connectors

Connections remain route-only by default. To generate a visible connector, provide an explicit `physical` definition with `enabled: true`, `surface: "land"`, `surfaceVerified: true`, and a world-space `path` whose first and last points exactly match the registered endpoint nodes. The path may include intermediate waypoints to follow a surveyed road alignment. Width and sidewalk width can be specified; road and sidewalk sections are built as instanced batches.

The `surfaceVerified` flag is the map author's confirmation, not an automatic terrain or water survey. The builder rejects water surfaces and will not invent bridges, piers, or causeways. A future bridge must have its own explicitly designed geometry and clearance checks. Ground-height queries also follow the connector's road and sidewalk elevations outside district bounds, and stop returning those heights when the connector is removed. Removing either endpoint district or unregistering the connection disposes its connector geometry. The current second-district preview fixture remains route-only; it is not presented as a real physical city street.

## Safe build workflow

1. Add or revise a district blueprint.
2. Validate it with `registerDistrict`.
3. Register only explicitly designed inter-district connectors.
4. Build it in the isolated preview and run the preview assertions.
5. Review the complete generated area on the primary iPad target.
6. Only after the combined review, plan any live-game integration.

Do not register or build new districts at engine startup. The lightweight host may be present in the engine, but it does not load the runtime or create geometry until explicitly initialized. Keep generation on demand, preserve existing approved structures, and avoid loading distant district detail at initial startup. The streaming controller limits how many full districts and far proxies it builds or removes in one update to reduce sudden work spikes. The parcel-detail selector refreshes only after meaningful player movement and preserves the configured per-district detail budget. Distant parcel proxies are grouped by archetype into instanced meshes, and generated parcel detail avoids per-object dynamic shadow casting by default.

## Current boundary

The World System and its generated preview remain separate from live district geometry. The current district preview includes a guide for the existing arena footprint, but generated roads, gates, parcel geometry, and collision are not automatically active in the live city. The engine-registered host exposes an explicit API; the live player now follows generated ground, road, and sidewalk heights when that host is deliberately initialized. With the host inactive, current gameplay remains unchanged. Vehicle grounding is not yet connected. Surveyed shoreline contours, bridges, piers, final building architecture, and full city integration remain later phases.
