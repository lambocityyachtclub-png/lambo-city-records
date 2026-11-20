# LAMBO CITY × ALIVE — Acceleration Strategy

**Status:** Proposed owner-directed roadmap  
**Created:** 2026-11-14  
**Implementation posture:** Additive, isolated, review-first  
**Pilot:** Floor 2 Studio / Studio Development Runner

## 1. North star

LAMBO CITY is intended to grow beyond a conventional game into an interconnected entertainment world: music creation and collaboration, performances, fashion and commerce, creator experiences, and future real-world business connections.

ALIVE is the intelligence and development system that helps the owner understand, prioritize, research, prototype, validate, and expand that ecosystem.

The owner remains the creative director and final authority. ALIVE may discover and recommend opportunities within approved boundaries; it may not silently expand its permissions, spend money, change security, delete data, merge code, or deploy to production.

This strategy coordinates existing project plans. It does not replace the North Star, autonomous development engine specification, system direction registry, studio contract, DAW architecture, or project guardrails.

## 2. Existing foundations to reuse

The current repository already contains important building blocks:

- `development/engine/developmentDirector.js`: task creation, prioritization, approval states, dependencies, specialist assignment, and task history.
- `development/policies/developmentPolicy.js`: policy evaluation and protected-action approval.
- `development/execution/controlledDevelopmentExecutor.js`: isolated execution flow, path allowlists, validation, and owner review handoff.
- `development/execution/isolatedWorkspaceAdapter.js`: workspace adapter boundary.
- `development/runners/studio/studioDevelopmentRunner.js`: Studio findings converted into structured tasks.
- `development/blueprints/`: department discovery and dependency mapping.
- `development/storage/`: task and review storage adapters.
- `development/tests/` and GitHub Actions workflows: existing automated checks.
- `floor2TaskRegistry.js`: a separate, deliberately limited Floor 2 registry. It is not an AI executor and must not be treated as a substitute for the central Development Director.
- `FLOOR2_STUDIO_EXPERIENCE.md`, `LAMBO_CITY_DAW_ARCHITECTURE.md`, and `LAMBO_CITY_FLOOR2_BLUEPRINT.md`: approved studio behavior and architecture constraints.

Reuse these components where their contracts fit. Do not create a competing director, duplicate task registry, second audio engine, or parallel session format.

## 3. Critical integration gap

The repository has substantial planning and controlled-execution code, but the existence of those modules does not prove a continuously operating autonomous system.

Before enabling background execution, verify each real connection:

1. Owner direction and approval records can be read from the private control repository without exposing secrets.
2. The hosted worker can authenticate using the intended short-lived identity mechanism.
3. A task can be validated against the owner-approved task contract and exact allowed-file scope.
4. The worker can call the existing director/runner/executor contracts without bypassing policy.
5. The isolated workspace is actually separate from production and can be discarded safely.
6. Test results, changed-file lists, logs, and review artifacts return to the owner.
7. No worker can merge, deploy, spend money, change permissions, or silently broaden scope.
8. Interrupted work can be identified and resumed or safely abandoned without duplicate execution.

The private ALIVE control repository documents the private queue and, on its integration branch, contains a bounded preview smoke-test task dated 2026-11-12. The inspected integration-branch tree contains the README, queue README, and that single smoke-test JSON record; no worker source code is present in that branch tree. The task authorizes only a documentation-only smoke-test artifact. This does not prove that no worker exists elsewhere, but its implementation and hosted runtime are not verifiable from the inspected repository branch. Do not repurpose or silently broaden that task.

Additional implementation facts verified in source:

- `development/blueprints/discoverBlueprints.mjs` performs a read-only repository scan and emits discovery-draft reports. Its own contract says keyword matches are clues, not proof, and it does not create or submit development tasks.
- `.github/workflows/development-engine-tests.yml` runs the existing development-engine and blueprint-discovery tests, generates the read-only report, and uploads it as an artifact. This is a useful scheduled-by-CI/on-change discovery step, not a continuously running autonomous director.
- `development/execution/isolatedWorkspaceAdapter.js` creates a local temporary workspace outside the project root and enforces path and symlink checks. That is a concrete isolation adapter, but by itself it does not establish a hosted, durable worker or GitHub branch/PR integration.
- `development/engine/developmentDirector.js` supports persistence through an injected storage adapter, but defaults to in-memory task state when no adapter is supplied.
- `development/runners/studio/studioDevelopmentRunner.js` converts submitted findings into director tasks; its source explicitly says it does not read or write repository files or execute code.

These are useful components, but the end-to-end connection between private queue retrieval, hosted worker, durable task state, isolated execution, and owner review still needs an environment-level verification.

## 4. Delivery sequence

### Stage A — Project understanding (read-only)

- Build a verified inventory of current modules, entry points, imports, public interfaces, registrations, tests, and protected systems.
- Connect the inventory to the existing department catalog and dependency graph.
- Distinguish verified implementation from documentation-only intent, stubs, adapters, and unverified infrastructure.
- Produce a system map and confidence-labelled gap report.
- Record known-good behavior that must not be re-audited as unfinished without contrary evidence.

**Exit condition:** ALIVE can accurately explain the current architecture and identify which facts are verified, inferred, or unknown without modifying application files.

### Stage B — ALIVE reasoning and opportunity discovery

