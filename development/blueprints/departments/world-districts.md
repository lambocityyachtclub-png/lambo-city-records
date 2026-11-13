# World & Districts — Department Blueprint (Draft v1)

**Department ID:** `world-districts`  
**Status:** partial  
**Approval:** Not owner-approved; draft only  
**Parent:** `LAMBO_CITY_MASTER_BLUEPRINT_DRAFT.md`

## 1. Mission

A modular World System registry, district lifecycle, world composition, terrain, navigation and parcel/streaming modules are present with automated tests. Full integrated player experience and all district geometry still require runtime/device validation.

## 2. Scope and ownership

Own the shared world map, district registry and lifecycle, parcels, roads, sidewalks, buildings as world infrastructure, navigation, scene composition, streaming and protected landmark boundaries. Departments own their venue/building-specific feature content; World & Districts owns the common spatial contract.

### Explicit boundaries
- Own the interfaces and assets explicitly assigned to this department.
- Consume shared services through documented interfaces; do not fork shared engines.
- Do not silently modify another department's protected assets or architecture.
- Cross-department work must name its dependency and agree the integration contract first.

## 3. Current source inventory

The following are source pointers for inspection and traceability. They are not proof of complete behavior.

- `LAMBO_CITY_WORLD_PLAN.md`
- `LAMBO_CITY_MASTER_BLUEPRINT.md`
- `WORLD_SYSTEM_GUIDE.md`
- `worldSystem.js`
- `worldSystemHost.js`
- `worldSystemRuntime.js`
- `worldDistrictSchema.js`
- `worldDistrictFactory.js`
- `worldDistrictStreaming.js`
- `worldNavigation.js`
- `cityMap.js`
- `worldConnectionBuilder.js`

**Current-state interpretation:** The reconciliation register identifies partial/planned foundations. No end-to-end completion claim is made here.

## 4. Non-goals

- Rebuild working systems simply to create a cleaner department boundary.
- Introduce a new framework, duplicate runtime or parallel engine without explicit approval.
- Treat future concepts as current requirements.
- Activate paid services, live transactions, production deployments or external communications without explicit approval.

## 5. Dependencies

- `performance-quality`
- `security-release`

Dependencies are planning relationships, not permission for one department to own another's implementation.

## 6. Proposed roadmap

1. Inventory canonical world bootstrap, district registry, module lifecycle and active scene composition.
2. Create a verified map of district bounds, road/pedestrian links, land/water edges, collision and protected anchors.
3. Resolve map circulation and dead ends by improving surrounding connections before altering landmarks.
4. Standardize district module declarations, cleanup ownership, collision openings and navigation links.
5. Validate streaming, LOD, memory and touch/desktop navigation in the integrated scene.

## 7. Draft acceptance criteria

- [ ] Every district has explicit bounds, ownership, entrances, dependencies and cleanup behavior.
- [ ] Roads, sidewalks, terrain, land/water and collision form continuous, reachable routes.
- [ ] Protected anchors are not moved or overwritten by district modules.
- [ ] Streaming/unloading does not leave orphan geometry, listeners or stale collision.
- [ ] World remains explorable without commerce, accounts, multiplayer or ALIVE services.

## 8. Open questions / evidence gaps

- Confirm the active world entrypoint and exact registry path in the current release candidate.
- Generate a runtime-verified district/landmark map; static file search alone is insufficient.
- Agree a repeatable physical iPad navigation/performance test route.

## 9. Definition of done for this department

This blueprint becomes implementation-ready only after:
1. Source files and active runtime registration have been inspected.
2. Current capabilities are classified with source locators and test evidence.
3. Dependencies and integration contracts are confirmed.
4. Draft acceptance criteria are converted into measurable checks.
5. Conflicts and owner decisions are resolved or explicitly retained as blockers.
6. The owner approves the department blueprint.

**No Development Director task is created or submitted by this document.**
