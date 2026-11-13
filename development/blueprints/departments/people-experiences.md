# People & Experiences — Department Blueprint (Draft v1)

**Department ID:** `people-experiences`  
**Status:** partial  
**Approval:** Not owner-approved; draft only  
**Parent:** `LAMBO_CITY_MASTER_BLUEPRINT_DRAFT.md`

## 1. Mission

HERO model/performance/post-performance and NPC/player/crowd-related source files exist. The full HERO event, consent-based invitation workflow and real stage audio asset remain future/incomplete dependencies.

## 2. Scope and ownership

Own character/NPC identity, movement and interaction, HERO personality, social/VIP experience, crowd reactions and player-facing consent moments. Jumbotron & Events owns stage cue orchestration; Security & Release owns data/consent controls and any messaging integration.

### Explicit boundaries
- Own the interfaces and assets explicitly assigned to this department.
- Consume shared services through documented interfaces; do not fork shared engines.
- Do not silently modify another department's protected assets or architecture.
- Cross-department work must name its dependency and agree the integration contract first.

## 3. Current source inventory

The following are source pointers for inspection and traceability. They are not proof of complete behavior.

- `hero-model.js`
- `heroPerformance.js`
- `heroPostPerformance.js`
- `npc.js`
- `player.js`
- `stageCrowdPulse.js`
- `recordsHQRooftopVIP.js`
- `LAMBO_CITY_NORTHSTAR.md`

**Current-state interpretation:** The reconciliation register identifies partial/planned foundations. No end-to-end completion claim is made here.

## 4. Non-goals

- Rebuild working systems simply to create a cleaner department boundary.
- Introduce a new framework, duplicate runtime or parallel engine without explicit approval.
- Treat future concepts as current requirements.
- Activate paid services, live transactions, production deployments or external communications without explicit approval.

## 5. Dependencies

- `jumbotron-events`
- `lambo-city-radio`
- `security-release`
- `performance-quality`

Dependencies are planning relationships, not permission for one department to own another's implementation.

## 6. Proposed roadmap

1. Inventory current NPC lifecycle, HERO model, dialogue/personality and trigger conditions.
2. Keep HERO's defining experience larger-than-life but humble: music mogul, superstar and mentor.
3. Implement event-linked arrival only after the stage-performance event lifecycle and approved audio asset are ready.
4. Make phone-number enrollment and SMS explicitly optional, consent-based and independently revocable; do not collect data merely to unlock a scene.
5. Validate crowd/security behavior, collision, cleanup and player agency.

## 7. Draft acceptance criteria

- [ ] NPCs and HERO have deterministic spawn, update, interaction and cleanup behavior.
- [ ] HERO event triggers only after the approved performance event completes.
- [ ] The actual stage MP3 is supplied and verified before the performance experience is considered ready.
- [ ] Any phone/SMS invitation is opt-in, clearly explained, records consent and supports opt-out; no unsolicited messaging.
- [ ] Crowd/security behavior does not trap or block the player or damage performance.

## 8. Open questions / evidence gaps

- The actual HERO performance MP3 has not yet been supplied.
- Confirm whether rooftop-party SMS is included in Version 1 or deferred.
- Verify the current source of HERO trigger state and NPC/security navigation.

## 9. Definition of done for this department

This blueprint becomes implementation-ready only after:
1. Source files and active runtime registration have been inspected.
2. Current capabilities are classified with source locators and test evidence.
3. Dependencies and integration contracts are confirmed.
4. Draft acceptance criteria are converted into measurable checks.
5. Conflicts and owner decisions are resolved or explicitly retained as blockers.
6. The owner approves the department blueprint.

**No Development Director task is created or submitted by this document.**
