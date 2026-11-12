# LAMBO CITY ALIVE — Private Queue Setup

The owner workspace is deliberately fail-closed. It will not send owner direction to the public `lambo-city-records` repository. The integrated non-production ALIVE preview is served at `https://alive-preview.lambocityrecords.com` and is mapped to `integration/lc-alive-agentic-worker-2026-11-10`. The GitHub Actions worker retrieves private tasks from `https://alive-preview.lambocityrecords.com/api/alive/private-task`; production remains unchanged.

## One-time repository setup

1. In GitHub, create a new repository under `lambocityyachtclub-png` named **`lambo-city-alive-control`**.
2. Set its visibility to **Private**. Do not initialize it with a README or public license.
3. After the private repository exists, the ALIVE setup process creates the isolated queue branch:
   `integration/lc-alive-agentic-worker-2026-11-10`.

## Credentials

Create one GitHub fine-grained personal access token. Do not paste it into ChatGPT or into the ALIVE web page.

### Vercel token

- Repository access: only `lambo-city-records` and `lambo-city-alive-control`.
- Repository permission: **Contents — Read and write**.
- Add it to the Vercel project as the sensitive environment variable `ALIVE_PRIVATE_QUEUE_GITHUB_TOKEN`.
- Targets: Preview and Production.

This server-only token writes the private task and a public pointer containing only the task ID and private file location. The raw owner vision is never written to the public repository.

### Hosted worker identity

The hosted worker uses GitHub Actions OpenID Connect (OIDC) to prove which repository, branch, and workflow is requesting a task. Vercel verifies the signed, short-lived GitHub identity token and checks the exact workflow commit's public pointer before using its server-only token to retrieve the private task.

**No GitHub Actions personal access token or repository secret is required.** The worker receives only the task associated with its verified push commit. The private task is returned to the authorized workflow and kept in its temporary runner workspace; it is not committed to the public repository.
 
## Owner sign-in

The Vercel project already has sensitive `ALIVE_OWNER_PASSWORD_HASH` and `ALIVE_SESSION_SECRET` variables configured for Preview and Production. The initial owner password is delivered separately in the private owner handoff.

## Safety checks

Before submissions are enabled, the server verifies that:

- the queue repository exists and is private;
- the required private queue branch exists;
- the public ALIVE worker branch and its task workflow exist;
- the task pointer contains no owner vision text.

The workflow independently verifies the private repository, branch, task ID, and exact task path before it reads a private task. Every code proposal remains isolated in a draft PR. No automatic merge or production deployment is enabled.
