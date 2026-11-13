# Convention Center — Department Blueprint (Draft v1)

**Department ID:** `convention-center`  
**Status:** partial  
**Approval:** Not owner-approved; draft only  
**Parent:** `LAMBO_CITY_MASTER_BLUEPRINT_DRAFT.md`

## 1. Mission

A dedicated completion blueprint and Conference Center district implementation exist. The source blueprint reports a foundation but explicitly leaves live driving integration and final cinematic polish outstanding; integrated geometry/collision still require current runtime validation.

## 2. Scope and ownership

Own the Convention/Conference Center venue, building design, meeting/exhibition spaces, public arrival, visitor circulation within the venue and venue-specific event spaces. City-wide roads, parcel registry and shared collision standards remain with World & Districts.

### Explicit boundaries
- Own the interfaces and assets explicitly assigned to this department.
- Consume shared services through documented interfaces; do not fork shared engines.
- Do not silently modify another department's protected assets or architecture.
- Cross-department work must name its dependency and agree the integration contract first.

## 3. Current source inventory

The following are source pointers for inspection and traceability. They are not proof of complete behavior.

- `CONFERENCE_CENTER_COMPLETION_BLUEPRINT.md`
- `LAMBO_CITY_MASTER_BLUEPRINT.md`
- `worldDistricts/conferenceCenter.js`
- `conferenceCenterDistrict.js`
- `worldSystem.js`
- `vehicleRoadController.js`

**Current-state interpretation:** The reconciliation register identifies partial/planned foundations. No end-to-end completion claim is made here.

## 4. Non-goals

- Rebuild working systems simply to create a cleaner department boundary.
- Introduce a new framework, duplicate runtime or parallel engine without explicit approval.
- Treat future concepts as current requirements.
- Activate paid services, live transactions, production deployments or external communications without explicit approval.

## 5. Dependencies

- `world-districts`
- `vehicles-yachts`
- `performance-quality`

Dependencies are planning relationships, not permission for one department to own another's implementation.

## 6. Proposed roadmap

1. Reconcile the existing Conference Center blueprint with the current district module and active registration.
2. Survey terrain, land/water boundaries, road loop, sidewalks, plaza, building entrances and collision as one integrated district.
3. Complete only outstanding venue details and live vehicle integration using existing road/access rules.
4. Validate meeting room experience, visitor routes, access permissions and cinematic presentation.
5. Do not stack duplicate arena geometry or move protected boardwalk, HQ or Grand Stage anchors.

## 7. Draft acceptance criteria

- [ ] One canonical Conference Center/arena implementation is registered; no overlapping duplicate structure exists.
- [ ] All public entrances connect to walkable plazas/sidewalks and collision openings match visible architecture.
- [ ] The boulevard/road loop is continuous where specified; service-only access rules are respected.
- [ ] Meeting and event spaces are reachable and usable on desktop/iPad.
- [ ] Protected anchors and surrounding districts remain unchanged.

## 8. Open questions / evidence gaps

- Verify which conference-center implementation branch is currently integrated in the candidate release.
- Confirm current arena footprint/road loop against active land and collision before any geometry changes.
- Live vehicle driving and final cinematic polish remain outstanding per the source checkpoint.

## 9. Definition of done for this department

This blueprint becomes implementation-ready only after:
1. Source files and active runtime registration have been inspected.
2. Current capabilities are classified with source locators and test evidence.
3. Dependencies and integration contracts are confirmed.
4. Draft acceptance criteria are converted into measurable checks.
5. Conflicts and owner decisions are resolved or explicitly retained as blockers.
6. The owner approves the department blueprint.

**No Development Director task is created or submitted by this document.**
