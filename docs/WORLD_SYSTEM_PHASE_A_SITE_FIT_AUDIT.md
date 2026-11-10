# LAMBO CITY — World System Phase A Site-Fit Audit

**Audit status:** Source-level coordinate and architecture audit completed; physical-world survey remains incomplete  
**Branch:** `planning/sports-motors-masterplan`  
**Scope:** Read-only inspection of the current map registry, Convention Center district definition, World System host/runtime, streaming configuration, and preview harness.  
**Runtime geometry changes:** None  
**Production changes:** None

## Executive result

The current Convention Center/Arena district is not a suitable container for the full Sports & Motors program. Its mapped footprint is already committed to the arena, a complete boulevard, six villa parcels, an arrival/service approach, and pedestrian circulation. The correct next planning direction remains a separately registered expansion district connected by a verified land connector.

The source-level audit does **not** establish where that expansion can physically fit. The repository snapshot does not provide a complete, surveyed city-wide terrain/shoreline map or a verified adjacent-land/collision inventory. No candidate coordinates are approved by this audit.

## 1. Coordinate and footprint findings

The shared `cityMap.js` declares:
- +X east/right; -X west/left; +Z inland/north; -Z ocean/stage.
- Boardwalk road: X -45 to 45; Z 42 to 50; width 8.
- Boardwalk sidewalk centerlines: Z 39.5 and 52.5.
- Boardwalk vehicle policy: restricted; service/emergency access only.
- Records HQ: center (28, 22), protected.
- Grand Stage: center (0, -74), protected.
- Arena District provisional bounds: X -105 to 19; Z 45 to 158.

The Convention Center district definition derives the following layout from the registry:
- Arena center (-43, 97), footprint 54 × 44; calculated footprint extents X -70 to -16 and Z 75 to 119.
- Boulevard center (-43, 97), outer dimensions 84 × 84; calculated outer extents X -85 to -1 and Z 55 to 139.
- Boulevard road width 9 and sidewalk width 3.
- Six villa parcels: two west, two east, and two north of the boulevard.
- West villa centers at X -98.5; east villa centers at X 12.5; north villa centers at Z 148.5. Their footprints are already inside and close to the outer district limits.
- District definition bounds: X -105 to 19; Z 50 to 158.
- South arrival/service access and a pedestrian connection join the Boardwalk edge. The vehicle connection is permission-controlled; ordinary traffic is denied. Pedestrian access is a separate sidewalk spur.

These calculations describe the authored blueprint coordinates only. The registry itself states that Arena District coordinates are provisional until full geometry and collision audit.

## 2. Boardwalk and protected-area constraints

The Boardwalk must remain a pedestrian-priority Yacht Club VIP destination:
- No Grand Prix route or ordinary public vehicle route through the Boardwalk.
- Preserve boarding-pass/VIP access policy.
- Preserve gated service/emergency access and pedestrian connections as separate access systems.
- No paving or foundations over open water based on guessed boundaries.

Records HQ, Grand Stage, the marina Boardwalk, and central dock approach remain protected. The Convention Center south arrival and the complete boulevard loop must also remain clear.

## 3. World System architecture findings

The source-level inspection confirms:
- `main.js` registers the World System host and initializes it with the Convention Center district after the engine initializes.
- `worldSystemHost.js` exposes explicit district/connection registration, route, gate, and build operations.
- `worldSystemRuntime.js` dynamically imports the World System, district streaming, and recipe factory when initialized.
- `worldDistrictStreaming.js` streams full district detail by distance and creates cheaper distant proxies; it caps builds/removals per update and detailed parcel counts.
- The current `main.js` streaming configuration uses a 30-unit detail-in radius, 45-unit detail-out radius, 900-unit proxy-in radius, 1000-unit proxy-out radius, one district build per update, and six detailed parcels.
- `world-system-preview.html` is a separate preview/test harness. Its source contains checks for district validation, route/access behavior, Boardwalk sidewalk grading, collision registration/cleanup, streaming/proxy behavior, and rollback.

This is a source inspection, not an executed browser test. The preview harness has not been run in a real browser during this audit, and no physical iPad performance result is claimed.

## 4. Current site-fit decision

**Decision:** Do not add the circuit, basketball court, skatepark, or golf driving range inside the existing Arena/Convention District bounds.

Reason:
1. The arena, boulevard, villas, arrival, and pedestrian/service links already consume the mapped district program.
2. The bounds are provisional, not a surveyed spare-land boundary.
3. The code snapshot does not establish a reliable adjacent land envelope or the full shoreline/collision limits.
4. Inventing coordinates or expanding over water could damage protected landmarks and the existing city circulation.

The preferred future solution is a separately registered Sports & Motors expansion district with an explicit, physically verified land connector. The expansion's direction, boundary, route, and coordinates remain open pending the full-world survey.

## 5. Required work before a candidate layout can be approved

