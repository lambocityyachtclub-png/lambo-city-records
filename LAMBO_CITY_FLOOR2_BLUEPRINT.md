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
