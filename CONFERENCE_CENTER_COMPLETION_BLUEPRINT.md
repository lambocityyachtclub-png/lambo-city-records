# Conference Center & World System Completion Blueprint

**Checkpoint date:** November 9, 2026  
**Repository:** lambocityyachtclub-png/lambo-city-records  
**Working branch:** feature/lambo-city-completion  
**Checkpoint commit before this document:** 276601d5e8f07940aa149fb20e0029b937ce7ddf  
**Related pull request:** #19  
**Status:** Baseline foundation verified; live driving integration and final cinematic polish remain outstanding.

> Durable handoff: read this file before continuing work on the Conference Center or World System.

## 1. Protection rules

- Work only on the isolated development branch.
- Do not merge, promote, or deploy to production without separate explicit authorization.
- Preserve the approved world, Boardwalk, existing districts, and unrelated Studio work.
- Do not redesign approved geometry or interfaces just to implement this task.
- Keep changes modular; prefer new feature modules and small integration points over broad rewrites.
- Optimize for desktop and iPad. Avoid excessive real-time lights, duplicate geometry, and expensive always-on effects.
- Never bypass road access gates or collision rules to make a vehicle appear functional.

## 2. Existing foundation at this checkpoint

The development branch already contains:

- Connected road, intersection, sidewalk, and terrain systems.
- Boardwalk-to-Convention Center road and sidewalk connection.
- District and parcel foundations, streaming, and LOD.
- Pedestrian routing and protected sidewalk bands.
- Vehicle road-surface and footprint safety rules.
- Gate/access permissions, including service-only approaches.
- Four corner U-turn areas, planned at approximately 18 by 18 world units.
- A reusable vehicle road controller and world-system facade methods.
- Conference Center terrain grading, landscaping, villa exteriors, building collision, navigation, and gated access.

The baseline World System test suite was reported passing at this checkpoint. Re-run it after implementation; that earlier result does not prove new driving integration works.

## 3. Work still required

### A. Live drivable vehicle integration

1. Inspect current engine, player, input, camera, world-system host, road controller, and road-rule interfaces before editing.
2. Select a valid public vehicle spawn/parking location from the actual road network. Do not spawn on service-only roads without the required permission context.
3. Add a modular vehicle feature that follows the project feature lifecycle and integrates with the live scene.
4. Support entering and exiting the vehicle.
5. Support steering, throttle, braking, and reverse on keyboard and iPad touch controls.
6. Integrate movement with the existing road controller and full-footprint/swept-path checks.
7. Keep the vehicle aligned to road/terrain and respect collisions, gates, and district access.
8. Synchronize player/camera safely while driving; on exit, restore the player at a valid nearby safe position.
9. Add a compact speed/status HUD and clear enter/exit affordances without obscuring gameplay.
10. Remove event listeners and temporary UI cleanly when the feature is disposed.

### B. Cinematic Conference Center finish

1. Inspect and reuse existing cinematic, lighting, and visual-skin systems before adding effects.
2. Polish the Conference Center arrival, architecture illumination, landscaping, street lighting, shadows, reflections, and atmosphere.
3. Prefer emissive/baked-style glow where practical; keep dynamic lights tightly limited.
4. Preserve existing architecture and road design.
5. Maintain smooth performance on iPad and desktop.

## 4. Non-negotiable acceptance criteria

- Boardwalk and Conference Center sidewalks connect continuously.
- Roads/intersections are navigable and have realistic turning clearance.
- The complete vehicle footprint—not only its center—stays on permitted pavement through turns and U-turns.
- Vehicles cannot drive over sidewalks, curbs, buildings, or landscaping.
- Service-only roads remain inaccessible without the correct permission.
- Pedestrian paths remain protected; crossings are handled clearly where routes meet.
- Enter/exit, keyboard controls, and touch controls work without breaking ordinary player movement.
- Camera follow and player restoration work correctly.
- No black screen, major frame-rate regression, duplicate roads, or heavy-lighting regression.
- Existing districts, approved designs, and Studio functionality remain intact.

## 5. Verification required before completion

- Run the existing World System node tests.
- Run syntax checks on every changed JavaScript module.
- Add/update automated tests for vehicle entry/exit, control state, access permissions, road footprint/swept-path rejection, and safe exit placement where architecture permits.
- Check live-scene registration and engine update ordering.
- Review the final diff for unrelated changes.
- Confirm development branch and commit; report any checks that could not be run.
- Keep production untouched. Passing development tests does not authorize deployment.

## 6. Resume instructions

Resume from the checkpoint commit above, then verify the current branch, commit, and working-tree state. Inspect existing source contracts and implement Workstream A, followed by Workstream B and the verification checklist.

Do not restart the design discussion or ask the user to repeat requirements already recorded here. Do not claim completion until acceptance criteria and verification are actually satisfied.

## 7. User workflow preference

The user wants this area completed as a coherent unit and prefers one final review rather than repeated intermediate testing. Keep progress notes concise and report concrete completed work, remaining work, blockers, and test results. The goal is to return to Studio and other design work without losing this World System position.
