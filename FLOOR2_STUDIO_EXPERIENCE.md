# LAMBO CITY Floor 2 — Studio Experience Contract

This document is the persistent product and implementation direction for the Records HQ Floor 2 studio. Future changes to Floor 2 must preserve these rules unless the owner explicitly changes them.

## Core experience

Floor 2 has two player modes:

1. **Free-roam mode** — normal character movement is available. The player can walk around the room and enter/exit the elevator.
2. **Studio-session mode** — entering Floor 2 by elevator automatically moves the character from the elevator to the producer chair. The character remains seated and cannot walk. The camera can rotate a full 360 degrees around the seated viewpoint by touch swipe, mouse drag, or trackpad drag.

Closing an instrument interface returns to the seated 360-degree room view. Ending the studio session exits seated mode and restores normal walking. The player then chooses when to walk to and use the elevator.

## Arrival and camera

- Selecting Floor 2 in the elevator starts a short, automatic arrival transition from the elevator to the producer chair.
- No joystick, keyboard movement, or sprint control is available during the seated session.
- The seated camera is anchored to the producer position and supports continuous 360-degree horizontal viewing.
- Touch and pointer drag rotate the camera; tapping a station selects it. A drag must not accidentally activate a station.
- Existing elevator travel, floor transitions, collision, and other floors must remain intact.

## Physical studio layout

Use the seated player's viewpoint as the coordinate reference:
- MPC and the unified producer workstation are directly in front.
- The piano is front-right.
- The elevator is to the player's left and remains in its existing architectural location.
- The headquarters window/exterior view is visible to the left side of the seated view.
- The vocal booth is behind-right.
- The drum kit is behind/right and remains independently selectable.
- Maintain open sightlines and a 360-degree view. Do not crowd the chair or block the exterior view.

The MPC, mix, and mastering controls belong to one cohesive physical workstation. Do not create competing duplicate mix/master desks.

## Station selection and interfaces

Every physical station is a separate selectable object. Selecting one opens only that station's dedicated full-screen interface. Closing it returns to the seated room view.

- MPC: dedicated playable MPC surface, with pads and production controls. Do not show the entire DAW or unrelated station controls inside the MPC interface.
- Digital Beat Lab: available as a clearly labeled alternative, especially recommended for devices without touch input.
- Piano: dedicated playable piano/keyboard interface.
- Drums: dedicated playable drum interface.
- Vocal booth: dedicated vocal recording interface.
- Edit: familiar multitrack editing workflow.
- Mix/Master: familiar channel strips, levels, pan, mute/solo, effects and master output.

All instruments use the same song/project and shared audio/recording core. Switching stations must not create separate projects or separate audio engines.

## DAW usability

The recording workflow should be immediately familiar to Logic Pro and Pro Tools users:
- Edit: multitrack timeline, waveforms, clip editing and arrangement.
- MIDI: piano roll, notes and patterns.
- Mix: channel strips, level, pan, mute, solo and effects.
- Master: output processing, meters and export.

LAMBO CITY's luxury identity belongs in its visual design and presentation, not in unfamiliar controls or complicated navigation. Keep the default workflow simple, with advanced controls available when needed.

## Engineering constraints

- Preserve the existing shared audio engine, Beat Lab, recording engine, project saving/import/export and multitrack data.
- Preserve Floor 1, Floor 3, rooftop, elevator architecture, collision, and world movement outside the Floor 2 session.
- Avoid duplicate audio engines, duplicate sequencers, duplicate DAW implementations, and unnecessary rewrites of working systems.
- Implement in narrow, testable modules and verify syntax/build/deployment after each meaningful change.
