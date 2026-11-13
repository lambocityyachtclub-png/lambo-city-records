# Jumbotron & Events — Department Blueprint (Draft v1)

**Department ID:** `jumbotron-events`  
**Status:** planned  
**Approval:** Not owner-approved; draft only  
**Parent:** `LAMBO_CITY_MASTER_BLUEPRINT_DRAFT.md`

## 1. Mission

The North Star defines a future Grand Stage/HERO event using existing stage, Jumbotron, lighting, media, audio and audience systems. The reconciliation register explicitly says the HQ stage-video viewer is not proof of a completed Grand Stage performance.

## 2. Scope and ownership

Own venue screens, stage presentation, event sequencing, stage media/audio coordination, event state and audience-facing event presentation. Coordinate HERO character behavior with People & Experiences; do not own HERO identity/AI or the underlying radio programming.

### Explicit boundaries
- Own the interfaces and assets explicitly assigned to this department.
- Consume shared services through documented interfaces; do not fork shared engines.
- Do not silently modify another department's protected assets or architecture.
- Cross-department work must name its dependency and agree the integration contract first.

## 3. Current source inventory

The following are source pointers for inspection and traceability. They are not proof of complete behavior.

- `LAMBO_CITY_NORTHSTAR.md`
- `stageVideo.js`
- `stageScreenMedia.js`
- `stageAudio.js`
- `stageAudioZone.js`
- `stageMusic.js`
- `stageCrowdPulse.js`
- `stageSpotlights.js`
- `stageLasers.js`
- `stageSmoke.js`
- `heroPerformance.js`

**Current-state interpretation:** The reconciliation register identifies partial/planned foundations. No end-to-end completion claim is made here.

## 4. Non-goals

- Rebuild working systems simply to create a cleaner department boundary.
- Introduce a new framework, duplicate runtime or parallel engine without explicit approval.
- Treat future concepts as current requirements.
- Activate paid services, live transactions, production deployments or external communications without explicit approval.

## 5. Dependencies

- `people-experiences`
- `lambo-city-radio`
- `performance-quality`
- `world-districts`

Dependencies are planning relationships, not permission for one department to own another's implementation.

## 6. Proposed roadmap

1. Inventory and map existing Grand Stage, Jumbotron, audio, video, lighting and crowd modules and their registration points.
2. Separate reusable venue presentation from one specific HERO event.
3. Define an event lifecycle: prepare, announce, enter, perform, transition, conclude and cleanup.
4. Integrate stage audio/video/lighting/crowd cues through existing systems; verify rights and supplied media assets.
5. Run end-to-end event and cleanup tests without disturbing unrelated HQ or Studio systems.

## 7. Draft acceptance criteria

- [ ] Existing stage/Jumbotron systems are reused rather than duplicated.
- [ ] Event start/stop/cleanup is deterministic and leaves no orphan loops, listeners or effects.
- [ ] Stage media and audio use approved assets and clear fallback behavior.
- [ ] HERO's actual performance audio asset is supplied before implementing or validating the final performance.
- [ ] Event can be experienced on desktop and iPad without blocking normal world navigation.

## 8. Open questions / evidence gaps

- Identify the canonical Jumbotron controller and its current runtime registration.
- The actual HERO stage-performance MP3 is still a required asset dependency.
- Clarify whether event scheduling is in-world only or includes future external broadcasts.

## 9. Definition of done for this department

This blueprint becomes implementation-ready only after:
1. Source files and active runtime registration have been inspected.
2. Current capabilities are classified with source locators and test evidence.
3. Dependencies and integration contracts are confirmed.
4. Draft acceptance criteria are converted into measurable checks.
5. Conflicts and owner decisions are resolved or explicitly retained as blockers.
6. The owner approves the department blueprint.

**No Development Director task is created or submitted by this document.**
