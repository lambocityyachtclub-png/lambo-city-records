import test from "node:test";
import assert from "node:assert/strict";
import { createDevelopmentDirector } from "../engine/developmentDirector.js";
import { createWorldDevelopmentRunner } from "../runners/world/worldDevelopmentRunner.js";
import { createLivingContractEngine } from "../contracts/livingContractEngine.js";

async function createEngine() {
  const director = createDevelopmentDirector();
  await director.initialize();
  const worldRunner = createWorldDevelopmentRunner({ developmentDirector: director });
  return { director, engine: createLivingContractEngine({ worldRunner }) };
}

test("Living Contract Engine plans a dependency-ordered waterfront improvement batch", async () => {
  const { engine } = await createEngine();
  const plan = engine.planIntent("Improve waterfront water, marina, lighting, landscaping, and performance");

  assert.equal(plan.status, "planned");
  assert.equal(plan.mode, "deterministic_contract_planning");
  assert.deepEqual(plan.matchedContracts, [
    "water-materials",
    "marina-transitions",
    "environment-lighting",
    "waterfront-landscaping",
    "world-performance"
  ]);
  assert.equal(plan.tasks[0].projectContractId, "world-material-quality");
  assert.equal(plan.tasks.at(-1).projectContractId, "performance-quality");
  assert.deepEqual(plan.tasks.at(-1).dependsOn, [
    "water-materials",
    "marina-transitions",
    "environment-lighting",
    "waterfront-landscaping"
  ]);
});

test("Living Contract Engine submits tasks in dependency order using canonical project contracts", async () => {
  const { director, engine } = await createEngine();
  const result = await engine.submitIntent("Improve waterfront water, marina, lighting, landscaping, and performance");

  assert.equal(result.status, "submitted");
  assert.equal(result.total, 5);
  assert.equal(result.codeChangesMade, false);
  assert.equal(result.productionChangesMade, false);

  const tasks = director.listTasks();
  assert.equal(tasks.length, 5);
  assert.equal(tasks[0].contractId, "world-material-quality");
  assert.equal(tasks[4].contractId, "performance-quality");
  assert.deepEqual(tasks[4].dependencies, tasks.slice(0, 4).map(task => task.id));
  assert.ok(tasks.every(task => task.status === "queued"));
});

test("Convention Center glass intent maps to the existing world-material contract", async () => {
  const { engine } = await createEngine();
  const plan = engine.planIntent("Improve Convention Center glass realism");
  assert.equal(plan.status, "planned");
  assert.deepEqual(plan.matchedContracts, ["convention-center-materials"]);
  assert.equal(plan.tasks[0].projectContractId, "world-material-quality");
});

test("Protected HERO, layout, accounts, and Studio intent never enters the autonomous queue", async () => {
  for (const intent of [
    "Improve HERO performance",
    "Change the boardwalk navigation",
    "Improve player phone verification",
    "Improve the Studio vocal booth"
  ]) {
    const { director, engine } = await createEngine();
    const plan = engine.planIntent(intent);
    assert.equal(plan.status, "owner_approval_required", intent);
    assert.equal(plan.tasks.length, 0, intent);
    const submitted = await engine.submitIntent(intent);
    assert.equal(submitted.status, "owner_approval_required", intent);
    assert.equal(director.listTasks().length, 0, intent);
  }
});

test("Unknown intent asks for clarification without creating tasks", async () => {
  const { director, engine } = await createEngine();
  const plan = engine.planIntent("Invent an entirely new district called Moon Harbor");
  assert.equal(plan.status, "needs_clarification");
  assert.equal(director.listTasks().length, 0);
});

test("Disabled Living Contract Engine refuses planning and submission", async () => {
  const { engine } = await createEngine();
  engine.setEnabled(false);
  assert.equal(engine.getSnapshot().enabled, false);
  assert.throws(() => engine.planIntent("Improve waterfront water"), /disabled/);
  await assert.rejects(() => engine.submitIntent("Improve waterfront water"), /disabled/);
});
