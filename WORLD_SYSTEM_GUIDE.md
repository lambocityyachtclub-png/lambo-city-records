# LAMBO CITY World System

The World System is the reusable foundation for adding named districts without hand-building every road, parcel, and connection. In the development branch, the approved Conference Center blueprint is initialized by `main.js` after the live scene and collision system are ready. The generated district streams between detailed geometry and lightweight distant proxies. Production remains unchanged until the draft pull request is reviewed and merged.

## Main pieces

- `worldDistrictSchema.js` checks district data before it can be registered.
- `worldDistrictFactory.js` compiles compact road-loop and parcel-band recipes into connected district blueprints.
- `worldSystem.js` stores districts, builds/removes their generated scene roots, manages access gates, and routes between districts.
- `vehicleRoadController.js` provides road-constrained acceleration, steering, braking, swept movement, and full U-turn execution for player-driven or AI vehicle modules.
- `worldBuilder.js` creates road surfaces, junctions, and sidewalks as instanced batches, plus parcel geometry and optional collision blockers.
- `worldTerrainBuilder.js` creates the district ground, colored grade surfaces, raised/lowered transitions, and low-cost planting. Terrain mesh resolution is capped at 192×192 segments per district; `worldTerrainMath.js` supplies cached terrain, road, and sidewalk height queries.
- `worldParcelBuilder.js` builds the nearest parcel archetypes in detail and batches distant parcel silhouettes into instanced meshes. Generated parcel details do not cast individual dynamic shadows by default, reducing iPad rendering cost.
- `worldDistrictProxyBuilder.js` creates very low-cost far-distance district proxies with instanced roads, landmark silhouettes, buildings, and park patches.
- `worldAccessGate.js` creates physical gates and updates their collision state when an access tier is granted.
- `worldConnectionBuilder.js` creates optional instanced road/sidewalk geometry for explicitly verified land connectors between districts; it refuses water crossings.
- `worldNavigation.js` provides A* routing inside one district and across registered district connectors.
- `worldDistrictStreaming.js` keeps distant districts visible as far proxies, swaps to full district detail near the player, and returns to the proxy before removing full detail. Separate distance bands prevent flicker and blank gaps.
- Nearby parcel detail follows the player inside large districts; detailed parcel meshes are grouped by material and geometry into a small number of instanced draws. The detailed parcel budget is capped independently from the instanced distant parcel batches.
- `worldSystemHost.js` is registered with `main.js` and `engine.js` as the runtime bridge. It publishes `window.__lamboCityWorldSystem`; `main.js` deliberately initializes the approved Conference Center blueprint after the scene and collision system are ready. New districts remain opt-in and are not automatically added just because a blueprint file exists.
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

An urban park is walkable and does not receive a building collision blocker. The coastal-villa archetype now includes a detailed architectural pass: recessed upper massing, divided ocean glazing, metal facade fins, usable terraces with railings, private garage and entry, roof parapets, pergola, and planting beds. Apartment and retail archetypes remain procedural massing/detail templates and can receive their own later architecture passes.

## District data

For repeatable neighborhoods, start with `createDistrictFromRecipe(recipe)`. The factory supports either a rectangular perimeter loop with optional junctions and parcel bands, or a rectangular street grid with automatically generated blocks and parcel centers. Both can include pedestrian routes and a restricted service entry. To protect iPad memory and frame time, a single grid is limited to 16 rows by 16 columns, loop recipes to 64 extra junctions, and parcel-band recipes to 256 parcels. The factory generates road nodes/segments and parcel positions; the schema then checks the result before registration. Use a hand-authored blueprint only when a district needs a custom landmark or unusual road layout.

A district blueprint contains:

- A unique `id`, a readable `name`, and rectangular `bounds`.
- A `roadNetwork` with unique nodes and connected vehicle/service segments plus a separately connected pedestrian network. The validator checks each travel mode independently, so a sidewalk can connect around a restricted road without inventing an unsafe vehicle-lane crossing.
- Optional `navigationOnly: true` segments for pedestrian or other route links that must not generate another road surface.
- Optional `terrainZones` with center, width, depth, edge elevation, top elevation, transition width, and a surface color.
- Optional `landscapeZones` for small planted courtyards.
- `parcels` with center, footprint, style, and optional rotation/floor count.
- `accessTiers` and restricted-road metadata.

