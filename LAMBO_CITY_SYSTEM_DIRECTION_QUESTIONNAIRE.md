# LAMBO CITY — System Direction Questionnaire

## Purpose

This is the owner-led direction process for every major LAMBO CITY system.

The owner is the creative director. Each system receives its own approved direction profile before substantial implementation or expansion. The profile defines what the system is for, what experience it creates, how it behaves, what it owns, what it must not own, how it connects to other systems, and how it is allowed to grow.

The goal is to define direction once, then let each system become more capable inside that direction without repeatedly redesigning its foundation.

## How the process works

1. Select one system from the registry in `systemDirectionRegistry.js`.
2. Ask the owner the 14 core questions one at a time.
3. Ask the system-specific follow-up questions.
4. Summarize the answers in plain language.
5. Let the owner correct or approve the summary.
6. Save the approved profile as the system's direction specification.
7. Audit the existing repository against that specification before changing code.
8. Build or improve the system within its own modular boundary.
9. Verify the system and its connections without breaking other systems.
10. Revisit the direction only when the owner changes it or approves a new phase.

Questions are asked conversationally, not as a giant form. The owner may answer in detail, answer briefly, or say "not decided yet." An undecided answer stays visible as an open decision; it must not be filled with an assumption.

## Core questions asked for every system

1. **Purpose and mission:** What is this system supposed to do, and why does LAMBO CITY need it?
2. **The experience:** What should a person see, feel, and be able to do?
3. **How it behaves:** What is the complete normal workflow, including important states and failure behavior?
4. **Capabilities and features:** What must it be capable of doing?
5. **Boundaries and non-goals:** What must it never do, change, or own?
6. **Connections:** Which systems does it connect to, and what crosses each interface?
7. **Modularity:** What belongs inside its own modules, and what shared services should it reuse?
8. **Growth direction:** How should it improve over time without rewriting unrelated systems?
9. **Design and usability:** What should it look and feel like, and how should it be controlled?
10. **Devices and performance:** Which devices must it support, and what performance standards matter?
11. **Reliability and protection:** What must be saved, recovered, tested, or protected?
12. **Definition of done:** What observable results prove that it works correctly?
13. **Priorities and phases:** What comes first, next, and later?
14. **Owner approval rules:** What can the team decide within the approved direction, and what must come back to the owner?

The registry also supplies system-specific follow-up prompts for each domain.

## Initial system order

The order below is a starting sequence, not permission to skip owner direction or change the existing roadmap.

1. LAMBO CITY Studio
2. World & Environment
3. Player, Camera & Navigation
4. Interaction System
5. NPCs & Character Behavior
6. Digital Real Estate
7. Entertainment & Events
8. Vehicles & Transportation
9. Audio, Visuals & Atmosphere
10. Platform, Performance & Reliability
11. Development & Quality System

A system may be split into smaller independently directed modules after its boundaries are understood. Do not create duplicate engines or duplicate sources of truth just to make the file count larger.

## Direction profile lifecycle

- `in-discovery`: questions are being answered; no final direction should be assumed.
- `approved`: the owner has reviewed and approved all required answers.
- `in-implementation`: approved direction is being translated into focused modules and tasks.
- `verified`: acceptance criteria have been checked against the implementation.
- `revisiting`: the owner has requested a direction change or a new phase.

The JavaScript registry currently provides profile creation, next-question selection, answer recording, progress checks, validation, approval, and JSON export. It does not write to browser storage, change the live game, or autonomously modify source code. The approved profile must be committed as a versioned project artifact by the development workflow.

## Development rules after direction is approved

- Inspect the current implementation before proposing changes.
- Preserve existing working behavior and established landmarks.
- Build within the system's own modular files where possible.
- Reuse shared services through explicit interfaces.
- Do not silently expand the system's authority or scope.
- Do not let one system rewrite another system's files.
- Add automated checks for critical behavior and interfaces.
- Make changes in an isolated branch or development workspace.
- Keep a known-good version and a clear rollback path.
- Require owner approval for protected, high-impact, paid, security, data-deletion, or major architectural changes.
- Do not treat "self-improving" as permission for unrestricted self-modifying code.

## Existing project direction remains in force

This questionnaire adds a more detailed owner-approved specification layer. It does not override the existing LAMBO CITY North Star, World Plan, Studio Architecture, or Autonomous Development Engine. If a new answer appears to conflict with an established decision, surface the conflict and ask the owner which direction should govern.

## First session

Begin with **LAMBO CITY Studio** because it is the current active system and already has a substantial working foundation. Ask one question at a time, starting with its purpose and mission. Do not ask the owner to repeat decisions already established in the repository or conversation; confirm those as known context and ask only about unresolved direction.
