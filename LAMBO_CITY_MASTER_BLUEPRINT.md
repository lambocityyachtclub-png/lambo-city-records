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


---

# Verified implementation baseline — 2026-11-15

The following sections extend the existing master plan. They do not cancel the approved Arena District concept above. Where the earlier plan contains provisional planning dimensions, retain them as planning envelopes until they are checked against the current rendered scene.

## Coordinate convention (confirmed)

The project coordinate convention is:
- **+X:** east / right; **-X:** west / left.
- **+Z:** inland / north; **-Z:** ocean / stage.
- **Y:** vertical elevation / floor level.
- Ground positions are written as (X, Z); full positions as (X, Y, Z).
- Values are Three.js world units unless stated otherwise.

## Source-verifiable anchors and collision envelopes

The following values were checked in the feature-branch `collision.js`. These are primarily safe movement envelopes and architectural collision constants, not necessarily exact visible mesh bounds.

| Feature | Source-verified values | Meaning |
|---|---|---|
| Grand Stage / circular pier | Center (0, -74); safe circular radius 43.1 | Collision-safe circular pier envelope; visible geometry radius still needs comparison |
| Stage platform | Center (0, -74); collision box 44 wide × 18 deep | Physical movement collider, not a complete visual footprint |
| Central dock | X center 0, safe half-width 6.2; Z -41 to 35 | Safe walking envelope, inset by player radius |
| Dock-to-boardwalk connector | X half-width 6.2; Z 33.8 to 38.2 | Explicit narrow movement connection; owner reports this route now works in preview |
| Street / boardwalk walkable envelope | X -45 to +45; Z 37 to 55 | Safe movement envelope |
| Left shore plate | X -65 to -21; Z 10 to 45 | Safe movement envelope |
| Right shore plate | X +21 to +65; Z 10 to 45 | Safe movement envelope |
| HQ dock approach spur | X 4.65 to 20.7; centered Z=13.75 | Narrow safe corridor to HQ approach |
| HQ elevator threshold | X 19.5 to 25.3; centered Z=14.15 | Narrow safe corridor |
| Records HQ center | (28, 22) | Architectural constant |
| Records HQ footprint | X 19.25 to 36.75; Z 15.25 to 28.75 | Architectural collision constants |
| HQ elevator | Approximately (23, 14.15) | Architectural / collision constant |
| HQ floor 1 | Y 0.0–8.0 | Collision level band |
| HQ floor 2 | Y 8.0–16.2 | Collision level band |
| HQ floor 3 | Y 16.2–23.8 | Collision level band |
| HQ rooftop | Y 23.8+ | Collision level band |

### Reconcile the boardwalk street and sidewalk planning values

The existing approved master-plan notes specify the marina / boardwalk street around Z=42–50 (center Z=46), with sidewalk centerlines at Z=39.5 and Z=52.5. The current collision module permits a broader pedestrian envelope Z=37–55. These values describe different layers (road / sidewalk planning vs. collision-safe region); do not treat them as contradictory or collapse them into one geometry dimension. Survey the rendered road and sidewalk meshes before modifying either.

## Current world-system inventory

The current feature-branch `main.js` and `engine.js` confirm the following registered systems. Multiple modules may layer details onto one geographic destination; this is a code inventory, not a claim that every module is a separate district.

### Waterfront and open-world systems
- Core world, scene, camera, renderer
- Water and sky
- Dock and dock path
- Marina and dock-core features
- Waterfront storefront details
- Boardwalk overlooks
- Yacht and yacht luxury details
- Palm scenery
- Dock entrance and dock luxury details
- Conference Center district

### Grand Stage and live-event systems
- Festival Stage upgrade, architecture, and finishing
- Festival audience zone
- Grand Stage pier
- Stage video, screen media, banner, music, and audio zone
- Spotlights, lasers, smoke, and crowd pulse
- HERO performance and post-performance systems
- Character and NPC systems

### Records HQ systems
- HQ structure and foundation
- Floor 1
- Floor 2 Studio and Studio navigation/session systems
- Floor 3 executive/details/experience systems (lazy-loaded)
- Rooftop VIP system (lazy-loaded)
- Elevator, entrance threshold, media details, merch details
- HERO career center

### Player and shared systems
- Input, player, HUD, collision
- Cinematic flow, world skin, dock core
- Visual Engine and performance monitor

## Current pedestrian connectivity

The inspected collision source defines safe walking areas for the circular stage pier, central dock, dock-to-boardwalk connector, street / boardwalk envelope, two shore plates, HQ approach spur, and HQ elevator threshold.

The dock-to-boardwalk connector explicitly bridges the former small gap around Z=35–37. The owner has confirmed that walking works normally in the current preview. Keep this connector intact unless a separately verified issue requires a targeted change.

