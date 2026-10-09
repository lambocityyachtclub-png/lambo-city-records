# LAMBO CITY — ARCHITECTURE MAP

## Purpose
This document guides future development of LAMBO CITY while protecting existing working systems. It supplements LAMBO_CITY_NORTHSTAR.md and does not replace the original vision.

## Core Rules
- Preserve working gameplay, the Grand Stage, HERO's performance, the Jumbotron, marina, dock, and Records HQ.
- Keep the existing Three.js and modular JavaScript architecture.
- Inspect existing files before changing code.
- Avoid duplicate audio players, animation loops, collision systems, and building geometry.
- Make small, focused changes and test them before moving on.
- Keep Phase 1 single-player. Do not skip development phases.

## Current Development Priorities

### 1. Grand Stage
- Add detailed speakers.
- Animate speaker cones so visible movement responds to the music.
- Make lighting and visual effects different for each song.
- Coordinate speakers, lights, lasers, and stage effects.
- Preserve the existing HERO performance and music playback.

### 2. Stage Artwork
- Plan artwork for billboards, banners, and the Jumbotron.
- Establish the visual direction before adding new artwork.

### 3. Records HQ Floor 1
- Finish the visitor-facing interior, media display, and merchandise experience.
- Preserve working access and navigation.

### 4. Records HQ Floor 3
- Develop the executive meeting and marketing environment.

### 5. Player Speed
- Later, adjust normal movement speed to be faster than the current walk speed but slightly slower than Shift/sprint.

### Deferred Work
The advanced Floor 2 music-production application, live vocals, and live broadcasting are future work. Do not build them as part of the immediate stage upgrade. The boarding-pass flow is also not the current priority.

## Planned Audio Architecture
- Existing stage music remains responsible for prerecorded song playback.
- A future stage-show controller coordinates song-specific visual cues.
- A future speaker module handles speaker geometry and animation.
- A future performance event logger records song and performance details.
- Future studio audio input and live broadcasting must connect through clearly defined interfaces rather than duplicate existing audio systems.

These are proposed components, not claims that the modules already exist.

## ASCAP and Performance Records
HERO and the user's own music will be the first example. A future event log may record the song, performer, start and end times, duration, and completion status.

Logging a performance does not guarantee royalties. ASCAP and relevant rights holders must confirm licensing and reporting requirements before any royalty claims are made.

## Safe Development Workflow
1. Inspect the current repository and relevant files.
2. Identify existing systems and dependencies.
3. Define the intended feature and visual design.
4. Change only the files necessary.
5. Integrate with the existing initialization and update lifecycle.
6. Test the new feature and verify existing gameplay still works.
7. Document what changed and what was actually tested.

## Next Task
Inspect the existing Grand Stage speaker geometry, stage music, lighting, Jumbotron, and update loop. Identify what already exists before implementing detailed, music-reactive speakers and song-specific lighting.

Do not replace the existing performance system or create a new audio framework unnecessarily.

## Guiding Principle
Preserve what works. Connect systems carefully. Finish the current phase before expanding into live broadcasting, multiplayer, or advanced studio features.
