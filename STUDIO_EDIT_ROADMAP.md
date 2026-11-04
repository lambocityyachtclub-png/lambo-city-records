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
- [ ] Timeline zoom and horizontal navigation that remain accurate at all zoom levels.
- [ ] Snap modes: bars, beats, subdivisions, seconds, and snap-off/free positioning.
- [ ] Non-destructive fades and crossfades.
- [ ] Clip gain independent of track volume.
- [ ] Slip editing (move source audio inside a region without moving the region).
- [ ] Clear trim boundaries and waveform rendering that reflects the audible source range.

## Stage 3 — Recording and vocal comping
- [ ] Punch-in and punch-out recording.
- [ ] Count-in and pre-roll.
- [ ] Input monitoring and input/record-level meters.
- [ ] Multiple takes and take lanes per track.
- [ ] Comping: choose sections from multiple takes into one composite performance.
- [ ] Overdub workflow and take protection.
- [ ] Recording latency measurement/compensation and input-device handling.

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
