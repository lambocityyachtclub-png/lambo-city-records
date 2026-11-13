# LAMBO CITY ALIVE — Implementation Convergence Audit (Draft)

**Status:** draft / evidence-backed / not owner-approved  
**Purpose:** identify which existing ALIVE implementation is the canonical foundation, which capabilities can be reused, and which branch changes must not be combined blindly.

This audit compares the open ALIVE candidate branches and their source trees. It does not merge branches, authorize deployment, enable workers, or approve paid services.

## 1. Executive decision

Use the existing **release-candidate branch behind PR #31** as the current game-and-Studio integration baseline for the blueprint chain. Do not merge PR #44, PR #30, or PR #26 wholesale into it.

The project currently contains multiple ALIVE implementation paths with overlapping responsibilities:

- A modular Development System and GitHub-hosted specialist proposal path.
- A separate runtime bootstrap using PostgreSQL, Vercel AI Gateway, and Vercel Sandbox.
- A separate, older integration branch lineage with overlapping worker and world changes.

The correct next step is a controlled convergence pass, not a branch merge. Reuse ALIVE-only capabilities after adapting them to the project's local-first/provider-independent requirements. Keep all AI, hosted execution, managed storage, and scheduled-worker adapters optional.

## 2. Candidate branch evidence

| Candidate | Branch / PR | Evidence and assessment |
|---|---|---|
| Current release-candidate baseline | `integration/lc-alive-release-candidate-2026-11-10` / PR #31 | Contains the current visitor-world and Floor 2 integration candidate, modular Development System, specialist roster, private task intake, and hosted proposal workflow. This is the base lineage used by PRs #46–#49. |
| Provider/sandbox runtime candidate | `feat/alive-development-worker-foundation` / PR #44 | Adds a PostgreSQL-backed task/review store, private review dashboard/API, runtime composition, Vercel AI Gateway provider, Vercel Sandbox test runner, and scheduled worker. Its current one-shot worker requires paid AI/Sandbox enablement and credentials. It also changes several game/world files, so it is not a safe wholesale ALIVE-only import. |
| Hosted specialist worker lineage | `integration/lc-alive-agentic-worker-2026-11-10` / PRs #27 and #30 | Shares one head commit across two open drafts but has a distinct, heavily diverged branch history relative to PR #31. Treat it as another candidate source, not as an automatic superset or clean continuation. |
| Blueprint and verification chain | PRs #46–#49 | Adds discovery, reconciliation, Master + ten Department Blueprint drafts, and static source verification on top of the PR #31 baseline. All remain draft/unmerged. |

## 3. Confirmed architecture differences

### A. PR #31 baseline

Evidence inspected:

- `development/engine/developmentSystem.js`
- `development/engine/developmentDirector.js`
- `development/engine/specialistWorkerRoster.js`
- `development/execution/specialistWorkerExecution.js`
- `development/execution/developmentWorkspacePipeline.js`
- `development/execution/hostedSpecialistQueueAdapter.js`
- `development/storage/developmentTaskStorage.js`
- `development/storage/developmentReviewStorage.js`
- `.github/workflows/development-engine-tests.yml`

Findings:

- The Development System accepts injected storage and optional specialist execution, hosted queue, and vision-planner adapters.
- The Director can operate in memory when no storage adapter is supplied.
- File-backed JSON task and review storage modules already exist, but there is no single documented local bootstrap that wires the complete local owner workflow together.
- Specialist execution requires explicitly injected workspace, planner, test-runner, review-store, and path-allowlist capabilities. No default code generator or test runner is silently enabled.
- The hosted specialist workflow uses GitHub Actions and a pinned GitHub Copilot CLI to prepare a proposal. It tests the proposal in a separate job without repository write credentials, then publishes a draft PR through a separate publishing job.
- This is a useful optional hosted adapter, but it is not a guarantee of zero-cost execution and should not be required by the core.

### B. PR #44 runtime candidate

Evidence inspected:

- `development/runtime/createAliveDevelopmentSystem.js`
- `development/runtime/runAliveWorker.js`
- `development/execution/vercelAIGatewayProposalProvider.js`
- `development/execution/vercelSandboxTestRunner.js`
- `development/storage/postgresDevelopmentStorage.js`
- `api/alive/reviews.js`
- `alive-review.html`, `alive-review.js`, `alive-review.css`
- `development/runtime/README.md`

Findings:

- The AI Gateway provider and Vercel Sandbox runner default to disabled.
- The current `runAliveWorker.js` refuses to run unless `ALIVE_WORKER_ENABLED=true`, `ALIVE_AI_ENABLED=true`, and `ALIVE_SANDBOX_ENABLED=true`.
- That worker also requires `AI_GATEWAY_API_KEY`, `VERCEL_TOKEN`, `VERCEL_TEAM_ID`, `VERCEL_PROJECT_ID`, `DATABASE_URL`, and `ALIVE_ALLOWED_PATHS`.
- The runtime bootstrap can accept injected storage/review adapters, but when either is omitted it requires PostgreSQL and the `pg` dependency.
- The review API/dashboard is useful operational tooling, but the current endpoint requires `DATABASE_URL` and `ALIVE_REVIEW_TOKEN`.
- Therefore this worker is not currently a provider-independent/local-first execution path. Its paid adapters must remain optional and the worker entrypoint must be redesigned before it can satisfy the core independence requirement.

