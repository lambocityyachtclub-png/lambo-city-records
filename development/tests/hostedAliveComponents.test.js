import test from "node:test";
import assert from "node:assert/strict";
import { createHostedAliveComponents } from "../runtime/hostedAliveComponents.js";

test("Hosted ALIVE components compose discovery, exact-target workspaces, and a disabled AI provider", () => {
  const components = createHostedAliveComponents({
    env: {},
    projectRoot: process.cwd()
  });
  const snapshot = components.getSnapshot();

  assert.ok(components.allowedPaths.includes("conferenceCenterDistrict.js"));
  assert.ok(components.allowedPaths.includes("development/engine"));
  assert.ok(components.allowedPaths.includes("development/blueprints"));
  assert.equal(snapshot.projectDiscovery.configured, true);
  assert.equal(snapshot.projectDiscovery.enabled, true);
  assert.equal(snapshot.aiProvider.provider, "vercel-ai-gateway");
  assert.equal(snapshot.aiProvider.enabled, false);
  assert.equal(snapshot.aiProvider.configured, false);
  assert.equal(snapshot.workspaceAdapter.configured, true);
  assert.equal(snapshot.workspaceAdapter.testRunnerConfigured, false);
  assert.equal(snapshot.workspaceAdapter.resourceProfilerConfigured, false);
  assert.equal(snapshot.proposalGenerationEnabled, false);
  assert.equal(snapshot.isolatedExecutionReady, false);
  assert.equal(snapshot.autonomousProductionDeployment, false);
});

test("Hosted ALIVE components accept injected test adapters without invoking them during setup", () => {
  const calls = { scan: 0, propose: 0, test: 0 };
  const aiProvider = {
    getSnapshot() {
      return {
        provider: "vercel-ai-gateway",
        configured: true,
        enabled: false
      };
    },
    async generateProposal() {
      calls.propose++;
      return {};
    }
  };
  const projectDiscovery = {
    getSnapshot() { return { configured: true, enabled: true }; },
    async scan() {
      calls.scan++;
      return { status: "discovery-only" };
    }
  };
  const workspaceAdapter = {
    getSnapshot() {
      return {
        configured: true,
        testRunnerConfigured: false,
        resourceProfilerConfigured: false
      };
    }
  };

  const components = createHostedAliveComponents({
    env: {},
    projectRoot: process.cwd(),
    aiProvider,
    projectDiscovery,
    workspaceAdapter
  });

  assert.equal(components.getSnapshot().aiProvider.configured, true);
  assert.equal(components.getSnapshot().proposalGenerationEnabled, false);
  assert.equal(calls.scan, 0);
  assert.equal(calls.propose, 0);
  assert.equal(calls.test, 0);
});
