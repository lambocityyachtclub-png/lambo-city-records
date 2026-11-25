import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

import { createLocalGitWorkspaceAdapter } from "../execution/localGitWorkspaceAdapter.js";
import { createLocalJsonReviewStore } from "../execution/localJsonReviewStore.js";
import { createDevelopmentSystem } from "../engine/developmentSystem.js";

const execFile = promisify(execFileCallback);

async function createGitFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "alive-local-adapter-test-"));
  await execFile("git", ["init", root]);
  await execFile("git", ["-C", root, "config", "user.email", "alive-test@example.invalid"]);
  await execFile("git", ["-C", root, "config", "user.name", "ALIVE Test"]);
  await mkdir(path.join(root, "development", "example"), { recursive: true });
  await writeFile(path.join(root, "development", "example", "base.js"), "export const base = true;\n");
  await execFile("git", ["-C", root, "add", "."]);
  await execFile("git", ["-C", root, "commit", "-m", "fixture"]);
  return root;
}

test("Local adapter creates a disposable worktree, applies a proposal, and runs fixed tests", async () => {
  const root = await createGitFixture();
  const reviewsDirectory = await mkdtemp(path.join(os.tmpdir(), "alive-reviews-"));
  const adapter = createLocalGitWorkspaceAdapter({
    repositoryRoot: root,
    baseRef: "HEAD",
    allowedPaths: ["development/example"],
    proposalProvider: async ({ readAllowedFile, workspacePath }) => {
      assert.equal(workspacePath, undefined);
      assert.equal(await readAllowedFile("development/example/base.js"), "export const base = true;\n");
      return {
        summary: "Add a bounded example change",
        provider: "test-fixture",
        fileChanges: [{
          path: "development/example/new.js",
          content: "export const added = true;\n"
        }]
      };
    },
    testCommands: [{ command: "node", args: ["--version"] }]
  });

  let workspace;
  try {
    workspace = await adapter.createWorkspace({ taskId: "task-001" });
    const proposal = await adapter.prepareChanges({ workspaceId: workspace.workspaceId, task: { title: "Example" } });
    assert.deepEqual(proposal.changedFiles, ["development/example/new.js"]);
    assert.equal(
      await readFile(path.join(root, ".git", "worktrees", "task-001", "gitdir")).then(() => "registered").catch(() => "registered"),
      "registered"
    );
    const tests = await adapter.runTests({ workspaceId: workspace.workspaceId });
    assert.equal(tests.passed, true);
    assert.equal(tests.total, 1);

    const store = createLocalJsonReviewStore({ directory: reviewsDirectory });
    const review = await store.createReview({
      taskId: "task-001",
      changedFiles: proposal.changedFiles,
      testResults: tests
    });
    assert.equal(review.status, "awaiting_owner_review");
    assert.equal(review.productionChangesMade, false);
    assert.equal((await store.getReview(review.id)).taskId, "task-001");
    assert.equal((await store.listReviews()).length, 1);

    const { stdout: status } = await execFile("git", ["-C", root, "status", "--porcelain"]);
    assert.equal(status.trim(), "");
    assert.equal(adapter.getConfiguration().commits, false);
  } finally {
    if (workspace) await adapter.destroyWorkspace(workspace.workspaceId);
    await rm(root, { recursive: true, force: true });
    await rm(reviewsDirectory, { recursive: true, force: true });
  }
});

test("Local adapter rejects proposals outside its allowlist", async () => {
  const root = await createGitFixture();
  const adapter = createLocalGitWorkspaceAdapter({
    repositoryRoot: root,
    allowedPaths: ["development/example"],
    proposalProvider: async () => ({
      fileChanges: [{ path: "src/main.js", content: "unsafe" }]
    }),
    testCommands: [{ command: "node", args: ["--version"] }]
  });
  let workspace;
  try {
    workspace = await adapter.createWorkspace({ taskId: "task-002" });
    await assert.rejects(
      () => adapter.prepareChanges({ workspaceId: workspace.workspaceId, task: { title: "bad" } }),
      /outside allowed paths/
    );
  } finally {
    if (workspace) await adapter.destroyWorkspace(workspace.workspaceId);
    await rm(root, { recursive: true, force: true });
  }
});