### C. Protected game/world changes in PR #44

The PR #31 → PR #44 comparison reports 41 changed files. In addition to ALIVE-only additions, PR #44 modifies or adds game/world files including:

- `engine.js`
- `main.js`
- `marina.js`
- `recordsHQ.js`
- `recordsHQFloor1.js`
- `systemDirectionRegistry.js`
- `heroCareerCenter.js`
- `LAMBO_CITY_NORTHSTAR.md`

These are outside a pure ALIVE runtime port. They require separate source review and regression evidence before any adoption. In particular, Floor 1 changes must not be swept into an ALIVE infrastructure change.

## 3.1 Local-first control plane update (PR #52)

The local-first implementation has now been added as a separate draft on top of the blueprint/source-verification chain:

- `development/storage/indexedDbDevelopmentStorage.js` persists Development Director tasks and owner review records in browser IndexedDB.
- `development/runtime/createLocalAliveControlPlane.js` composes the existing Development System with that local storage.
- `alive.js` starts the local control plane only after owner sign-in, displays its readiness, and saves owner directions into a local IndexedDB inbox without automatically submitting them to the separate hosted queue.
- The local path configures no AI provider, hosted queue, PostgreSQL connection, Vercel Sandbox, or code executor. Saving a direction does not call the hosted vision API, trigger GitHub Actions, or execute generated code.
- Browser tests verify local vision intake, protected task approval, review decisions, persistence after close/reopen, and that productionChangesMade remains false.
- Chromium, WebKit, and a WebKit iPad-sized touch viewport passed the browser test on PR #52 head `db9ea3f899375634ec2d8283976e6f5852c16321`.

This closes the local bootstrap, local task/review persistence, and local vision-intake foundation gates while keeping hosted execution off by default. It does **not** yet provide cross-device sync, export/import backup, a complete local task/review interface, or autonomous code execution. Local records remain in the current browser profile and are not automatically shared with another device.

## 4. Recommended canonical architecture

1. **Core control plane:** Development Director, specialist roster, policy, task dependencies, owner decisions, and review records. It must initialize without an AI provider, Sandbox, Vercel credentials, or managed database.
2. **Local persistence:** provide a documented local bootstrap using the existing JSON task/review storage adapters. Keep storage interfaces replaceable so PostgreSQL can be an optional adapter.
3. **Safe execution boundary:** code-generation and test-runner capabilities remain injected. Never run untrusted generated code inside the game runtime or an ordinary unsandboxed server process.
4. **Optional adapters:** GitHub Copilot/GitHub Actions, Vercel AI Gateway, Vercel Sandbox, Neon/PostgreSQL, and any future provider are independently enabled integrations, not core dependencies.
5. **Owner review:** proposals remain draft-only until explicit owner review. Approval records a decision; it does not merge, deploy, spend money, change billing, alter secrets, or activate workers.
6. **Visitor-world isolation:** ALIVE development infrastructure must not be imported by the public game runtime. The public game must not depend on ALIVE development services.

## 5. Minimum ALIVE completion gates before returning to Floor 2

These are the bounded foundation gates; they do not require completing every future department feature.

- [ ] One documented canonical ALIVE code lineage; competing drafts remain isolated until reviewed.
- [x] Local owner bootstrap starts with no AI, Sandbox, Vercel token, or database credentials (PR #52).
- [x] Local task and review persistence survives browser database close/reopen using IndexedDB (PR #52).
- [ ] Manual/assisted planning and owner decisions work without an external model.
- [ ] Any code-execution path requires a trusted isolated workspace, explicit path allowlist, tests, cleanup, and draft-only output.
- [ ] Authentication, private owner data, and visitor-world boundaries are covered by automated tests.
- [ ] Optional hosted adapters are off by default and have separate opt-in tests.
- [x] Development Engine and browser CI pass on the selected candidate (PR #52 head; Chromium, WebKit, and iPad-sized WebKit check).
- [x] Floor 2 remains lazily loaded and its existing Studio interfaces and protected room layout are unchanged by the ALIVE source/bootstrap changes (source graph and existing Studio checks; physical device acceptance remains outstanding).

Once these gates pass, ALIVE is sufficient to support controlled Floor 2 development. Radio, commerce, future districts, and other planned departments can continue expanding later without blocking Studio completion.

## 6. Explicit non-decisions

- No branch is merged by this audit.
- PR #44's paid AI/Sandbox/database stack is not approved as mandatory infrastructure.
- No scheduled worker is enabled.
- No production, domain, DNS, billing, secret, or environment setting is changed.
- No game feature, Floor 1 layout, or approved Studio interface is redesigned.
- No Department Blueprint is owner-approved and no tasks are automatically created.

## 7. Evidence provenance

This audit is based on repository source and GitHub branch/PR metadata observed on 2026-11-13. Static import and workflow references are evidence of wiring only; they do not prove successful runtime behavior on iPad or desktop. Test-source references are not treated as passing test results. The automated department source-verification artifact is published separately by PR #49 CI.
