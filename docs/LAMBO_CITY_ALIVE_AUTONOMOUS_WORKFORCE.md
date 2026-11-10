# LAMBO CITY ALIVE — autonomous specialist workforce

## What this adds

The specialist roster now has a bounded, hosted code-proposal path:

1. A task is written as a small JSON file under `development/queue/incoming/` on the isolated ALIVE worker branch.
2. A GitHub Actions job validates the task against the eight existing specialist roles.
3. GitHub Copilot CLI works in a disposable hosted runner with repository read access and scoped file-write tools. It does not receive a repository-write token.
4. A deterministic path gate rejects edits outside that specialist's allowlist and blocks production wiring, workflow files, deployment configuration, secrets, billing and payment paths.
5. A separate job receives only the patch artifact, applies it to a fresh checkout, reruns the complete Development Engine test suite, and creates a **draft pull request**.
6. Existing Studio/World workflows and the read-only engineering review run on the proposal PR.

## Safety boundaries

- No code is written to the production branch.
- The code-generation job has no repository write permission.
- The proposal job has repository write permission only to publish a branch and draft PR after the path gate and tests pass.
- No merge, production deployment, payment setup, seller payout, or permission change is performed.
- Protected architecture and deployment files are excluded from every worker's allowed paths.
- A specialist can stop and report a dependency rather than reaching outside its authorized scope.
- The generated proposal remains subject to owner review and existing CI.

## Queue format

Each task file must contain only these fields:

```json
{
  "id": "studio-vocal-polish",
  "workerId": "studio",
  "title": "Improve a Studio workflow",
  "vision": "Describe the desired outcome in plain language.",
  "acceptanceCriteria": [
    "The existing workflow remains functional."
  ],
  "priority": "normal",
  "referenceFiles": [
    "FLOOR2_STUDIO_EXPERIENCE.md"
  ]
}
```

Supported worker IDs: `studio`, `audio-assets`, `world-architecture`, `environment-water`, `yachts-vehicles`, `convention-center`, `performance-qa`, and `security-release`.

The queue workflow is intentionally restricted to the branch `integration/lc-alive-agentic-worker-2026-11-10`. It does not run from production. A task commit triggers one isolated proposal run. Do not put secrets, access tokens, payment data, or private personal data in a task.

## Current boundary and next integration step

This is the first real hosted code-generation bridge, not yet a fully self-running development company. It can turn a validated queued task into a tested draft PR. The current browser-side Development Director is not yet connected to this hosted queue; the next layer is an authenticated server-side bridge that transfers approved Director tasks into this queue and reports PR/check status back into the review store. That bridge must keep owner approval for protected actions and must never expose GitHub tokens to the browser.

The queue is operated through repository task files for this isolated prototype. The eventual user experience should be plain-language direction through the LAMBO CITY ALIVE control surface, not requiring the owner to edit JSON or use GitHub.


## Optional Development Director → hosted queue adapter

The ALIVE foundation now includes an optional, tested bridge from the existing Development Director to the hosted specialist queue:

- \`createHostedSpecialistQueueAdapter\` can be injected into \`createDevelopmentSystem\` as \`hostedQueue\`.
- \`dispatchHostedTask(workerId)\` claims the next eligible task for that specialist, checks its area, acceptance criteria, and recorded owner approval when required, then serializes it into the validated queue format.
- Successful dispatch records the queue branch, task-file path, and Git commit SHA on the Director task. A failed dispatch moves the task to \`blocked\` with a recorded reason.
- \`createGitHubTaskQueueClient\` is a server-side Contents API adapter. It writes only validated task JSON to \`development/queue/incoming/\` on an isolated \`integration/lc-alive-agentic-worker-*\` branch. Its token is held in the trusted host closure and is not returned in snapshots.

The complete Development Engine suite now includes the queue adapter and GitHub client tests: **149 passed, 0 failed** on the integration branch.

### What is still not connected

The adapter is optional and is not configured in the live website. The Vercel project currently has no server-side GitHub queue credential configured, and the live browser interface does not call this adapter. The hosted queue has been exercised through a repository task commit and produced a draft proposal PR; the Director-to-GitHub adapter is separately validated with an injected test client. Connecting the real server-side credential and the owner-facing plain-language control surface remains a separate integration step. No credential belongs in browser code.


## Vision Intake & Task Planner

The ninth specialist is the Vision Planning & Product Systems Specialist. Its bounded scope covers the owner-direction intake planner, planning artifacts, tests and ALIVE documentation.

The optional \`createVisionIntakePlanner\` accepts a trusted host planning function. It validates the returned work breakdown against the nine-worker roster, specialist areas, acceptance criteria, dependency references and dependency cycles. Work is classified into four lanes:

- \`launch\`: work intended for first-launch acceptance.
- \`foundation\`: architecture and reliability work needed to support launch.
- \`future\`: roadmap work retained for later; it cannot enter the execution queue.
- \`blocked\`: work waiting on a prerequisite or owner decision; it cannot enter the execution queue.

The planner does not create Director tasks when a vision is first submitted. The owner must explicitly select task keys to submit. Selected tasks are created in dependency order, and protected actions retain the Director's owner-approval gate. The planner adapter is opt-in and requires a trusted host language-model planner; no model credential or browser-side planner is configured in production.

The expanded Development Engine suite passed **154 tests, 0 failures** on commit \`58b00a5bc1c1a3de4ce29b26c3359877f9ec20d4\`. The next commit adds an additional guard preventing future roadmap work from entering the execution queue.
