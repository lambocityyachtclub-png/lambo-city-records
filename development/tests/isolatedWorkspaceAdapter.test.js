import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { getProjectContract } from "../../alive/contracts/projectContracts.js";
import { createIsolatedWorkspaceAdapter } from "../execution/isolatedWorkspaceAdapter.js";

async function createFixture(t, options = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "lambo-workspace-test-"));
  const projectRoot = path.join(root, "project");
  const workspaceRoot = path.join(root, "workspaces");

  await fs.mkdir(path.join(projectRoot, "development", "engine"), { recursive: true });
  await fs.mkdir(path.join(projectRoot, "src"), { recursive: true });
  await fs.writeFile(
    path.join(projectRoot, "development", "engine", "sample.js"),
    "export const value = 1;\n"
  );
  await fs.writeFile(path.join(projectRoot, "src", "live.js"), "This is part of the original project.\n");
  await fs.writeFile(path.join(projectRoot, ".env"), "PRIVATE_TOKEN=never-copy-this\n");

  const contract = getProjectContract("alive-development-core");
  const task = {
    id: options.taskId || "task-workspace-test",
    title: "Test isolated workspace",
    description: "Verify exact-target isolated execution.",
    area: "development-system",
    runner: "world",
    contractId: contract.id,
    contractVersion: contract.version,
    relatedFiles: options.relatedFiles || ["development/engine/sample.js"],
    acceptanceCriteria: ["Only exact task targets are exposed."]
  };

  const adapter = createIsolatedWorkspaceAdapter({
    projectRoot,
    workspaceRoot,
    allowedPaths: options.allowedPaths || ["development/engine"],
    proposalProvider: options.proposalProvider || null,
    testRunner: options.testRunner || null,
    resourceProfiler: options.resourceProfiler || null
  });

  t.after(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  async function createWorkspace() {
    return adapter.createWorkspace({
      taskId: task.id,
      task,
      allowedPaths: [...task.relatedFiles]
    });
  }

  return { root, projectRoot, workspaceRoot, task, adapter, createWorkspace };
}

test("Workspace adapter requires a project root", () => {
  assert.throws(
    () => createIsolatedWorkspaceAdapter({ allowedPaths: ["development/engine"] }),
    /projectRoot directory is required/
  );
});

test("Workspace adapter requires explicit allowed paths", () => {
  assert.throws(
    () => createIsolatedWorkspaceAdapter({ projectRoot: "/tmp/example" }),
    /explicit allowedPaths list is required/
  );
});

test("Workspace adapter rejects unsafe allowed paths", () => {
  assert.throws(
    () => createIsolatedWorkspaceAdapter({
      projectRoot: "/tmp/example",
      allowedPaths: ["../src"]
    }),
    /Unsafe workspace path/
  );
});

test("Workspace adapter rejects blocked and secret paths", () => {
  for (const unsafe of ["node_modules", ".env", "development/secrets/key.json"]) {
    assert.throws(
      () => createIsolatedWorkspaceAdapter({
        projectRoot: "/tmp/example",
        allowedPaths: [unsafe]
      }),
      /Unsafe workspace path/
    );
  }
});

test("Workspace adapter copies only exact task targets into a separate workspace", async t => {
  const { projectRoot, adapter, task, createWorkspace } = await createFixture(t);
  const workspace = await createWorkspace();

  assert.equal(workspace.isolated, true);
  assert.equal(workspace.taskId, task.id);
  assert.notEqual(workspace.directory, projectRoot);
  assert.deepEqual(workspace.allowedPaths, ["development/engine/sample.js"]);

  const copied = await adapter.readFile({
    workspaceId: workspace.workspaceId,
    filePath: "development/engine/sample.js"
  });
  assert.equal(copied, "export const value = 1;\n");

  await assert.rejects(
    fs.access(path.join(workspace.directory, ".env")),
    /ENOENT/
  );
  await adapter.destroyWorkspace(workspace.workspaceId);
});

