import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

import { createLocalGitWorkspaceAdapter } from "../execution/localGitWorkspaceAdapter.js";
import { createLocalJsonReviewStore } from "../execution/localJsonReviewStore.js";
import { createLocalApprovedReviewPublisher } from "../execution/localApprovedReviewPublisher.js";
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


test("Local review store requires an explicit owner decision and only approves passing complete proposals", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "alive-review-decision-test-"));
  try {
    const store = createLocalJsonReviewStore({ directory });
    const incomplete = await store.createReview({
      taskId: "task-review-incomplete",
      testResults: { passed: true },
      changes: { fileChanges: [] }
    });
    await assert.rejects(
      () => store.approveReview(incomplete.id, { decidedBy: "owner-1" }),
      /complete proposed file contents/
    );
    assert.equal((await store.getReview(incomplete.id)).status, "awaiting_owner_review");

    const failed = await store.createReview({
      taskId: "task-review-failed",
      testResults: { passed: false },
      changes: { fileChanges: [{ path: "development/example/a.js", content: "x" }] }
    });
    await assert.rejects(
      () => store.approveReview(failed.id, { decidedBy: "owner-1" }),
      /tests passed/
    );

    const ready = await store.createReview({
      taskId: "task-review-ready",
      testResults: { passed: true },
      changes: { fileChanges: [{ path: "development/example/a.js", content: "export const a = true;" }] }
    });
    await assert.rejects(
      () => store.approveReview(ready.id, {}),
      /verified owner identity/
    );
    const approved = await store.approveReview(ready.id, { decidedBy: "verified-owner-session" });
    assert.equal(approved.status, "approved");
    assert.equal(approved.decision.status, "approved");
    assert.equal(approved.decision.decidedBy, "verified-owner-session");
    assert.ok(approved.decision.decidedAt);
    assert.equal(approved.productionChangesMade, false);
    await assert.rejects(
      () => store.rejectReview(ready.id, { decidedBy: "verified-owner-session", reason: "Changed my mind" }),
      /Only reviews awaiting owner review/
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("Local review store records explicit rejection and requires a reason", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "alive-review-rejection-test-"));
  try {
    const store = createLocalJsonReviewStore({ directory });
    const review = await store.createReview({ taskId: "task-review-reject" });
    await assert.rejects(
      () => store.rejectReview(review.id, { decidedBy: "verified-owner-session" }),
      /reason is required/
    );
    const rejected = await store.rejectReview(review.id, {
      decidedBy: "verified-owner-session",
      reason: "The proposal does not preserve the approved layout."
    });
    assert.equal(rejected.status, "rejected");
    assert.equal(rejected.decision.reason, "The proposal does not preserve the approved layout.");
    assert.equal(rejected.productionChangesMade, false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});


test("Approved review publisher creates a local branch and commit after fresh passing tests", async () => {
  const root = await createGitFixture();
  const reviewsDirectory = await mkdtemp(path.join(os.tmpdir(), "alive-approved-publish-review-"));
  try {
    const store = createLocalJsonReviewStore({ directory: reviewsDirectory });
    const review = await store.createReview({
      taskId: "task-approved-publish",
      testResults: { passed: true },
      changes: {
        fileChanges: [{
          path: "development/example/approved.js",
          content: "export const ownerApproved = true;\n"
        }]
      }
    });
    const approved = await store.approveReview(review.id, { decidedBy: "verified-owner-session" });
    const publisher = createLocalApprovedReviewPublisher({
      repositoryRoot: root,
      baseRef: "HEAD",
      allowedPaths: ["development/example"],
      testCommands: [{ command: "node", args: ["--version"] }]
    });
    const result = await publisher.publishApprovedReview({
      reviewStore: store,
      reviewId: approved.id,
      branchName: "alive/test-approved-publish"
    });
    assert.equal(result.published, true);
    assert.equal(result.branch, "alive/test-approved-publish");
    assert.ok(result.commitSha);
    assert.equal(result.testResults.passed, true);
    assert.equal(result.ownerDecision.decidedBy, "verified-owner-session");
    assert.equal(result.productionChangesMade, false);
    assert.equal(result.pushed, false);
    assert.equal(result.merged, false);
    assert.equal(result.deployed, false);

    const { stdout: branchSha } = await execFile("git", ["-C", root, "rev-parse", "alive/test-approved-publish"]);
    assert.equal(branchSha.trim(), result.commitSha);
    const { stdout: baseContent } = await execFile("git", ["-C", root, "show", "HEAD:development/example/base.js"]);
    assert.equal(baseContent, "export const base = true;\n");
    const { stdout: publishedContent } = await execFile("git", ["-C", root, "show", "alive/test-approved-publish:development/example/approved.js"]);
    assert.equal(publishedContent, "export const ownerApproved = true;\n");
    const { stdout: status } = await execFile("git", ["-C", root, "status", "--porcelain"]);
    assert.equal(status.trim(), "");
    assert.equal((await store.getReview(review.id)).status, "approved");
    assert.equal(publisher.getConfiguration().localBranchOnly, true);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(reviewsDirectory, { recursive: true, force: true });
  }
});

test("Approved review publisher rejects pending reviews and never creates a branch", async () => {
  const root = await createGitFixture();
  const reviewsDirectory = await mkdtemp(path.join(os.tmpdir(), "alive-approved-pending-review-"));
  try {
    const store = createLocalJsonReviewStore({ directory: reviewsDirectory });
    const review = await store.createReview({ taskId: "task-still-pending" });
    const publisher = createLocalApprovedReviewPublisher({
      repositoryRoot: root,
      allowedPaths: ["development/example"],
      testCommands: [{ command: "node", args: ["--version"] }]
    });
    await assert.rejects(
      () => publisher.publishApprovedReview({
        reviewStore: store,
        reviewId: review.id,
        branchName: "alive/test-pending-must-not-publish"
      }),
      /Only a recorded owner-approved review/
    );
    await assert.rejects(
      () => execFile("git", ["-C", root, "rev-parse", "--verify", "refs/heads/alive/test-pending-must-not-publish"])
    );
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(reviewsDirectory, { recursive: true, force: true });
  }
});

test("Approved review publisher deletes the uncommitted branch when fresh verification fails", async () => {
  const root = await createGitFixture();
  const reviewsDirectory = await mkdtemp(path.join(os.tmpdir(), "alive-approved-failed-review-"));
  try {
    const store = createLocalJsonReviewStore({ directory: reviewsDirectory });
    const review = await store.createReview({
      taskId: "task-failed-fresh-test",
      testResults: { passed: true },
      changes: { fileChanges: [{ path: "development/example/fail.js", content: "export const fail = true;" }] }
    });
    await store.approveReview(review.id, { decidedBy: "verified-owner-session" });
    const publisher = createLocalApprovedReviewPublisher({
      repositoryRoot: root,
      allowedPaths: ["development/example"],
      testCommands: [{ command: "node", args: ["-e", "process.exit(9)"] }]
    });
    const result = await publisher.publishApprovedReview({
      reviewStore: store,
      reviewId: review.id,
      branchName: "alive/test-failed-verification"
    });
    assert.equal(result.published, false);
    assert.match(result.reason, /Fresh verification failed/);
    await assert.rejects(
      () => execFile("git", ["-C", root, "rev-parse", "--verify", "refs/heads/alive/test-failed-verification"])
    );
    const { stdout: status } = await execFile("git", ["-C", root, "status", "--porcelain"]);
    assert.equal(status.trim(), "");
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(reviewsDirectory, { recursive: true, force: true });
  }
});


test("Development System exposes owner approval and controlled local branch publishing", async () => {
  const root = await createGitFixture();
  const reviewsDirectory = await mkdtemp(path.join(os.tmpdir(), "alive-system-publisher-reviews-"));
  try {
    const system = await createDevelopmentSystem({
      localExecutionOptions: {
        repositoryRoot: root,
        baseRef: "HEAD",
        allowedPaths: ["development/example"],
        reviewDirectory: reviewsDirectory,
        proposalProvider: async () => ({
          summary: "System-level approved proposal",
          fileChanges: [{
            path: "development/example/system-approved.js",
            content: "export const systemApproved = true;\\n"
          }]
        }),
        testCommands: [{ command: "node", args: ["--version"] }]
      },
      approvedReviewPublisherOptions: {
        repositoryRoot: root,
        baseRef: "HEAD",
        allowedPaths: ["development/example"],
        testCommands: [{ command: "node", args: ["--version"] }]
      }
    });
    const submitted = await system.submitWorldFinding({
      title: "System owner publishing test",
      description: "Verify review approval and isolated branch publishing.",
      area: "water"
    });
    const execution = await system.executeNextWorldTask();
    assert.equal(execution.status, "review");
    const approved = await system.approveReview({
      reviewId: execution.review.id,
      decidedBy: "verified-owner-session"
    });
    assert.equal(approved.status, "approved");
    const published = await system.publishApprovedReview({
      reviewId: approved.id,
      branchName: "alive/test-system-owner-publish"
    });
    assert.equal(published.published, true);
    assert.equal(published.productionChangesMade, false);
    assert.equal(system.getSnapshot().approvedReviewPublisher.mode, "local_branch_only");
    const { stdout: branchContent } = await execFile("git", ["-C", root, "show", "alive/test-system-owner-publish:development/example/system-approved.js"]);
    assert.equal(branchContent, "export const systemApproved = true;\\n");
    assert.equal(system.director.getTask(submitted.task.id).status, "review");
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(reviewsDirectory, { recursive: true, force: true });
  }
});