The following items remain open:
- Capture or generate a verified top-down view of the complete live world, not only the Convention Center preview.
- Inspect all neighboring district footprints and unregistered scene geometry.
- Verify terrain continuity, land/water boundary, shoreline, dock/pier footprints, and any existing underground/overhead clearances.
- Inventory collision volumes and existing vehicle/pedestrian/service routes.
- Identify a contiguous land envelope large enough for the circuit perimeter and all recreation amenities, or determine what additional land/district expansion is required.
- Prepare one combined candidate plan showing arena/villas, track, basketball, skatepark, golf range, pit/service circulation, residential pedestrian access, emergency access, and Boardwalk separation.
- Run the preview harness and full-world regression in a browser, then perform iPad performance testing before any release proposal.

## 6. Sports & Motors program retained

The future expansion must include:
- Long Beach-inspired dedicated Grand Prix circuit with start/finish, pit/paddock/service access, spectator safety zones, barriers/runoff, and controlled pedestrian crossings.
- Blue-and-white LAMBO CITY basketball court with central inlaid/engraved mark and 1v1, 3v3, and 5v5 gameplay target.
- Skatepark with street and transition features; long-term gameplay quality target comparable to Tony Hawk's Pro Skater 3.
- Golf driving range with bays, targets, distance markers, and a safe ball-flight envelope.
- Convenient pedestrian connection to the Villas/apartments and Convention Center.
- Vehicle, pedestrian, service/emergency, and recreation circulation kept separate.

## 7. Change-control result

- No runtime code was edited.
- No live scene geometry was added or moved.
- No production branch was changed.
- No production deployment was triggered.
- This report is a planning artifact on the dedicated planning branch only.

**Phase A outcome:** The source-level map/architecture review is complete and confirms the need for a separate expansion district. The full physical site-fit survey is not yet complete; candidate placement must wait for verified whole-world geometry and shoreline/collision evidence.

## 8. Expanded source-level land-envelope survey

A second pass inspected the actual ground-generating modules (`world.js`, `marina.js`, `dock.js`, `dockPath.js`, and `water.js`) rather than relying only on district metadata.

### Authored ground and structure extents

| Existing element | Authored footprint / extent | Site-fit implication |
|---|---|---|
| West waterfront ground | X -65 to -21; Z 10 to 45 | Existing marina/HQ-side land; not spare expansion land |
| East waterfront ground | X 21 to 65; Z 10 to 45 | Existing marina/store-side land; not spare expansion land |
| Boardwalk road | X -45 to 45; Z 42 to 50 | Protected VIP waterfront route; ordinary traffic restricted |
| Arena/Convention district ground | X -105 to 19; Z 45 to 158 | Existing committed district envelope |
| Arena boulevard | Center (-43, 97), outer 84 × 84 | Full loop and sidewalks occupy the central district |
| Arena | Center (-43, 97), footprint 54 × 44 | Protected landmark footprint |
| West/east villa rows | Parcel centers around X -98.5 and 12.5; Z 80 and 112 | Planned residential parcels occupy outer boulevard edges |
| North villa row | Parcel centers around X -58 and -28; Z 148.5 | Planned residential parcels approach the north edge of the district |
| Main dock | X -7 to 7; Z -41 to 35 | Existing waterfront structure, not a land connector |
| Grand Stage ground | X -65 to 65; Z -99.5 to -44.5 | Protected event/stage land, separate from Convention expansion |
| Ocean surface | 800 × 800 animated water plane centered at origin | Visual water surface only; it does not certify buildable land or a surveyed shoreline |

The waterfront ground extents are directly authored in `world.js` and repeated as named extents in `marina.js`. The arena ground and district bounds are defined in the shared map/district blueprint. The dock and stage are separate built structures. The ocean plane is a large visual surface and must not be mistaken for terrain or evidence that a new road/land platform is safe to build.

### Top-down source schematic (not to scale)

```text
                         +Z / INLAND
                              ^
              No adjacent land envelope verified
              beyond the north edge of Arena District

       WEST              ARENA / CONVENTION             EAST
     X < -105          X -105 .......... 19           X > 19
                         [north villas]
                         [boulevard loop]
                         [arena]
                         [south arrival]
                              |
                     Boardwalk at Z 42–50
              VIP pedestrian waterfront / restricted vehicles
                 existing land sections Z 10–45
                              |
                    dock / marina approach
                              |
                 Grand Stage / stage ground
                              v
                         -Z / OCEAN
```

### Land-fit conclusion

The source-defined land is fragmented into the existing marina/waterfront, the Convention/Arena district, and the separate Grand Stage area. The adjacent east, west, and north areas outside the Convention/Arena ground envelope are not defined as continuous land in the inspected ground modules. The ocean plane beneath the scene is not a usable land parcel.

**No buildable adjacent site for the complete Sports & Motors program can be verified from the current source geometry.** A separate expansion district remains the right software architecture, but registering it with guessed bounds would only create a data blueprint over unverified water/empty space. No candidate coordinate rectangle is therefore approved.

### What this means for the next design decision

Before any Sports & Motors district can be placed, LAMBO CITY needs an explicit, approved land strategy backed by a full-world visual/terrain survey. That could mean identifying additional land already present but not represented in the inspected modules, or separately approving a designed land-extension project with its own shoreline engineering and access plan. This audit does not select either option and does not authorize reclamation, a bridge, a pier, or water fill.

The current milestone is therefore complete at the source-geometry level: it establishes the exact known ground extents and proves that the present source files do not establish a safe contiguous expansion site. A live browser scene review remains necessary to discover any geometry not represented by these modules.

