# LAMBO CITY ALIVE execution runtime

This is server-side development infrastructure. Never import it from browser/game modules.

## Connected components

- Vercel AI Gateway proposal provider: asks the configured model for bounded, complete file proposals using only files exposed by the isolated workspace.
- Vercel Sandbox test runner: copies allowlisted workspace files into a disposable Node 22 microVM, disables outbound networking, runs Node's test runner, and stops the sandbox.
- PostgreSQL storage: persists task snapshots and review records across worker restarts and separate GitHub Actions executions. Schema creation is idempotent.
- Runtime composition: `createAliveDevelopmentSystem()` wires durable task/review storage, the AI provider, sandbox runner, isolated workspace adapter, and Development System.
- Scheduled host: `runAliveWorker.js` processes at most one eligible task per invocation. The GitHub Actions workflow checks every six hours, but does nothing unless the explicit enablement variable is true.

## GitHub configuration

Create these repository **Actions variables** only after a database and Vercel project are ready:

- `ALIVE_WORKER_ENABLED`: set to `true` to permit the scheduled job to start.
- `ALIVE_AI_ENABLED`: set to `true` to authorize model calls.
- `ALIVE_SANDBOX_ENABLED`: set to `true` to authorize billable sandbox runs.
- `ALIVE_ALLOWED_PATHS`: JSON array of repository-relative paths. Start narrowly; never include secrets, credentials, `.git`, `.vercel`, `node_modules`, `dist`, or `build`.
- `VERCEL_TEAM_ID` and `VERCEL_PROJECT_ID`: identifiers for the Vercel project that owns Sandbox resources.

Create these repository **Actions secrets**:

- `ALIVE_DATABASE_URL`: PostgreSQL connection string from the selected managed database.
- `AI_GATEWAY_API_KEY`: Vercel AI Gateway API key.
- `VERCEL_TOKEN`: Vercel access token with access to the team/project used for Sandbox.

The GitHub Actions job uses a Vercel access token for Sandbox authentication; a GitHub-issued OIDC token is not interchangeable with a Vercel project OIDC token. AI Gateway calls use the separate AI Gateway API key. Never commit credentials to the repository.

Install runtime dependencies with `npm install --prefix development/runtime`. Run the worker host on Node 22 with `--experimental-default-type=module` so the existing server-side `.js` modules load as ES modules.

## Execution and safety

Both paid capabilities default to disabled in the runtime. The scheduled workflow is also gated by `ALIVE_WORKER_ENABLED`. A run requires all three enablement variables, database access, AI Gateway credentials, and Vercel Sandbox credentials.

The worker processes at most one queued task per six-hour schedule tick. The Sandbox receives only allowlisted workspace files and runs with outbound networking denied. Proposed changes remain in the isolated workspace and enter the persistent owner-review queue. The runtime never commits, merges, deploys, or writes to production.

Do not enable the workflow until the managed database is provisioned, credentials are saved as Actions secrets, the initial path allowlist is reviewed, and the owner has approved the expected model and sandbox spending. Scheduling is configured but gated; no autonomous run is active by default.