Required route checks as the map is completed:
1. Central dock ↔ boardwalk / street walkway.
2. Boardwalk ↔ storefronts and overlooks.
3. Boardwalk / waterfront ↔ Records HQ entrance and elevator approach.
4. Dock ↔ Grand Stage audience access ↔ stage pier.
5. Main street / roundabout ↔ adjacent city districts.
6. Conference Center / future arena plaza ↔ surrounding street and pedestrian network.

Routes 5 and 6 still need exact endpoints and source-backed geometry survey.

## District registry and confidence levels

| District / landmark | Current known information | Remaining survey |
|---|---|---|
| Marina / boardwalk street | Planning street Z=42–50, center Z=46; sidewalk centerlines Z=39.5 and 52.5; collision envelope X -45..45, Z 37..55 | Visible mesh bounds, exact road/sidewalk edges, dock and storefront junctions |
| Central dock | Collision-safe envelope X ±6.2, Z -41..35 | Visible deck bounds, ramps, marina slips, all access endpoints |
| Grand Stage / pier | Center (0,-74); collision-safe radius 43.1; stage platform collider 44×18 | Visible pier / stage bounds, audience and backstage route geometry |
| Records HQ | Center (28,22); approximate footprint X 19.25..36.75, Z 15.25..28.75 | Visible exterior survey, plaza / boardwalk threshold, all entrances |
| Conference Center (existing interim structure) | Center (-43,97); footprint 28×24 per existing master-plan notes | Re-measure current geometry, collision, land foundation, entrance and adjacent street |
| Arena District (approved concept) | Planning origin (-43,97); reserve land X -105..+19, Z 48..158; arena planning footprint ~54×44 centered (-43,97); square boulevard ~84×74 overall | Verify all current land, terrain, water, street, collision, and landmark overlaps before implementation |
| Villa apartment parcels | Planned outside west, north, and east edges of arena boulevard; keep south approach and arena sightline open | Parcel coordinates, heights, footprints, access, and view corridors |
| Roundabout | Existing approved world landmark | Exact center, diameter, road centerlines, connected spokes |
| Jumbotron | Existing approved world landmark | Exact position, orientation, footprint, sightlines, access |
| Storefront row | Existing waterfront detail system | Individual building footprints, entrances, sidewalks, collision |
| Boardwalk overlooks | Existing registered system | Exact positions, footprints, and path links |
| Marina / yachts / villa waterfront | Existing systems and approved landmarks | Exact asset locations, shoreline boundary, pedestrian links |

**Important:** The Arena District numbers are the existing approved planning concept, not proof that the entire reserve area is currently built, flat, or collision-free. The Conference Center center and footprint above are from the prior master-plan notes and must be rechecked against current source before any replacement or expansion work.

## Street, pedestrian, and district module standards

Every road or pedestrian path added or modified must record:
- Stable route ID and display name.
- Ordered centerline points (X/Z) or explicit polygon / rectangle.
- Width, surface type, elevation, and endpoints.
- Road class: vehicle street, pedestrian-only route, or shared route.
- Sidewalks, crossings, curb returns, ramps, and junction continuity where applicable.
- Collision-safe boundary including player-radius allowance.
- Connected route IDs at each endpoint.
- Adjacent building entrances and public-space links.
- Sightline and landmark visibility considerations.

Every district module must declare:
- Stable district ID, name, origin, and bounds.
- Ground footprint and elevation.
- Building footprints, entrance positions, and orientation.
- Road centerlines, widths, endpoints, and junctions.
- Pedestrian links and accessible thresholds.
- Shoreline / water edges and intentional bridges or piers.
- Collision boundaries and openings.
- A root / ownership boundary for clean module lifecycle and future maintenance.

### Connectivity rules

- A visible path is not considered connected until collision and player movement confirm it.
- Adjacent walkable areas must overlap or connect after the player collision radius is considered.
- Water is not walkable ground; a crossing requires an intentional bridge, pier, or ramp.
- A described road loop must connect every side, corner, and junction.
- A building entrance must meet a walkable sidewalk, plaza, or path with a matching collision opening.
- Never use a broad walkable rectangle to connect unrelated places or accidentally open a water boundary.
- Future district modules must attach to existing route endpoints rather than silently shifting protected geography.

## Implementation and verification sequence

