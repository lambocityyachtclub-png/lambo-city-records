import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createIsolatedWorkspaceAdapter } from "../execution/isolatedWorkspaceAdapter.js";
import { createDevelopmentWorkspacePipeline } from "../execution/developmentWorkspacePipeline.js";

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "lc-pipeline-test-"));
  const projectRoot = path.join(root, "project");
  const workspaceRoot = path.join(root, "workspaces");
  await fs.mkdir(path.join(projectRoot, "development", "sample"), { recursive: true });
  await fs.writeFile(path.join(projectRoot, "development", "sample", "module.js"), "export const value = 1;\n");
  const workspaceAdapter = createIsolatedWorkspaceAdapter({
    projectRoot, workspaceRoot, allowedPaths: ["development"]
  });
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return { projectRoot, workspaceAdapter };
}

test("pipeline requires explicit planner and test runner", async t => {
  const { workspaceAdapter } = await fixture(t);
  assert.throws(() => createDevelopmentWorkspacePipeline({ workspaceAdapter }), /changePlanner/);
});

test("pipeline prepares real isolated changes and runs an injected test runner", async t => {
  const { projectRoot, workspaceAdapter } = await fixture(t);
  let testCalls = 0;
  const pipeline = createDevelopmentWorkspacePipeline({
    workspaceAdapter,
    changePlanner: async ({ files }) => {
      const before = await files.read("development/sample/module.js");
      await files.write("development/sample/module.js", before.replace("1", "2"));
      return { summary: "Updated isolated sample module." };
    },
    testRunner: async ({ changedFiles }) => {
      testCalls += 1;
      assert.deepEqual(changedFiles, ["development/sample/module.js"]);
      return { passed: true, total: 1, failed: 0 };
    }
  });

  const workspace = await pipeline.createWorkspace({ taskId: "pipeline-test" });
  const proposal = await pipeline.prepareChanges({ workspaceId: workspace.workspaceId, task: { id: "pipeline-test" } });
  assert.deepEqual(proposal.changedFiles, ["development/sample/module.js"]);
  assert.equal(proposal.changes, "Updated isolated sample module.");
  assert.equal(testCalls, 0);

  const tests = await pipeline.runTests({ workspaceId: workspace.workspaceId, task: { id: "pipeline-test" } });
  assert.equal(tests.passed, true);
  assert.equal(testCalls, 1);

  const original = await fs.readFile(path.join(projectRoot, "development", "sample", "module.js"), "utf8");
  assert.equal(original, "export const value = 1;\n");
  await pipeline.destroyWorkspace(workspace.workspaceId);
});

test("pipeline refuses to run tests before a proposal exists", async t => {
  const { workspaceAdapter } = await fixture(t);
  const pipeline = createDevelopmentWorkspacePipeline({
    workspaceAdapter,
    changePlanner: async () => ({}),
    testRunner: async () => ({ passed: true })
  });
  const workspace = await pipeline.createWorkspace({ taskId: "test-order" });
  await assert.rejects(
    pipeline.runTests({ workspaceId: workspace.workspaceId }),
    /must be prepared before tests/
  );
  await pipeline.destroyWorkspace(workspace.workspaceId);
});

test("pipeline requires an explicit boolean test outcome", async t => {
  const { workspaceAdapter } = await fixture(t);
  const pipeline = createDevelopmentWorkspacePipeline({
    workspaceAdapter,
    changePlanner: async () => ({}),
    testRunner: async () => ({ total: 3 })
  });
  const workspace = await pipeline.createWorkspace({ taskId: "test-result" });
  await pipeline.prepareChanges({ workspaceId: workspace.workspaceId, task: {} });
  await assert.rejects(
    pipeline.runTests({ workspaceId: workspace.workspaceId }),
    /explicit boolean passed/
  );
  await pipeline.destroyWorkspace(workspace.workspaceId);
});
