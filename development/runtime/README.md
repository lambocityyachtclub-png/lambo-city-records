# LAMBO CITY ALIVE execution runtime

This is server-side development infrastructure. Do not import it from browser/game modules.

## Connected components

- Vercel AI Gateway proposal provider: asks the configured model for bounded, complete file proposals using only files exposed by the isolated workspace.
- Vercel Sandbox test runner: copies allowlisted workspace files into a disposable Node 22 microVM, disables outbound network access, runs Node's test runner, and stops the sandbox.
- Runtime composition: `createAliveDevelopmentSystem()` wires the provider, sandbox runner, isolated workspace adapter, persistent review store, and Development System together.

## Required runtime configuration

- `AI_GATEWAY_API_KEY` or `VERCEL_OIDC_TOKEN`: AI Gateway authentication.
- `ALIVE_AI_ENABLED=true`: explicit opt-in to billable model calls. Default is disabled.
- `VERCEL_OIDC_TOKEN` or a Vercel access token supported by the Sandbox SDK: Vercel Sandbox authentication.
- `ALIVE_SANDBOX_ENABLED=true`: explicit opt-in to billable sandbox execution. Default is disabled.
- `ALIVE_AI_MODEL`: optional model override. Default: `anthropic/claude-sonnet-5`.
- A persistent task storage adapter and review store must be supplied by the host application.
- The host must supply a narrow `allowedPaths` list. Do not include secrets, credentials, `.git`, `.vercel`, or dependency/build folders.

Install runtime dependencies with `npm install --prefix development/runtime`. Run the worker host on Node 22 with `--experimental-default-type=module` so the existing server-side `.js` modules load as ES modules.

## Safety and rollout

Both paid capabilities are disabled unless their corresponding opt-in flags are explicitly true. The Sandbox receives no host credentials and runs with `networkPolicy: "deny-all"`. Proposed changes remain in the isolated workspace and enter the existing owner-review queue. This runtime never commits, merges, deploys, or writes to production.

Do not enable either paid flag until the owner has approved the expected model and compute spending and the host has configured its credentials. Scheduling and production deployment are separate rollout steps and are intentionally not enabled here.