- Convert the North Star into explicit evaluation criteria.
- Generate candidate improvements from verified code, user experience, test results, and current technology research.
- Score opportunities by owner value, user value, feasibility, dependencies, risk, cost, and reversibility.
- Explain why each recommendation matters and identify what evidence is missing.
- Separate near-term reliability/product improvements from longer-term ecosystem bets.

**Exit condition:** ALIVE produces a small, ranked proposal queue with evidence, dependencies, scope, risks, and acceptance criteria. Discovery alone never authorizes implementation.

### Stage C — Floor 2 Studio pilot

Use the Studio as the first bounded proving ground because it has a meaningful existing architecture and explicit product contract.

The pilot begins with read-only verification. It must preserve the working shared audio engine, Beat Lab, MPC, session save/load, recording, multitrack, export, and existing Floor 2 interaction flow.

The first implementation task must be selected only after the read-only audit identifies a real gap. Do not invent work or reopen completed workflows merely to exercise ALIVE.

For each approved pilot task:

1. State the user outcome and evidence for the issue/opportunity.
2. Name exact permitted files and protected behavior.
3. Identify callers, imports, registrations, shared state, assets, and dependent workflows.
4. Create one task-specific branch from the latest verified production baseline.
5. Make the smallest additive change in an isolated workspace.
6. Run relevant automated checks and inspect the complete diff.
7. Produce a review package with changed files, test output, limitations, and preview instructions.
8. Stop for owner review; do not merge or deploy.

**Exit condition:** One real, bounded Studio improvement reaches a reproducible owner-review package, with no production changes and no regression in protected workflows.

### Stage D — Background worker integration

Only after Stages A–C demonstrate reliable contracts:

- Verify private queue retrieval and identity/authentication in the actual hosted environment.
- Connect the worker to the existing director, specialist runner, controlled executor, and review storage through explicit adapters.
- Add task leases/claim safety, duplicate-run protection, timeouts, resumability, and structured logs where missing.
- Enforce the allowlist at both task and workspace boundaries.
- Return owner-readable progress and review artifacts.
- Keep the worker disabled by default until an end-to-end preview test passes.

Paid services, new hosting, billing changes, or new external AI providers require separate cost and permission review.

### Stage E — Expand departments and ecosystem intelligence

After the Studio pilot is reliable, add departments incrementally using the existing department catalog and dependency graph:

1. World and environment.
2. Entertainment and events.
3. Digital real estate.
4. NPCs and character behavior.
5. Vehicles and transportation.
6. Platform performance and reliability.
7. Business and creator ecosystem research.

The central director coordinates work; departments contribute bounded specialist capabilities. Cross-department tasks must declare dependencies and shared-system risks.

Business intelligence may research and model opportunities, but real-world launches, contracts, purchases, financial actions, customer-data use, and public commitments remain owner-controlled.

## 5. Owner approval and safety rules

The existing `PROJECT_GUARDRAILS.md` remains authoritative.

- Production is never an experimental workspace.
- Every implementation task has one branch and one review package.
- Every task declares exact allowed files, must-preserve behavior, validation, and authorization.
- No unrequested refactors, deletions, redesigns, or scope expansion.
- Existing working Studio save/load and audio behavior is protected.
- No credentials, tokens, secrets, or private task payloads enter the public repository.
- No autonomous merge, production deployment, paid-service activation, billing change, permission change, data deletion, crypto/wallet/account system, multiplayer launch, or protected-landmark change.
- If required scope expands or evidence is incomplete, stop and ask the owner.
- A passing automated test is not the same as successful iPad/gameplay verification.
- Never claim a preview, deployment, or real-device test that did not occur.

## 6. Success measures

Measure ALIVE by verified capability, not code volume:

- **Understanding:** accuracy of architecture and dependency explanations.
- **Discovery:** useful, evidence-backed opportunities found without prompting.
- **Prioritization:** quality of value/risk/dependency ranking.
- **Execution:** percentage of approved tasks that produce bounded, reviewable changes.
- **Quality:** actual automated test results and regression outcomes.
- **Safety:** zero unauthorized paths, merges, deployments, spending, or permission changes.
- **Learning:** owner corrections and prior test outcomes improve later proposals.
- **Product value:** improvements make the world more useful, immersive, reliable, or commercially meaningful.

## 7. Immediate next work items

| Order | Work item | Mode | Completion evidence |
|---|---|---|---|
| 1 | Reconcile current mainline source, department blueprints, and existing ALIVE branches | Read-only | Verified architecture/gap report |
| 2 | Trace private queue → worker → director → runner → executor → review handoff | Read-only / preview | Connection map with verified and unverified links |
| 3 | Audit Floor 2 against its existing experience contract and tests | Read-only | Evidence-backed list of actual gaps; working features marked protected |
| 4 | Select one narrow Studio improvement | Owner review | Exact goal, file allowlist, dependencies, acceptance criteria |
| 5 | Implement that task in an isolated branch/workspace | Approved task only | Tests, diff, review package |
| 6 | Validate hosted worker end-to-end | Preview only | Owner-readable proof of safe handoff and no production mutation |

## 8. Definition of this roadmap's completion

This roadmap is a coordination document, not an assertion that the stages are already implemented. The strategy is considered operational only when the evidence for each stage is produced and reviewed.

The first meaningful win is not an AI that writes a large amount of code. It is ALIVE correctly understanding LAMBO CITY, finding one genuinely useful improvement, safely developing it in isolation, proving the result, and returning it for owner approval.

**The owner establishes the vision. ALIVE discovers and coordinates. Specialist runners build. Quality controls protect. The owner decides what becomes part of LAMBO CITY.**