1. Complete source survey of world, dock, dock path, marina, boardwalk, storefronts, overlooks, conference center, stage, roundabout, Jumbotron, villa, roads, and collision.
2. Compare visible mesh bounds with collision-safe bounds.
3. Publish the verified coordinate and route registry in this file.
4. Audit the Conference Center / Arena District footprint against the current land and all protected landmarks.
5. Only then plan any arena replacement, boulevard loop, villa parcels, or new districts as one coordinated layout.
6. Test full pedestrian routes on iPad Safari and desktop, including water and building boundaries.
7. Keep all changes on the feature branch until owner review; no production merge without explicit approval.

## Sources inspected for this revision

- `LAMBO_CITY_MASTER_BLUEPRINT.md` — preserved prior approved Arena District concept, street standards, and district module contract.
- `collision.js` — current waterfront safe-surface envelopes, dock-boardwalk connector, stage pier, Records HQ footprint, elevator threshold, and floor Y ranges.
- `main.js` — registered world-system inventory and lazy-load entry points.
- `engine.js` — actual system initialization order.

## Change log

- **2026-11-15:** Added a source-verified spatial baseline and current module inventory to the existing master blueprint. Preserved the prior Arena District plan and marked all unverified geometry as survey work. Documentation only; no scene code or production files changed.


## Detailed source survey — waterfront and Conference Center

These additional measurements were checked against `cityMap.js`, `world.js`, `dock.js`, `dockPath.js`, `marina.js`, `boardwalkOverlooks.js`, and `conferenceCenterDistrict.js`.

### Shared surface elevations

| Surface | Y / height | Source |
|---|---:|---|
| Water surface | Y=0.3 | `cityMap.js` |
| Existing land top | Y=0.65 | `cityMap.js` |
| Road top | Y=0.77 | `cityMap.js` |
| Boardwalk deck top | Y=1.0 | `cityMap.js` |
| Timber dock base center | Y=1.0; base thickness 0.4 | `dock.js` |
| HQ dock spur surface | Y=1.36 | `dockPath.js` |

### Marina / boardwalk geometry

- Existing north waterfront land is formed by two slabs, each 44 × 35, centered at (-43, 27.5) and (+43, 27.5), giving land bounds X -65..-21 and +21..+65, Z 10..45.
- The marina road is centered at (0, 46), length 90, width 8; bounds X -45..45, Z 42..50.
- Sidewalks are each 90 × 5, centered at Z=39.5 and Z=52.5. Their nominal bounds are Z=37..42 and Z=50..55.
- The waterfront street is pedestrian-priority; ordinary cars are restricted, with service/emergency access only per `cityMap.js`.
- The two boardwalk overlooks extend 13 units beyond the road ends. Their deck centers are approximately X=-51.5 and X=+51.5, with Z span 37..55. The entrance edge meets the existing street; the other three sides are railed.
- Existing waterfront stores are centered along the west/store side at X=-20, -32, and -44. The source shows 10 × 8 × 12 building meshes; their exact Z center and door threshold should be verified from the remaining `marina.js` lines before adding a route node.

### Central dock and HQ spur

- Main dock visible base: 14 wide × 76 long, from Z=-41 to Z=35, centered at Z=-3. Its safe collision envelope is narrower (X ±6.2) to account for player clearance.
- Dock ramp: five steps centered at X=0; step Z positions 31, 32.5, 34, 35.5, and 37. The step geometry should be compared with the dock-to-boardwalk connector in runtime.
- Timber spur to the HQ elevator: X from 5.25 to 20.10; center Z=13.75; width 2.4; surface Y=1.36.
- The dock spur module deliberately opens a 4.4-unit gap in the right-hand dock rail to provide a physical path opening. The rail is split into two retained segments; do not restore the original uninterrupted rail.
- Bollards line both sides of the spur at X=9, 12, 15, and 18, with Z=11.8 and 16.5.

### Conference Center district — current interim implementation

The shared `cityMap.js` registry and `conferenceCenterDistrict.js` agree on the current interim location:
- Building center: (-43, 97).
- District ground pad: center (-43, 95), size 54 × 62; nominal bounds X -70..-16, Z 64..126.
- Land connector: size 54 × 19, center (-43, 54.5); nominal bounds X -70..-16, Z 45..64. It overlaps the existing north land by 0.5 units at Z=45..45.5 to avoid a ground seam.
- Store-side access road: X=-37, width 8, running from Z=46 to Z=80. It connects to the existing marina street at Z=46 and continues onto the new district land.
- Sidewalks: two 2.8-wide × 30-long runs centered at X=-44.5 and X=-29.5, Z=65.
- Arrival plaza: 34 × 16, centered (-43, 84); entry walk 8 × 7, centered (-43, 78.5).
- Interim Conference Center foundation / roof: 28 × 24, centered (-43, 97). Main wall runs define an approximately 26 × 22 enclosure, with a deliberate south-facing central entrance.
- Architectural collision is registered on the four walls and split front facade wings; the central south entrance remains open.

