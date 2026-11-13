# Water & Environment — Department Blueprint (Draft v1)

**Department ID:** `water-environment`  
**Status:** partial  
**Approval:** Not owner-approved; draft only  
**Parent:** `LAMBO_CITY_MASTER_BLUEPRINT_DRAFT.md`

## 1. Mission

The repository contains an ocean surface module with layered water meshes and throttled vertex animation. Shoreline continuity, scene registration, environmental completeness and device performance are not verified by source presence alone.

## 2. Scope and ownership

Own ocean and environmental presentation: water surfaces, waves, shoreline, beaches, marina/dock environmental details, terrain and weather effects. Coordinate shoreline geometry and walkable access with World & Districts; do not own city parcel or road topology.

### Explicit boundaries
- Own the interfaces and assets explicitly assigned to this department.
- Consume shared services through documented interfaces; do not fork shared engines.
- Do not silently modify another department's protected assets or architecture.
- Cross-department work must name its dependency and agree the integration contract first.

## 3. Current source inventory

The following are source pointers for inspection and traceability. They are not proof of complete behavior.

- `water.js`
- `marina.js`
- `dock.js`
- `dockPath.js`
- `worldTerrainBuilder.js`
- `worldTerrainMath.js`

**Current-state interpretation:** The reconciliation register identifies partial/planned foundations. No end-to-end completion claim is made here.

## 4. Non-goals

- Rebuild working systems simply to create a cleaner department boundary.
- Introduce a new framework, duplicate runtime or parallel engine without explicit approval.
- Treat future concepts as current requirements.
- Activate paid services, live transactions, production deployments or external communications without explicit approval.

## 5. Dependencies

- `world-districts`
- `performance-quality`

Dependencies are planning relationships, not permission for one department to own another's implementation.

## 6. Proposed roadmap

1. Inventory active scene registration, lifecycle and cleanup for water/environment modules.
2. Map actual water boundaries against land, docks, piers, marina and player movement/collision.
3. Validate visual quality and frame-time on iPad Safari and desktop; optimize only after profiling.
4. Add missing environmental details only where they improve existing destination cohesion.

## 7. Draft acceptance criteria

- [ ] Water is registered once, updates predictably and cleans up fully when the scene/module is disposed.
- [ ] Water never behaves as walkable ground; every crossing is an intentional bridge, dock or pier.
- [ ] Visible shoreline, dock access and collision/navigation boundaries agree.
- [ ] No unnecessary real-time lights or duplicate expensive water surfaces are introduced.
- [ ] Representative desktop and iPad tests meet agreed frame-time and memory budgets.

## 8. Open questions / evidence gaps

- Confirm active water registration and actual world extents.
- Measure current frame cost and memory on physical iPad Safari.
- Identify whether weather/environment systems exist elsewhere before adding new ones.

## 9. Definition of done for this department

This blueprint becomes implementation-ready only after:
1. Source files and active runtime registration have been inspected.
2. Current capabilities are classified with source locators and test evidence.
3. Dependencies and integration contracts are confirmed.
4. Draft acceptance criteria are converted into measurable checks.
5. Conflicts and owner decisions are resolved or explicitly retained as blockers.
6. The owner approves the department blueprint.

**No Development Director task is created or submitted by this document.**
