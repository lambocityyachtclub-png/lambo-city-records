# LAMBO CITY RECORDS — FLOOR 2 DEVELOPMENT BLUEPRINT

## 1. MISSION

This system is responsible exclusively for developing,
verifying, and improving the LAMBO CITY RECORDS Floor 2
Digital Studio.

Its purpose is to coordinate approved, predefined
development tasks while preserving existing functionality.

It must not independently modify unrelated areas of LAMBO CITY.

## 2. PROJECT STANDARD

The Floor 2 Digital Studio is intended to become a
professional music-production environment with capabilities
comparable in scope to industry-standard DAWs.

The long-term workflow is:

CREATE BEAT
ARRANGE
RECORD VOCALS
EDIT
MIX
MASTER
EXPORT
SONG ARCHIVE

All equipment and interfaces should serve a functional purpose.

All equipment, instruments, interfaces, and branding must
follow the LAMBO CITY RECORDS identity.

## 3. EXISTING SYSTEMS TO PRESERVE

The following files are established parts of the project:

- recordsHQFloor2Studio.js
- floor2StudioApp.js
- floor2InstrumentApp.js
- floor2DrumStation.js
- studioAudioEngine.js
- studioSoundKit.js
- studioAudioExport.js
- studioSongProject.js

These files must be inspected before any task proposes
changes to them.

Existing working audio, beat patterns, song saving,
song loading, song export, and pattern import/export
must be preserved.

A task must not replace an existing system merely because
a new implementation is easier to write.

## 4. PROTECTED PROJECT BOUNDARIES

The Floor 2 system must not make unrelated changes to:

- Floor 1
- Floor 3
- The rooftop VIP area
- The marina
- The dock
- The Grand Stage
- The Jumbotron
- Vehicles
- Player movement
- Other unrelated world systems

Changes outside Floor 2 require separate authorization.

## 5. TASK REQUIREMENTS

Every task must specify:

- A unique task identifier
- Its target component
- Its single primary objective
- The files it is permitted to affect
- Its required inputs
- Its expected result
- Its verification procedure
- Its completion status

A task must not silently expand its scope.

If a task requires changes outside its permitted files,
it must stop and report the boundary conflict.

## 6. ALLOWED TASK BEHAVIOR

The system may:

- Inspect approved project modules
- Validate task inputs
- Execute explicitly registered operations
- Run available verification checks
- Report success, failure, or blocked status
- Maintain a record of task execution
- Identify missing prerequisites

The system must not execute arbitrary code supplied
as task text.

Written instructions alone do not authorize unrestricted
file modifications.

## 7. CHANGE PROTECTION

Before changing an existing file:

1. Identify the exact proposed change.
2. Confirm that the change is necessary for the task.
3. Preserve unrelated working behavior.
4. Identify any potential impact on other modules.
5. Require approval for destructive or out-of-scope changes.

Never claim a feature works unless it has been verified.

## 8. COMPLETION STATES

Every task must report one of these states:

- CREATED
- VALIDATING
- RUNNING
- COMPLETED
- FAILED
- BLOCKED

COMPLETED means the defined operation finished successfully.

It does not automatically mean the entire studio feature
has been tested in the browser.

Browser verification must be reported separately when required.

## 9. DEVELOPMENT SEQUENCE

The initial development sequence is:

1. Establish this blueprint.
2. Implement the Floor 2 task registry.
3. Verify task registration and validation.
4. Connect one safe, predefined studio operation.
5. Verify its result and failure handling.
6. Expand only after the initial integration succeeds.

Do not skip verification steps.

## 10. ARCHITECTURE

Continue using the existing Three.js and JavaScript module
architecture.

Do not introduce a new framework, external AI service,
backend, or unrelated dependency for this task system.

Keep task coordination separate from the studio's audio,
song-project storage, and visual construction modules.

The registry coordinates approved operations; it does not
replace the modules that perform the actual work.

## 11. FUTURE EXPANSION

