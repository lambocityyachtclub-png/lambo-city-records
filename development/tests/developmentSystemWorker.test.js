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
