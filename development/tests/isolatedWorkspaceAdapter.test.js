
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  createIsolatedWorkspaceAdapter
} from "../execution/isolatedWorkspaceAdapter.js";

async function createFixture(t) {
  const root = await fs.mkdtemp(
    path.join(os.tmpdir(), "lambo-workspace-test-")
  );

  const projectRoot = path.join(root, "project");
  const workspaceRoot = path.join(root, "workspaces");

  await fs.mkdir(
    path.join(projectRoot, "development", "example"),
    { recursive: true }
  );

  await fs.mkdir(
    path.join(projectRoot, "src"),
    { recursive: true }
  );

  await fs.writeFile(
    path.join(projectRoot, "development", "example", "sample.js"),
    "export const value = 1;\n"
  );

  await fs.writeFile(
    path.join(projectRoot, "src", "live.js"),
    "This is part of the original project.\n"
  );

  const adapter = createIsolatedWorkspaceAdapter({
    projectRoot,
    workspaceRoot,
    allowedPaths: ["development"]
  });

  t.after(async () => {
    await fs.rm(root, {
      recursive: true,
      force: true
    });
  });

  return {
    root,
    projectRoot,
    workspaceRoot,
    adapter
  };
}

test("Workspace adapter requires a project root", () => {
  assert.throws(
    () => createIsolatedWorkspaceAdapter({
      allowedPaths: ["development"]
    }),
    /projectRoot directory is required/
  );
});