**Planning note:** The prior Arena District concept is intended to coordinate a later arena-scale replacement of this interim Conference Center. Do not stack a second arena on top of the existing interim building. Treat the current Conference Center as the existing implementation to be replaced only as one approved, coordinated district change after the full road, land, and collision audit.

### Current source files and responsibilities

| File | Responsibility |
|---|---|
| `cityMap.js` | Shared coordinate registry, surface elevations, protected landmarks, interim Conference Center coordinates, provisional Arena District envelope, and road rules |
| `world.js` | Existing waterfront land slabs, stage ground/platform, and background skyline |
| `marina.js` | Boardwalk road, sidewalks, streetlights, stores, palms, and waterfront glass |
| `dock.js` | Main timber dock, planks, rails, posts, and lanterns |
| `dockPath.js` | Timber HQ spur, bollards, and dock-rail opening |
| `boardwalkOverlooks.js` | West and east end overlook decks, rails, and associated collision |
| `conferenceCenterDistrict.js` | District land pad, land connector, access road, sidewalks, plaza, interim building, and wall collision |
| `collision.js` | Safe movement envelopes, architectural colliders, and player boundary checks |

### Remaining survey items

- [ ] Inspect the complete storefront positions, entrances, and collision in `marina.js` and `waterfrontStorefrontDetails.js`.
- [ ] Inspect yacht, villa, roundabout, and Jumbotron exact positions and dimensions.
- [ ] Inspect all conference access-road collision and confirm that the pedestrian route is open end-to-end.
- [ ] Inspect the arena ground and boulevard concept against current world meshes and collision before construction.
- [ ] Verify the full boardwalk-to-conference pedestrian route in a live preview on iPad and desktop.


## Owner-confirmed Convention / Arena District program — 2026-11-15

This section records the owner's clarified spatial hierarchy and circulation. It refines the earlier provisional Arena District concept; it does not authorize scene implementation.

### Fixed district hierarchy

1. **Convention Center / Arena — centerpiece.** The arena-scale Convention Center is the dominant architectural and social landmark of the district. It must not sit in the middle of a street or be treated as a traffic island. Streets, plazas, and pedestrian routes are arranged around the building.
2. **Central recreation zone — near the Convention Center.** Reserve the central public-realm area adjacent to the Convention Center for:
   - A LAMBO CITY-branded basketball court, with future 1v1, 3v3, and 5v5 play.
   - A high-quality skate park with a coherent, playable layout and varied skate features.
   - Connected pedestrian gathering space so these amenities feel like part of the arena destination, not isolated objects.
3. **Outer residential perimeter — apartments / villas.** Place the LAMBO CITY Villa Apartments on the outside perimeter of the district street loop, with outward-facing balconies and coastal views. Residential parcels frame the district; they do not displace the Convention Center or the central recreation zone.
4. **Other previously requested program.** Preserve planning capacity for the Sports & Motors concept, including the Long Beach-style Grand Prix circuit and golf practice range. Their final placement must be coordinated with the district circulation and land survey; do not invent coordinates at this stage.

### Confirmed street circulation

The district is reached from the existing **store-side end of the marina boardwalk**. Following the owner's described route, the street turns left off the boardwalk, continues around the Convention Center / recreation / residential district, makes the next left, and returns toward LAMBO CITY Records HQ. The final design must read as one coherent, continuous outlet-style shopping and entertainment loop, with connected road geometry, sidewalks, crossings, and pedestrian links.

- Treat the loop as one connected district circulation system, not a separate street added on the opposite side of the boardwalk.
- Preserve the existing boardwalk, stores, dock, HQ, and all approved landmarks.
- Keep the Records HQ approach and elevator access clear.
- The existing boardwalk remains pedestrian-priority; do not route ordinary through-traffic along it.
- The exact route centerline, corners, road class, and junction coordinates remain subject to a source and runtime survey before geometry is approved.

### Explicit geographic exclusion

The **opposite side of the boardwalk toward the Jumbotron is out of scope** for this district plan. Do not add, extend, or relocate streets, buildings, plazas, sports facilities, or other district construction into that area. Preserve its current geography and all existing content.

### Implementation status and evidence

As of this source review, the current feature-branch `cityMap.js` contains the provisional Conference Center / Arena footprint, boulevard concept, and outer villa-parcel intent. The current `conferenceCenterDistrict.js` is still the interim Conference Center structure and its single store-side access road. The inspected source does **not** yet register or build the basketball court or skate park. Those amenities are owner-approved planning requirements, not existing implemented scene objects.

