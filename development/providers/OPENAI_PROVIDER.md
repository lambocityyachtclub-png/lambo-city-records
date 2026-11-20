# ALIVE OpenAI proposal provider

This adapter connects ALIVE's vendor-neutral proposal contract to the OpenAI
Responses API. It is server-side code and must never be imported by browser
or game-client modules.

## Configuration

- Set OPENAI_API_KEY in the server's secret/environment configuration.
- Optionally set OPENAI_MODEL; the adapter defaults to gpt-6-astra.
- Construct createOpenAIProposalProvider() only in trusted server code.
- Inject the returned provider as worldExecution.proposalProvider alongside
  the isolated workspace, trusted test runner, review store, and explicit
  allowed-path list.

Example server-only composition:

    import { createOpenAIProposalProvider } from "./development/providers/openAIProposalProvider.js";

    const proposalProvider = createOpenAIProposalProvider({
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL
    });

    const system = await createDevelopmentSystem({
      worldExecution: {
        proposalProvider,
        workspaceAdapter,
        testRunner,
        reviewStore,
        allowedPaths: ["development/runners/world", "development/world"]
      }
    });

The example allowlist is illustrative only. Configure paths narrowly for
each task; do not copy it blindly into production.

## Safety and activation

- No API key, model call, paid request, Vercel environment variable, or
  production setting is configured by this code change.
- API requests use HTTPS, the Responses API, strict JSON Schema output,
  and store: false.
- Model output remains untrusted and must pass ALIVE's existing proposal
  validator, isolated workspace, trusted test runner, and owner-review flow.
- This provider does not execute code, write to the source project, commit,
  merge, or deploy.
- API usage is billed separately from a ChatGPT subscription.
- The API key must remain server-side and never enter browser code, public
  configuration, source control, or logs.
- The current trusted test-runner callback is not an OS-level sandbox. A
  hardened process/container sandbox with resource, time, and network limits
  remains a separate security milestone.

## Verification

Tests use mocked HTTP responses. They verify request shape, structured
output parsing, missing credentials, refusal/incomplete responses, API
errors, and input-size bounds. No billable OpenAI request is made.

## Model and cost control

The default model is `gpt-6.1-sol` for a more economical balance on routine development proposals. The owner may set `OPENAI_MODEL` to a stronger model such as `gpt-6-astra` for unusually difficult tasks, after reviewing current API pricing. Keep `ALIVE_AI_ENABLED=false` until the owner has configured API budgets and explicitly approved usage. The provider never stores Responses (`store:false`) and does not run until the server-side API key and execution switches are configured.
