# LAMBO CITY — Master City Blueprint

**Status:** Arena District master-plan revision; geometry implementation pending visual validation.
**Coordinate system:** Three.js world units; +X east/right, -X west/left, +Z inland/north, -Z ocean/stage.

## Design intent
LAMBO CITY is a modular luxury coastal entertainment city. Districts must be planned as connected infrastructure before buildings are added. Every district module consumes the shared `cityMap.js` registry and declares land, roads, sidewalks, buildings, entrances, water edges, and collision together.

## Protected existing anchors
| Feature | Position / extent | Planning treatment |
|---|---|---|
| Marina / boardwalk street | X -45 to +45; Z 42–50; center Z 46; 8 units wide | Preserve; pedestrian-priority; ordinary cars restricted |
| Boardwalk sidewalks | Centerlines Z 39.5 and 52.5 | Preserve and connect pedestrian circulation |
| Existing north land | Z 10–45 | Preserve |
| Records HQ | Center (28, 22) | Protected private label / executive destination |
| Grand Stage | Center (0, -74) | Protected live-performance destination |
| Existing Conference Center | Center (-43, 97); footprint 28 x 24 | Interim structure; replace as one coordinated design, not by stacking duplicate geometry |

## Approved Arena District concept
The Conference Center becomes the dominant arena-scale landmark, inspired by the urban presence of Crypto.com Arena without copying its protected design. The building sits at the center of a complete square-block street loop. LAMBO CITY Villa Apartments occupy outward-facing parcels around the outside of that boulevard. The arena is the visual and social heart of the neighborhood.

### Provisional spatial planning envelope
- District planning origin: (-43, 97).
- Reserve continuous land approximately X -105 to +19 and Z 48 to 158.
- Arena planning footprint: approximately 54 x 44 units, centered at (-43, 97), with its grand public entrance facing south toward the boardwalk approach.
- Square boulevard: continuous four-sided, two-way loop around the arena, approximately 84 x 74 units overall. All four corners, curb returns, sidewalks, crossings, and vehicle circulation must connect.
- Villa parcels: low-rise parcels outside the boulevard on the west, north, and east edges. Keep the south approach and primary arena sightline open; do not put homes between the boardwalk approach and arena entrance.
- Villa architecture: premium Santa Monica / Dana Point coastal apartments, outward-facing balconies and ocean-view orientation, customizable resident interiors. Villa heights remain subordinate to the arena.
- Public realm: landscaped pedestrian promenades, safe crossings, grand arrival plaza, and active gathering spaces facing the arena.
- Expansion: reserve outer-street attachment points for future neighborhoods and named towns.

These dimensions are a planning envelope, not a claim that the land is already built or collision-free. Final coordinates must be checked against active geometry, terrain, water, roads, and player boundaries before construction.

## Street and shoreline standards
- **Class A — city streets:** continuous two-way pavement, lane geometry, curb returns, connected intersections, sidewalks, crossings, and matching collision boundaries.
- **Class B — pedestrian routes:** boardwalks, promenades, plazas, and building walkways; ordinary vehicles are excluded.
- **Class C — waterfront access:** piers, ramps, overlooks, and shoreline paths; each explicitly meets land, dock, or building thresholds.
- **Water rule:** water is not usable ground. Roads and buildings require continuous land foundations; a crossing over water must be intentionally modeled as a bridge or pier.
- **Loop rule:** a boulevard described as a loop must connect all four sides and corners; no floating slabs, visual-only junctions, or unexplained road endings.
- **Entrance rule:** every building entrance meets a walkable plaza or sidewalk, with matching open collision.
- **Sightline rule:** the arena remains the dominant landmark; villas frame rather than hide it.
- **Expansion rule:** no district may silently move or overwrite a protected landmark or another district parcel.

## Required district module contract
Each module declares district ID/name/bounds/origin; ground footprints/elevation; road centerlines/widths/endpoints/junctions/class; pedestrian links/entrances; shoreline/water crossings; building footprints/sightlines; collision boundaries/openings; and a cleanup/ownership root.

## Implementation sequence
1. Survey current district geometry and adjacent land/water/collision boundaries.
2. Reconcile the narrow conference approach with a continuous square boulevard and complete land foundation.
3. Replace the interim conference building with one arena-scale landmark, not overlapping duplicate buildings.
4. Add outer villa parcels and low-rise apartment modules only after the loop road and pedestrian network are verified.
5. Run syntax/build checks and inspect the production scene before deployment.
6. Preserve the marina, central dock approach, boardwalk, Records HQ, and Grand Stage throughout.

## Validation gate
Production is not complete until the road loop is visually continuous, all four corners connect, the arena entrance is reachable, villa parcels do not block the approach or ocean sightlines, collision matches visible architecture, and protected landmarks remain unchanged.
