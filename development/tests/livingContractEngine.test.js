import test from "node:test";
import assert from "node:assert/strict";
import { createDevelopmentSystem } from "../engine/developmentSystem.js";

test("Living Contract engine resolves a waterfront instruction into one dependency-aware batch", async () => {
  const system = await createDevelopmentSystem();
  const plan = system.contractEngine.planIntent("Improve waterfront realism");

  assert.equal(plan.status, "planned");
  assert.equal(plan.mode, "deterministic_no_paid_ai");
  assert.deepEqual(plan.matchedContracts, [
    "water",
    "marina",
    "lighting",
    "landscaping",
    "world_performance"
  ]);
  assert.equal(plan.tasks.length, 5);
  assert.deepEqual(plan.tasks.find(task => task.contractId === "marina").dependsOn, ["water"]);
  assert.deepEqual(
    plan.tasks.find(task => task.contractId === "world_performance").dependsOn,
    ["water", "marina", "lighting", "landscaping"]
  );
});

test("One waterfront instruction submits a coordinated batch with real task dependencies", async () => {
  const system = await createDevelopmentSystem();
  const result = await system.submitWorldIntent("Improve waterfront realism");

  assert.equal(result.status, "submitted");
  assert.equal(result.mode, "deterministic_no_paid_ai");
  assert.equal(result.total, 5);
  assert.equal(result.codeChangesMade, false);
  assert.equal(result.productionChangesMade, false);

  const byContract = new Map(result.submitted.map(item => [item.contractId, item]));
  assert.equal(byContract.get("water").dependencies.length, 0);
  assert.deepEqual(byContract.get("marina").dependencies, [byContract.get("water").taskId]);
  assert.deepEqual(byContract.get("lighting").dependencies, [byContract.get("water").taskId]);
  assert.deepEqual(byContract.get("landscaping").dependencies, [byContract.get("marina").taskId]);
  assert.deepEqual(
    byContract.get("world_performance").dependencies,
    [
      byContract.get("water").taskId,
      byContract.get("marina").taskId,
      byContract.get("lighting").taskId,
      byContract.get("landscaping").taskId
    ]
  );

  for (const item of result.submitted) {
    const task = system.director.getTask(item.taskId);
    assert.equal(task.runner, "world");
    assert.equal(task.status, "queued");
    assert.deepEqual(task.dependencies, item.dependencies);
  }
});

test("Living Contract engine asks for clarification when no contract matches", async () => {
  const system = await createDevelopmentSystem();
  const result = await system.submitWorldIntent("Invent a new unrelated feature");

  assert.equal(result.status, "needs_clarification");
  assert.equal(result.total, undefined);
  assert.equal(system.director.listTasks().length, 0);
});

test("Living Contract batch intake is disabled when ALIVE is disabled", async () => {
  const system = await createDevelopmentSystem();
  system.disable();

  assert.throws(
    () => system.submitWorldIntent("Improve waterfront realism"),
    /development system is disabled/
  );
});