This blueprint applies only to Floor 2.

Other systems, such as the Jumbotron, Marina, Vehicles,
and Grand Stage, may receive their own dedicated blueprints
and task registries in the future.

Each system must have its own mission and boundaries.

No system may automatically assume responsibility
for another system.

## 12. GOVERNING RULE

INSPECT WHAT EXISTS.
PRESERVE WHAT WORKS.
CHANGE ONLY WHAT IS NECESSARY.
VERIFY BEFORE EXPANDING.




# FLOOR 2 APPROVED STUDIO DIRECTION
## LAMBO CITY RECORDS — IMMERSIVE DIGITAL STUDIO

STATUS: APPROVED DESIGN DIRECTION
PRIORITY: PRESERVE EXISTING FUNCTIONALITY
APPROACH: MODULAR, INCREMENTAL DEVELOPMENT

### 1. CORE VISION

Floor 2 will function as a luxury, immersive music-production studio inspired by the experience of operating a professional cockpit.

The player is the producer. The studio is the player's instrument panel. Every station represents a functional part of the music-production process.

The experience must combine realistic physical surroundings, intuitive controls, professional music-production capabilities, and LAMBO CITY RECORDS branding.

The existing Three.js architecture and working studio systems must be preserved and expanded incrementally.

### 2. CINEMATIC ARRIVAL AND EXIT

When the player exits the elevator to enter Floor 2:

1. The elevator doors open.
2. A brief cinematic introduces the studio environment.
3. The player's character is shown arriving at the producer's workstation.
4. The character transitions into the producer's chair.
5. Control transfers to the player when the seated experience begins.

The entrance should feel cinematic, luxurious, and responsive without unnecessarily delaying the player.

When the player finishes working:

1. The studio interface closes.
2. The character exits the seated production experience.
3. Control returns to normal third-person gameplay.
4. The player can freely explore Floor 2, use the elevator, and travel to other floors.

### 3. SEATED PRODUCER POV

The primary production experience takes place from the seated producer's perspective.

The player remains seated while operating the studio.

The camera must support a smooth, full 360-degree view of the surrounding studio, allowing the player to look around and discover available equipment.

The seated experience must support desktop controls and touch-friendly iPad navigation.

The camera system must remain compatible with the existing game architecture.

### 4. TWO METHODS OF NAVIGATION

Players must be able to interact with the studio in two complementary ways.

PHYSICAL STUDIO INTERACTION:
- Look around the studio.
- Select visible equipment.
- Open the appropriate production interface.
- Experience the equipment as part of the physical environment.

QUICK WORKSTATION NAVIGATION:
- Swipe left or right to switch workstations.
- Provide clear visual feedback about the selected station.
- Keep navigation intuitive on touchscreens.
- Allow players to return to the main studio view.

Both methods must access the same underlying production systems.

Switching stations must not reset the player's song, erase patterns, or disconnect audio.

### 5. MODULAR VISUAL EQUIPMENT

Every major piece of equipment must be designed for independent visual replacement and future improvement.

Equipment includes:

- MPC Beat Lab.
- Piano and virtual instruments.
- Mixing console.
- Recording booth.
- Vocal recording equipment.
- Editing and arrangement displays.
- Mixing and mastering displays.
- Producer workstation and chair.
- Studio monitors and branded accessories.

Visual models, materials, lighting, and decorative elements should be kept separate from interaction logic wherever practical.

Replacing an equipment model must not unintentionally break its click targets, audio connections, collision behavior, or production functions.

All equipment should reflect the premium LAMBO CITY RECORDS identity.

### 6. MUSIC-PRODUCTION WORKFLOW

The long-term production workflow is:

CREATE BEAT
→ ARRANGE
→ RECORD VOCALS
→ EDIT
→ MIX
→ MASTER
→ EXPORT
→ SONG ARCHIVE

The studio must progressively support beginner-friendly controls and advanced producer workflows.

