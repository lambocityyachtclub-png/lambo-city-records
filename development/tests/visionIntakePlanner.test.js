import test from "node:test";
import assert from "node:assert/strict";
import { createDevelopmentSystem } from "../engine/developmentSystem.js";
import { createVisionIntakePlanner, validateVisionPlan } from "../engine/visionIntakePlanner.js";

function validPlan() {
  return {
    title: "First launch plan",
    summary: "Sequence the core Studio and World work.",
    items: [
      { key: "studio-core-audit", lane: "foundation", workerId: "studio", title: "Audit Studio core", description: "Review core Studio workflow boundaries.", area: "studio_interface", acceptanceCriteria: ["Approved interfaces remain intact."] },
      { key: "studio-export-flow", lane: "launch", workerId: "studio", title: "Verify Studio export", description: "Verify save and export workflow after the core audit.", area: "project_export", dependencies: ["studio-core-audit"], acceptanceCriteria: ["A session exports successfully."] },
      { key: "creator-marketplace", lane: "future", workerId: "vision-planning", title: "Plan creator marketplace", description: "Document future creator marketplace dependencies.", area: "product_planning", acceptanceCriteria: ["No seller payouts are activated."] },
      { key: "payments-release", lane: "blocked", workerId: "vision-planning", title: "Release payments", description: "Blocked pending owner decisions and payment-provider setup.", area: "product_planning", acceptanceCriteria: ["No payment code is deployed."] }
    ]
  };
}

async function makeSystem(plan = validPlan()) {
  return createDevelopmentSystem({
    visionPlanner: async () => plan
  });
}

test("vision intake converts owner direction into validated launch, foundation, future and blocked lanes", async () => {
  const system = await makeSystem();
  const result = await system.intakeVision("Make the City ready for launch.");
  assert.equal(result.title, "First launch plan");
  assert.deepEqual(result.items.map(item => item.lane), ["foundation", "launch", "future", "blocked"]);
});

test("vision plan rejects unknown workers, unauthorized areas and dependency cycles", async () => {
  const system = await makeSystem();
  const roster = system.workerRoster;
  assert.throws(() => validateVisionPlan({ ...validPlan(), items: [{ ...validPlan().items[0], workerId: "unknown" }] }, roster), /Unknown specialist/);
  assert.throws(() => validateVisionPlan({ ...validPlan(), items: [{ ...validPlan().items[0], area: "billing" }] }, roster), /not authorized/);
  const cyclic = validPlan();
  cyclic.items[0].dependencies = ["studio-export-flow"];
  assert.throws(() => validateVisionPlan(cyclic, roster), /dependency cycle/);
});

test("vision plan rejects duplicate, unsafe and execution-blocking work definitions", async () => {
  const system = await makeSystem();
  const roster = system.workerRoster;
  const duplicateKey = validPlan();
  duplicateKey.items.push({ ...duplicateKey.items[0] });
  assert.throws(() => validateVisionPlan(duplicateKey, roster), /Duplicate task key/);

  const duplicateDependency = validPlan();
  duplicateDependency.items[1].dependencies = ["studio-core-audit", "studio-core-audit"];
  assert.throws(() => validateVisionPlan(duplicateDependency, roster), /must be unique/);

  const unknownAction = validPlan();
  unknownAction.items[0].protectedActions = ["invented_permission"];
  assert.throws(() => validateVisionPlan(unknownAction, roster), /recognized owner-approval actions/);

  const unexpectedField = validPlan();
  unexpectedField.items[0].execute = true;
  assert.throws(() => validateVisionPlan(unexpectedField, roster), /unsupported fields/);

  const invalidDependencyLane = validPlan();
  invalidDependencyLane.items[1].dependencies = ["creator-marketplace"];
  assert.throws(() => validateVisionPlan(invalidDependencyLane, roster), /cannot depend on blocked or future work/);
});

test("vision plan only creates tasks when explicitly selected and preserves dependency order", async () => {
  const system = await makeSystem();
  await system.intakeVision("Prepare the launch plan.");
  assert.equal(system.director.listTasks().length, 0);
  await assert.rejects(system.submitVisionTasks(["studio-export-flow"]), /Select dependency/);
  await assert.rejects(system.submitVisionTasks(["studio-core-audit", "studio-core-audit"]), /must be unique/);
  const submitted = await system.submitVisionTasks(["studio-export-flow", "studio-core-audit"]);
  assert.deepEqual(submitted.map(item => item.key), ["studio-core-audit", "studio-export-flow"]);
  assert.equal(submitted[1].task.dependencies[0], submitted[0].task.id);
});

test("blocked tasks cannot be submitted and protected work retains owner approval", async () => {
  const plan = validPlan();
  plan.items[2].protectedActions = ["production_release"];
  const system = await makeSystem(plan);
  await system.intakeVision("Prepare the plan.");
  await assert.rejects(system.submitVisionTasks(["payments-release"]), /Blocked work/);
  await assert.rejects(system.submitVisionTasks(["creator-marketplace"]), /Future work stays on the roadmap/);
  plan.items[2].lane = "foundation";
  const approvedPlanSystem = await makeSystem(plan);
  await approvedPlanSystem.intakeVision("Prepare the plan.");
  const submitted = await approvedPlanSystem.submitVisionTasks(["creator-marketplace"]);
  assert.equal(submitted[0].task.status, "pending_approval");
});

test("vision submission rechecks worker authorization and reports partial creation failures", async () => {
  const system = await makeSystem();
  await system.intakeVision("Prepare the launch plan.");
  system.workerRoster.setWorkerEnabled("studio", false);
  await assert.rejects(system.submitVisionTasks(["studio-core-audit"]), /authorization changed/);
  system.workerRoster.setWorkerEnabled("studio", true);

  let attempts = 0;
  const failure = new Error("storage unavailable");
  const planner = createVisionIntakePlanner({
    planner: async () => validPlan(),
    workerRoster: system.workerRoster,
    developmentDirector: {
      createTask: async () => {
        attempts += 1;
        if (attempts === 2) throw failure;
        return { id: "created-task-1" };
      }
    }
  });
  await planner.intakeVision({ vision: "Prepare the launch plan." });
  await assert.rejects(
    planner.submitPlanTasks(["studio-export-flow", "studio-core-audit"]),
    error => {
      assert.match(error.message, /failed while creating vision task studio-export-flow; its state may be partially applied/);
      assert.equal(error.failedTaskKey, "studio-export-flow");
      assert.equal(error.failedTaskMayExist, true);
      assert.deepEqual(error.createdTasks, [{ key: "studio-core-audit", taskId: "created-task-1" }]);
      assert.equal(error.cause, failure);
      return true;
    }
  );
});

test("vision intake requires a trusted planner adapter and non-empty direction", async () => {
  await assert.rejects(createDevelopmentSystem({ visionPlanner: true }), /function/);
  const system = await makeSystem();
  await assert.rejects(system.intakeVision(" "), /Owner vision is required/);
});
