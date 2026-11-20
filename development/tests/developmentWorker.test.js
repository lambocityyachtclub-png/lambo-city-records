import test from "node:test";
import assert from "node:assert/strict";
import { createDevelopmentWorker } from "../engine/developmentWorker.js";

test("worker processes multiple tasks per runner up to its bounded limit", async () => {
  const remaining = new Map([["studio", 3], ["world", 2]]);
  const calls = [];
  const worker = createDevelopmentWorker({
    executor: {
      async executeNextTask(input) {
        calls.push(input);
        const count = remaining.get(input.runnerId) || 0;
        if (!count) return { executed: false, reason: "No eligible task." };
        remaining.set(input.runnerId, count - 1);
        return { executed: true, status: "review", taskId: input.runnerId + "-" + count, productionChangesMade: false };
      }
    },
    runnerIds: ["studio", "world"],
    workerId: "test-worker",
    maxTasksPerRun: 4,
    enabled: true
  });

  const result = await worker.runOnce();
  assert.equal(result.processed, 4);
  assert.equal(result.attempted, 4);
  assert.deepEqual(result.results.filter(item => item.executed).map(item => item.runnerId), ["studio", "world", "studio", "world"]);
  assert.ok(calls.every(item => item.workerId === "test-worker"));
});

test("worker stops after a full pass finds no work", async () => {
  let calls = 0;
  const worker = createDevelopmentWorker({
    executor: { async executeNextTask() { calls++; return { executed: false }; } },
    runnerIds: ["studio", "world"],
    enabled: true
  });
  const result = await worker.runOnce();
  assert.equal(result.processed, 0);
  assert.equal(calls, 2);
});

test("disabled worker never calls executor", async () => {
  let calls = 0;
  const worker = createDevelopmentWorker({
    executor: { async executeNextTask() { calls++; return { executed: true }; } },
    runnerIds: ["studio"]
  });
  const result = await worker.runOnce();
  assert.equal(result.started, false);
  assert.equal(calls, 0);
});

test("worker rejects missing executor, empty runners, and invalid limits", () => {
  assert.throws(() => createDevelopmentWorker({ runnerIds: ["studio"] }), /executor is required/);
  assert.throws(() => createDevelopmentWorker({ executor: { executeNextTask() {} }, runnerIds: [] }), /authorized runner ID/);
  assert.throws(() => createDevelopmentWorker({ executor: { executeNextTask() {} }, runnerIds: ["studio"], maxTasksPerRun: 26 }), /between 1 and 25/);
});

test("worker resets running state after an executor error", async () => {
  const worker = createDevelopmentWorker({
    executor: { async executeNextTask() { throw new Error("simulated failure"); } },
    runnerIds: ["studio"],
    enabled: true
  });
  await assert.rejects(() => worker.runOnce(), /simulated failure/);
  assert.equal(worker.getSnapshot().running, false);
});


test("worker stops starting new tasks after it is disabled during a run", async () => {
  let worker;
  let calls = 0;
  worker = createDevelopmentWorker({
    executor: {
      async executeNextTask() {
        calls++;
        worker.setEnabled(false);
        return { executed: true, status: "review", taskId: "first-task" };
      }
    },
    runnerIds: ["studio", "world"],
    maxTasksPerRun: 5,
    enabled: true
  });

  const result = await worker.runOnce();
  assert.equal(result.processed, 1);
  assert.equal(result.stopped, true);
  assert.match(result.stopReason, /disabled before the next task/);
  assert.equal(calls, 1);
});
