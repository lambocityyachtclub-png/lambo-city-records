# Security & Release — Department Blueprint (Draft v1)

**Department ID:** `security-release`  
**Status:** cross-cutting  
**Approval:** Not owner-approved; draft only  
**Parent:** `LAMBO_CITY_MASTER_BLUEPRINT_DRAFT.md`

## 1. Mission

ALIVE review, worker policy, storage, API authentication and CI workflows exist in the development candidate. Hosted execution adapters and production release remain gated; the independent local core and full provider-independent operation still need separate engineering work.

## 2. Scope and ownership

Own access control, secret handling, owner approval, isolated execution policy, auditability, release readiness, rollback and production boundaries for the platform. Do not make the visitor-facing game depend on ALIVE or a hosted service.

### Explicit boundaries
- Own the interfaces and assets explicitly assigned to this department.
- Consume shared services through documented interfaces; do not fork shared engines.
- Do not silently modify another department's protected assets or architecture.
- Cross-department work must name its dependency and agree the integration contract first.

## 3. Current source inventory

The following are source pointers for inspection and traceability. They are not proof of complete behavior.

- `development/runtime/aliveReviewApi.js`
- `development/runtime/createAliveDevelopmentSystem.js`
- `development/runtime/runAliveWorker.js`
- `development/automation/specialistWorkerPolicy.js`
- `development/storage/developmentReviewStorage.js`
- `api/alive/reviews.js`
- `.github/workflows/alive-scheduled-worker.yml`

**Current-state interpretation:** This department publishes shared standards and validation gates. Its presence in the repository does not mean every department currently meets those standards.

## 4. Non-goals

- Rebuild working systems simply to create a cleaner department boundary.
- Introduce a new framework, duplicate runtime or parallel engine without explicit approval.
- Treat future concepts as current requirements.
- Activate paid services, live transactions, production deployments or external communications without explicit approval.

## 5. Dependencies

- `performance-quality`
- `all departments`

Dependencies are planning relationships, not permission for one department to own another's implementation.

## 6. Proposed roadmap

1. Keep draft blueprints and proposals read-only until explicit owner approval.
2. Audit ALIVE core dependencies so local planning/review can operate without paid AI, Vercel Sandbox or hosted database services.
3. Separate optional adapters (AI, sandbox, hosted storage/scheduler) from core interfaces and default them off.
4. Review secret exposure, path allowlists, execution isolation, network access, artifact provenance and audit logs.
5. Define release checklist, preview verification, rollback and owner sign-off; never auto-promote production.

## 7. Draft acceptance criteria

- [ ] No draft blueprint or AI proposal can modify production or submit tasks without the established approval path.
- [ ] Secrets are never written to reports, logs, artifacts or client-visible files.
- [ ] Optional paid/hosted adapters remain disabled unless explicitly configured and approved.
- [ ] Untrusted code execution uses an appropriate isolation boundary; a Git worktree alone is not treated as a sandbox.
- [ ] Every release has test evidence, reviewed diff, owner approval and a rollback plan.

## 8. Open questions / evidence gaps

- Complete provider-independent ALIVE core audit before enabling scheduled worker operation.
- Confirm local storage/runtime path for owner review when hosted Postgres is unavailable.
- Review Hobby-plan commercial restrictions before any business launch or hosting decision.

## 9. Definition of done for this department

This blueprint becomes implementation-ready only after:
1. Source files and active runtime registration have been inspected.
2. Current capabilities are classified with source locators and test evidence.
3. Dependencies and integration contracts are confirmed.
4. Draft acceptance criteria are converted into measurable checks.
5. Conflicts and owner decisions are resolved or explicitly retained as blockers.
6. The owner approves the department blueprint.

**No Development Director task is created or submitted by this document.**
