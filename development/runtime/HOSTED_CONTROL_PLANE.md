# ALIVE hosted OpenAI control plane

This is the first hosted, owner-authenticated connection from ALIVE task intake
to the OpenAI proposal provider, disposable workspaces, isolated tests, and
owner review.

## API

All endpoints require a verified ALIVE owner session cookie issued by Better Auth.
The session is checked server-side against the single ALIVE_OWNER_EMAIL allowlist.
Player accounts and the ALIVE owner identity use separate database tables.

- GET /api/alive/status — reports configuration booleans only.
- GET /api/alive/tasks — lists durable task records.
- POST /api/alive/tasks — creates a world-development task; it does not execute it. The same endpoint accepts action `approve` or `reject` for protected tasks.
- POST /api/alive/run — attempts one queued world task.
- GET /api/alive/reviews — lists owner reviews.
- POST /api/alive/reviews — records decision "perfect" or "change".

A run is one-shot and requires both ALIVE_AI_ENABLED=true and
ALIVE_SANDBOX_ENABLED=true. No cron, background loop, merge, commit, production
write, or deployment is started. The first hosted executor pilot is for World
tasks only; Studio task execution remains a separate milestone.

## Required server-side Vercel environment

Configure these only for the intended Preview branch first:

- DATABASE_URL — pooled connection string for the existing lambo-city-alive
  Neon development branch (database neondb).
- ALIVE_OWNER_EMAIL — the one verified email address permitted to enroll as the ALIVE owner.
- ALIVE_OWNER_AUTH_SECRET — unique random Better Auth secret, at least 32 characters.
- ALIVE_OWNER_AUTH_URL — exact HTTPS origin for the Preview deployment being tested.
- RESEND_API_KEY and EMAIL_FROM — Resend credentials and verified sender for owner verification and password reset.
- OPENAI_API_KEY — secret OpenAI Platform API key. This is separate from a
  ChatGPT subscription and API calls are billed separately.
- OPENAI_MODEL — optional; defaults to gpt-6-astra.
- ALIVE_ALLOWED_PATHS — JSON array of narrowly scoped repository-relative
  paths. The first pilot must include ["development"] so the sandbox can run
  ALIVE's complete automated test suite. This keeps the first pilot inside
  ALIVE's development subsystem; it does not make game-world or Studio runtime
  source files writable. Add additional source paths only when matching tests
  are included and reviewed.
- ALIVE_AI_ENABLED — keep false until model usage is explicitly approved.
- ALIVE_SANDBOX_ENABLED — keep false until sandbox usage is explicitly approved.

Never expose any of these values to browser code or commit them to Git.

## Database migration

The existing development database already contains the task-state and review
tables. Its review status constraint predates the newer CHANGE workflow.
Before using the hosted API, manually review and apply
development/storage/migrations/001_alive_hosted_control_plane.sql to the
isolated alive-dev branch. Application code checks the schema and will refuse
to run if the migration is missing. No migration is run automatically.

## Safety and execution

- API requests require a verified owner session cookie; the legacy bearer-token flow is removed by the owner-authentication change.
- Task intake and review actions are serialized with a PostgreSQL advisory lock
  so the snapshot-based task director cannot race across function instances.
- The OpenAI key stays on the server.
- Vercel Sandbox uses the deployment's Vercel OIDC identity when available; enable
  Vercel OIDC for the project before turning on ALIVE_SANDBOX_ENABLED.
- OpenAI proposals are validated against an explicit path allowlist and written
  only into a disposable workspace.
- Tests run in a fresh Vercel Sandbox with outbound networking denied.
- The isolated workspace is destroyed after processing; the owner review stores
  the proposed text files so the changes remain inspectable.
- PERFECT and CHANGE affect task/review records only. Neither publishes code.
- The Vercel Function has a 60-second invocation limit; this is a small one-task
  pilot, not the long-running worker. Durable background orchestration and a
  hardened release/publish process remain future milestones.
