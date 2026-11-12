import test from "node:test";
import assert from "node:assert/strict";
import { createVercelAIGatewayProposalProvider } from "../execution/vercelAIGatewayProposalProvider.js";

function response(content, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => "gateway error",
    json: async () => ({
      id: "resp_test",
      choices: [{ message: { content } }]
    })
  };
}

test("AI provider stays disabled unless explicitly enabled", async () => {
  let called = false;
  const provider = createVercelAIGatewayProposalProvider({
    apiKey: "test-key",
    fetchImpl: async () => { called = true; return response("{}"); }
  });
  await assert.rejects(
    provider.proposeChanges({ listFiles: async () => [], readFile: async () => "" }),
    /disabled/
  );
  assert.equal(called, false);
});

test("AI provider sends only allowlisted workspace source and returns bounded proposal", async () => {
  let request;
  const provider = createVercelAIGatewayProposalProvider({
    enabled: true,
    apiKey: "test-key",
    model: "anthropic/claude-sonnet-5",
    fetchImpl: async (url, options) => {
      request = { url, options };
      return response(JSON.stringify({
        summary: "Improve the isolated test fixture.",
        files: [{ path: "development/example.js", content: "export const value = 2;" }]
      }));
    }
  });

  const result = await provider.proposeChanges({
    task: { id: "task-1", title: "Improve fixture" },
    workspace: { allowedPaths: ["development"] },
    listFiles: async () => ["development/example.js"],
    readFile: async filePath => {
      assert.equal(filePath, "development/example.js");
      return "export const value = 1;";
    }
  });

  assert.equal(request.url, "https://ai-gateway.vercel.sh/v1/chat/completions");
  assert.equal(request.options.headers.authorization, "Bearer test-key");
  const body = JSON.parse(request.options.body);
  assert.equal(body.model, "anthropic/claude-sonnet-5");
  assert.equal(body.messages[1].content.includes("development/example.js"), true);
  assert.equal(result.files[0].content, "export const value = 2;");
  assert.equal(result.provenance.provider, "vercel-ai-gateway");
});

test("AI provider rejects malformed model output", async () => {
  const provider = createVercelAIGatewayProposalProvider({
    enabled: true,
    apiKey: "test-key",
    fetchImpl: async () => response("not json")
  });
  await assert.rejects(
    provider.proposeChanges({
      workspace: { allowedPaths: ["development"] },
      listFiles: async () => [],
      readFile: async () => ""
    }),
    /valid JSON/
  );
});

test("AI provider rejects files beyond configured bounds", async () => {
  const provider = createVercelAIGatewayProposalProvider({
    enabled: true,
    apiKey: "test-key",
    maxProposalFiles: 1,
    fetchImpl: async () => response(JSON.stringify({
      files: [
        { path: "development/a.js", content: "a" },
        { path: "development/b.js", content: "b" }
      ]
    }))
  });
  await assert.rejects(
    provider.proposeChanges({
      workspace: { allowedPaths: ["development"] },
      listFiles: async () => [],
      readFile: async () => ""
    }),
    /file-count limit/
  );
});
