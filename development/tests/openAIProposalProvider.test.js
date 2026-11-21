import test from "node:test";
import assert from "node:assert/strict";
import { createOpenAIProposalProvider, OPENAI_PROPOSAL_PROVIDER_DEFAULTS } from "../providers/openAIProposalProvider.js";

function apiResponse(proposal) {
  return {
    ok: true, status: 200, headers: { get: () => null },
    async json() {
      return { status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(proposal) }] }] };
    }
  };
}
const proposal = {
  summary: "Add one isolated world helper.",
  files: [{ path: "development/example/world-helper.js", content: "export const ready = true;" }]
};

test("OpenAI provider sends strict structured Responses API request", async () => {
  let request;
  const provider = createOpenAIProposalProvider({
    apiKey: "test-secret", model: "gpt-test-model",
    fetchImpl: async (url, options) => {
      request = { url, options, body: JSON.parse(options.body) };
      return apiResponse(proposal);
    }
  });
  const result = await provider.generateProposal({
    task: { id: "task-1", title: "Add a world helper" },
    context: { files: [{ path: "development/example/base.js", content: "export const base = true;" }] },
    allowedPaths: ["development/example"]
  });
  assert.deepEqual(result, proposal);
  assert.equal(provider.providerId, "openai");
  assert.equal(provider.model, "gpt-test-model");
  assert.equal(request.url, OPENAI_PROPOSAL_PROVIDER_DEFAULTS.endpoint);
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.headers.Authorization, "Bearer test-secret");
  assert.equal(request.body.store, false);
  assert.equal(request.body.model, "gpt-test-model");
  assert.equal(request.body.text.format.type, "json_schema");
  assert.equal(request.body.text.format.strict, true);
  assert.equal(request.body.text.format.schema.additionalProperties, false);
  assert.match(request.body.input[0].content[0].text, /Add a world helper/);
});

test("OpenAI provider requires an API key", () => {
  assert.throws(() => createOpenAIProposalProvider({ apiKey: "", model: "gpt-test-model" }), /OpenAI API key is required/);
});

test("OpenAI provider requires a task and explicit allowed paths", async () => {
  const provider = createOpenAIProposalProvider({ apiKey: "test-secret", model: "gpt-test-model", fetchImpl: async () => apiResponse(proposal) });
  await assert.rejects(provider.generateProposal({ task: { id: "1" }, allowedPaths: [] }), /allowedPaths/);
  await assert.rejects(provider.generateProposal({ task: null, allowedPaths: ["development/example"] }), /development task/);
});

test("OpenAI provider handles refusal and incomplete responses", async () => {
  const refusal = createOpenAIProposalProvider({
    apiKey: "test-secret", model: "gpt-test-model",
    fetchImpl: async () => ({ ok: true, status: 200, async json() {
      return { status: "completed", output: [{ content: [{ type: "refusal", refusal: "Not allowed." }] }] };
    } })
  });
  await assert.rejects(refusal.generateProposal({ task: { id: "1" }, allowedPaths: ["development/example"] }), /declined/);

  const incomplete = createOpenAIProposalProvider({
    apiKey: "test-secret", model: "gpt-test-model",
    fetchImpl: async () => ({ ok: true, status: 200, async json() { return { status: "incomplete", output: [] }; } })
  });
  await assert.rejects(incomplete.generateProposal({ task: { id: "1" }, allowedPaths: ["development/example"] }), /incomplete/);
});

test("OpenAI provider reports API errors without exposing credentials", async () => {
  const provider = createOpenAIProposalProvider({
    apiKey: "never-print-this-secret", model: "gpt-test-model",
    fetchImpl: async () => ({
      ok: false, status: 429,
      headers: { get: name => name === "x-request-id" ? "req_test_123" : null },
      async json() { return { error: { message: "Rate limit reached." } }; }
    })
  });
  await assert.rejects(
    provider.generateProposal({ task: { id: "1" }, allowedPaths: ["development/example"] }),
    error => {
      assert.match(error.message, /HTTP 429/);
      assert.match(error.message, /req_test_123/);
      assert.doesNotMatch(error.message, /never-print-this-secret/);
      return true;
    }
  );
});

test("OpenAI provider rejects oversized input before network access", async () => {
  let called = false;
  const provider = createOpenAIProposalProvider({
    apiKey: "test-secret", model: "gpt-test-model",
    fetchImpl: async () => { called = true; return apiResponse(proposal); }
  });
  await assert.rejects(
    provider.generateProposal({ task: { id: "1", description: "x".repeat(700_001) }, allowedPaths: ["development/example"] }),
    /input size limit/
  );
  assert.equal(called, false);
});
