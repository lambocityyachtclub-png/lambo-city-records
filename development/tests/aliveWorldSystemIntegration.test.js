import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createDevelopmentSystem } from "../engine/developmentSystem.js";
import { createDevelopmentReviewStorage } from "../storage/developmentReviewStorage.js";
import { TASK_STATUS } from "../engine/developmentDirector.js";

async function setupSystem() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "alive-world-system-"));
  const reviewStore = createDevelopmentReviewStorage({ storageDirectory: directory });
  const system = await createDevelopmentSystem({
    worldExecution: {
      allowedPaths: ["development/example"],
      workspaceAdapter: {
        async createWorkspace() { return { workspaceId: "isolated-world-workspace" }; },
        async prepareChanges() {
          return {
            changedFiles: ["development/example/world-detail.js"],
            changes: "Prepared a bounded World proposal."
          };
        },
        async runTests() { return { passed: true, total: 3, failed: 0 }; },
        async destroyWorkspace() { return { destroyed: true }; }
      },
      reviewStore
    },
    workerRunnerIds: ["world"],
    workerId: "test-world-worker",
    maxTasksPerRun: 1,
    workerEnabled: true
  });
  return { directory, reviewStore, system };
}

test("mainline ALIVE World specialist executes one bounded task and queues owner review", async () => {
  const { directory, system } = await setupSystem();
  try {
    const submitted = await system.submitWorldFinding({
      title: "Improve marina reflections",
      description: "Improve reflections while preserving approved marina geography and camera paths.",
      area: "water",
      acceptanceCriteria: ["Preserve approved positions.", "Keep navigation unchanged."]
    });
    assert.equal(submitted.task.status, TASK_STATUS.QUEUED);
    const result = await system.executeNextWorldTask();
    assert.equal(result.executed, true);
    assert.equal(result.status, TASK_STATUS.REVIEW);
    assert.equal(result.productionChangesMade, false);
    assert.deepEqual(result.changedFiles, ["development/example/world-detail.js"]);
    assert.equal(system.director.getTask(submitted.task.id).status, TASK_STATUS.REVIEW);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("mainline ALIVE owner PERFECT records approval without publishing code", async () => {
  const { directory, system } = await setupSystem();
  try {
    const submitted = await system.submitWorldFinding({
      title: "Improve boardwalk atmosphere",
      description: "Improve lighting and detail without moving approved geometry.",
      area: "lighting"
    });
    const execution = await system.executeNextWorldTask();
    const result = await system.markWorldReviewPerfect({
      taskId: submitted.task.id,
      reviewId: execution.review.id,
      ownerNote: "PERFECT — preserve this approved quality."
    });
    assert.equal(result.feedback, "perfect");
    assert.equal(result.task.status, TASK_STATUS.COMPLETED);
    assert.equal(result.review.status, "approved");
    assert.equal(result.productionChangesMade, false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("mainline ALIVE owner CHANGE records revision notes and safely requeues the task", async () => {
  const { directory, system } = await setupSystem();
  try {
    const submitted = await system.submitWorldFinding({
      title: "Improve waterfront water",
      description: "Improve reflections while preserving the approved marina layout.",
      area: "water"
    });
    const execution = await system.executeNextWorldTask();
    const result = await system.requestWorldReviewChanges({
      taskId: submitted.task.id,
      reviewId: execution.review.id,
      ownerNote: "CHANGE — lower reflection intensity and preserve the horizon."
    });
    assert.equal(result.feedback, "change");
    assert.equal(result.task.status, TASK_STATUS.QUEUED);
    assert.equal(result.review.status, "revision_requested");
    assert.equal(result.productionChangesMade, false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("mainline ALIVE never executes tasks without explicitly configured adapters", async () => {
  const system = await createDevelopmentSystem();
  assert.equal(system.getSnapshot().worldExecutor.enabled, false);
  await assert.rejects(
    system.executeNextWorldTask(),
    /World execution is not configured/
  );
});
