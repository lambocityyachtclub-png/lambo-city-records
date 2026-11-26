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

The following development-side foundations are now present in the repository:

- Seven canonical project contracts define autonomy, allowed paths and operations, protected invariants, required evidence, resource budgets, and rollback expectations.
- The Development System registers the canonical contracts and exposes contract-action evaluation.
- Development tasks can pin a canonical contract ID and version.
- The controlled executor checks the pinned contract and its path permissions before tests and owner review.
- The World Development Runner converts structured findings into contract-pinned tasks. Low-risk material/quality findings and protected layout/HERO/account/Studio findings are routed differently.
- Automated Development Engine tests cover contract integrity, protected actions, executor path enforcement, and World Runner behavior.

The following capabilities are **not yet connected or enabled**:

- A hosted ALIVE agent/model provider that performs ongoing project analysis and generates proposals.
- A live isolated workspace provider connected to the actual repository and a persistent task/review store.
- An automated release/deployment adapter. The low-risk world-material contract defines a possible pre-authorized release path, but the current executor still stops at isolated tests and review.
- Continuous background scheduling and proactive monitoring.
- Full read-only runtime inventory and measured visual-quality reporting across all departments.

The Development System remains separate from the live Three.js game. No worker or background process is enabled by default. No production credentials are exposed to the browser.

## First implementation milestone

The first production milestone is a trustworthy read-only ALIVE Core that can explain what exists, how it connects, what must not change, how the project is performing, and which improvements are safe to propose. The initial contract and runner foundations are in place; the next work is to connect project discovery, persistent isolated execution, and verified release infrastructure without weakening the contracts.

**Success means faster development without sacrificing owner control, project stability, creative direction, or trust.**