test("Workspace adapter refuses reads outside exact task targets", async t => {
  const { adapter, createWorkspace } = await createFixture(t);
  const workspace = await createWorkspace();
  await assert.rejects(
    adapter.readFile({ workspaceId: workspace.workspaceId, filePath: "src/live.js" }),
    /outside the exact task targets/
  );
  await adapter.destroyWorkspace(workspace.workspaceId);
});

test("Workspace adapter writes changes only to the isolated copy", async t => {
  const { projectRoot, adapter, createWorkspace } = await createFixture(t);
  const workspace = await createWorkspace();

  await adapter.writeFile({
    workspaceId: workspace.workspaceId,
    filePath: "development/engine/sample.js",
    content: "export const value = 2;\n"
  });

  assert.equal(
    await adapter.readFile({ workspaceId: workspace.workspaceId, filePath: "development/engine/sample.js" }),
    "export const value = 2;\n"
  );
  assert.equal(
    await fs.readFile(path.join(projectRoot, "development", "engine", "sample.js"), "utf8"),
    "export const value = 1;\n"
  );
  await adapter.destroyWorkspace(workspace.workspaceId);
});

test("Workspace adapter detects modified files and rejects adding new files", async t => {
  const { adapter, createWorkspace } = await createFixture(t);
  const workspace = await createWorkspace();

  await adapter.writeFile({
    workspaceId: workspace.workspaceId,
    filePath: "development/engine/sample.js",
    content: "export const value = 3;\n"
  });
  assert.deepEqual(
    await adapter.listChangedFiles({ workspaceId: workspace.workspaceId }),
    ["development/engine/sample.js"]
  );

  await assert.rejects(
    adapter.writeFile({
      workspaceId: workspace.workspaceId,
      filePath: "development/engine/new-file.js",
      content: "export const added = true;\n"
    }),
    /outside the exact task targets/
  );
  await adapter.destroyWorkspace(workspace.workspaceId);
});

test("Workspace adapter blocks deletion of approved task targets", async t => {
  const { adapter, createWorkspace } = await createFixture(t);
  const workspace = await createWorkspace();
  await fs.rm(path.join(workspace.directory, "development", "engine", "sample.js"));
  await assert.rejects(
    adapter.listChangedFiles({ workspaceId: workspace.workspaceId }),
    /Deleting an approved task target is not permitted/
  );
  await adapter.destroyWorkspace(workspace.workspaceId);
});

test("Workspace adapter rejects directory traversal and writes outside task targets", async t => {
  const { adapter, createWorkspace } = await createFixture(t);
  const workspace = await createWorkspace();
  await assert.rejects(
    adapter.readFile({ workspaceId: workspace.workspaceId, filePath: "development/../src/live.js" }),
    /Unsafe workspace path/
  );
  await assert.rejects(
    adapter.writeFile({
      workspaceId: workspace.workspaceId,
      filePath: "src/live.js",
      content: "This must not be written."
    }),
    /outside the exact task targets/
  );
  await adapter.destroyWorkspace(workspace.workspaceId);
});

test("Workspace adapter rejects symbolic links in source targets", async t => {
  const { projectRoot, adapter, task } = await createFixture(t);
  const source = path.join(projectRoot, "development", "engine", "sample.js");
  const outsideFile = path.join(projectRoot, "outside-secret.txt");
  await fs.writeFile(outsideFile, "outside data");
  await fs.rm(source);
  await fs.symlink(outsideFile, source);
  await assert.rejects(
    () => adapter.createWorkspace({
      taskId: task.id,
      task,
      allowedPaths: [...task.relatedFiles]
    }),
    /symbolic links are not allowed/i
  );
});

