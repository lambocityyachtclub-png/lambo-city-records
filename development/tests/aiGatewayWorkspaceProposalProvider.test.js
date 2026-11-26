import test from "node:test";
import assert from "node:assert/strict";
import { createAIGatewayWorkspaceProposalProvider } from "../providers/aiGatewayWorkspaceProposalProvider.js";

const task = {
  id: "task-1",
  contractId: "world-material-quality",
  contractVersion: "1.0.0",
  relatedFiles: ["conferenceCenterDistrict.js"]
};

test("AI Gateway workspace bridge reads only exact task targets and attaches discovery context", async () => {
  const calls = { reads: [], scans: 0, provider: null };
  const aiProvider = {
    async generateProposal(input) {
      calls.provider = input;
      return { summary: "Bounded proposal", risk: "low", files: [] };
    }
  };
  const projectDiscovery = {
    async scan() {
      calls.scans++;
      return { status: "discovery-only", summary: { departmentCount: 10 } };
    }
  };
  const bridge = createAIGatewayWorkspaceProposalProvider({ aiProvider, projectDiscovery });
  const result = await bridge.proposeChanges({
    task,
    workspace: { allowedPaths: [...task.relatedFiles] },
    async listFiles() { return [...task.relatedFiles]; },
    async readFile(filePath) {
      calls.reads.push(filePath);
      return "export const glass = true;";
    }
  });

  assert.equal(result.summary, "Bounded proposal");
  assert.deepEqual(calls.reads, ["conferenceCenterDistrict.js"]);
  assert.equal(calls.scans, 1);
  assert.deepEqual(calls.provider.sourceFiles, [{
    path: "conferenceCenterDistrict.js",
    content: "export const glass = true;"
  }]);
  assert.equal(calls.provider.projectContext.status, "discovery-only");
});

test("AI Gateway workspace bridge rejects mismatched workspace targets before model invocation", async () => {
  let invoked = false;
  const bridge = createAIGatewayWorkspaceProposalProvider({
    aiProvider: {
      async generateProposal() {
        invoked = true;
        return {};
      }
    }
  });

  await assert.rejects(
    () => bridge.proposeChanges({
      task,
      async listFiles() { return ["main.js"]; },
      async readFile() { return "not allowed"; }
    }),
    /does not exactly match/
  );
  assert.equal(invoked, false);
});

test("AI Gateway workspace bridge requires exact task source files", async () => {
  const bridge = createAIGatewayWorkspaceProposalProvider({
    aiProvider: { async generateProposal() { return {}; } }
  });
  await assert.rejects(
    () => bridge.proposeChanges({
      task: { ...task, relatedFiles: [] },
      async listFiles() { return []; },
      async readFile() { return ""; }
    }),
    /no exact approved source-file targets/
  );
});

test("AI Gateway workspace bridge can omit project discovery context", async () => {
  let context;
  const bridge = createAIGatewayWorkspaceProposalProvider({
    aiProvider: {
      async generateProposal(input) {
        context = input.projectContext;
        return { summary: "No discovery context", risk: "low", files: [] };
      }
    },
    includeProjectContext: false,
    projectDiscovery: { async scan() { throw new Error("Must not scan"); } }
  });
  await bridge.proposeChanges({
    task,
    async listFiles() { return [...task.relatedFiles]; },
    async readFile() { return "source"; }
  });
  assert.equal(context, null);
});
