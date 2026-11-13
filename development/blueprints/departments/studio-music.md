# Studio & Music — Department Blueprint (Draft v1)

**Department ID:** `studio-music`  
**Status:** partial  
**Approval:** Not owner-approved; draft only  
**Parent:** `LAMBO_CITY_MASTER_BLUEPRINT_DRAFT.md`

## 1. Mission

The repository contains a substantial shared Studio architecture and many DAW, recording, MPC, vocal and export modules. The owner direction requires one production core/project format for standalone Studio and Floor 2. Full end-to-end parity and physical-device behavior remain validation work.

## 2. Scope and ownership

Own the shared production engine, session/project format, standalone and Floor 2 Studio entry points, DAW, MPC, instruments, recording, editing, vocals, pitch correction, mixing, mastering, save/reopen and export. Do not create a second DAW or separate Floor 2 project core.

### Explicit boundaries
- Own the interfaces and assets explicitly assigned to this department.
- Consume shared services through documented interfaces; do not fork shared engines.
- Do not silently modify another department's protected assets or architecture.
- Cross-department work must name its dependency and agree the integration contract first.

## 3. Current source inventory

The following are source pointers for inspection and traceability. They are not proof of complete behavior.

- `LAMBO_CITY_DAW_ARCHITECTURE.md`
- `FLOOR2_STUDIO_EXPERIENCE.md`
- `STUDIO_EDIT_ROADMAP.md`
- `studioProjectPackage.js`
- `studioRecordingEngine.js`
- `studioDAWWorkspace.js`
- `studioPitchCorrection.js`
- `studioPitchCorrectionWorklet.js`
- `floor2StudioApp.js`
- `studioStandalone.js`

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

1. Preserve approved MPC and Edit interface designs; inspect latest code before any UI change.
2. Verify one project/session format and shared production core across standalone and Floor 2 entry points.
3. Complete end-to-end record, edit, save, reopen, playback, mix/master and export workflows.
4. Validate pitch correction across live vocal monitoring/recording, playback, offline render and export; include physical iPad Safari testing.
5. Verify talkback, vocal chain, metronome, transport and lazy-loading do not regress.
6. Keep large instruments/effects lazy-loaded and avoid expensive always-on processing.

## 7. Draft acceptance criteria

- [ ] A session created in either entry point opens in the other without duplicated or lost state.
- [ ] Recording, editing, save/reopen, playback, mix/master and WAV/MP3 export pass automated and manual device checks.
- [ ] Pitch correction is audible and consistent across all supported paths with clear bypass/latency behavior.
- [ ] MPC remains a dedicated playable interface; performance tools remain inside its Tools area.
- [ ] Floor 2 room layout, seated camera and other floors remain unchanged by Studio module work.
- [ ] Voice Notes remains distinct from Vocal Booth while talkback and vocal processing are integrated as specified.

## 8. Open questions / evidence gaps

- Physical iPad testing is still needed for the user's pitch-correction/workflow feedback.
- Confirm all supported export formats and browser limitations.
- Verify shared session parity from the latest deployed candidate before declaring Studio release-ready.

## 9. Definition of done for this department

This blueprint becomes implementation-ready only after:
1. Source files and active runtime registration have been inspected.
2. Current capabilities are classified with source locators and test evidence.
3. Dependencies and integration contracts are confirmed.
4. Draft acceptance criteria are converted into measurable checks.
5. Conflicts and owner decisions are resolved or explicitly retained as blockers.
6. The owner approves the department blueprint.

**No Development Director task is created or submitted by this document.**
