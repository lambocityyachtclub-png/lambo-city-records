# Performance & Quality — Department Blueprint (Draft v1)

**Department ID:** `performance-quality`  
**Status:** cross-cutting  
**Approval:** Not owner-approved; draft only  
**Parent:** `LAMBO_CITY_MASTER_BLUEPRINT_DRAFT.md`

## 1. Mission

Automated test workflows and extensive targeted tests exist, including World System and Studio paths. This department is a quality gate across every feature; a passing test suite does not replace integrated physical-device validation.

## 2. Scope and ownership

Own cross-cutting performance budgets, reliability standards, accessibility/usability checks, test strategy, regression gates, device/browser matrix and quality reporting. Feature behavior remains owned by its department.

### Explicit boundaries
- Own the interfaces and assets explicitly assigned to this department.
- Consume shared services through documented interfaces; do not fork shared engines.
- Do not silently modify another department's protected assets or architecture.
- Cross-department work must name its dependency and agree the integration contract first.

## 3. Current source inventory

The following are source pointers for inspection and traceability. They are not proof of complete behavior.

- `.github/workflows/development-engine-tests.yml`
- `.github/workflows/world-system-checks.yml`
- `.github/workflows/floor2-studio-checks.yml`
- `tests/world-system-node-tests.mjs`
- `scripts/test-studio-pitch-correction.mjs`
- `scripts/test-studio-interface-workflow.mjs`
- `performanceMonitor.js`

**Current-state interpretation:** This department publishes shared standards and validation gates. Its presence in the repository does not mean every department currently meets those standards.

## 4. Non-goals

- Rebuild working systems simply to create a cleaner department boundary.
- Introduce a new framework, duplicate runtime or parallel engine without explicit approval.
- Treat future concepts as current requirements.
- Activate paid services, live transactions, production deployments or external communications without explicit approval.

## 5. Dependencies

- `all departments`

Dependencies are planning relationships, not permission for one department to own another's implementation.

## 6. Proposed roadmap

1. Define a common test matrix: Node/unit, browser integration, desktop, iPad Safari and mobile touch where applicable.
2. Establish measurable budgets for startup, frame time, memory, asset size, audio latency and cleanup.
3. Require each department to add focused tests and report known unverified runtime behavior.
4. Add integrated smoke tests for navigation, Studio entry/exit, stage events, water/shoreline and district transitions.
5. Use profiling evidence before optimization; avoid speculative rewrites.

## 7. Draft acceptance criteria

- [ ] Each feature has unit/integration coverage appropriate to its behavior and failure modes.
- [ ] Critical flows pass on supported browsers and physical iPad before release claims are made.
- [ ] No unbounded listeners, animation loops, audio nodes, timers or scene objects remain after cleanup.
- [ ] Performance claims include measured device/context, not just a source-code assumption.
- [ ] A failed quality gate blocks promotion but does not auto-deploy a fix.

## 8. Open questions / evidence gaps

- Set explicit numeric frame-time/memory/audio-latency budgets after measuring baseline devices.
- Identify available physical-device test coverage and repeatable manual checklist.
- Decide which checks are blocking versus informational for preview-only work.

## 9. Definition of done for this department

This blueprint becomes implementation-ready only after:
1. Source files and active runtime registration have been inspected.
2. Current capabilities are classified with source locators and test evidence.
3. Dependencies and integration contracts are confirmed.
4. Draft acceptance criteria are converted into measurable checks.
5. Conflicts and owner decisions are resolved or explicitly retained as blockers.
6. The owner approves the department blueprint.

**No Development Director task is created or submitted by this document.**
