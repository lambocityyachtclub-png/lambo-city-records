# LAMBO CITY — Sports & Motors District Master Plan

**Status:** Future planning blueprint only — not approved for runtime construction  
**Created from:** World System development checkpoint `276601d5e8f07940aa149fb20e0029b937ce7ddf`  
**Protected development workflow:** Keep this work on a planning branch. Do not merge or deploy to production without the user's explicit approval and a full-world regression review.

## Vision

Create a dedicated LAMBO CITY Sports & Motors District connected to the Convention Center district and its villa/apartment residential amenities. The district combines a purpose-built Grand Prix-style circuit with complementary recreation facilities. The Boardwalk remains a separate Yacht Club VIP destination.

This is a long-range master-plan commitment, not a request to build these facilities now.

## Program commitments

1. **LAMBO CITY Grand Prix circuit**
   - A dedicated closed-loop street-circuit-inspired driving experience, taking broad inspiration from the Acura Grand Prix of Long Beach.
   - Plan for a start/finish straight, pit/paddock and service access, controlled spectator/viewing edges, marshal/safety zones, runoff/barriers, and safe pedestrian crossings.
   - The course must be its own designated driving area. It must not use the Yacht Club Boardwalk as a public race route or cut through active recreation surfaces.
   - The exact circuit length, turn count, direction, track width, pit location, and geometry remain undecided until a measured site-fit study is complete.
   - Reference: IMSA Long Beach Street Circuit describes the real course as 1.968 miles: https://www.imsa.com/long-beach-street-circuit

2. **LAMBO CITY basketball court**
   - Premium outdoor blue-and-white basketball floor.
   - LAMBO CITY mark centered and visibly integrated into the floor (engraved/inlaid visual treatment).
   - Support one-on-one, 3-on-3, and full 5-on-5 play, with regulation-aware court dimensions and appropriate safe run-off.
   - Design for actual multiplayer gameplay later, not just a decorative court.

3. **LAMBO CITY skate park**
   - Dedicated skatepark with street and transition zones: bowls, ramps, rails, ledges, stairs, and linked lines.
   - Long-term gameplay quality target: the depth, responsiveness, flow, and replayability associated with Tony Hawk's Pro Skater 3.
   - Treat this as a future gameplay system with trick controls, physics, scoring/challenges, and traversal design—not merely static props.

4. **Golf driving range**
   - Dedicated hitting bays, targets, distance markers, ball-flight safety envelope, and a quieter placement away from pedestrian routes and track operations.
   - Do not assume a full golf course; the requested amenity is a driving range.

5. **Residential amenity connection**
   - The basketball court, skatepark, and driving range are complementary amenities for the LAMBO CITY Villas/apartments.
   - Provide comfortable pedestrian access from the residential area and Convention Center while keeping vehicle routes separate from play areas.
   - Access policy and resident/guest permissions can be integrated with the future city credential system later.

## Spatial planning principles

- Treat the Convention Center and Villas as protected existing program elements.
- Plan the Grand Prix loop around the outside of the recreation campus where a verified land envelope allows; do not force the loop through the courts, skatepark, golf range, arrival plaza, or pedestrian network.
- Keep basketball and skateboarding close enough to read as one active-sports zone, but give each its own clear safety perimeter and circulation.
- Place the golf range in a quieter edge zone with a verified ball-flight safety envelope.
- Keep pit/service access distinct from resident and pedestrian access.
- Provide safe crossings only at designed, controlled crossing points.
- Preserve emergency access, accessible routes, sightlines, turning radii, and iPad-conscious scene budgets.
- Build future facilities as separate, data-driven district modules; do not add them to the live scene merely by importing this document.

## Existing map facts — reference only, not a site-fit approval

At checkpoint `276601d5e8f07940aa149fb20e0029b937ce7ddf`, `cityMap.js` defines world axes as +X east/right, -X west/left, +Z inland/north, and -Z ocean/stage.

The current provisional Arena/Convention District map entry records:
- District bounds: X -105 to 19; Z 45 to 158.
- Conference Center landmark center: (-43, 97), footprint 54 × 44.
- Existing boulevard loop: center (-43, 97), outer dimensions 84 × 84, road width 9, sidewalk width 3.
- Six villa parcel centers are derived by `worldDistricts/conferenceCenter.js`; west/east villa bands and the north villa band already occupy planned land outside the boulevard.
- The Boardwalk road is mapped separately around Z 46, and ordinary traffic is restricted there; only permission-controlled service/emergency access is allowed.

**Important:** The Arena District coordinates are explicitly described in `cityMap.js` as provisional pending full geometry and collision audit. The current district bounds are not proof of spare developable land. No exact track or amenity coordinates are assigned in this blueprint. The next site-fit pass must inspect the full live-world geometry, parcel footprints, terrain, water/shoreline boundary, collision, pedestrian links, and protected landmark envelopes before recommending a location.

