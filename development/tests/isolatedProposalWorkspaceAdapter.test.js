import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createIsolatedWorkspaceAdapter } from "../execution/isolatedWorkspaceAdapter.js";
import { createIsolatedProposalWorkspaceAdapter } from "../execution/isolatedProposalWorkspaceAdapter.js";

async function fixture(t, testRunner = async () => ({ passed: true, total: 1, failed: 0 }), projectContext = null) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "alive-proposal-workspace-"));
  const projectRoot = path.join(root, "project");
  const workspaceRoot = path.join(root, "workspaces");
  await fs.mkdir(path.join(projectRoot, "development", "example"), { recursive: true });
  await fs.writeFile(path.join(projectRoot, "development", "example", "base.js"), "export const base = true;\n");
  const isolated = createIsolatedWorkspaceAdapter({
    projectRoot,
    workspaceRoot,
    allowedPaths: ["development/example"]
  });
  const adapter = createIsolatedProposalWorkspaceAdapter({
    workspaceAdapter: isolated,
    allowedPaths: ["development/example"],
    testRunner,
    projectContext
  });
  t.after(async () => fs.rm(root, { recursive: true, force: true }));
  return { projectRoot, adapter };
}

test("proposal bridge reads bounded context from isolated workspace and applies text files only there", async t => {
  const { projectRoot, adapter } = await fixture(t);
  const workspace = await adapter.createWorkspace({ taskId: "bridge-read-write" });
  const context = await adapter.readWorkspaceContext({ workspaceId: workspace.workspaceId });
  assert.equal(context.files.length, 1);
  assert.match(context.files[0].content, /base = true/);

  await adapter.applyProposedFiles({
    workspaceId: workspace.workspaceId,
    files: [{ path: "development/example/generated.js", content: "export const generated = true;\n" }]
  });
  assert.deepEqual(await adapter.listChangedFiles({ workspaceId: workspace.workspaceId }), [
    "development/example/generated.js"
  ]);
  const liveFile = await fs.readFile(path.join(projectRoot, "development", "example", "base.js"), "utf8");
  assert.match(liveFile, /base = true/);
  const liveGeneratedExists = await fs.access(path.join(projectRoot, "development", "example", "generated.js"))
    .then(() => true).catch(() => false);
  assert.equal(liveGeneratedExists, false);
  await adapter.destroyWorkspace(workspace.workspaceId);
});

test("proposal bridge delegates tests only to an explicitly injected trusted runner", async t => {
  let received;
  const { adapter } = await fixture(t, async input => {
    received = input;
    return { passed: true, total: 3, failed: 0 };
  });
  const workspace = await adapter.createWorkspace({ taskId: "bridge-tests" });
  const result = await adapter.runTests({ workspaceId: workspace.workspaceId, task: { id: "task-1" } });
  assert.equal(result.passed, true);
  assert.equal(received.workspaceId, workspace.workspaceId);
  assert.equal(received.task.id, "task-1");
  assert.equal(received.allowedPaths[0], "development/example");
  await adapter.destroyWorkspace(workspace.workspaceId);
});

test("proposal bridge rejects missing trusted test runner", () => {
  const isolated = { createWorkspace() {}, getWorkspaceInfo() {}, readFile() {}, writeFile() {}, listChangedFiles() {} };
  assert.throws(() => createIsolatedProposalWorkspaceAdapter({
    workspaceAdapter: isolated,
    allowedPaths: ["development/example"]
  }), /trusted testRunner/);
});

test("proposal bridge rejects writes outside the explicit allowlist", async t => {
  const { adapter } = await fixture(t);
  const workspace = await adapter.createWorkspace({ taskId: "bridge-path-guard" });
  await assert.rejects(adapter.applyProposedFiles({
    workspaceId: workspace.workspaceId,
    files: [{ path: "src/live.js", content: "not allowed" }]
  }), /outside allowed paths/);
  await adapter.destroyWorkspace(workspace.workspaceId);
});

test("proposal bridge enforces file and total proposal write limits", async t => {
  const { adapter } = await fixture(t);
  const workspace = await adapter.createWorkspace({ taskId: "bridge-size-guard" });
  await assert.rejects(adapter.applyProposedFiles({
    workspaceId: workspace.workspaceId,
    files: [{ path: "development/example/large.js", content: "x".repeat(128 * 1024 + 1) }]
  }), /128 KB limit/);
  await adapter.destroyWorkspace(workspace.workspaceId);
});

test("proposal bridge adds compact read-only project context without exposing raw inventory", async t => {
  const projectContext = {
    status: "discovery-only",
    ownerApproved: false,
    dependencyGraph: { rootEntrypoints: ["index.html"], reachableFiles: ["main.js"] }
  };
  const { adapter } = await fixture(t, undefined, projectContext);
  const workspace = await adapter.createWorkspace({ taskId: "bridge-project-context" });
  const context = await adapter.readWorkspaceContext({ workspaceId: workspace.workspaceId });
  assert.deepEqual(context.projectBlueprint, projectContext);
  assert.equal(context.projectBlueprint.ownerApproved, false);
  await adapter.destroyWorkspace(workspace.workspaceId);
});
