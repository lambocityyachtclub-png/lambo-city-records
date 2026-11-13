# LAMBO CITY Department Implementation Readiness Map (Draft)

**Status:** draft — not owner-approved  
**Evidence snapshot:** Department Source Verification workflow run 43355322431, source commit 92a1ae5f99cf669356554bd7a2fa860b614577a2  
**Evidence artifact:** lambo-city-department-source-verification  
**Purpose:** establish a dependency-aware order for implementation without treating source presence as completion or creating work authorization.

## 1. Executive direction

The ten Department Blueprints now have a common source inventory and a repeatable verification report. The next practical move is to return priority to Floor 2 Studio while preserving the shared world and ALIVE architecture.

The map does not require all ten departments to be fully implemented before Floor 2 can progress. It identifies the shared foundations, integration order and explicit blockers so that one department can advance without forcing unfinished future systems into the current release.

## 2. Verified evidence snapshot

The report follows 66 registered or separately hosted runtime roots across visitor-world, Studio standalone, ALIVE owner workspace, ALIVE API and ALIVE CI worker domains. It traces local import dependencies from those roots. All runtime/device verification remains not-verified.

| Department | Blueprint state | Source evidence summary | Runtime domain |
|---|---|---|---|
| Water & Environment | partial | 6 connected code modules; no direct tests identified | visitor-world |
| Jumbotron & Events | planned | 9 connected modules; 1 code module source-only; 1 documentation reference | visitor-world |
| LAMBO CITY Radio | discovery-needed | 2 connected shared-audio modules, 1 tested shared audio engine, 2 source-only; visitor-world and Studio-standalone domains; no verified station/player path | visitor-world |
| Studio & Music | partial | 7 tested modules, 3 documentation references | visitor-world |
| Convention Center | partial | 4 connected modules, 2 documentation references | visitor-world |
| World & Districts | partial | 7 connected modules, 2 tested modules, 3 documentation references | visitor-world |
| Vehicles & Yachts | discovery-needed | 5 connected modules; cars.js is source-only and intentionally not active | visitor-world |
| People & Experiences | partial | 5 connected modules, 2 source-only modules, 1 documentation reference | visitor-world |
| Performance & Quality | cross-cutting | 1 connected runtime monitor, 3 test sources, 3 configuration references | visitor-world |
| Security & Release | cross-cutting | 13 tested modules, 3 connected modules, 12 source-only modules, 1 test source, 2 configuration references and 1 asset; alive-api, owner-workspace and CI-worker domains | alive-api |

### Evidence interpretation

- connected means a source module is reachable from a registered or explicitly seeded runtime root. It does not prove correct behavior.
- tested means a direct test-source reference exists for a connected module. The CI suite passing is reported separately; a test-file reference alone is not a passing result.
- source-only means the code module was not reached from the roots inspected. It may be intentionally dormant, development-only, or require further integration discovery.
- Documentation, configuration and test-source references are reported as their own roles, not as missing runtime features.
- No module is automatically marked runtime-verified.
- Radio's shared audio dependencies do not establish a Radio station/player product.
- The car module remains inactive by design; this map does not authorize enabling it.

## 3. Recommended implementation order

### Phase A — protect shared foundations

Keep the Master Blueprint, Department Blueprints, verification engine and approval gates as the shared architectural reference. Preserve the existing draft-only workflow and keep AI, hosted execution and paid adapters optional.

Performance & Quality and Security & Release remain cross-cutting release gates. They should not become hard runtime dependencies of the visitor-facing world.

### Phase B — prioritize Floor 2 Studio

This is the next feature implementation priority. The verification report shows the strongest direct module/test evidence in Studio, including the project package, recording engine, DAW workspace, pitch-correction processor/worklet and Floor 2 Studio entry module.

Work should focus on closing the real workflow, not redesigning approved interfaces:

1. Verify one shared project/session core between standalone Studio and Floor 2.
2. Validate pitch correction through live monitoring, recording, playback and export; include bypass and latency behavior.
3. Verify global transport, playhead behavior, metronome/click, recording cancellation and lazy loading.
4. Verify the Vocal Booth, vocal effects chain and talkback while keeping Voice Notes distinct.
5. Complete save, reopen, mix/master and WAV/MP3 export checks.
6. Run physical iPad Safari checks before calling Studio release-ready.

