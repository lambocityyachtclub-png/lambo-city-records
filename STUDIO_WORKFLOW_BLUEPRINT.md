# LAMBO CITY Studio — Unified Workflow Blueprint

Status: approved product direction, November 15, 2026.

## Product rule

One Studio. One song. One session clock. One timeline. One transport. One recording system.

Edit is the session command center. Instrument and recording workspaces are focused tools that operate on the same session; they must never create parallel projects, transports, or timelines.

## Producer workflow

1. **Session** — create, open, save, rename, recover, import, and export a song project.
2. **Edit** — central timeline, tracks, regions, take lanes, comping, loop range, markers, tempo, mixer, undo/redo.
3. **Create** — MPC, Piano / City Synth, Beat Lab, and Live Drummer. Their performances become tracks or patterns in the same session.
4. **Record** — Vocal Booth and Voice Notes are two modes of the same recording area. Both write to the current session.
5. **Mix & Master** — track processing, buses, effects, master chain, final playback and export.

## Shared session behavior

- One persistent transport bar is visible in every workspace.
- Play, Stop, Record/Arm, tempo, metronome, cycle-takes state, and playhead all refer to the same session.
- Spacebar toggles session playback/recording from every workspace, except while typing in a text field.
- Return-to-start moves the playhead to the session start without autoplay.
- Empty sessions still have a working song clock and playhead.
- Opening an instrument never changes the session, playhead, loop, tempo, or armed recording target.
- No instrument or sequencer starts unexpectedly. Beat Lab plays only after the producer explicitly starts its sequencer or enables it for the current session.
- Track mute, solo, volume, pan, and master controls affect the corresponding shared-session audio.
- Session files use the shared .lcp project package; instrument patterns and performance data must be persisted as session content rather than hidden, unrelated local projects.

## Recording behavior

- Record arms the selected/current instrument or recording mode.
- Play or Spacebar starts the session and armed recording together.
- Stop ends the recording and saves the take into the current session.
- The Edit loop range determines the cycle-recording pass length.
- If no loop is enabled, use an eight-bar loop beginning at the current playhead.
- Cycle Takes is enabled by default. Each completed pass is preserved as a distinct take; the next pass begins at loop-in until Stop is pressed.
- Turning Cycle Takes off records one pass.
- Original takes remain protected from destructive comping; selected sections can be placed into a non-destructive comp lane.
- Voice Notes records without requiring a beat or Beat Lab playback.
- MPC pad performances and City Synth MIDI performances are session tracks and follow the shared transport.

## Workspace responsibilities

- **Edit:** authoritative session controls and arrangement.
- **MPC:** pad/sample performance and internal MPC tools; no separate workflow destination for MPC Performance.
- **Piano / City Synth:** live instrument and MIDI capture into the current session.
- **Vocal Booth:** vocal input, effects, pitch correction, monitoring, talkback and cycle takes.
- **Voice Notes:** quick idea capture into the current session without requiring a beat.
- **Beat Lab:** pattern creation/editing; pattern playback is explicit and synchronized to the session clock.
- **Live Drummer:** secondary physical-station performance view, not a stop in the six-workspace navigation.
- **Mix & Master:** final mix and master chain for the same session.

## Design constraints

- Preserve the approved Edit visual design and original MPC hardware interface; only remove duplicated controls when they are replaced by the shared transport.
- Preserve approved world geometry, camera, navigation, room layout, and working systems.
- No duplicate DAWs, audio engines, sequencers, project stores, or transport clocks.
- Prefer small, dependency-aware modules and lazy loading.
- No new feature is complete until it has source review, build/deployment validation, and a focused iPad workflow check.

## Completion checklist

- [ ] One persistent transport on all workspaces.
- [ ] No unexpected Beat Lab playback in empty sessions or Voice Notes.
- [ ] Loop-based cycle recording saves separate audio takes and stops cleanly.
- [ ] Voice Notes works without a beat.
- [ ] MPC, City Synth, Beat Lab, and Live Drummer record into the shared session.
- [ ] Track mixer and Mix & Master affect the same session audio.
- [ ] Pitch correction and vocal effects are applied predictably to new vocal takes.
- [ ] Session save/reopen preserves tracks, audio, MIDI, patterns, tempo, loop and take metadata.
- [ ] Export produces a complete final song.
- [ ] Final iPad test passes without unrelated behavior or regressions.