test("Workspace adapter rejects workspace storage inside the project", async t => {
  const { projectRoot, task } = await createFixture(t);
  const unsafe = createIsolatedWorkspaceAdapter({
    projectRoot,
    workspaceRoot: path.join(projectRoot, "temporary-workspaces"),
    allowedPaths: ["development/engine"]
  });
  await assert.rejects(
    unsafe.createWorkspace({ taskId: task.id, task, allowedPaths: [...task.relatedFiles] }),
    /outside the project directory/
  );
});

test("Workspace adapter returns exact task targets in workspace information", async t => {
  const { adapter, task, createWorkspace } = await createFixture(t);
  const workspace = await createWorkspace();
  const info = await adapter.getWorkspaceInfo(workspace.workspaceId);
  assert.equal(info.workspaceId, workspace.workspaceId);
  assert.equal(info.taskId, task.id);
  assert.equal(info.isolated, true);
  assert.deepEqual(info.allowedPaths, task.relatedFiles);
  const globalPaths = adapter.getAllowedPaths();
  globalPaths.push("src");
  assert.deepEqual(adapter.getAllowedPaths(), ["development/engine"]);
  await adapter.destroyWorkspace(workspace.workspaceId);
});

test("Workspace adapter destroys temporary workspaces", async t => {
  const { adapter, createWorkspace } = await createFixture(t);
  const workspace = await createWorkspace();
  const result = await adapter.destroyWorkspace({ workspaceId: workspace.workspaceId });
  assert.equal(result.destroyed, true);
  await assert.rejects(fs.access(workspace.directory));
  await assert.rejects(adapter.getWorkspaceInfo(workspace.workspaceId), /Workspace not found/);
});

test("Workspace adapter requires a task ID and matching canonical contract", async t => {
  const { adapter, task } = await createFixture(t);
  await assert.rejects(() => adapter.createWorkspace(), /taskId is required/);
  await assert.rejects(
    () => adapter.createWorkspace({
      taskId: task.id,
      task: { ...task, contractVersion: "0.0.0" },
      allowedPaths: [...task.relatedFiles]
    }),
    /contract is missing or has changed/
  );
});

test("Workspace adapter prepares a bounded proposal, measures it, and runs only an injected test runner", async t => {
  const { projectRoot, workspaceRoot, task } = await createFixture(t);
  const adapter = createIsolatedWorkspaceAdapter({
    projectRoot,
    workspaceRoot,
    allowedPaths: ["development/engine"],
    proposalProvider: async ({ task: providedTask, listFiles, readFile }) => {
      assert.equal(providedTask.id, task.id);
      assert.deepEqual(await listFiles(), task.relatedFiles);
      assert.equal(await readFile("development/engine/sample.js"), "export const value = 1;\n");
      return {
        summary: "Isolated proposal",
        risk: "low",
        files: [{
          path: "development/engine/sample.js",
          content: "export const value = 42;\n"
        }],
        notes: ["No dependencies or runtime lights added."]
      };
    },
    testRunner: async ({ changedFiles }) => ({
      passed: true,
      total: changedFiles.length,
      failed: 0
    })
  });

  const workspace = await adapter.createWorkspace({
    taskId: task.id,
    task,
    allowedPaths: [...task.relatedFiles]
  });
  const proposal = await adapter.prepareChanges({ workspaceId: workspace.workspaceId, task });
  assert.deepEqual(proposal.changedFiles, ["development/engine/sample.js"]);
  assert.equal(proposal.metrics.changedFiles, 1);
  assert.equal(proposal.metrics.newDependencies, 0);
  assert.equal(proposal.metrics.addedRuntimeLights, 0);
  assert.equal(proposal.metrics.maxTextureDimension, 0);
  assert.equal(proposal.metrics.maxAddedFrameLoopWorkMs, 0);
  assert.equal(proposal.changes.summary, "Isolated proposal");
  assert.match(proposal.changes.diff, /export const value = 42/);

  const original = await fs.readFile(path.join(projectRoot, "development", "engine", "sample.js"), "utf8");
  const isolated = await adapter.readFile({ workspaceId: workspace.workspaceId, filePath: "development/engine/sample.js" });
  assert.equal(original, "export const value = 1;\n");
  assert.equal(isolated, "export const value = 42;\n");

  const tests = await adapter.runTests({ workspaceId: workspace.workspaceId, task });
  assert.equal(tests.passed, true);
  assert.equal(tests.isolatedWorkspace, true);
  assert.equal(tests.executionAdapter, "injected-test-runner");
  await adapter.destroyWorkspace(workspace.workspaceId);
});