The long-term professional direction includes multitrack recording, timeline arrangement, MIDI editing, mixing, effects, automation, mastering, and song export.

These capabilities must be implemented and tested individually. Planned capabilities must not be represented as completed features.

### 7. HERO — THE STUDIO PARTNER

The player controls the production experience.

HERO serves as the in-world studio partner, guide, and knowledgeable assistant.

HERO should:
- Offer help when requested.
- Explain equipment and production techniques.
- Provide useful tips for improving a song.
- Support beginners without interrupting experienced producers.
- Maintain his own personality and presence within the LAMBO CITY world.

HERO must not force players through unnecessary tutorials or take control away from them.

### 8. SONG PROJECTS, OWNERSHIP, AND EXPORT

Preserve the existing working Beat Lab audio and song-project systems.

The long-term goal is for players to:

- Create original music.
- Save beats and complete song projects.
- Reopen saved projects and continue working.
- Maintain an organized personal Song Archive.
- Export their music to their own devices.
- Use their exported recordings to pursue independent music releases.

Saving a complete session must preserve the information required to reopen and continue that session, not merely save the current beat pattern.

The existing export mechanism must be audited before expanding it to support complete song sessions.

Future integration may connect the Song Archive to the in-game phone, LAMBO CITY stage, and LAMBO CITY Radio.

### 9. FUTURE DIGITAL DISTRIBUTION

LAMBO CITY may eventually offer a direct music-distribution service.

This is a future business-development phase, separate from the initial studio implementation.

Before offering distribution to digital service providers, investigate the applicable licensing, rights management, artist agreements, royalty accounting, distribution partnerships, and legal requirements.

Until that infrastructure exists, prioritize allowing artists to export their music and pursue independent distribution themselves.

### 10. ENGINEERING RULES

The following rules govern Floor 2 development:

1. Preserve existing working functionality.
2. Inspect the actual repository code before proposing changes.
3. Keep the existing Three.js architecture intact unless a verified technical need requires a change.
4. Separate camera behavior, interaction logic, visual equipment, and audio systems wherever practical.
5. Build modular components with clear responsibilities.
6. Avoid unnecessary rewrites of working files.
7. Make small, independently testable changes.
8. Maintain compatibility with iPad Safari and desktop browsers.
9. Preserve existing mobile movement controls.
10. Test audio playback, project saving, project loading, and export after relevant changes.
11. Never remove working functionality without an explicit reason and an approved replacement.
12. Maintain a clear record of completed work, outstanding tasks, and the next implementation step.

### 11. IMPLEMENTATION ROADMAP

PHASE 1 — DOCUMENTATION AND BASELINE
- Record this approved design direction.
- Inspect the existing Floor 2 blueprint, camera, input, studio, and audio-related files.
- Identify what is working, partially implemented, and still planned.
- Establish a safe baseline before making code changes.

PHASE 2 — CINEMATIC ARRIVAL AND CAMERA
- Implement the elevator-to-producer-chair transition.
- Establish the seated producer camera.
- Support smooth 360-degree viewing.
- Provide a reliable transition back to third-person gameplay.

PHASE 3 — STUDIO NAVIGATION
- Connect physical station selection to existing production interfaces.
- Implement swipe-based workstation navigation.
- Ensure both navigation methods access the same underlying systems.

PHASE 4 — MODULAR VISUAL EQUIPMENT
- Establish replaceable visual components.
- Improve equipment models, materials, lighting, and branded details.
- Preserve existing interactions and audio behavior.

PHASE 5 — PROFESSIONAL PRODUCTION WORKFLOW
- Expand arrangement, recording, editing, mixing, mastering, and export.
- Introduce advanced features incrementally.
- Test each feature before expanding further.

PHASE 6 — SONG ARCHIVE AND COMPLETE SESSIONS
- Improve project selection and archive management.
- Ensure complete sessions can be saved and reopened.
- Expand export capabilities while preserving existing functionality.

