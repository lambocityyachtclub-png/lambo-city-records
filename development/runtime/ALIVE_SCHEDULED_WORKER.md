# ALIVE persistent scheduled worker

## Purpose

This adds a server-side scheduled entry point so ALIVE can resume queued work without the owner keeping a browser tab open. It is a bounded first implementation, not a continuously running daemon.

## Schedule

The repository's `vercel.json` schedules `/api/alive/worker` once daily at 17:00 UTC. This conservative default avoids assuming a paid plan or activating frequent background compute. The schedule is registered when a deployment containing this configuration is deployed to Production.

## Required owner-controlled Preview configuration

- `CRON_SECRET`: a random secret with at least 32 characters. Vercel sends it as a Bearer token to the scheduled route.
- `ALIVE_SCHEDULER_ENABLED=false` initially. Change to `true` only after the owner has reviewed the Preview and approved scheduled execution.
- `DATABASE_URL`: isolated ALIVE development database connection.
- `OPENAI_API_KEY`: server-side OpenAI API key.
- `ALIVE_AI_ENABLED=true` only after the owner approves API billing.
- `ALIVE_SANDBOX_ENABLED=true` only after the owner approves Vercel Sandbox usage and the Vercel OIDC integration is configured.
- `ALIVE_ALLOWED_PATHS`: a narrow JSON allowlist including `development` for the first pilot.

The code refuses to run without the cron secret and the explicit scheduler, AI, and sandbox switches. No credentials are stored in source or sent to the browser.

## Execution boundaries

- The scheduled route accepts GET only and checks the exact Bearer secret using a timing-safe comparison.
- It invokes the existing hosted control plane and its PostgreSQL advisory lock.
- It processes at most one queued World task per invocation.
- It does not create tasks, approve protected tasks, or bypass Development Policy.
- The controlled executor runs in a disposable workspace and isolated sandbox, then saves a review proposal.
- It does not write to the source repository, merge, publish, or deploy code.
- Owner review remains required before any proposed change can be accepted for release.
- No Studio execution is enabled by this first pilot.

## Completion and limits

Automated tests verify authentication, disabled-by-default behavior, the paid-service switches, the one-shot World executor boundary, method restrictions, and sanitized failures.

This code is not considered active until the owner configures the secrets and switches, a Production deployment registers the schedule, and a real scheduled invocation is observed. It is not a long-running worker. A higher-frequency schedule or durable multi-step workflow can be enabled later after usage limits and costs are reviewed.
