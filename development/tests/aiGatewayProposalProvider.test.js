import test from "node:test";
import assert from "node:assert/strict";
import {
  createAIGatewayProposalProvider,
  validateAIProposal,
  AI_GATEWAY_CHAT_COMPLETIONS_URL
} from "../providers/aiGatewayProposalProvider.js";

const task = {
  id: "task-convention-center",
  title: "Review Convention Center glass realism",
  description: "Improve glass material response without changing the building footprint.",
  area: "world_materials",
  contractId: "world-material-quality",
  contractVersion: "1.0.0",
  relatedFiles: ["conferenceCenterDistrict.js"],
  acceptanceCriteria: ["Preserve the existing footprint."]
};

const sourceFiles = [{
  path: "conferenceCenterDistrict.js",
  content: "export const existingMaterial = true;"
}];

function createProvider(options = {}) {
  const calls = [];
  const responseContent = options.responseContent || JSON.stringify({
    summary: "Improve the existing glass material response.",
    risk: "low",
    files: [{
      path: "conferenceCenterDistrict.js",
      content: "export const existingMaterial = true;\nexport const improvedGlass = true;"
    }],
    notes: ["No geometry or layout changes."]
  });
  const provider = createAIGatewayProposalProvider({
    apiKey: "test-credential-not-real",
    model: "openai/test-model",
    enabled: options.enabled ?? true,
    spendApproved: options.spendApproved ?? true,
    fetchImpl: async (url, request) => {
      calls.push({ url, request });
      if (options.httpStatus && options.httpStatus !== 200) {
        return { ok: false, status: options.httpStatus };
      }
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            model: "openai/test-model",
            choices: [{ message: { content: responseContent } }],
            usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 }
          };
        }
      };
    }
  });
  return { provider, calls };
}

test("AI Gateway provider is disabled unless both owner flags are enabled", async () => {
  const calls = [];
  const provider = createAIGatewayProposalProvider({
    apiKey: "test-credential-not-real",
    model: "openai/test-model",
    env: {},
    fetchImpl: async () => { calls.push("called"); }
  });
  assert.equal(provider.getSnapshot().enabled, false);
  await assert.rejects(
    () => provider.generateProposal({ task, sourceFiles }),
    /disabled until the owner explicitly enables it and approves model spend/
  );
  assert.equal(calls.length, 0);
});

test("AI Gateway provider requires an explicit spend approval even when enabled", async () => {
  const { provider, calls } = createProvider({ enabled: true, spendApproved: false });
  assert.equal(provider.getSnapshot().ownerEnabled, true);
  assert.equal(provider.getSnapshot().spendApproved, false);
  await assert.rejects(() => provider.generateProposal({ task, sourceFiles }), /approves model spend/);
  assert.equal(calls.length, 0);
});

test("AI Gateway provider sends a bounded request and validates the returned proposal", async () => {
  const { provider, calls } = createProvider();
  const result = await provider.generateProposal({ task, sourceFiles });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, AI_GATEWAY_CHAT_COMPLETIONS_URL);
  assert.equal(calls[0].request.method, "POST");
  assert.equal(calls[0].request.headers.Authorization, "Bearer test-credential-not-real");
  const body = JSON.parse(calls[0].request.body);
  assert.equal(body.model, "openai/test-model");
  assert.equal(body.response_format.type, "json_object");
  assert.equal(body.max_tokens, 6000);

  assert.equal(result.provider, "vercel-ai-gateway");
  assert.equal(result.risk, "low");
  assert.deepEqual(result.files.map(file => file.path), ["conferenceCenterDistrict.js"]);
  assert.equal(result.usage.totalTokens, 150);
  assert.equal(provider.getSnapshot().writesFiles, false);
  assert.equal(provider.getSnapshot().deploysProduction, false);
});

test("AI Gateway provider rejects a task with a stale contract version before making a request", async () => {
  const { provider, calls } = createProvider();
  await assert.rejects(
    () => provider.generateProposal({
      task: { ...task, contractVersion: "0.0.0" },
      sourceFiles
    }),
    /contract is missing or has changed/
  );
  assert.equal(calls.length, 0);
});

test("AI Gateway provider requires source files to match exact task targets", async () => {
  const { provider, calls } = createProvider();
  await assert.rejects(
    () => provider.generateProposal({
      task,
      sourceFiles: [{ path: "main.js", content: "not allowed" }]
    }),
    /outside the approved task targets/
  );
  assert.equal(calls.length, 0);
});

test("AI Gateway provider rejects model output outside the exact task target", async () => {
  const { provider, calls } = createProvider({
    responseContent: JSON.stringify({
      summary: "Attempt to modify main entry.",
      risk: "low",
      files: [{ path: "main.js", content: "export const unsafe = true;" }]
    })
  });
  await assert.rejects(
    () => provider.generateProposal({ task, sourceFiles }),
    /outside its task targets/
  );
  assert.equal(calls.length, 1);
});

test("AI Gateway provider rejects invalid JSON and failed gateway responses", async () => {
  const invalidJson = createProvider({ responseContent: "not-json" });
  await assert.rejects(
    () => invalidJson.provider.generateProposal({ task, sourceFiles }),
    /invalid JSON/
  );

  const failed = createProvider({ httpStatus: 429 });
  await assert.rejects(
    () => failed.provider.generateProposal({ task, sourceFiles }),
    /HTTP 429/
  );
});

test("AI proposal validator rejects duplicate files, excessive file size, and invalid risk", () => {
  const valid = {
    summary: "Valid proposal",
    risk: "low",
    files: [{ path: "conferenceCenterDistrict.js", content: "export const safe = true;" }]
  };
  const baseOptions = {
    allowedPaths: ["conferenceCenterDistrict.js"],
    targetPaths: ["conferenceCenterDistrict.js"],
    maxFiles: 1,
    maxFileBytes: 100,
    maxTotalBytes: 100
  };
  assert.throws(() => validateAIProposal({
    ...valid,
    files: [...valid.files, ...valid.files]
  }, baseOptions), /file count/);
  assert.throws(() => validateAIProposal({
    ...valid,
    files: [{ path: "conferenceCenterDistrict.js", content: "x".repeat(101) }]
  }, baseOptions), /per-file size limit/);
  assert.throws(() => validateAIProposal({
    ...valid,
    risk: "unknown"
  }, baseOptions), /risk must be/);
});