## Preliminary site-fit finding from the mapped blueprint

The current Arena/Convention District envelope is already assigned to the arena, the complete boulevard and its turning geometry, six villa parcels, the south arrival/service approach, and the pedestrian loop. The arena alone occupies a 54 × 44 footprint; the boulevard is an 84 × 84 outer loop; the district envelope is 124 × 113 world units. The existing villa parcels sit outside the boulevard on its west, east, and north sides.

**Planning conclusion:** Do not try to squeeze the Grand Prix loop plus basketball, skatepark, and golf range into the current Arena/Convention District bounds. The mapped blueprint does not establish a sufficiently large, unoccupied, verified land envelope for that full program. The likely solution is a separately registered expansion district attached to the Convention District through a verified land connector, but its direction and exact location must remain undecided until the full live-world scene, adjacent parcels, and shoreline are surveyed. This avoids shrinking the existing boulevard, moving villas, blocking the arena arrival, or inventing land over water.

The current map registry calls the Arena District coordinates provisional and explicitly requires a full geometry/collision audit. Accordingly, this is a reliable planning constraint, not a final surveyed site boundary.

## Boardwalk access policy — preserve

The Marina Boardwalk is a pedestrian-waterfront/VIP destination, not the general driving area:
- Keep it exclusive to LAMBO CITY Yacht Club boarding-pass members for the intended VIP experience.
- Do not route the Grand Prix circuit, public driving, or ordinary vehicle traffic through it.
- Preserve the existing gated service/emergency access and pedestrian connection as separately permission-controlled infrastructure.
- Do not weaken or replace the boarding-pass policy when future city access credentials are implemented.

## Phased delivery — deliberately deferred

### Phase A — now: site-fit and master-plan coordination
- Inspect the current world and exact district geometry.
- Identify protected footprints, existing parcels, road edges, pedestrian paths, shoreline/water, and collision envelopes.
- Produce candidate placement diagrams and a conflict/clearance report.
- Do not generate runtime geometry or alter the live game in this phase.

### Phase B — future: reserve and register the district
- Only after the user approves a site-fit, define a separate district blueprint and explicit land connector(s).
- Validate road connectivity, pedestrian connectivity, gates/access, parcel clearance, terrain grades, collision, water boundaries, and streaming budgets.
- Keep the circuit and amenities opt-in and unloaded until the district is intentionally activated.

### Phase C — future: build facilities and gameplay
- Build the driving circuit and vehicle gameplay as a dedicated milestone.
- Build basketball gameplay for 1v1, 3v3, and 5v5.
- Build the skatepark to the stated Tony Hawk's Pro Skater 3 gameplay-quality target.
- Build the golf driving range with safe shot/ball simulation.
- Complete physical iPad performance testing and full-world regression before release.

## Non-goals for this planning checkpoint

- No playable driving implementation.
- No AI traffic.
- No basketball, skating, or golf gameplay implementation.
- No new track, court, skatepark, or range geometry in the live game.
- No changes to the Yacht Club Boardwalk, Convention Center, Villas, existing approved landmarks, or production.
- No speculative coordinates, shoreline crossings, bridges, piers, or parcel placements.

## Acceptance criteria for the next site-fit step

The site-fit is complete only when it provides:
1. A verified top-down map of the current Convention Center/Villas district and adjacent available land.
2. Explicit protected and already-occupied footprints.
3. At least one plausible candidate arrangement for the circuit and all four amenities, or a clear explanation of what must be expanded/repositioned.
4. Independent vehicle, pedestrian, service/emergency, and recreation circulation.
5. Verified land/water boundaries and no guessed bridges or shoreline fill.
6. A collision/clearance and streaming/performance risk review.
7. A recommendation ready for the user's single combined review.

This file is the persistent source of truth for the future Sports & Motors District unless the user changes the vision.

## Phase A progress — source-level audit completed

A read-only source-level audit is recorded in [WORLD_SYSTEM_PHASE_A_SITE_FIT_AUDIT.md](./WORLD_SYSTEM_PHASE_A_SITE_FIT_AUDIT.md). It verifies the authored Arena/Convention District coordinate layout and inspects the World System host/runtime and streaming configuration.

The audit confirms that the existing Arena/Convention envelope is already assigned to the arena, boulevard, six villa parcels, arrival/service access, and pedestrian circulation. It therefore recommends a separately registered expansion district rather than squeezing the Grand Prix circuit and recreation amenities into the current bounds.

**Important status distinction:** this completes the repository/source-level audit only. The full live-world survey—adjacent scene geometry, terrain continuity, shoreline/water boundary, collision inventory, and candidate land envelope—remains open. No candidate coordinates are approved, and no runtime geometry or production code was changed. The next approval-ready milestone is a verified whole-world top-down site-fit plan.

