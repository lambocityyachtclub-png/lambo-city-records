# ALIVE local owner host

This module connects the existing Living Contract engine, controlled local Git
workspace, persistent review store, owner decision gate, and approved local
branch publisher through one authenticated local HTTP host.

## Safety boundary

- The host binds only to `127.0.0.1`, `::1`, or `localhost`.
- Every `/v1/*` route requires a bearer token of at least 32 characters.
- The owner identity used for approval/rejection comes from host configuration;
  a request body cannot impersonate another owner.
- The worker is one-shot and bounded. It does not run in the background.
- Proposed files are confined by the configured path allowlist and isolated
  Git worktrees. Reviews are stored outside the repository.
- Publishing requires an approved review and fresh passing tests, and creates
  a local Git branch/commit only. It does not push, open a PR, merge, deploy,
  or write to production.
- No paid AI, paid sandbox, hosted database, or external provider is required.
  A proposal provider is injected explicitly; ALIVE does not silently choose
  or call an AI provider.

## Relationship to the private ALIVE owner queue

The project also has a separate hosted owner-task path. The private repository
`lambocityyachtclub-png/lambo-city-alive-control` stores owner directions on
`integration/lc-alive-agentic-worker-2026-11-10` under
`development/queue/incoming/`. The public worker branch contains only a
non-sensitive task pointer; the private vision/task body is retrieved by the
hosted worker through the Vercel private-task endpoint after GitHub Actions
OIDC identity and the exact commit pointer are verified.

Keep the two queue types distinct:

- **Private owner queue:** the source of owner directions and specialist task
  records. Never copy raw owner vision or credentials into the public repo.
- **Local proposal queue in this host:** task-ID-matched complete file patches
  used as an explicitly supplied code proposal source. It does not read or
  write the private owner queue and it does not generate code by itself.

The local host is an optional desktop/local execution route. The existing
hosted private queue remains the project’s owner-direction channel. The
hosted workflow's code-generation provider is a separate choice; do not
enable a paid AI provider or grant additional AI entitlements unless the
owner explicitly chooses that route.

## Host integration

The host is a Node.js process on the machine that has the LAMBO CITY Git
repository checked out. It is not part of the live Three.js browser runtime.
Do not import it from `main.js`.

Create the Development System with explicit local settings, then pass it to
`createLocalAliveHost`. The following is an integration example; replace the
repository/review paths, allowed paths, and proposal provider with the values
you have deliberately approved for that machine:

```js
import { createDevelopmentSystem } from "../engine/developmentSystem.js";
import { createLocalProposalQueueProvider } from "../execution/localProposalQueueProvider.js";
import { createLocalAliveHost } from "./localAliveHost.js";

const ownerToken = process.env.ALIVE_OWNER_TOKEN;
if (!ownerToken || ownerToken.length < 32) {
  throw new Error("Set ALIVE_OWNER_TOKEN to a private random value of at least 32 characters.");
}

const system = await createDevelopmentSystem({
  workerEnabled: true,
  workerRunnerIds: ["world"],
  maxTasksPerRun: 1,
  localExecutionOptions: {
    repositoryRoot: process.env.ALIVE_REPOSITORY_ROOT,
    reviewDirectory: process.env.ALIVE_REVIEW_DIRECTORY,
    baseRef: "HEAD",
    allowedPaths: (process.env.ALIVE_ALLOWED_PATHS || "")
      .split(",").map(value => value.trim()).filter(Boolean),
    proposalProvider: createLocalProposalQueueProvider({
      directory: process.env.ALIVE_PROPOSAL_DIRECTORY,
      repositoryRoot: process.env.ALIVE_REPOSITORY_ROOT
    }),
    testCommands: [{ command: "node", args: ["--experimental-default-type=module", "--test", "development/tests/*.test.js"] }]
  },
  approvedReviewPublisherOptions: {
    repositoryRoot: process.env.ALIVE_REPOSITORY_ROOT,
    baseRef: "HEAD",
    allowedPaths: (process.env.ALIVE_ALLOWED_PATHS || "")
      .split(",").map(value => value.trim()).filter(Boolean),
    testCommands: [{ command: "node", args: ["--test", "development/tests"] }]
  }
});

const host = createLocalAliveHost({
  system,
  ownerToken,
  ownerId: "local-repository-owner",
  host: "127.0.0.1",
  port: 4317
});

await host.listen();
console.log("ALIVE local owner host is listening on 127.0.0.1:4317");
process.on("SIGINT", async () => { await host.close(); process.exit(0); });
process.on("SIGTERM", async () => { await host.close(); process.exit(0); });
```

