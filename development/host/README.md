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
import { createLocalAliveHost } from "./localAliveHost.js";

const ownerToken = process.env.ALIVE_OWNER_TOKEN;
if (!ownerToken || ownerToken.length < 32) {
  throw new Error("Set ALIVE_OWNER_TOKEN to a private random value of at least 32 characters.");
}

const system = await createDevelopmentSystem({
  workerEnabled: true,
  workerRunnerIds: ["world"],
  maxTasksPerRun: 2,
  localExecutionOptions: {
    repositoryRoot: process.env.ALIVE_REPOSITORY_ROOT,
    reviewDirectory: process.env.ALIVE_REVIEW_DIRECTORY,
    baseRef: "HEAD",
    allowedPaths: (process.env.ALIVE_ALLOWED_PATHS || "")
      .split(",").map(value => value.trim()).filter(Boolean),
    proposalProvider: async ({ task, allowedPaths, readAllowedFile }) => {
      // Inject an owner-controlled local proposal source here.
      // Return { summary, fileChanges: [{ path, content }] }.
      // No provider is installed or invoked by default.
      throw new Error("No local proposal provider has been configured.");
    },
    testCommands: [{ command: "node", args: ["--test", "development/tests"] }]
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