test("Workspace adapter refuses provider output outside exact task targets", async t => {
  const { projectRoot, workspaceRoot, task } = await createFixture(t);
  const adapter = createIsolatedWorkspaceAdapter({
    projectRoot,
    workspaceRoot,
    allowedPaths: ["development/engine"],
    proposalProvider: async () => ({
      files: [{ path: "src/live.js", content: "not allowed" }]
    }),
    testRunner: async () => ({ passed: true })
  });
  const workspace = await adapter.createWorkspace({
    taskId: task.id,
    task,
    allowedPaths: [...task.relatedFiles]
  });
  await assert.rejects(
    adapter.prepareChanges({ workspaceId: workspace.workspaceId, task }),
    /outside exact task targets/
  );
  await adapter.destroyWorkspace(workspace.workspaceId);
});

test("Workspace adapter refuses to execute generated code without a trusted test runner", async t => {
  const { adapter, task, createWorkspace } = await createFixture(t);
  const workspace = await createWorkspace();
  await assert.rejects(
    adapter.runTests({ workspaceId: workspace.workspaceId, task }),
    /No trusted sandboxed testRunner is configured/
  );
  await adapter.destroyWorkspace(workspace.workspaceId);
});

test("Workspace adapter reports missing profiler evidence when texture or frame-loop code changes", async t => {
  const { projectRoot, workspaceRoot, task } = await createFixture(t);
  const adapter = createIsolatedWorkspaceAdapter({
    projectRoot,
    workspaceRoot,
    allowedPaths: ["development/engine"],
    proposalProvider: async () => ({
      files: [{
        path: "development/engine/sample.js",
        content: "export const texture = new THREE.TextureLoader();\nrenderer.setAnimationLoop(() => {});\n"
      }]
    })
  });
  const workspace = await adapter.createWorkspace({
    taskId: task.id,
    task,
    allowedPaths: [...task.relatedFiles]
  });
  const proposal = await adapter.prepareChanges({ workspaceId: workspace.workspaceId, task });
  assert.equal(proposal.metrics.textureTouched, true);
  assert.equal(proposal.metrics.frameLoopTouched, true);
  assert.equal(proposal.metrics.maxTextureDimension, null);
  assert.equal(proposal.metrics.maxAddedFrameLoopWorkMs, null);
  await adapter.destroyWorkspace(workspace.workspaceId);
});

test("Workspace adapter accepts independently measured profiler evidence", async t => {
  const { projectRoot, workspaceRoot, task } = await createFixture(t);
  const adapter = createIsolatedWorkspaceAdapter({
    projectRoot,
    workspaceRoot,
    allowedPaths: ["development/engine"],
    proposalProvider: async () => ({
      files: [{
        path: "development/engine/sample.js",
        content: "export const texture = new THREE.TextureLoader();\nrenderer.setAnimationLoop(() => {});\n"
      }]
    }),
    resourceProfiler: async () => ({
      maxTextureDimension: 1024,
      maxAddedFrameLoopWorkMs: 0.02
    })
  });
  const workspace = await adapter.createWorkspace({
    taskId: task.id,
    task,
    allowedPaths: [...task.relatedFiles]
  });
  const proposal = await adapter.prepareChanges({ workspaceId: workspace.workspaceId, task });
  assert.equal(proposal.metrics.maxTextureDimension, 1024);
  assert.equal(proposal.metrics.maxAddedFrameLoopWorkMs, 0.02);
  await adapter.destroyWorkspace(workspace.workspaceId);
});
