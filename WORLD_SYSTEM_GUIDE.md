# LAMBO CITY World System

The World System is the reusable foundation for adding named districts without hand-building every road, parcel, and connection. It is opt-in: registering a district does not build it, and the current system is not started by the live game.

## Main pieces

- `worldDistrictSchema.js` checks district data before it can be registered.
- `worldSystem.js` stores districts, builds/removes their generated scene roots, manages access gates, and routes between districts.
- `worldBuilder.js` creates road surfaces, junctions, sidewalks, parcel geometry, and optional collision blockers.
- `worldTerrainBuilder.js` creates the district ground, raised/lowered grade transitions, low-cost planting, and ground-height samples.
- `worldParcelBuilder.js` builds parcel archetypes.
- `worldAccessGate.js` creates physical gates and updates their collision state when an access tier is granted.
- `worldNavigation.js` provides A* routing inside one district and across registered district connectors.
- `worldDistrictStreaming.js` builds nearby registered districts on demand and removes their geometry after the player leaves, using separate in/out distances to prevent flicker.
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

A district blueprint contains:

- A unique `id`, a readable `name`, and rectangular `bounds`.
- A `roadNetwork` with unique nodes and connected segments.
- Optional `navigationOnly: true` segments for pedestrian or other route links that must not generate another road surface.
- Optional `terrainZones` with center, width, depth, edge elevation, top elevation, and transition width.
- Optional `landscapeZones` for small planted courtyards.
- `parcels` with center, footprint, style, and optional rotation/floor count.
- `accessTiers` and restricted-road metadata.

Terrain zones must stay within the district, avoid parcel footprints, and not overlap one another. The validator also checks rotated parcel footprints against road and sidewalk corridors. The height sampler uses the same transition formula as the generated terrain mesh.

## Access tiers and gates

The first blueprint declares three tiers:

1. `public` — open streets and promenades.
2. `resident` — residents and invited guests.
3. `service` — authorized maintenance and emergency access.

A restricted segment uses `access: "permission-controlled"` and a `requiredAccess` tier. Add a `gate` definition when a physical barrier is needed. The gate starts closed, and `setGateAccess(districtId, gateId, permissions)` opens it only when the required tier is present. The gate collider is removed while open and restored when closed.

These tiers are an access-control foundation, not yet connected to player profiles, ownership, invitations, or account credentials.

## Connections and routing

Use `registerConnection` to connect a node in one registered district to a node in another. Connections are route-graph links; they do not automatically create a bridge, road mesh, or water crossing. Physical connector geometry must be explicitly designed and validated.

Use `findRoute` for one district and `findWorldRoute` for a route across registered districts. Route modes are vehicle, pedestrian, and service. Restricted edges are only included when the caller supplies the required permission.

## Safe build workflow

1. Add or revise a district blueprint.
2. Validate it with `registerDistrict`.
3. Register only explicitly designed inter-district connectors.
4. Build it in the isolated preview and run the preview assertions.
5. Review the complete generated area on the primary iPad target.
6. Only after the combined review, plan any live-game integration.

Do not wire new districts into engine startup by default. Keep generation on demand, preserve existing approved structures, and avoid loading distant district detail at initial startup. The streaming controller limits how many districts it builds or removes in one update to reduce sudden work spikes.

## Current boundary

The World System and its generated preview are separate from live gameplay. The current district preview includes a guide for the existing arena footprint, but generated roads, gates, parcel geometry, and collision are not yet active in the live city. Terrain grades are local controlled transitions; surveyed shoreline contours, bridges, piers, final building architecture, live grounding, and full city integration remain later phases.
