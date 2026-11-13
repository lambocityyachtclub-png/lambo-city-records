# LAMBO CITY — Protected Development Rules

**Owner direction:** LAMBO CITY is a continuously improving world and platform. Existing approved work is the protected foundation. Development should make it richer, more cinematic, more detailed, more capable, and more reliable — not repeatedly replace completed work.

## Protected production baseline

- Current production baseline at the time these rules were introduced: `1a8ce6d015010595bad2ba2687be09b2b728e019`.
- Prior independent-project milestone: `64d98dab5a0e3cd01dc77572674b391c7e3ada8e`.
- Production must never be used as an experimental workspace.
- Every feature change starts from the latest verified production commit and is developed on its own branch.

## Non-negotiable development rules

1. **Preserve first.** Existing locations, systems, interfaces, interactions, content, visual design, navigation, audio workflows, and approved behavior remain intact unless the owner explicitly asks to change a specific part.
2. **Additive-first development.** Prefer new modules, assets, details, layers, configuration, and isolated enhancements. Do not replace an existing system when an additive extension can achieve the goal.
3. **No unrequested scope.** Change only files required for the stated task. Do not opportunistically refactor, rename, reorganize, simplify, optimize, redesign, or delete unrelated work.
4. **No silent removal.** Deleting or disabling a feature, module, asset, location, interaction, collision, or content requires explicit owner authorization for that specific removal.
5. **Preserve approved design.** A design described as perfect/approved is locked. Improve details around it; do not redesign it.
6. **Dependency awareness.** Before editing a module, identify its callers, registrations, imports, shared state, assets, collisions, input bindings, and dependent workflows.
7. **Isolated delivery.** One task per branch and pull request. Keep diffs small and explain every changed file.
8. **Preview before production.** Build and test a preview first. Production deployment is allowed only after required checks pass and the owner approves the exact change.
9. **No false completion claims.** Distinguish code review, automated test, successful build, preview verification, and real device/gameplay testing. Never claim a test that was not run.
10. **Recoverability.** Keep known-good commits and deployments available. Never force-push, rewrite shared history, or reset production to an older state as a convenience.

## Protected systems and experiences

These are protected product areas, not permission to assume their internal implementation. Confirm actual paths and dependencies before changing them.

- World runtime, scene orchestration, navigation, movement, camera, input, physics, collisions, and loading.
- Existing city districts, roads, sidewalks, marina, waterfront, boardwalk, stage, stores, Records HQ, and all completed locations.
- Records HQ building, lobby, floors, rooftop, elevator, branding, and approved architectural direction.
- Floor 2 Studio production core, standalone Studio, in-world Studio, Edit, MPC, Beat Lab, Piano/City Synth, Vocal Booth, Voice Notes, effects, recording, monitoring, transport, Mix & Master, save/load/export.
- ALIVE foundation, blueprints, registries, automation, and owner-control workflows.
- Player identity, accounts, profiles, events, HERO, communications, and business systems.

## Required task authorization record

Every pull request must state:
- **Goal:** the exact owner-requested outcome.
- **Allowed files/areas:** exact file paths or narrowly scoped directories.
- **Must preserve:** existing behavior, visuals, dependencies, and interfaces that must remain unchanged.
- **Validation:** the checks that were run and their actual results.
- **Founder authorization:** explicit approval for changes to application source, protected systems, or deletions.

A PR must not expand its own scope. If implementation requires additional files or a different approach, stop and obtain owner direction before proceeding.

## Required development sequence

1. Read the current production baseline and relevant source files.
2. Map dependencies and identify protected behavior.
3. Write a short change plan and exact file scope.
4. Create a task-specific branch from current `main`.
5. Implement the smallest additive change.
6. Run syntax/build/tests available for the project and inspect the full diff.
7. Verify that files outside the approved scope are unchanged.
8. Open a pull request with the authorization record and preview URL.
9. Review the preview against the current production world, including affected interactions and nearby systems.
10. Merge and deploy only after the required checks and owner approval.
11. Record the new known-good production commit and deployment.

## Expansion philosophy

LAMBO CITY should scale upward:
- Stores become richer, more cinematic, and more detailed without losing their existing identity or functionality.
- Records HQ becomes more complete and realistic without disturbing its completed layout, navigation, floors, or approved experiences.
- Floor 2 Studio gains complete plug-ins and workflows without replacing the shared production core or approved interfaces.
- The world gains detail, graphics, assets, atmosphere, and new experiences without removing existing locations or behavior.

**Default decision when uncertain: preserve the existing implementation and stop for clarification.**
