import test from "node:test";
import assert from "node:assert/strict";

import {
  createDevelopmentWorker
} from "../engine/developmentWorker.js";

test("Worker processes only its authorized runner IDs", async () => {
  const calls = [];
  const worker = createDevelopmentWorker({
    executor: {
      async executeNextTask(input) {
        calls.push(input);
        return {
          executed: true,
          status: "review",
          taskId: `task-${calls.length}`,
          productionChangesMade: false
        };
      }
    },
    runnerIds: ["studio", "world"],
    workerId: "test-worker",
    maxTasksPerRun: 2
  });

  const result = await worker.runOnce();

  assert.equal(result.started, true);
  assert.equal(result.processed, 2);
  assert.deepEqual(
    calls.map(call => call.runnerId),
    ["studio", "world"]
  );
  assert.ok(calls.every(call => call.workerId === "test-worker"));
  assert.equal(worker.getSnapshot().mode, "one-shot");
  assert.equal(worker.getSnapshot().productionWrites, false);
});

test("Worker enforces its per-run task limit", async () => {
  const calls = [];
  const worker = createDevelopmentWorker({
    executor: {
      async executeNextTask(input) {
        calls.push(input.runnerId);
        return { executed: true, status: "review" };
      }
    },
    runnerIds: ["studio", "world", "npcs"],
    maxTasksPerRun: 2
  });

  const result = await worker.runOnce();

  assert.equal(result.processed, 2);
  assert.deepEqual(calls, ["studio", "world"]);
});

test("Disabled worker does not call its executor", async () => {
  let calls = 0;
  const worker = createDevelopmentWorker({
    executor: {
      async executeNextTask() {
        calls++;
        return { executed: true };
      }
    },
    runnerIds: ["studio"],
    enabled: false
  });

  const result = await worker.runOnce();

  assert.equal(result.started, false);
  assert.equal(calls, 0);
});

test("Worker rejects missing executor and empty runner lists", () => {
  assert.throws(
    () => createDevelopmentWorker({
      runnerIds: ["studio"]
    }),
    /controlled development executor is required/
  );

  assert.throws(
    () => createDevelopmentWorker({
      executor: { executeNextTask: async () => ({}) },
      runnerIds: []
    }),
    /At least one authorized runner ID/
  );
});

test("Worker resets its running state after an executor error", async () => {
  const worker = createDevelopmentWorker({
    executor: {
      async executeNextTask() {
        throw new Error("simulated worker failure");
      }
    },
    runnerIds: ["studio"]
  });

  await assert.rejects(
    () => worker.runOnce(),
    /simulated worker failure/
  );

  assert.equal(worker.getSnapshot().running, false);
});
