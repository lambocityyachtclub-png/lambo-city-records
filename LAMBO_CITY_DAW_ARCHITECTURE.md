LAMBO CITY RECORDS — MODULAR DAW ARCHITECTURE

PRODUCT DIRECTION

Build a professional music-production workspace inspired by the familiar workflow of Pro Tools, with an original LAMBO CITY identity.

Visual direction:

* Dark charcoal and black interface
* Restrained luxury gold accents
* Familiar professional DAW workflow
* Clear track lanes and timeline
* Dedicated mixer and instrument views
* Touch-friendly iPad controls
* Scalable desktop layout

Pro Tools is a workflow reference, not a source of copied branding or proprietary assets.

CORE ARCHITECTURE

ONE SHARED PRODUCTION ENGINE.

ONE SONG / SESSION FORMAT.

TWO EXPERIENCES:

1. Standalone LAMBO CITY Studio.
2. Floor 2 immersive 3D studio.

EXISTING FILES TO PRESERVE

* floor2StudioApp.js
* studioAudioEngine.js
* studioSoundKit.js
* studioAudioExport.js
* studioRecordingEngine.js
* studioVocalEffects.js
* studioMultitrackWorkspace.js
* studioSongProject.js
* studioProjectPackage.js
* floor2InstrumentApp.js
* recordsHQFloor2Studio.js
* floor2StudioNavigation.js

Do not replace existing functionality without inspecting the current implementation.

NEW MODULAR FILES

1. studioDAWWorkspace.js — main DAW interface.
2. studioDAWTransport.js — playback, stop, recording, tempo.
3. studioDAWTimeline.js — arrangement, track lanes, clips.
4. studioDAWMixer.js — mixer channels and controls.
5. studioMPCController.js — physical MPC integration.
6. studioPianoController.js — piano and MIDI integration.
7. studioVocalWorkspace.js — vocal recording interface.
8. studioMasteringWorkspace.js — mastering interface.

Create these incrementally, only when their implementation is ready.

IMPLEMENTATION ORDER

1. Main DAW workspace.
2. Transport controls.
3. Timeline and arrangement.
4. Mixer.
5. MPC integration.
6. Piano and MIDI.
7. Vocal recording.
8. Mastering.
9. Standalone Studio integration.
10. Full session recording and project export verification.

COPY-AND-PASTE RULES

For every implementation:

* Inspect the latest GitHub source first.
* Identify whether the instruction creates or replaces a file.
* Give the exact filename.
* Supply complete copy-and-paste code.
* Include all required import and connection instructions.
* Preserve existing working functionality.
* Verify the committed changes before moving forward.
* Prefer automated checks before manual testing.
* Save the complete recording and export test until the workflow is assembled.

NON-NEGOTIABLES

* One shared audio and production foundation.
* No duplicate song-project systems.
* Modular, reusable components.
* Preserve the existing Beat Lab and working audio.
* Keep Floor 1, Floor 3, collision, marina, and dock systems out of scope.
* No fake controls presented as functional.
* No unnecessary rewrites.

THE GOAL: A professional, scalable LAMBO CITY music-production platform with a familiar DAW workflow and an immersive Floor 2 studio experience.