PHASE 7 — WORLD INTEGRATION
- Connect songs to the in-game phone.
- Explore integration with the LAMBO CITY stage and radio.
- Evaluate future artist publishing and distribution services.

### 12. IMMEDIATE NEXT ACTION

After saving this blueprint update, inspect the existing camera and Floor 2 integration code before implementing the first cinematic transition.

Do not begin by rebuilding the studio.

First establish the camera transition, preserve the existing controls, and verify that the working Beat Lab, piano audio, and song-project functionality remain intact.

Every subsequent change must build on the verified results of the previous step.

END OF APPROVED FLOOR 2 DESIGN DIRECTION









⸻

LAMBO CITY — PROJECT CONTINUITY & MODULE STANDARD

Last updated: October 26, 2026
Status: Active development
Permanent source of truth: This GitHub repository and its committed documentation.

1. PROJECT CONTINUITY

This repository records LAMBO CITY’s approved vision, technical decisions, completed milestones, and next steps.

At the start of every new development session:

* Read this blueprint before proposing changes.
* Inspect the current repository and verify what already exists.
* Preserve previously approved decisions.
* Never restart completed work unnecessarily.
* Record meaningful progress and the next unfinished task.

2. OWNER’S DEVELOPMENT RULES

* Maximize practical automation.
* Build independent, reusable modules instead of unnecessary rewrites.
* Commit directly to main, as requested by the owner.
* Run automated checks before requesting manual testing.
* Give exact copy-and-paste instructions when owner participation is required.
* Make routine technical decisions using sound engineering practices.
* Never claim a change or test succeeded without verification.
* Preserve existing working features.

3. REUSABLE MODULE STANDARD

Every new component, such as an MPC sound kit, jumbotron, studio camera, or visual equipment system, should have one clear responsibility.

Each module should:

1. Initialize its own resources.
2. Communicate through defined interfaces.
3. Reuse the existing engine, scene, and audio services.
4. Follow the established initialization and update patterns.
5. Clean up resources it creates when appropriate.
6. Separate visual presentation from interaction logic where practical.
7. Declare dependencies and permitted files.
8. Include automated checks wherever feasible.
9. Avoid changing unrelated systems.
10. Be upgradeable without requiring unrelated modules to be rewritten.

The existing engine already provides a shared game loop. Do not create duplicate loops without a verified technical reason.

4. EXISTING TASK REGISTRY

File: floor2TaskRegistry.js

The registry already contains basic mechanisms for:

* Registering tasks.
* Validating task definitions.
* Registering and executing predefined handlers.
* Tracking task statuses.
* Recording execution history.

It does not yet provide a complete automated module-generation pipeline.

The next stage is to connect the registry to real, predefined operations with validated inputs, controlled file boundaries, and testable results.

Important: allowedFiles describes a task’s permitted scope; it does not independently prevent a handler from modifying other files. That protection must be implemented before expanding automation.

Never execute arbitrary task descriptions as code.

5. CURRENT PROJECT POSITION

* The Floor 2 blueprint exists and documents the approved studio direction.
* The task registry exists.
* The main engine initializes Floor 2 systems and updates registered systems through its shared loop.
* The reusable module contract still needs implementation and verification.
* A complete automated development pipeline has not yet been verified.
* No new automated module-generation operation is confirmed complete.

6. NEXT STEPS — IN ORDER

1. Inspect the existing module-loading architecture and available automated checks.
2. Define a reusable module contract compatible with the current engine.
3. Test the registry’s successful execution, invalid inputs, missing handlers, and handler failures.
4. Connect one safe, predefined demonstration operation.
5. Verify that operation before developing controlled module-file generation from a fixed template.
6. Preserve the working Beat Lab audio, song saving and loading, export, player movement, and unrelated world systems.
7. Continue the approved Floor 2 development roadmap after the automation foundation is verified.

7. FLOOR 2 DESIGN DIRECTION

The long-term production workflow remains:

