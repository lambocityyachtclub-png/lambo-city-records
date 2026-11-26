# ALIVE — Living Code Architecture

**Status:** Approved product and architecture direction  
**Version:** 0.1  
**Host environment:** LAMBO CITY  
**Implementation status:** Blueprint approved; initial server-side contract registry, development-system integration, contract-aware isolated executor, and World Development Runner are implemented. ALIVE is not yet a continuously running agent and has no connected model-provider or production-deployment adapter.

## Product definition

ALIVE is a contract-governed living-code platform. It understands the software systems and digital environments it manages, evaluates opportunities to improve them, and can carry out authorized improvements within explicit, owner-defined boundaries.

LAMBO CITY is ALIVE's first living environment and proving ground. ALIVE is designed as a reusable technology that may later serve other digital worlds and software environments.

## Non-negotiable trust principle

**ALIVE may exercise authority that an owner has explicitly granted, but it may never grant itself additional authority.**

No module, agent, planner, evaluator, or generated change may silently modify, weaken, bypass, or expand its own permissions, hard limits, trust roots, or approval requirements. Changes to those controls require an authenticated owner-authorized action.

## Living contract

Every managed module or asset should have a versioned contract describing:

- Stable identity and owner.
- Purpose and responsibilities.
- Dependencies and interfaces.
- Protected properties and invariants.
- Allowed operations and editable properties.
- Explicitly forbidden operations.
- Resource budgets and performance ceilings.
- Visual, functional, accessibility, and environmental quality criteria where relevant.
- Required tests and evidence.
- Autonomy level and approval requirements.
- Recovery target and rollback procedure.

Contracts are machine-readable, reviewable, versioned, and bound to the exact module/version they govern. A proposed change must be evaluated against the contract version in force when the change is authorized.

## Autonomy levels

1. **Observer:** inspect, measure, map dependencies, diagnose, and recommend. No writes.
2. **Builder:** prepare changes in an isolated branch or workspace; run checks and present evidence. No production writes.
3. **Trusted operator:** execute only pre-authorized classes of low-risk changes inside strict contracts and budgets.
4. **Adaptive operator:** continuously monitor and maintain authorized systems, with automatic rollback when defined safety or quality conditions fail.
5. **Trusted ecosystem:** coordinate multiple contracted systems while preserving each system's individual authority boundaries.

Autonomy is configured per module, operation, environment, and risk class. The owner can lower or revoke autonomy. Higher autonomy is not an automatic progression and must be explicitly enabled.

## Permission and safety model

- Default to read-only until a module has been inventoried and assigned a contract.
- Separate planning, evaluation, execution, and verification responsibilities.
- Enforce permissions outside the generated code being evaluated; generated code cannot authorize itself.
- Apply least privilege, explicit allowlists, hard resource ceilings, and environment separation.
- Never let a contract edit authorize its own permission expansion.
- Require owner authorization for protected geometry, world layout, navigation, camera behavior, identity/security rules, production deployment, and other designated protected areas.
- Reject or quarantine changes when contract interpretation is ambiguous, evidence is incomplete, dependencies are unknown, or tests fail.
- Keep a human-accessible emergency stop and a known-good recovery path.
- Never treat a successful build as proof of visual quality or gameplay correctness.

## Quality intelligence

ALIVE evaluates both technical and creative quality. A technically faster result is not automatically better if it damages the intended cinematic atmosphere, realism, usability, or established LAMBO CITY identity.

Quality checks should include, where applicable:

- Frame time, sustained FPS, draw calls, triangles, geometry and texture counts, memory pressure, and loading behavior.
- Visual consistency, material realism, lighting coherence, scale, composition, and fit with the surrounding environment.
- Gameplay behavior, collision, navigation, camera paths, and interaction regression.
- iPad/mobile compatibility and graceful quality scaling.
- Preservation of approved positions, geometry, and experiences.

For example, ALIVE may be authorized to improve Convention Center glass materials, reflections, or designated landscaping while being prohibited from moving the building, changing its footprint, altering roads, or redesigning the district.

## Verifiable change history

Each proposed and executed change should produce a tamper-evident record containing:

- Module identity and contract version.
- Before/after version identifiers and content hashes.
- Author or agent identity.
- Reason and intended outcome.
- Permission basis and autonomy level.
- Tests, measurements, and visual/functional evidence.
- Approval record where required.
- Execution result and rollback reference.