Generate a token locally with Node.js:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Keep the token private. Keep the review directory outside the Git repository.
Set `ALIVE_ALLOWED_PATHS` to the narrowest project folders needed for the
specific task; do not grant the entire repository by default. The example
provider intentionally throws until an owner-approved local proposal source
is connected, so the worker cannot fabricate or apply code changes.


## Ready-to-run local launcher

A small launcher is included at `development/host/startLocalAliveHost.js`.
It wires the deterministic Living Contract engine, local Git worktree adapter,
persistent review store, JSON proposal queue, owner gate, and local branch
publisher together. It does not require an AI API or hosted sandbox.

On the computer that has the repository checkout:

1. Use Node.js 22 or newer and Git.
2. Create three directories outside the repository: one for reviews, one for
   proposal JSON files, and one private location for environment configuration.
3. Set these environment variables in the shell or a private env file:
   - `ALIVE_REPOSITORY_ROOT`: absolute path to the Git repository root
   - `ALIVE_REVIEW_DIRECTORY`: absolute path to the review directory
   - `ALIVE_PROPOSAL_DIRECTORY`: absolute path to the proposal queue directory
   - `ALIVE_OWNER_TOKEN`: private random token of at least 32 characters
   - `ALIVE_OWNER_ID`: the local owner identity label
   - `ALIVE_ALLOWED_PATHS`: comma-separated, narrow project folders ALIVE may change
   - `ALIVE_PORT`: optional local port; defaults to 4317
4. Start it from the repository root:
   `node --experimental-default-type=module development/host/startLocalAliveHost.js`

Do not put secrets in Git or paste the owner token into chat. Do not use broad
allowlists such as the entire repository. The launcher uses a one-task worker
limit and fixed local tests. The worker cannot change files unless a complete
proposal file already exists for the exact task ID in the proposal queue.

### Proposal queue format

Create one UTF-8 JSON file named exactly `<task-id>.json` in the private
proposal directory. Its `taskId` must match the queued task ID:

```json
{
  "taskId": "task_123",
  "summary": "Short explanation of the proposed change",
  "fileChanges": [
    {
      "path": "development/example.js",
      "content": "export const example = true;\\n"
    }
  ]
}
```

Every file path must be inside `ALIVE_ALLOWED_PATHS`. Each proposal file is
validated against its task ID, path allowlist, duplicate paths, symlinks, and
size limits. A missing or invalid proposal blocks the task; ALIVE does not
invent a patch or silently contact an external provider. The queue file is
not automatically deleted, so retain or archive it deliberately after review.

The launcher and proposal queue are designed for a desktop/laptop with the
repository checkout. They cannot be started by the iPad app itself. A local
host process is not running until the owner starts it on that computer.

## Local API

All routes except `GET /health` require
`Authorization: Bearer <ALIVE_OWNER_TOKEN>`.

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/health` | Minimal process health |
| GET | `/v1/status` | System and safety snapshot |
| GET | `/v1/reviews` | Persistent owner review queue |
| POST | `/v1/intents` | Submit `{"intent":"..." }` to Living Contracts |
| POST | `/v1/worker/run-once` | Explicitly run one bounded worker cycle |
| POST | `/v1/reviews/:id/approve` | Record authenticated owner approval |
| POST | `/v1/reviews/:id/reject` | Reject with a required `{"reason":"..." }` |
| POST | `/v1/reviews/:id/publish` | Publish an approved review to a local branch with `{"branchName":"..." }` |

The HTTP host is an authenticated local control boundary, not a user interface
or a remote service. It does not expose a public network listener. A desktop
host process must be started on the computer that owns the local repository;
the iPad/browser cannot execute Git worktrees on that computer by itself.