CREATE BEAT → ARRANGE → RECORD VOCALS → EDIT → MIX → MASTER → EXPORT → SONG ARCHIVE

The intended experience includes a cinematic elevator arrival, a seated producer camera with 360-degree viewing, workstation navigation, functional studio equipment, and a smooth return to third-person exploration.

Implement these features incrementally after the module/task foundation is verified. Do not rebuild the studio or replace working systems unnecessarily.

8. GOVERNING RULE

INSPECT WHAT EXISTS.
PRESERVE WHAT WORKS.
AUTOMATE REPEATABLE WORK.
VERIFY BEFORE EXPANDING.
RECORD THE NEXT STEP.

Every future session must resume from the last verified milestone instead of restarting the project.

LAMBO CITY STUDIO
PRODUCT DIRECTION + ARCHITECTURE + NEXT IMPLEMENTATION MILESTONE
PRODUCT DECISION
• Build BOTH: (1) a standalone LAMBO CITY Studio app and (2) the Floor 2 in-game studio. Both must use one shared music-production core, not two separate DAWs.
• Song-project access: standalone-first. A song belongs to the creator as a portable project file, not only to one game session or browser.
TARGET ARCHITECTURE
• Shared Studio Core — audio engine, sound library (DIGITAL + VINTAGE MPC), project model, recording/mixing services, and project import/export.
• Standalone Studio — independent full-screen music app; must not depend on Three.js.
• Floor 2 Studio — 3D producer-chair/cockpit experience that opens the same production tools and projects.
• Portable project format — LAMBO CITY project package, proposed extension .lcp; later able to include audio recordings, stems and media.
WHAT EXISTS IN THE REPOSITORY
• main.js / engine.js: Floor 2 studio systems are registered and initialized in the game.
• floor2StudioApp.js: existing 16-step Beat Lab with DIGITAL and VINTAGE MPC sound profiles, audio playback/export, beat save/load and song-project controls.
• studioSongProject.js: song metadata, patterns, arrangement sections/clips and browser storage.
• floor2TaskRegistry.js: exists, but is not registered in main.js or engine.js. It is not required for the project-file milestone.
IMPORTANT LIMITATIONS
• Song projects currently use browser localStorage, so they are not automatically portable between devices.
• The current song-project export is incomplete for the desired product: it must preserve the full arrangement, every pattern and project metadata. The future package can
later add recorded audio/stems.
• The current Beat Lab is not yet a complete DAW. Do not claim multitrack recording, full MIDI editing, automation, effects or mastering are finished.
NEXT IMPLEMENTATION MILESTONE — BUILD THE .LCP PACKAGE
• Create a focused module: studioProjectPackage.js.
• Versioned export/import should include metadata, settings, all patterns, arrangement sections and clips; validate files before import; preserve project IDs and pattern/clip
relationships.
• Connect the existing Floor 2 export/import controls to this module only after the package is tested.
• Verify a complete export → import → compare round trip. Keep existing localStorage save/load working.
PRESERVATION RULES & WORKFLOW
• Do not rewrite the working Beat Lab, audio engine, Floor 2 room, main.js or engine.js for this milestone unless inspection proves a change is necessary.
• Make the smallest safe modular change; preserve backups/history; automated checks first, manual verification only where needed.
• User works from iPad and prefers exact file-level instructions and minimal back-and-forth. No third-party AI coding agent and no AI runtime task system.
ROADMAP AFTER PORTABILITY
• 1. Complete and verify .lcp portability. 2. Build standalone Studio UI using the same core. 3. Expand shared tools toward multitrack recording/editing, MIDI, mixing, effects
and mastering. 4. Connect Floor 2 cockpit/stations. 5. Add optional cloud archive/sync after standalone files are reliable.
CURRENT STATUS
• Architecture and milestone established; no code was changed or committed during this planning step. Repository: lambocityyachtclub-png/lambo-city-records ·
default branch: main.
