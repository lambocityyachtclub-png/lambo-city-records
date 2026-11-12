import test from "node:test";
import assert from "node:assert/strict";
import {
  createDevelopmentDirector,
  TASK_STATUS
} from "../engine/developmentDirector.js";

function makeStorage() {
  let snapshot = [];
  return {
    async load() {
      return structuredClone(snapshot);
    },
    async save(tasks) {
      snapshot = structuredClone(tasks);
    }
  };
}

test("expired worker lease safely returns abandoned task to the queue", async () => {
  let now = Date.parse("2026-11-12T20:00:00.000Z");
  const director = createDevelopmentDirector({
    storage: makeStorage(),
    clock: () => new Date(now).toISOString(),
    leaseDurationMs: 60_000
  });
  await director.initialize();
  const task = await director.createTask({
    title: "Recover interrupted module task",
    area: "development-system",
    runner: "studio",
    description: "Verify abandoned task recovery."
  });

  const firstClaim = await director.claimNextTask("studio", "worker-a");
  assert.equal(firstClaim.id, task.id);
  assert.equal(firstClaim.status, TASK_STATUS.IN_PROGRESS);
  assert.equal(firstClaim.assignedWorker, "worker-a");
  assert.equal(Date.parse(firstClaim.leaseExpiresAt), now + 60_000);

  now += 60_001;
  const recoveredClaim = await director.claimNextTask("studio", "worker-b");

  assert.equal(recoveredClaim.id, task.id);
  assert.equal(recoveredClaim.status, TASK_STATUS.IN_PROGRESS);
  assert.equal(recoveredClaim.assignedWorker, "worker-b");
  assert.equal(Date.parse(recoveredClaim.leaseExpiresAt), now + 60_000);

  const history = director.getTask(task.id).history;
  assert.ok(history.some(entry => entry.event === "task_lease_expired_requeued"));
  assert.ok(history.some(entry =>
    entry.event === "task_lease_expired_requeued" &&
    entry.details.previousWorker === "worker-a"
  ));
});

test("completed execution transition clears its worker lease", async () => {
  const director = createDevelopmentDirector({
    storage: makeStorage(),
    leaseDurationMs: 60_000
  });
  await director.initialize();
  const task = await director.createTask({
    title: "Clear lease after review",
    area: "development-system",
    runner: "studio"
  });
  const claimed = await director.claimNextTask("studio", "worker-a");
  assert.ok(claimed.leaseExpiresAt);

  const reviewed = await director.updateTask(task.id, {
    status: TASK_STATUS.REVIEW,
    result: { status: "awaiting_owner_review" }
  });
  assert.equal(reviewed.leaseExpiresAt, null);
});

test("lease duration rejects unsafe or invalid values", () => {
  assert.throws(
    () => createDevelopmentDirector({ leaseDurationMs: 10_000 }),
    /between 1 minute and 24 hours/
  );
  assert.throws(
    () => createDevelopmentDirector({ leaseDurationMs: 25 * 60 * 60 * 1000 }),
    /between 1 minute and 24 hours/
  );
});