This is a documentation-only planning update. No coordinates, scene meshes, collision, navigation, or production behavior are changed by this section. Before implementation, survey the actual land, water edge, storefront entrances, Records HQ approach, and all protected landmarks; then publish a complete, dimensioned district layout for owner review.


## Store-side Arena District site survey — source-verified constraints

**Survey status:** source-code coordinate audit only; not a runtime terrain scan. The measurements below are existing source geometry, not a final approved street layout.

### Existing fixed geometry

| Element | Source-verified footprint / location | Planning implication |
|---|---|---|
| Marina boardwalk street | X -45 to +45; Z 42 to 50; road width 8 | Existing east-west street is protected and remains pedestrian-priority / service-only |
| Boardwalk sidewalks | Centered near Z 39.5 and 52.5 | Preserve existing pedestrian circulation |
| Storefront row | Centers X -20, -32, -44; building depth spans Z 25 to 37 | Preserve storefronts and their entrances |
| Storefront threshold | Approximately Z 38.05 to 38.48 | Keep a clear pedestrian approach to the existing stores |
| Interim Conference Center land | X -70 to -16; Z 64 to 126 | Existing built land plate; not enough by itself to prove a complete loop |
| Interim land connector | X -70 to -16; Z 45 to 64 | Existing north-side connection from boardwalk area to conference land |
| Interim access road | Center X -37; Z 46 to 80; width 8 | Existing single approach road, not a loop |
| Interim Conference Center | Center (-43,97); foundation 28 × 24 | Current building is interim and smaller than the arena-scale master-plan target |
| Provisional arena land reserve | X -105 to +19; Z 48 to 158 | Planning reserve only; much of this is not yet built terrain |
| Provisional arena footprint | Center (-43,97); 54 × 44 | Previous target footprint; retain as provisional pending site fit |
| Records HQ | Center (28,22); approximate footprint X 19.25 to 36.75, Z 15.25 to 28.75 | Protect building, front approach, and rear/elevator approach |
| HQ dock spur | X 5.25 to 20.10; centered Z 13.75; width 2.4 | Must remain clear and connected to elevator |

### Critical route-fit finding

The current source does **not** contain a completed street loop. It contains one northbound access road from the store-side boardwalk and a separate provisional boulevard outline in `cityMap.js`.

There is also a real land-continuity issue to resolve before assigning final road coordinates: the existing conference land plate ends at X=-16, while the existing HQ-side shore plate begins at X=+21. The 37-unit interval between those land plates is not a surveyed continuous ground corridor north of the boardwalk. The central dock corridor and the Records HQ approach are protected. A return leg toward the HQ side therefore cannot simply be drawn across this gap as if solid land already exists.

The final site plan must explicitly show how the district loop reaches the HQ-side return point using a continuous, supported land route, while:
- keeping the whole new district on the store / Convention Center side of the boardwalk;
- using the existing boardwalk as the preserved connection, not rebuilding it;
- avoiding the Jumbotron-facing / opposite side of the boardwalk entirely;
- preserving the central dock, dock-to-boardwalk connector, HQ dock spur, and HQ elevator access;
- keeping the Convention Center as the centerpiece, recreation (basketball court and skate park) central and nearby, and apartments / villas on the outer perimeter;
- providing connected sidewalks, crossings, accessible pedestrian paths, and safe player collision boundaries.

### Planning correction

The earlier 84 × 74 boulevard outline is **not** a final road design and must not be implemented as-is. It was a provisional arena-district reservation, not a surveyed loop that reaches the Records HQ side. The next design artifact must be a full top-down parcel and circulation plan with a continuous route, verified land support, arena footprint, recreation parcels, outer residential parcels, and protected-area overlays. Only after that plan is reviewed and approved should `cityMap.js`, terrain, road meshes, and collision be changed.

## Owner-approved district layout direction — 2026-11-15

This section is the current owner-approved direction and supersedes earlier provisional Arena District street geometry wherever the two conflict. It is a planning brief, not authorization to build scene geometry.

### Fixed design intent

- The Convention Center / Arena is the visual and functional centerpiece of the district.
- A basketball court and skate park belong in the central recreation area, close to the Convention Center and integrated into the public realm.
- Apartments and villas occupy the district's outer perimeter. Their height and massing must remain subordinate to the Convention Center landmark.
- The district should read as one connected outlet / shopping / entertainment destination, not as a detached extension or a collection of unrelated parcels.
- The street route follows the owner's described sequence: leave the existing boardwalk at its district-side end, make the first left, continue along the district street, make the second left, and return toward the Records HQ side. The final centerline and exact approach point must be proven against the surveyed scene before coordinates are assigned.
- The existing boardwalk, storefront row, Records HQ, dock, marina, Grand Stage, Jumbotron, roundabout, and all other approved geography are fixed anchors.