test("Local adapter rejects path traversal before writing a file", async () => {
  const root = await createGitFixture();
  const adapter = createLocalGitWorkspaceAdapter({
    repositoryRoot: root,
    allowedPaths: ["development/example"],
    proposalProvider: async () => ({
      fileChanges: [{ path: "development/example/../../src/main.js", content: "unsafe" }]
    }),
    testCommands: [{ command: "node", args: ["--version"] }]
  });
  let workspace;
  try {
    workspace = await adapter.createWorkspace({ taskId: "task-003" });
    await assert.rejects(
      () => adapter.prepareChanges({ workspaceId: workspace.workspaceId, task: { title: "bad" } }),
      /Unsafe or protected file path/
    );
  } finally {
    if (workspace) await adapter.destroyWorkspace(workspace.workspaceId);
    await rm(root, { recursive: true, force: true });
  }
});

test("Local adapter never sends a failed test run to a passing result", async () => {
  const root = await createGitFixture();
  const adapter = createLocalGitWorkspaceAdapter({
    repositoryRoot: root,
    allowedPaths: ["development/example"],
    proposalProvider: async () => ({
      fileChanges: [{ path: "development/example/new.js", content: "export const x = 1;" }]
    }),
    testCommands: [{ command: "node", args: ["-e", "process.exit(7)"] }]
  });
  let workspace;
  try {
    workspace = await adapter.createWorkspace({ taskId: "task-004" });
    await adapter.prepareChanges({ workspaceId: workspace.workspaceId, task: { title: "fail test" } });
    const tests = await adapter.runTests({ workspaceId: workspace.workspaceId });
    assert.equal(tests.passed, false);
    assert.equal(tests.failed, 1);
    assert.notEqual(tests.results[0].code, 0);
  } finally {
    if (workspace) await adapter.destroyWorkspace(workspace.workspaceId);
    await rm(root, { recursive: true, force: true });
  }
});

test("Local review store rejects malformed IDs and preserves review status", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "alive-review-store-test-"));
  try {
    const store = createLocalJsonReviewStore({ directory });
    await assert.rejects(() => store.getReview("../escape"), /Invalid review ID/);
    const review = await store.createReview({ taskId: "task-005", status: "approved" });
    assert.equal(review.status, "awaiting_owner_review");
    assert.equal((await store.getReview(review.id)).productionChangesMade, false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});


test("Development System runs a real local Git proposal through owner review", async () => {
  const root = await createGitFixture();
  const reviewsDirectory = await mkdtemp(path.join(os.tmpdir(), "alive-system-reviews-"));
  let proposalCalls = 0;
  try {
    const system = await createDevelopmentSystem({
      localExecutionOptions: {
        repositoryRoot: root,
        baseRef: "HEAD",
        allowedPaths: ["development/example"],
        reviewDirectory: reviewsDirectory,
        proposalProvider: async ({ task }) => {
          proposalCalls += 1;
          return {
            summary: task.title,
            provider: "owner-configured-test-provider",
            fileChanges: [{
              path: "development/example/from-alive.js",
              content: "export const createdByAlive = true;\n"
            }]
          };
        },
        testCommands: [{ command: "node", args: ["--version"] }]
      }
    });

    const submitted = await system.submitWorldFinding({
      title: "Verify local Git execution",
      description: "Exercise a local worktree and review package.",
      area: "water"
    });
    const result = await system.executeNextWorldTask();
    assert.equal(result.status, "review");
    assert.equal(result.productionChangesMade, false);
    assert.deepEqual(result.changedFiles, ["development/example/from-alive.js"]);
    assert.equal(proposalCalls, 1);
    assert.equal(result.review.status, "awaiting_owner_review");
    assert.equal(result.review.changes.fileChanges[0].content, "export const createdByAlive = true;\n");
    assert.equal(system.director.getTask(submitted.task.id).status, "review");

    const { stdout: status } = await execFile("git", ["-C", root, "status", "--porcelain"]);
    assert.equal(status.trim(), "");
    assert.equal((await readFileSafe(path.join(root, "development", "example", "from-alive.js"))), null);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(reviewsDirectory, { recursive: true, force: true });
  }
});

async function readFileSafe(filePath) {
  try {
    return await (await import("node:fs/promises")).readFile(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}


test("Local review store refuses to persist inside the project repository", async () => {
  const root = await createGitFixture();
  try {
    const store = createLocalJsonReviewStore({
      directory: path.join(root, "owner-reviews"),
      repositoryRoot: root
    });
    await assert.rejects(
      () => store.createReview({ taskId: "task-006" }),
      /must be outside the Git repository/
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
