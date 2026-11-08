# LAMBO CITY — Master City Blueprint

**Status:** Phase 1 street-network correction and planning baseline  
**Coordinate system:** Three.js world units; +X east/right, -X west/left, +Z inland/north, -Z ocean/stage.

## Design intent

LAMBO CITY is a modular luxury coastal entertainment city, not a collection of disconnected scene objects. Every district must be planned as a continuous piece of urban infrastructure before its buildings are added. New districts are independent modules and must consume the shared `cityMap.js` coordinate registry.

## Existing surveyed anchors

| Feature | Position / extent | Planning treatment |
|---|---|---|
| Marina / boardwalk street | X -45 to +45; Z 42–50; center Z 46; 8 units wide | Pedestrian-priority waterfront; ordinary cars restricted |
| Boardwalk sidewalks | Centerlines Z 39.5 and 52.5 | Preserve and connect pedestrian circulation |
| Existing north land plates | Z 10–45 | Preserve |
| Conference district ground | X -70 to -16; Z 64–126 | Preserve and connect to the boardwalk-side land |
| Conference access road | X -37; Z 46–80; 8 units wide | Store-side two-way district entrance |
| Conference Center | Center (-43, 97); footprint 28 x 24 | Primary landmark and visual anchor |
| Records HQ | Center (28, 22) | Protected private label / executive destination |
| Grand Stage | Center (0, -74) | Protected live-performance destination |

## Phase 1 — connect the city before adding more buildings

1. Maintain the store-side entrance at the negative-X end of the boardwalk street.
2. Join the access road to the existing east–west boardwalk street as a real junction.
3. Provide continuous underlying land beneath the new road from the existing land edge at Z 45 to the conference district land beginning at Z 64. The road must never appear to float over ocean.
4. Keep ordinary vehicle circulation on the new two-way street; keep the boardwalk pedestrian-priority.
5. Keep the conference road, curbs, sidewalks, arrival plaza, entry walk, and building entrance aligned and connected.
6. Preserve the central dock approach, marina, Records HQ, Grand Stage, and existing boardwalk geometry.
7. Make road/land/water boundaries and collision agree. Visual pavement without matching walkable ground and collision is not considered complete.

## District structure

- **Marina Boardwalk:** pedestrian waterfront, stores, dock and promenade.
- **Entertainment District:** Grand Stage and large live-performance activity.
- **Records HQ:** private label operations and studio.
- **Conference Center District:** public-facing education, conferences, networking, and the first major inland landmark.
- **LAMBO CITY Villas:** future low-rise coastal apartment community on outer streets around the Conference Center, with ocean-view orientation and customizable resident interiors.
- **Future districts:** independently named modules that attach to surveyed arterial roads and declared district boundaries.

## Road and shoreline standards

- **Class A — city streets:** continuous two-way vehicle pavement, lane/curb geometry, connected junctions, sidewalks, and matching collision boundaries.
- **Class B — pedestrian routes:** boardwalks, promenades, plazas, and building walkways; ordinary vehicles are excluded.
- **Class C — waterfront access:** piers, ramps, overlooks, and shoreline paths; each must explicitly meet land, dock, or building thresholds.
- **Water rule:** water is not usable ground. Roads and buildings require continuous land foundations; a crossing over water must be intentionally modeled as a bridge or pier.
- **Junction rule:** roads must terminate at a connected road, plaza, or deliberate turnaround—not in open water, a building wall, or an arbitrary patch of pavement.
- **Sightline rule:** the Conference Center remains the dominant landmark; villa massing stays lower and frames rather than hides it.
- **Expansion rule:** no district may silently move or overwrite a protected landmark or another district's parcel.

## Required module contract for future districts

Each district module must declare:
1. District ID, name, bounds, and coordinate origin.
2. Ground footprint(s) and surface elevation.
3. Road centerlines, widths, endpoints, junctions, and road class.
4. Pedestrian connections and entrance thresholds.
5. Water/shoreline boundary and any explicit bridge or pier.
6. Building footprints and protected sightlines.
7. Collision boundaries matching physical architecture and access openings.
8. A cleanup/ownership root so the district can be maintained independently.

## Next planned phase

After the corrected road/land connection is visually checked in the live game, survey and lay out the villa parcels and outer residential street loop. Do not populate those parcels with arbitrary apartment blocks before the street and shoreline geometry are settled.
