import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile, symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createLocalProposalQueueProvider } from "../execution/localProposalQueueProvider.js";

async function fixture(run) {
  const root = await mkdtemp(path.join(os.tmpdir(), "alive-proposal-queue-test-"));
  const repositoryRoot = path.join(root, "repo");
  const queue = path.join(root, "queue");
  await mkdir(repositoryRoot);
  await mkdir(queue);
  try {
    await run({ root, repositoryRoot, queue });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

const task = { id: "task_123", title: "Improve approved world detail" };
const context = { task, allowedPaths: ["development", "src/world"], readAllowedFile: async () => null };

test("Local proposal queue returns a complete proposal matched to the exact task ID", async () => {
  await fixture(async ({ repositoryRoot, queue }) => {
    await writeFile(path.join(queue, "task_123.json"), JSON.stringify({
      taskId: "task_123",
      summary: "Improve a scoped world module",
      fileChanges: [{ path: "src/world/detail.js", content: "export const detail = true;\n" }]
    }));
    const provider = createLocalProposalQueueProvider({ directory: queue, repositoryRoot });
    const result = await provider(context);
    assert.equal(result.provider, "local-json-proposal-queue");
    assert.equal(result.summary, "Improve a scoped world module");
    assert.deepEqual(result.fileChanges, [{ path: "src/world/detail.js", content: "export const detail = true;\n" }]);
  });
});

test("Local proposal queue fails closed when no matching task file exists", async () => {
  await fixture(async ({ repositoryRoot, queue }) => {
    const provider = createLocalProposalQueueProvider({ directory: queue, repositoryRoot });
    await assert.rejects(provider(context), /No local proposal file is queued/);
  });
});

test("Local proposal queue rejects task ID mismatch, traversal, duplicates, and paths outside allowlist", async () => {
  await fixture(async ({ repositoryRoot, queue }) => {
    const provider = createLocalProposalQueueProvider({ directory: queue, repositoryRoot });
    const file = path.join(queue, "task_123.json");
    await writeFile(file, JSON.stringify({ taskId: "task_other", fileChanges: [{ path: "src/world/a.js", content: "x" }] }));
    await assert.rejects(provider(context), /does not match/);

    await writeFile(file, JSON.stringify({ taskId: "task_123", fileChanges: [{ path: "../escape.js", content: "x" }] }));
    await assert.rejects(provider(context), /Unsafe or protected/);

    await writeFile(file, JSON.stringify({ taskId: "task_123", fileChanges: [{ path: "src/world/a.js", content: "x" }, { path: "src/world/a.js", content: "y" }] }));
    await assert.rejects(provider(context), /Duplicate proposal path/);

    await writeFile(file, JSON.stringify({ taskId: "task_123", fileChanges: [{ path: "public/index.html", content: "x" }] }));
    await assert.rejects(provider(context), /outside the configured allowlist/);
  });
});

test("Local proposal queue rejects symlink entries and proposal directories inside the repository", async () => {
  await fixture(async ({ repositoryRoot, queue }) => {
    const provider = createLocalProposalQueueProvider({ directory: queue, repositoryRoot });
    const outside = path.join(queue, "outside.json");
    await writeFile(outside, JSON.stringify({ taskId: "task_123", fileChanges: [{ path: "src/world/a.js", content: "x" }] }));
    await rm(path.join(queue, "task_123.json"), { force: true });
    await symlink(outside, path.join(queue, "task_123.json"));
    await assert.rejects(provider(context), /regular JSON file/);

    const insideQueue = path.join(repositoryRoot, "proposals");
    await mkdir(insideQueue);
    const insideProvider = createLocalProposalQueueProvider({ directory: insideQueue, repositoryRoot });
    await assert.rejects(insideProvider(context), /outside the Git repository/);
  });
});

test("Local proposal queue enforces file size and required text contents", async () => {
  await fixture(async ({ repositoryRoot, queue }) => {
    const provider = createLocalProposalQueueProvider({ directory: queue, repositoryRoot });
    await writeFile(path.join(queue, "task_123.json"), JSON.stringify({
      taskId: "task_123",
      fileChanges: [{ path: "src/world/a.js", content: "x".repeat(1024 * 1024 + 1) }]
    }));
    await assert.rejects(provider(context), /no larger than 1 MiB/);
  });
});
