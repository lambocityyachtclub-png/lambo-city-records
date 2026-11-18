import test from "node:test";
import assert from "node:assert/strict";
import {
  createDevelopmentSystem
} from "../engine/developmentSystem.js";
import {
  STUDIO_RUNNER_ID
} from "../runners/studio/studioDevelopmentRunner.js";
import {
  TASK_STATUS
} from "../engine/developmentDirector.js";

test("development system leaves an injected worker disabled by default", async () => {
  let calls = 0;
  const system = await createDevelopmentSystem({
    workerExecutor: {
      async executeNextTask() {
        calls++;
        return { executed: true };
      }
    }
  });

  const result = await system.runWorkerOnce();
  assert.equal(result.started, false);
  assert.equal(calls, 0);
  assert.equal(system.getSnapshot().worker.enabled, false);
});

test("development system runs a bounded worker only when explicitly enabled", async () => {
  let system;
  const executor = {
    async executeNextTask({ runnerId, workerId }) {
      const task = await system.director.claimNextTask(runnerId, workerId);
      if (!task) return { executed: false, reason: "No queued task." };
      await system.director.updateTask(task.id, {
        status: TASK_STATUS.REVIEW,
        result: { status: "awaiting_owner_review" }
      });
      return {
        executed: true,
        status: TASK_STATUS.REVIEW,
        taskId: task.id,
        productionChangesMade: false
      };
    }
  };

  system = await createDevelopmentSystem({
    workerExecutor: executor,
    workerRunnerIds: [STUDIO_RUNNER_ID],
    maxTasksPerRun: 2,
    workerEnabled: true
  });

  await system.director.createTask({
    title: "Verify bounded worker integration",
    area: "development-system",
    runner: STUDIO_RUNNER_ID,
    description: "Exercise the explicitly injected one-shot worker."
  });

  const result = await system.runWorkerOnce();
  assert.equal(result.started, true);
  assert.equal(result.processed, 1);
  assert.equal(result.results[0].status, TASK_STATUS.REVIEW);

  system.disable();
  const disabledResult = await system.runWorkerOnce();
  assert.equal(disabledResult.started, false);

  system.enable();
  assert.equal(system.getSnapshot().worker.enabled, true);
});


test("development system composes the controlled executor from explicit adapters", async () => {
  const reviews = [];
  let destroyed = 0;
  const workspaceAdapter = {
    async createWorkspace() {
      return { workspaceId: "system-integration-workspace" };
    },
    async prepareChanges() {
      return {
        changedFiles: ["development/safe/worker-output.js"],
        changes: { summary: "A tested isolated proposal." }
      };
    },
    async runTests() {
      return { passed: true, total: 1, failed: 0 };
    },
    async destroyWorkspace() {
      destroyed++;
    }
  };
  const reviewStore = {
    async createReview(review) {
      const saved = { id: "review-system-integration", ...review };
      reviews.push(saved);
      return saved;
    }
  };

  const system = await createDevelopmentSystem({
    workspaceAdapter,
    reviewStore,
    allowedPaths: ["development/safe"],
    workerRunnerIds: [STUDIO_RUNNER_ID],
    workerEnabled: true,
    maxTasksPerRun: 1
  });

  await system.director.createTask({
    title: "Run through the controlled execution path",
    area: "development-system",
    runner: STUDIO_RUNNER_ID
  });

  const result = await system.runWorkerOnce();
  assert.equal(result.processed, 1);
  assert.equal(result.results[0].status, TASK_STATUS.REVIEW);
  assert.equal(result.results[0].productionChangesMade, false);
  assert.equal(reviews.length, 1);
  assert.equal(reviews[0].status, "awaiting_owner_review");
  assert.equal(destroyed, 1);
  assert.equal(system.getSnapshot().worker.enabled, true);
});

test("development system rejects partially configured controlled execution", async () => {
  await assert.rejects(
    () => createDevelopmentSystem({
      workspaceAdapter: {
        createWorkspace() {},
        prepareChanges() {},
        runTests() {}
      }
    }),
    /requires workspaceAdapter, reviewStore, and a non-empty allowedPaths/
  );
});
