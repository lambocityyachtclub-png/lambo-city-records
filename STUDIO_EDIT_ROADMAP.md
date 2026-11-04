# LAMBO CITY Studio — EDIT Development Roadmap

This roadmap is the source of truth for the EDIT workspace build. Keep the approved EDIT screen design unchanged: **Simple on the surface. Powerful underneath.** Build the professional capabilities behind the existing interface, using the shared song session, recording engine, audio engine, and arrangement playback. Do not create a second DAW or duplicate session/audio systems.

## Stage 1 — Editing foundation
**Code status: implemented; device/browser verification still required.**

- [x] Select an audio region.
- [x] Move a region by dragging its title.
- [x] Trim the start and end using the region edge handles.
- [x] Split the selected region at the EDIT playhead.
- [x] Duplicate the selected region.
- [x] Delete a region to session trash and restore the last deleted item.
- [x] Undo and redo region edits.
- [x] Add keyboard shortcuts: Cmd/Ctrl+Z undo, Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y redo, Cmd/Ctrl+D duplicate, Delete/Backspace delete, and S split.
- [x] Record history only when a drag/trim actually changes a region, not when the user merely selects it.
- [ ] Verify all operations on iPad Safari, desktop mouse/keyboard, and touch devices.
- [ ] Verify undo/redo across split, trim, move, duplicate, delete, restore, and session save/reopen.

## Stage 2 — Waveform precision
**Code status: Stage 2 core implementation committed; device/browser and save/reopen verification remain.**

- [x] Timeline zoom and horizontal navigation using the existing zoomable 128-bar timeline.
- [x] Snap modes: bars, beats, 1/16 subdivisions, seconds, and snap-off/free positioning for region movement, trimming, and cursor placement.
- [x] Non-destructive fade-in and fade-out handles with playback gain envelopes; overlapping regions can be shaped as manual crossfades.
- [x] Clip gain independent of track volume, saved with the region, applied during playback, and included in WAV/MP3 renders.
- [x] Source trim/slip boundaries and fade envelopes are respected by both live playback and offline WAV/MP3 export.
- [x] Slip editing moves source audio inside a region without moving the region boundary.
- [x] Waveform rendering reflects the audible source offset and trimmed source duration.
- [x] Equal-power fade curves support manual crossfades when overlapping regions are shaped with fade-out and fade-in handles.
- [ ] Verify snap accuracy, fades, clip gain, slip editing, and waveform boundaries on iPad Safari and desktop.
- [ ] Verify precision metadata survives save/reopen and portable session export/import.

## Stage 3 — Recording and vocal comping
**Code status: core workflow implemented and committed; hands-on iPad Safari / desktop verification remains. Automatic loopback latency measurement is still deferred.**

- [x] Count-in / pre-roll with audible beat clicks before the armed track begins recording.
- [x] Punch-in at a selected bar and automatic punch-out at a selected bar; manual record/stop remains available.
- [x] Optional microphone input monitoring, off by default; use headphones to avoid acoustic feedback.
- [x] Multiple takes are retained as separate, vertically stacked take lanes on the armed track.
- [x] Take protection lock prevents accidental deletion and is preserved in portable session export/import.
- [x] Recording-level meter reads the active input while recording.
- [x] Select an available microphone/input device; fall back to the browser default if a saved device is unavailable.
- [x] Comp selected sections from different takes into a normal audio comp track; source takes remain intact and are muted while the comp is auditioned.
- [x] Overdub by recording additional passes onto the same armed track; each pass remains a separate take.
- [x] Per-device manual latency compensation (0–500 ms) is applied to the recorded region start and saved with the session / portable session.
- [ ] Automatic input-latency measurement / loopback calibration.
- [ ] Verify count-in timing, punch boundaries, monitoring, input selection, meter behavior, take lanes, comp playback, undo, and protection on iPad Safari and desktop.

## Stage 4 — Arrangement and navigation
- [ ] Song markers and named sections.
- [ ] Loop/cycle range with clear start/end controls.
- [ ] Track folders, groups, and linked editing.
- [ ] Follow-playhead and scroll-to-cursor behavior.
- [ ] Multi-region selection and group move/edit.
- [ ] Tempo and time-signature changes across the arrangement.

## Stage 5 — Session reliability
- [ ] Reliable autosave with visible save state.
- [ ] Crash/reload recovery for unsaved work.
- [ ] Version history and restore points.
- [ ] Safer session open/new/import flows that protect unsaved changes.
- [ ] Validate portable project export/import, including all region-edit metadata.
- [ ] Verify session persistence across browser restarts and supported devices.

## Stage 6 — Advanced production integration
- [ ] Automation lanes and editable automation points.
- [ ] Audio routing, buses, sends, and groups.
- [ ] MIDI/piano-roll editing and instrument workflow integrated into the same song session.
- [ ] Shared track/session state handoff to the separate MIX & MASTER interface.
- [ ] MIX & MASTER processing: EQ, compression, effects, pitch correction, stereo processing, and master chain.
- [ ] Final mix and stem export options.

## Build rules
1. Preserve the approved EDIT visual design unless HERO explicitly asks for a redesign.
2. Keep the EDIT timeline separate from the Digital Beat Lab interface.
3. Reuse the shared session model, recording engine, and audio engine; do not fork them.
4. Keep advanced controls contextual so the main EDIT surface stays clean.
5. Mark a stage complete only after its code is implemented and its relevant workflows are verified. Source commits alone do not count as device/browser testing.
6. After Stage 1 verification, proceed to Stage 2. Do not skip or silently drop any roadmap item.
