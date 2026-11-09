# LAMBO CITY World System

The World System is the reusable foundation for adding named districts without hand-building every road, parcel, and connection. It is opt-in: registering a district does not build it, and the current system is not started by the live game.

## Main pieces

- `worldDistrictSchema.js` checks district data before it can be registered.
- `worldDistrictFactory.js` compiles compact road-loop and parcel-band recipes into connected district blueprints.
- `worldSystem.js` stores districts, builds/removes their generated scene roots, manages access gates, and routes between districts.
- `worldBuilder.js` creates road surfaces, junctions, sidewalks, parcel geometry, and optional collision blockers.
- `worldTerrainBuilder.js` creates the district ground, colored grade surfaces, raised/lowered transitions, and low-cost planting; `worldTerrainMath.js` supplies cached terrain, road, and sidewalk height queries.
- `worldParcelBuilder.js` builds the nearest parcel archetypes in detail and batches distant parcel silhouettes into instanced meshes. Generated parcel details do not cast individual dynamic shadows by default, reducing iPad rendering cost.
- `worldDistrictProxyBuilder.js` creates very low-cost far-distance district proxies with instanced roads, landmark silhouettes, buildings, and park patches.
- `worldAccessGate.js` creates physical gates and updates their collision state when an access tier is granted.
- `worldNavigation.js` provides A* routing inside one district and across registered district connectors.
- `worldDistrictStreaming.js` keeps distant districts visible as far proxies, swaps to full district detail near the player, and returns to the proxy before removing full detail. Separate distance bands prevent flicker and blank gaps.
- Nearby parcel detail follows the player inside large districts; the detailed parcel budget is capped independently from the instanced distant parcel batches.
- `worldSystemRuntime.js` is the lazy bridge the engine can call later; it loads the system only when explicitly initialized, registers blueprints/recipes, and delegates per-frame streaming updates.
- `worldDistricts/conferenceCenter.js` is the first district blueprint.
- `world-system-preview.html` is the isolated preview and browser-side check harness.

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

Terrain zones must stay within the district, avoid parcel footprints, and not overlap one another. The validator also checks rotated parcel footprints against road and sidewalk corridors, landscape planting density, and color values. Terrain zones receive their own low-poly finish meshes and use the same height formula as the underlying terrain. Landscape courtyards follow their local terrain elevation and use instanced low-poly planting to keep draw calls controlled. `getDistrictAtPosition(x, z)` identifies the registered district under a world coordinate, and `getGroundHeightAt(x, z)` returns its sampled terrain height or the road/sidewalk top where appropriate. The runtime bridge exposes the same coordinate-based queries for a future player/vehicle grounding adapter.

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

## Safe build workflow

1. Add or revise a district blueprint.
2. Validate it with `registerDistrict`.
3. Register only explicitly designed inter-district connectors.
4. Build it in the isolated preview and run the preview assertions.
5. Review the complete generated area on the primary iPad target.
6. Only after the combined review, plan any live-game integration.

Do not wire new districts into engine startup by default. Keep generation on demand, preserve existing approved structures, and avoid loading distant district detail at initial startup. The runtime bridge must be explicitly initialized by the host engine; until then it adds no startup work. The streaming controller limits how many full districts and far proxies it builds or removes in one update to reduce sudden work spikes. The parcel-detail selector refreshes only after meaningful player movement and preserves the configured per-district detail budget. Distant parcel proxies are grouped by archetype into instanced meshes, and generated parcel detail avoids per-object dynamic shadow casting by default.

## Current boundary

The World System and its generated preview are separate from live gameplay. The current district preview includes a guide for the existing arena footprint, but generated roads, gates, parcel geometry, and collision are not yet active in the live city. Terrain grades and colored finish surfaces are generated from explicit zones, and the runtime exposes coordinate-based terrain/road/sidewalk height queries. Those queries are not yet connected to the live player or vehicle movement controller. Surveyed shoreline contours, bridges, piers, final building architecture, and full city integration remain later phases.