### Absolute geographic exclusion

No new streets, buildings, district extensions, terrain pads, or construction are to be placed on the opposite / Jumbotron-facing side of the existing boardwalk. This is a hard exclusion, not a future expansion reserve. The Grand Stage, Jumbotron, dock, and their approaches remain untouched.

### Conceptual top-down circulation diagram

The following is a relationship diagram only; it is deliberately not to scale and does not assign world coordinates:

```text
FIXED EXISTING APPROACH
[Storefronts] — [Existing Boardwalk] — [Records HQ side]
                         |
                  District entry
                         |
                    LEFT TURN 1
                         |
        +-----------------------------------+
        | OUTER APARTMENTS / VILLAS         |
        |                                   |
        |  Basketball Court   Skate Park    |
        |       CENTRAL RECREATION          |
        |                                   |
        |       CONVENTION CENTER           |
        |           CENTERPIECE             |
        |                                   |
        | Retail / dining / entertainment   |
        +-----------------------------------+
                         |
                    LEFT TURN 2
                         |
              Return leg toward HQ
                         |
             [Records HQ approach]

Jumbotron-facing opposite side: PROTECTED — NO CONSTRUCTION.
```

The diagram communicates adjacency and program only. Its drawn corners do not define the actual route geometry. The route must be drafted as a continuous centerline with connected junctions and safe pedestrian crossings; no dead ends or floating pavement.

### Existing constraints that must be resolved before coordinates

- The existing boardwalk road is centered at Z=46, spans X=-45..45, and is pedestrian-priority / service-emergency access only. It must not silently become an ordinary vehicle thoroughfare.
- The existing storefronts are west of the current district approach, around X=-20, -32, and -44. Their building positions, doors, and threshold clearances are fixed.
- The current Conference Center pad and approach are interim geometry around X=-70..-16, Z=45..126. They are not a completed district street loop.
- The current HQ-side shore plate is X=21..65, Z=10..45, while the Conference Center connector / pad occupies X=-70..-16. The intervening area is not proven as continuous buildable land. Any return route toward HQ requires a verified land / terrain continuity plan that stays on the permitted district side and preserves the HQ dock spur and elevator approach.
- The former provisional square-boulevard dimensions and villa placement notes are not final geometry. Do not copy them into scene code or use them as a coordinate template.
- No coordinates are approved yet for the new street centerline, land extension, Convention Center replacement footprint, courts, skate park, residential parcels, or return junction.

### Next planning deliverable and approval gate

Prepare a measured top-down parcel and circulation plan with:
1. Existing protected geometry and no-build overlays.
2. A continuous district-side land footprint that closes the described route without crossing water or touching the Jumbotron-facing exclusion.
3. The exact first-left and second-left junctions, return connection toward Records HQ, and all route endpoints.
4. A Convention Center footprint and arrival plaza at the center of the district.
5. Central basketball and skate park parcels with pedestrian links to the arena and retail street.
6. Outer apartment / villa parcels, access points, setbacks, and sightline protection.
7. Separate vehicle, shared-street, and pedestrian paths, with a clear policy for the existing boardwalk.
8. Matching collision boundaries, thresholds, and route connectivity.

Only after that plan is source-checked and presented for owner review should any `cityMap.js`, terrain, road, building, collision, or navigation implementation begin. This approval authorizes continued planning and documentation only; it does not authorize construction or production deployment.

## Topology and protected-waterfront audit — 2026-11-15

This audit reconciles the owner-approved district program with the current feature-branch source. It is a planning-only update. It does not authorize or implement new terrain, roads, buildings, collision, or navigation.

### Confirmed existing geometry relevant to the district

