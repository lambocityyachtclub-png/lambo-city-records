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

test("vision plan only creates tasks when explicitly selected and preserves dependency order", async () => {
  const system = await makeSystem();
  await system.intakeVision("Prepare the launch plan.");
  assert.equal(system.director.listTasks().length, 0);
  await assert.rejects(system.submitVisionTasks(["studio-export-flow"]), /Select dependency/);
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
  const submitted = await system.submitVisionTasks(["creator-marketplace"]);
  assert.equal(submitted[0].task.status, "pending_approval");
});

test("vision intake requires a trusted planner adapter and non-empty direction", async () => {
  await assert.rejects(createDevelopmentSystem({ visionPlanner: true }), /function/);
  const system = await makeSystem();
  await assert.rejects(system.intakeVision(" "), /Owner vision is required/);
});