Terrain zones must stay within the district, avoid parcel footprints, and not overlap one another. The validator also checks rotated parcel footprints against road and sidewalk corridors, landscape planting density, and color values. Terrain zones receive their own low-poly finish meshes and use the same height formula as the underlying terrain. Landscape courtyards follow their local terrain elevation and use instanced low-poly planting to keep draw calls controlled. `getDistrictAtPosition(x, z)` identifies the registered district under a world coordinate, and `getGroundHeightAt(x, z)` returns its sampled terrain height or the road/sidewalk top where appropriate. The runtime host exposes the same coordinate-based queries. `player.js` uses them only while the host is explicitly active, adjusting player height over generated ground, roads, and sidewalks; when the host is inactive, the existing player floor behavior is unchanged.

## Boardwalk-to-Convention street and sidewalk tie-in

The first district uses the mapped Boardwalk street and sidewalk endpoints rather than creating a visually adjacent but disconnected path. The service road begins at the mapped Boardwalk road edge with a small geometry overlap and grades from the mapped street surface (0.66) to the Convention boulevard road surface (0.77). A dedicated pedestrian spur joins the existing north Boardwalk sidewalk (top 0.70) to the Convention south sidewalk (top 0.82) on the west side of the gated service lane. The spur is its own physical sidewalk surface; the service lane does not generate a second overlapping sidewalk. The route stays outside the vehicle lane, and height sampling follows the full ramp.

## Vehicle-only road rules and turning space

Vehicle road checks are separate from pedestrian ground-height checks. Only permitted vehicle, shared, or authorized service segments count as drivable. Pedestrian-only routes and sidewalks are excluded. Vehicle footprint checks sample the center, four corners, and side midpoints. Swept movement checks sample the whole path between the current and proposed position at short intervals, so a fast move cannot skip over the curb boundary. `VehicleRoadController` applies acceleration, steering, braking, and those swept checks; it rejects an unsafe move and brakes the vehicle before its footprint crosses the road edge. It can also execute a prevalidated 180-degree U-turn path. Permission-controlled and gated service roads require the matching permission and an open physical gate.

The Conference Center boulevard has 18×18 map-unit U-turn aprons at the two north boulevard corners. The south corners use 14×14 turning pads for ordinary cornering, while the two north aprons provide the larger dedicated full U-turn space. Raised curb strips define the vehicle edge and stop before the aprons and intersections; the sidewalks are set back so turning pavement does not consume the pedestrian route. The default passenger-car planning envelope is approximately 16.1×14.7 map units for a 4.8×2.1-unit car with a 6.5-unit turning radius; both 18×18 U-turn aprons exceed that envelope. A full 180-degree swept U-turn path is sampled against the actual drivable surface, including the vehicle footprint between points; a dimension-only apron check is not treated as proof that a turn is safe.

Current vehicle integration boundary: the road-constrained controller is implemented and exposed through the World System host for both AI and player-driven vehicles. The existing `cars.js` display-car feature remains disabled, so no drivable car has been activated in the live scene yet. This keeps the road-safety system ready without unexpectedly changing the current player controls or adding unapproved car traffic.

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

In the development branch, the live scene now uses the World System for Conference Center terrain, road and sidewalk surfaces, raised curbs, verges, the gated service approach, and villa parcels. The legacy district module retains the approved arena landmark shell and its arrival plaza, avoiding duplicate roads and villas. The host supplies ground-height, routing, access-gate, and vehicle-road checks; the player follows generated ground, road, and sidewalk heights while the host is active. The generated preview remains a separate validation harness. The car-driving controller is still a separate implementation task: the existing decorative car module remains disabled, so these road rules do not yet move an in-game vehicle. Production is not changed by this development-branch integration.
