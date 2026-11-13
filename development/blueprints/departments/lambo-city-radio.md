# LAMBO CITY Radio — Department Blueprint (Draft v1)

**Department ID:** `lambo-city-radio`  
**Status:** discovery-needed  
**Approval:** Not owner-approved; draft only  
**Parent:** `LAMBO_CITY_MASTER_BLUEPRINT_DRAFT.md`

## 1. Mission

The catalog defines a Radio department, but the current reconciliation register contains no Radio-specific verified capability record. Candidate audio files are shared with Studio and stage systems; their presence does not prove a station, broadcast scheduler or radio product exists.

## 2. Scope and ownership

Own station identity, programming, playlist/schedule metadata, listening experience and radio-specific routing. Shared audio playback primitives may be consumed from Studio/audio infrastructure; Radio must not fork the Studio engine or claim ownership of stage event playback.

### Explicit boundaries
- Own the interfaces and assets explicitly assigned to this department.
- Consume shared services through documented interfaces; do not fork shared engines.
- Do not silently modify another department's protected assets or architecture.
- Cross-department work must name its dependency and agree the integration contract first.

## 3. Current source inventory

The following are source pointers for inspection and traceability. They are not proof of complete behavior.

- `ambientMusic.js`
- `stageAudio.js`
- `stageMusic.js`
- `studioAudioEngine.js`
- `studioAudioAssetStore.js`

**Current-state interpretation:** The current reconciliation register does not establish a verified capability for this department. The listed files are candidate source pointers only; inspect each file and runtime registration before classifying functionality.

## 4. Non-goals

- Rebuild working systems simply to create a cleaner department boundary.
- Introduce a new framework, duplicate runtime or parallel engine without explicit approval.
- Treat future concepts as current requirements.
- Activate paid services, live transactions, production deployments or external communications without explicit approval.

## 5. Dependencies

- `studio-music`
- `jumbotron-events`
- `security-release`
- `performance-quality`

Dependencies are planning relationships, not permission for one department to own another's implementation.

## 6. Proposed roadmap

1. Perform a focused source inventory to find any existing radio UI, station metadata, player controls and asset manifests.
2. Document the intended product behavior: station selection, programming model, track metadata, playback controls and fallback when no stream is available.
3. Choose a minimal modular integration contract with shared audio primitives only after inspecting actual audio engine interfaces.
4. Prototype locally with approved assets; defer live streaming, licensing and external distribution until separately reviewed.

## 7. Draft acceptance criteria

- [ ] A Radio capability is not labelled present until a working station/player path and tests are identified.
- [ ] Radio does not create a second audio engine or duplicate Studio project state.
- [ ] Playback, pause, station changes and error/fallback states are predictable.
- [ ] Music rights, stream hosting, operating costs and user data are reviewed before any public broadcast feature.

## 8. Open questions / evidence gaps

- Is there an owner-authored Radio product specification or existing prototype not yet identified?
- Which audio assets are cleared for in-world radio playback?
- Is the first release ambient/in-world playlists or true live broadcasting?

## 9. Definition of done for this department

This blueprint becomes implementation-ready only after:
1. Source files and active runtime registration have been inspected.
2. Current capabilities are classified with source locators and test evidence.
3. Dependencies and integration contracts are confirmed.
4. Draft acceptance criteria are converted into measurable checks.
5. Conflicts and owner decisions are resolved or explicitly retained as blockers.
6. The owner approves the department blueprint.

**No Development Director task is created or submitted by this document.**
