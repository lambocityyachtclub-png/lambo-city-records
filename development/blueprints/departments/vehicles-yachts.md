# Vehicles & Yachts — Department Blueprint (Draft v1)

**Department ID:** `vehicles-yachts`  
**Status:** discovery-needed  
**Approval:** Not owner-approved; draft only  
**Parent:** `LAMBO_CITY_MASTER_BLUEPRINT_DRAFT.md`

## 1. Mission

Vehicle, road-controller, road-rule and yacht source modules exist. Their current integration, player controls, ownership/customization and safe entry/exit behavior are not established by the present reconciliation records.

## 2. Scope and ownership

Own vehicle and yacht models, driving/handling, boarding/interactions, parking, safe spawn/exit and future customization. World & Districts owns roads and map geometry; Water & Environment owns water surface/shoreline boundaries.

### Explicit boundaries
- Own the interfaces and assets explicitly assigned to this department.
- Consume shared services through documented interfaces; do not fork shared engines.
- Do not silently modify another department's protected assets or architecture.
- Cross-department work must name its dependency and agree the integration contract first.

## 3. Current source inventory

The following are source pointers for inspection and traceability. They are not proof of complete behavior.

- `cars.js`
- `yacht.js`
- `yachtLuxuryDetails.js`
- `vehicleRoadController.js`
- `worldVehicleRoadRules.js`
- `worldAccessGate.js`

**Current-state interpretation:** The current reconciliation register does not establish a verified capability for this department. The listed files are candidate source pointers only; inspect each file and runtime registration before classifying functionality.

## 4. Non-goals

- Rebuild working systems simply to create a cleaner department boundary.
- Introduce a new framework, duplicate runtime or parallel engine without explicit approval.
- Treat future concepts as current requirements.
- Activate paid services, live transactions, production deployments or external communications without explicit approval.

## 5. Dependencies

- `world-districts`
- `water-environment`
- `performance-quality`
- `security-release`

Dependencies are planning relationships, not permission for one department to own another's implementation.

## 6. Proposed roadmap

1. Inspect current car/yacht modules and determine which are visual-only, interactive or runtime-integrated.
2. Map road controller, road rules, access gates, spawn points, collision and player/camera ownership.
3. Complete a safe, modular enter/drive/exit workflow only where existing road permissions and collision support it.
4. Define yacht boarding/navigation and marina interaction boundaries without assuming full water physics exists.
5. Defer ownership, purchases and customization economies until separate product/security approval.

## 7. Draft acceptance criteria

- [ ] Vehicle movement respects road access gates, full footprint, collision and swept-path safety.
- [ ] Enter/exit restores the player at a valid safe position and camera/input state.
- [ ] Touch and keyboard controls are supported without bypassing permissions.
- [ ] Yacht and dock interactions respect shoreline and walkable access boundaries.
- [ ] No live purchase, ownership promise or economy is introduced by vehicle work.

## 8. Open questions / evidence gaps

- Identify which vehicles/yachts are currently interactive in the integrated world.
- Confirm whether yacht movement is intended for Version 1 or a later phase.
- Verify spawn/parking locations against actual public road network.

## 9. Definition of done for this department

This blueprint becomes implementation-ready only after:
1. Source files and active runtime registration have been inspected.
2. Current capabilities are classified with source locators and test evidence.
3. Dependencies and integration contracts are confirmed.
4. Draft acceptance criteria are converted into measurable checks.
5. Conflicts and owner decisions are resolved or explicitly retained as blockers.
6. The owner approves the department blueprint.

**No Development Director task is created or submitted by this document.**