| Element | Source-backed geometry / behavior | Planning consequence |
|---|---|---|
| Marina boardwalk road | Center (0,46), X=-45..45, Z=42..50; pedestrian-priority with service / emergency access only | Preserve its role and geometry; do not convert it into an ordinary vehicle street |
| Boardwalk sidewalks | Centerlines Z=39.5 and Z=52.5; nominal Z=37..42 and 50..55 | Keep pedestrian circulation continuous and separate from any new vehicle route |
| Store-side overlook | West end deck extends X=-45 to -58; wood deck, rails, lanterns and palms | This is an existing endpoint feature, not a free road junction; preserve its deck and edge treatment |
| HQ-side overlook | Its builder exists, but current `init()` intentionally does not call it; the east boardwalk end remains open | Do not assume a completed east-end plaza or overlook exists |
| Storefront row | Centers X=-20, -32, -44; building boxes 10×8×12; detail module places front thresholds around Z=38.05–38.48 | Storefront entries and pedestrian frontage must remain clear |
| Existing shore plates | West plate X=-65..-21 and east plate X=21..65, both Z=10..45 | The center corridor is intentionally open around the central dock; do not bridge it at the wrong elevation or block dock access |
| Current district connector | X=-70..-16, Z=45..64; joins west shore land to district pad | Existing district access is west/store-side only |
| Current district ground pad | X=-70..-16, Z=64..126 | Current land support does not reach the HQ-side shore plate |
| Interim access road | X center -37, width 8, from Z=46 to Z=80 | This is a single approach, not a completed loop or a two-turn route |
| Records HQ | Center (28,22); protected footprint and elevator approach are already registered | Return route must meet the HQ-side public approach without crossing the dock spur or changing the HQ |
| Stage ground | 130×55 centered (0,-72), approximate bounds X=-65..65, Z=-99.5..-44.5 | This is oceanward / stage-side geography and remains protected |
| Stage platform | 44×18 centered (0,-74), approximate bounds X=-22..22, Z=-83..-65 | No district road, land pad, or construction is to be placed here |

### Critical route and land-continuity finding

The present district connector and pad occupy the west side of the map (X=-70..-16). The existing HQ-side shore plate begins at X=+21 and ends at Z=45. The 37-unit X gap between those land plates is not currently a verified continuous district-side land corridor. The interim access road only runs north from the boardwalk at X=-37; it does not return toward Records HQ.

A return leg cannot be drawn responsibly by simply extending the existing road or copying the provisional square-boulevard dimensions. The top-down plan must first establish a land-support footprint on the permitted inland / district side, then route the road and pedestrian paths over that footprint. It must preserve the central dock, its rails and spur opening, the HQ elevator threshold, and all existing boardwalk/storefront geometry.

### Route-orientation check

The owner's route instruction is: leave the boardwalk, make a left, continue, make another left, and return near Records HQ. The source establishes two boardwalk endpoints with different treatments: a completed west/store-side overlook and an intentionally open east/HQ-side end. The source does not yet establish which endpoint and approach heading the owner is describing as the first turn.

Therefore, the route is recorded as an owner-approved two-left-turn sequence, but its turn coordinates and exact approach heading remain unassigned until the plan overlays the existing player approach and fixed landmarks. This avoids reversing the route or accidentally routing it toward the protected stage/Jumbotron side.

### Protected geography overlay

Treat the following as fixed / no-build for this district plan:
- Existing marina boardwalk road, sidewalks, overlooks, and all three storefronts.
- Central dock, dock ramp, HQ spur, rail opening, and elevator threshold.
- Records HQ and its current entrance / elevator approach.
- Grand Stage ground, stage platform, stage back wall, screen, towers, and stage access.
- The Jumbotron-facing / oceanward side of the boardwalk: no new streets, buildings, terrain pads, or district extensions.
- Existing yachts, marina objects, roundabout, and other approved world landmarks until their exact bounds are surveyed.

### Updated measured-plan requirements

The next parcel drawing must show, on one consistent top-down coordinate plane:
1. The existing west/store-side district entrance and the open east/HQ-side boardwalk endpoint.
2. The owner's two-left-turn route with direction arrows, exact turn nodes, and a return endpoint near the HQ public approach.
3. The complete district-side land footprint that supports every road and pedestrian path; identify every land seam and overlap.
4. The Convention Center centerpiece and its public arrival plaza.
5. The central basketball court and skate park, with safe pedestrian links and clear separation from vehicle circulation.
6. Retail / dining / entertainment frontage along the connected district street.
7. Outer apartment / villa parcels, setbacks, building access, and sightline controls.
8. A distinct no-build overlay for the entire oceanward / Jumbotron-facing side.
9. Dock, HQ spur, elevator, storefront, boardwalk and stage keep-out / access envelopes.
10. A route and parcel schedule with widths, endpoints, elevations, and collision requirements.

No new world coordinates are approved by this audit. The old boulevard dimensions remain superseded provisional notes and must not be used as implementation coordinates. The next deliverable is a measured site plan for owner review; code implementation remains gated on that review.



## Owner-approved first-world completion district — residential capacity and site layout

**Owner approval:** 2026-11-15. The owner's hand-drawn site sketch is the controlling spatial relationship for this district and supersedes earlier provisional placement assumptions wherever they differ. This approval authorizes moving the district design forward; it does not authorize changing protected existing geography or guessing unverified coordinates.

### Controlling site arrangement

