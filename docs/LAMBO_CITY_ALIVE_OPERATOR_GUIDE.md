# LAMBO CITY ALIVE — Operator Guide

## Purpose and first-launch direction

The owner sets creative direction; ALIVE helps turn it into small, reviewable development work. First-launch product direction balances **Create**, **Experience**, and **Earn**: tools and original content for creation; an immersive, connected LAMBO CITY destination; and sustainable earnings led by LAMBO CITY-owned products. Creator earning is a later phase, only after licensing and rights, payment and tax, privacy, and operational readiness are established. These pillars do not make seller payouts or a third-party marketplace launch requirements.

The eventual owner experience should be plain-language direction through the ALIVE control surface—not asking the owner to edit JSON or use GitHub. That experience is not connected today. The current task queue is a repository-based prototype, not an end-user control panel. The live website does not currently have an AI control panel.

## From direction to a bounded task

1. State the desired outcome, why it matters, and observable acceptance criteria. Reference relevant project files; preserve existing working systems and user-facing design.
2. Keep the task narrow enough to review, identify dependencies and risks, and mark protected actions. Tasks involving spending or paid services, billing or payments, security permissions, data deletion, major architecture, protected landmarks, accounts, crypto, wallets, multiplayer, or production release require owner approval.
3. Assign the task to the specialist whose domain and allowed paths match the work. If it crosses domains or needs a protected file, split it or stop and route the dependency for owner direction.

The implemented roster covers Studio/DAW, audio assets, world architecture, environment/water, yachts/vehicles, convention/venues, performance/QA, and security/release. Scope is enforced by task policy and a changed-file gate; protected paths include workflows, deployment configuration, authentication, payment/billing, secrets, and core production wiring. The queue validator accepts one bounded task at a time, with a worker ID, outcome, criteria, optional priority, and references.

## Proposal and review flow

**Implemented and tested:** the Development Director manages task status and approval; the roster creates scoped tasks; policy blocks protected work from routine execution. The local controlled executor can pass a task through an injected isolated-workspace adapter, explicit change planner and test runner, path validation, and review storage. These trusted adapters are required; the local engine does not supply a code generator or shell runner. A passing proposal is recorded as awaiting owner review; failed tests or invalid paths block it. Development Engine tests cover these boundaries.

**Hosted queue path:** `.github/workflows/development-engine-tests.yml` runs the Development Engine suite on relevant pushes and pull requests. A push adding one task JSON under `development/queue/incoming/` on the isolated ALIVE worker integration branch can trigger task validation and scoped Copilot code generation in a disposable runner. The proposed patch is path-checked, then a separate job applies it to a clean base, repeats the path check, reruns the full Development Engine suite, and opens a **draft pull request**. The generator has repository read access; the publishing job has write access to publish the proposal branch and draft PR. This requires the workflow and Copilot entitlement to be available.

Review the draft diff, task criteria, path scope, test results, and relevant CI before approval. Studio and World checks run when their configured file filters match; they are not universal checks for every change. The proposal remains isolated: creating a draft PR is not approval to merge or release. The owner retains merge and production-release authority, including rollback readiness. ALIVE does not autonomously merge or deploy production.

## Current limits and next integration

The Development Director now has an optional, tested adapter that can claim an eligible task and submit it to the hosted queue when a trusted host injects a GitHub queue client. It validates the specialist scope, acceptance criteria, and recorded owner approval, then stores the queue commit reference on the Director task. The adapter is not configured in the live website: no server-side GitHub queue credential is configured in Vercel, and the browser-side Development System is not connected to a plain-language ALIVE control surface. Workers do not run continuously in the background; dispatch still requires a trusted host to invoke the adapter.

**Automated review:** the read-only Copilot engineering review is configured to run for pull requests targeting the isolated ALIVE worker branch. It produces a review artifact and workflow summary; it does not approve, merge, or release a proposal. The owner still evaluates its findings alongside the test results and relevant Studio/World checks.

Before connecting the owner-facing control surface or expanding hosted operation, establish an authenticated server-side bridge that keeps credentials out of the browser and reports task, test, and review status. Keep protected actions, merge, and release owner-controlled.