test("Workspace adapter requires explicit allowed paths", () => {
  assert.throws(
    () => createIsolatedWorkspaceAdapter({
      projectRoot: "/tmp/example"
    }),
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

test("Workspace adapter rejects blocked directories in allowed paths", () => {
  assert.throws(
    () => createIsolatedWorkspaceAdapter({
      projectRoot: "/tmp/example",
      allowedPaths: ["node_modules"]
    }),
    /Unsafe workspace path/
  );
});

test("Workspace adapter creates a separate copy of allowed files", async t => {
  const {
    projectRoot,
    adapter
  } = await createFixture(t);

  const workspace = await adapter.createWorkspace({
    taskId: "task-copy-test"
  });

  assert.equal(workspace.isolated, true);
  assert.equal(workspace.taskId, "task-copy-test");
  assert.notEqual(workspace.directory, projectRoot);

  const copiedFile = await adapter.readFile({
    workspaceId: workspace.workspaceId,
    filePath: "development/example/sample.js"
  });

  assert.equal(
    copiedFile,
    "export const value = 1;\n"
  );

  await adapter.destroyWorkspace(workspace.workspaceId);
});

test("Workspace adapter does not copy files outside the allowlist", async t => {
  const {
    adapter
  } = await createFixture(t);

  const workspace = await adapter.createWorkspace({
    taskId: "task-allowlist-test"
  });

  await assert.rejects(
    adapter.readFile({
      workspaceId: workspace.workspaceId,
      filePath: "src/live.js"
    }),
    /outside the workspace allowlist/
  );

  await adapter.destroyWorkspace(workspace.workspaceId);
});

test("Workspace adapter writes changes only to the isolated copy", async t => {
  const {
    projectRoot,
    adapter
  } = await createFixture(t);

  const workspace = await adapter.createWorkspace({
    taskId: "task-write-test"
  });

  await adapter.writeFile({
    workspaceId: workspace.workspaceId,
    filePath: "development/example/sample.js",
    content: "export const value = 2;\n"
  });

  const workspaceContent = await adapter.readFile({
    workspaceId: workspace.workspaceId,
    filePath: "development/example/sample.js"
  });

  const originalContent = await fs.readFile(
    path.join(
      projectRoot,
      "development",
      "example",
      "sample.js"
    ),
    "utf8"
  );

  assert.equal(
    workspaceContent,
    "export const value = 2;\n"
  );

  assert.equal(
    originalContent,
    "export const value = 1;\n"
  );

  await adapter.destroyWorkspace(workspace.workspaceId);
});

test("Workspace adapter detects modified and added files", async t => {
  const {
    adapter
  } = await createFixture(t);

  const workspace = await adapter.createWorkspace({
    taskId: "task-change-test"
  });

  await adapter.writeFile({
    workspaceId: workspace.workspaceId,
    filePath: "development/example/sample.js",
    content: "export const value = 3;\n"
  });

  await adapter.writeFile({
    workspaceId: workspace.workspaceId,
    filePath: "development/example/new-file.js",
    content: "export const added = true;\n"
  });

  const changedFiles = await adapter.listChangedFiles({
    workspaceId: workspace.workspaceId
  });

  assert.deepEqual(
    changedFiles,
    [
      "development/example/new-file.js",
      "development/example/sample.js"
    ]
  );

  await adapter.destroyWorkspace(workspace.workspaceId);
});

test("Workspace adapter detects deleted files", async t => {
  const {
    adapter
  } = await createFixture(t);

  const workspace = await adapter.createWorkspace({
    taskId: "task-delete-test"
  });

  await fs.rm(
    path.join(
      workspace.directory,
      "development",
      "example",
      "sample.js"
    )
  );

  const changedFiles = await adapter.listChangedFiles({
    workspaceId: workspace.workspaceId
  });

  assert.deepEqual(
    changedFiles,
    ["development/example/sample.js"]
  );

  await adapter.destroyWorkspace(workspace.workspaceId);
});

test("Workspace adapter rejects directory traversal", async t => {
  const {
    adapter
  } = await createFixture(t);

  const workspace = await adapter.createWorkspace({
    taskId: "task-traversal-test"
  });

  await assert.rejects(
    adapter.readFile({
      workspaceId: workspace.workspaceId,
      filePath: "development/../src/live.js"
    }),
    /Unsafe workspace path/
  );

  await adapter.destroyWorkspace(workspace.workspaceId);
});

test("Workspace adapter rejects writes outside allowed paths", async t => {
  const {
    adapter
  } = await createFixture(t);

  const workspace = await adapter.createWorkspace({
    taskId: "task-write-boundary-test"
  });

  await assert.rejects(
    adapter.writeFile({
      workspaceId: workspace.workspaceId,
      filePath: "src/live.js",
      content: "This must not be written."
    }),
    /outside the workspace allowlist/
  );

  await adapter.destroyWorkspace(workspace.workspaceId);
});

test("Workspace adapter rejects symbolic links in source files", async t => {
  const {
    projectRoot,
    adapter
  } = await createFixture(t);

  const outsideFile = path.join(
    projectRoot,
    "outside-secret.txt"
  );

  await fs.writeFile(outsideFile, "outside data");

  await fs.symlink(
    outsideFile,
    path.join(
      projectRoot,
      "development",
      "example",
      "linked-file.txt"
    )
  );

  await assert.rejects(
    () => adapter.createWorkspace({
      taskId: "task-symlink"
    }),
    /symbolic links are not allowed/i
  );
});
test("Workspace adapter rejects workspace storage inside the project", async t => {
  const {
    projectRoot
  } = await createFixture(t);

  const unsafeAdapter = createIsolatedWorkspaceAdapter({
    projectRoot,
    workspaceRoot: path.join(projectRoot, "temporary-workspaces"),
    allowedPaths: ["development"]
  });

  await assert.rejects(
    unsafeAdapter.createWorkspace({
      taskId: "task-inside-project-test"
    }),
    /outside the project directory/
  );
});

test("Workspace adapter returns workspace information and allowed paths safely", async t => {
  const {
    adapter
  } = await createFixture(t);

  const workspace = await adapter.createWorkspace({
    taskId: "task-info-test"
  });

  const info = await adapter.getWorkspaceInfo(
    workspace.workspaceId
  );

  assert.equal(info.workspaceId, workspace.workspaceId);
  assert.equal(info.taskId, "task-info-test");
  assert.equal(info.isolated, true);
  assert.deepEqual(info.allowedPaths, ["development"]);

  const allowedPaths = adapter.getAllowedPaths();

  allowedPaths.push("src");

  assert.deepEqual(
    adapter.getAllowedPaths(),
    ["development"]
  );

  await adapter.destroyWorkspace(workspace.workspaceId);
});

test("Workspace adapter destroys temporary workspaces", async t => {
  const {
    adapter
  } = await createFixture(t);

  const workspace = await adapter.createWorkspace({
    taskId: "task-cleanup-test"
  });

  const result = await adapter.destroyWorkspace(
    workspace.workspaceId
  );

  assert.equal(result.destroyed, true);

  await assert.rejects(
    fs.access(workspace.directory)
  );

  await assert.rejects(
    adapter.getWorkspaceInfo(workspace.workspaceId),
    /Workspace not found/
  );
});

test("Workspace adapter requires a task ID", async t => {
  const {
    adapter
  } = await createFixture(t);

  await assert.rejects(
    adapter.createWorkspace(),
    /taskId is required/
  );
});


test("Workspace adapter applies provider proposals only inside the isolated copy", async t => {
  const calls = [];
  const {
    projectRoot,
    adapter: baseAdapter
  } = await createFixture(t);

  const adapter = createIsolatedWorkspaceAdapter({
    projectRoot,
    workspaceRoot: path.join(path.dirname(projectRoot), "provider-workspaces"),
    allowedPaths: ["development"],
    proposalProvider: async input => {
      calls.push(input.workspace.workspaceId);
      return {
        summary: "Improve isolated test fixture.",
        files: [{
          path: "development/example/sample.js",
          content: "export const value = 99;\n"
        }]
      };
    },
    testRunner: async input => ({
      passed: true,
      total: 1,
      failed: 0,
      testedFiles: input.changedFiles
    })
  });

  const workspace = await adapter.createWorkspace({
    taskId: "task-proposal-adapter"
  });

  const proposal = await adapter.prepareChanges({
    workspaceId: workspace.workspaceId,
    task: { id: "task-proposal-adapter" }
  });

  assert.deepEqual(proposal.changedFiles, [
    "development/example/sample.js"
  ]);
  assert.equal(proposal.changes.summary, "Improve isolated test fixture.");
  assert.deepEqual(calls, [workspace.workspaceId]);

  const original = await fs.readFile(
    path.join(projectRoot, "development", "example", "sample.js"),
    "utf8"
  );
  const isolated = await adapter.readFile({
    workspaceId: workspace.workspaceId,
    filePath: "development/example/sample.js"
  });

  assert.equal(original, "export const value = 1;\n");
  assert.equal(isolated, "export const value = 99;\n");

  const testResults = await adapter.runTests({
    workspaceId: workspace.workspaceId,
    task: { id: "task-proposal-adapter" }
  });

  assert.equal(testResults.passed, true);
  assert.equal(testResults.isolatedWorkspace, true);
  assert.equal(testResults.executionAdapter, "injected-test-runner");

  await adapter.destroyWorkspace(workspace.workspaceId);
  await baseAdapter.getAllowedPaths();
});

test("Workspace adapter refuses to prepare changes without a proposal provider", async t => {
  const { adapter } = await createFixture(t);
  const workspace = await adapter.createWorkspace({
    taskId: "task-missing-provider"
  });

  await assert.rejects(
    adapter.prepareChanges({ workspaceId: workspace.workspaceId }),
    /No trusted proposalProvider is configured/
  );

  await adapter.destroyWorkspace(workspace.workspaceId);
});

test("Workspace adapter refuses to run code without a trusted test runner", async t => {
  const { adapter } = await createFixture(t);
  const workspace = await adapter.createWorkspace({
    taskId: "task-missing-test-runner"
  });

  await assert.rejects(
    adapter.runTests({ workspaceId: workspace.workspaceId }),
    /No trusted sandboxed testRunner is configured/
  );

  await adapter.destroyWorkspace(workspace.workspaceId);
});

test("Workspace adapter rejects proposals outside the allowlist", async t => {
  const { projectRoot } = await createFixture(t);
  const adapter = createIsolatedWorkspaceAdapter({
    projectRoot,
    allowedPaths: ["development"],
    proposalProvider: async () => ({
      files: [{
        path: "src/main.js",
        content: "must not be written"
      }]
    }),
    testRunner: async () => ({ passed: true })
  });
  const workspace = await adapter.createWorkspace({
    taskId: "task-proposal-outside-allowlist"
  });

  await assert.rejects(
    adapter.prepareChanges({ workspaceId: workspace.workspaceId }),
    /outside the workspace allowlist/
  );

  await adapter.destroyWorkspace(workspace.workspaceId);
});