- Keep the complete district on the same side of the existing boardwalk as the Convention Center district land.
- The district street forms one continuous square loop around the neighborhood, with connected corners, sidewalks, safe crossings, and clear pedestrian access.
- Place the basketball court and skate park toward the front / boardwalk-facing side of the district.
- Place the Convention Center farther back, as the principal landmark and anchor of the district.
- Place residential apartment buildings beyond the outer sidewalks, around the outside perimeter of the square street.
- Integrate storefronts and suitable food, retail, and entertainment destinations along the district street. Their exact frontage and parcel positions are part of detailed site planning.
- Keep the existing boardwalk, waterfront storefronts, Records HQ, dock, marina, Grand Stage, Jumbotron, roundabout, and all other approved landmarks fixed.
- Do not add streets, buildings, parcels, or extensions on the opposite / Jumbotron-facing side of the boardwalk.
- The street loop must be a real connected route. The existing boardwalk remains pedestrian-priority; do not silently turn it into an ordinary vehicle road.

### Residential capacity — minimum 300 private homes

The residential program must support **at least 300 registered residents, with one individually assigned private apartment per user**. This is a capacity requirement, not a target number of visible apartment doors or a requirement to render 300 fully detailed interiors simultaneously.

Architecture requirements:
- Use repeatable, modular apartment-building and unit layouts so capacity can grow without hand-building every residence.
- Plan enough apartments for at least 300 distinct user assignments, with expansion capacity beyond the initial minimum.
- Give each user a persistent private apartment instance or logically isolated unit; one user's furniture, finishes, inventory, or layout must never overwrite another user's home.
- Support private entry and return-to-home access from the world and the user's profile/home interface.
- Treat the apartment as the user's personal home screen / home base after registration, not merely a decorative building.
- Save apartment ownership, room layout, furniture placement, material selections, and customization state to the user's account-backed data.
- Reconstruct the apartment from saved data when the user returns. Do not depend on a browser-only session or local-only storage as the authoritative save.
- Design for scalable loading: render the exterior neighborhood efficiently and load a user's detailed interior when they enter it. Do not instantiate hundreds of fully furnished interiors at initial world load.

### User-controlled interior customization

Each resident should be able to design their apartment to their taste. The customization system should support:
- Furniture selection, placement, rotation, arrangement, and removal.
- Interior materials and finishes, including marble flooring, granite or marble countertops, cabinetry, wall finishes, and future material collections.
- Room surfaces, color palettes, lighting, décor, and personal objects.
- Clear ownership boundaries, save / restore, and sensible placement validation so furniture does not block doors or become embedded in walls.
- A modular catalog so new furniture and material options can be added without rebuilding the apartment system.

Premium materials are selectable design options, not claims that every unit must use the same luxury finish. The user chooses the look.

### Account, privacy, and scalable data model

The future implementation should separate:
1. User identity and apartment assignment.
2. Apartment template / building / unit definition.
3. Per-user room layout and customization records.
4. Catalog definitions for furniture, materials, and décor.
5. Saved object transforms and finish selections.

Use stable IDs for users, buildings, units, catalog items, and placed objects. Enforce server-side ownership checks so only the assigned user (and explicitly authorized collaborators, if later introduced) can edit a private home. Avoid storing sensitive account credentials in apartment records.

### Completion definition for the first world

The first-world district is not complete until:
- The square street and sidewalk network is continuous and walkable.
- The front recreation zone contains both the basketball court and skate park.
- The Convention Center occupies the rear landmark position.
- Storefronts form a coherent active retail / entertainment frontage.
- The outer residential perimeter has enough modular inventory to assign at least 300 private apartments.
- A registered user can enter their own apartment, customize furniture and materials, save, leave, and return to the same design.
- Apartment interiors are loaded on demand and do not overwhelm initial world performance.
- Protected geography and existing navigation remain intact.
- The complete district has been tested for pedestrian routes, entrances, collision, and performance.

### Implementation gates

1. Complete the measured parcel and circulation plan against actual scene geometry. Keep unknown dimensions explicitly marked; do not invent coordinates or build over unverified land / water.
2. Reconcile the existing interim Conference Center and its access road as one coordinated district design, avoiding duplicate or overlapping structures.
3. Implement the continuous square street, ground foundation, sidewalks, crossings, and pedestrian routes as one tested system.
4. Build the front recreation zone and rear Convention Center.
5. Build the outer apartment perimeter using reusable building and unit modules sized for at least 300 assigned homes.
6. Implement account-linked private apartment assignment, on-demand interiors, customization catalog, and persistent saves.
7. Validate the complete first-world experience before declaring the first world finished.

**Scope boundary:** This owner approval is for the district described above and the 300-home residential capability. It does not approve construction on the prohibited opposite side of the boardwalk, movement of protected landmarks, or unverified road / parcel coordinates. Existing production remains untouched until reviewed and explicitly released.