Use signed records and a hash-linked audit history as the initial foundation. Blockchain anchoring or decentralized verification may be evaluated later if it provides a concrete trust, portability, or multi-party coordination benefit. Do not add blockchain infrastructure merely for branding; the security model must remain meaningful without it.

## LAMBO CITY integration principles

- Integrate with the existing Three.js 0.160.0, browser-native ES module architecture.
- Respect the existing central engine and registered system lifecycle.
- Preserve modular feature files and avoid introducing a bundler, React, or TypeScript without a separate approved decision.
- Keep ALIVE's control plane separate from the game runtime and from production credentials.
- Do not add expensive monitoring or analysis to the frame loop.
- Use lazy loading and background/offline analysis where possible.
- Do not modify approved world geography, camera/navigation, HERO's approved performance, or other locked experiences without explicit authorization.
- Studio development remains deferred while ALIVE and the world/account foundations take priority.

## Delivery sequence

### Phase 0 — Read-only project understanding
Inventory source files, entry points, module lifecycle, dynamic imports, shared state, asset ownership, external services, current tests, deployment flow, and protected experiences. Produce a dependency map and identify risks. No production code changes.

### Phase 1 — ALIVE registry and contracts
Create stable module identities, a contract schema, a read-only registry, contract validation, and an inspectable project map. No autonomous writes.

### Phase 2 — Quality and diagnosis
Connect existing performance measurements and add safe diagnostic/reporting capabilities. Establish baselines before recommending changes.

### Phase 3 — Isolated change pipeline
Generate changes only in isolated branches/workspaces. Require contract checks, regression tests, and evidence before presenting a change for approval.

### Phase 4 — Limited trusted operation
Enable narrowly scoped, low-risk autonomous improvements only after their contracts, tests, resource budgets, audit records, and rollback paths are proven.

### Phase 5 — Portable trusted technology
Harden identity, signatures, audit verification, contract portability, and multi-environment support. Evaluate optional blockchain anchoring based on demonstrated need.

## Implementation status — 2026-11-26

The following ALIVE development-side foundations are implemented in the repository:

- Seven canonical project contracts define autonomy, exact allowed paths and operations, protected invariants, required evidence, resource budgets, and rollback expectations.
- Every canonical allowed path is now checked against the real repository. Living Contract targets are validated against the canonical allowlist before a task can be planned.
- Development tasks pin a canonical contract ID and version. The controlled executor checks the pinned contract and changed paths before tests and owner review.
- The World Development Runner and Living Contract Engine map clear owner intent to dependency-aware, contract-pinned tasks. Protected HERO, world layout/navigation, player identity/accounts, and deferred Studio intents are not placed into the autonomous queue.
- The on-demand Project Discovery Service connects the existing repository scanner and static dependency mapper to the Development System. It returns bounded metadata only; it does not expose raw source contents, create tasks, or write files.
- A PostgreSQL storage adapter and explicit migration are present for persistent task snapshots and owner reviews. The isolated `alive-dev` database branch already has the corresponding task/review tables and compatible base status constraint. The adapter has automated tests, but is not yet connected to a hosted API runtime.
- Automated tests cover contract integrity, real path existence, protected actions, dependency ordering, read-only discovery, executor boundaries, and persistent storage behavior.

The following capabilities are **not yet connected or enabled**:

- A hosted ALIVE API/control plane wired to the authenticated owner console and the persistent Neon adapter.
- An AI proposal provider. No model API has been called and no model spend has been enabled.
- A live isolated workspace provider connected to the actual repository and the proposal generator.
- A verified release/deployment adapter. The low-risk world-material contract defines the conditions for pre-authorized release, but the current executor does not deploy.
- Continuous background scheduling and proactive runtime monitoring.
- Full runtime visual-quality measurement across all departments.

The Development System remains separate from the live Three.js game. No worker or background process is enabled by default. No production credentials are exposed to the browser. The current implementation can discover the repository, evaluate permissions, and plan bounded work; it cannot yet autonomously generate, execute, or deploy changes.

## First implementation milestone

The first milestone is a trustworthy ALIVE Core that can understand the project structure, map dependencies, plan work through canonical contracts, and preserve a reviewable record. That foundation is now implemented. The next milestone is to connect authenticated hosted control, persistent task/review storage, a budget-governed model provider, and isolated execution—then verify release evidence before enabling any pre-authorized deployment.

**Success means faster development without sacrificing owner control, project stability, creative direction, or trust.**