Keep the approved MPC and Edit visual designs intact. Keep Floor 2 modules lazy-loaded and avoid changes to Floor 1, Floor 3, the room layout or camera unless separately requested.

### Phase C — world and environment integration

Use World & Districts as the spatial authority. Confirm district bounds, collision, entrances, navigation and cleanup before changing surrounding geometry. Water & Environment then validates water/shoreline/dock continuity against that shared spatial contract.

### Phase D — vehicles and Convention Center

Keep road geometry and road rules owned by World & Districts. Vehicles & Yachts can complete enter/drive/exit and yacht interaction only after road, collision, spawn and shoreline boundaries are verified. Convention Center can complete its pedestrian and venue experience independently; vehicle arrival is an optional integration, not a prerequisite for a usable venue.

Do not activate cars.js as part of this map.

### Phase E — stage and people experiences

Build a reusable event lifecycle first: prepare, announce, enter, perform, conclude and cleanup. The generic Jumbotron/stage presentation should work without depending on HERO or Radio.

People & Experiences can then consume the event lifecycle for HERO, crowd and VIP behavior. The actual approved stage-performance MP3 remains a hard dependency before final HERO performance implementation or validation.

### Phase F — LAMBO CITY Radio

Treat Radio as a separate product capability, not a label applied to existing ambient or stage audio. First define station identity, playlist/metadata, player controls, playback state, fallback behavior and cleared audio sources. Defer live broadcasting, licensing commitments, hosting costs and external distribution until separately reviewed.

## 4. Dependency-cycle resolution proposal

The current draft dependency lists form a cycle among Jumbotron & Events, People & Experiences and LAMBO CITY Radio:

- Jumbotron lists People and Radio as dependencies.
- Radio lists Jumbotron as a dependency.
- People lists both Jumbotron and Radio as dependencies.

**Proposed separation for owner review:**

1. Generic event presentation owns its lifecycle and can run without HERO or Radio.
2. Radio consumes shared audio primitives and can run independently of event orchestration.
3. HERO consumes the generic event lifecycle after the approved MP3 is supplied.
4. Event presentation may optionally expose event announcements or audio cues to Radio, but Radio is not a hard prerequisite for an event.

This removes the implementation deadlock without deleting any future capability. It is a proposed integration contract, not an owner-approved change to the Department Blueprints.

## 5. Owner decisions and evidence blockers

These items remain visible rather than being silently decided by the implementation map:

- The visitor-facing game versus ALIVE development-infrastructure boundary remains an explicit source-document conflict requiring owner confirmation.
- The actual HERO stage-performance MP3 has not yet been supplied.
- Radio's first-release product definition and cleared music assets remain unresolved.
- Physical iPad Safari validation is still required for Studio and world performance.
- Vehicle driving and yacht movement are not established as fully working runtime experiences.
- ALIVE's provider-independent local storage/worker path still needs a separate security and architecture audit before any worker activation.
- Any paid service, production release, domain/DNS, secret, billing or scheduled-worker change still requires separate explicit approval.

## 6. Readiness gates

A department may move from draft planning to implementation-ready only when:

- its source inventory and active runtime/dependency graph are reviewed;
- its acceptance criteria are measurable;
- relevant automated tests and their actual CI results are recorded;
- device/runtime validation requirements are stated;
- cross-department ownership and integration contracts are clear;
- unresolved decisions are either approved or retained as blockers.

A department becomes owner-approved only through a separate explicit owner decision. This map does not approve a department or authorize Development Director tasks.

## 7. Definition of done for this map

- [x] All ten departments are represented.
- [x] Evidence categories distinguish code, tests, documentation and configuration.
- [x] Visitor-world and ALIVE API roots are reported separately.
- [x] The current dependency cycle is identified with a proposed non-destructive resolution.
- [x] Floor 2 Studio is identified as the next feature implementation priority.
- [ ] Owner review of unresolved architecture decisions.
- [ ] Department-specific implementation tasks created only after separate owner approval.

**No Development Director tasks are created or submitted by this document.**
