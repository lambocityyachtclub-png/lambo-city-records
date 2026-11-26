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

test("Living Contract Engine maps waterfront intent only to existing allowlisted detail modules", async () => {
  const { engine } = await createEngine();
  const plan = engine.planIntent("Improve waterfront dock entrance and storefront quality with performance optimization");

  assert.equal(plan.status, "planned");
  assert.deepEqual(plan.matchedContracts, [
    "dock-entrance-materials",
    "waterfront-storefront-materials",
    "world-performance"
  ]);
  assert.deepEqual(plan.tasks[0].filePaths, ["dockEntranceLuxury.js"]);
  assert.deepEqual(plan.tasks[1].filePaths, ["waterfrontStorefrontDetails.js"]);
  assert.deepEqual(plan.tasks[2].filePaths, ["deviceGraphics.js", "performanceMonitor.js"]);
  assert.deepEqual(plan.tasks[2].dependsOn, [
    "dock-entrance-materials",
    "waterfront-storefront-materials"
  ]);
});

test("Living Contract Engine submits tasks with contract IDs, source files, and dependencies", async () => {
  const { director, engine } = await createEngine();
  const result = await engine.submitIntent("Improve waterfront dock entrance and storefront quality with performance optimization");

  assert.equal(result.status, "submitted");
  assert.equal(result.total, 3);
  assert.equal(result.codeChangesMade, false);
  assert.equal(result.productionChangesMade, false);

  const tasks = director.listTasks();
  assert.equal(tasks.length, 3);
  assert.equal(tasks[0].contractId, "world-material-quality");
  assert.equal(tasks[0].relatedFiles[0], "dockEntranceLuxury.js");
  assert.equal(tasks[1].relatedFiles[0], "waterfrontStorefrontDetails.js");
  assert.equal(tasks[2].contractId, "performance-quality");
  assert.deepEqual(tasks[2].dependencies, tasks.slice(0, 2).map(task => task.id));
  assert.deepEqual(tasks[2].relatedFiles, ["deviceGraphics.js", "performanceMonitor.js"]);
  assert.ok(tasks.every(task => task.status === "queued"));
});

test("Convention Center glass intent targets only the existing Convention Center source", async () => {
  const { engine } = await createEngine();
  const plan = engine.planIntent("Improve Convention Center glass realism");
  assert.equal(plan.status, "planned");
  assert.deepEqual(plan.matchedContracts, ["convention-center-materials"]);
  assert.equal(plan.tasks[0].projectContractId, "world-material-quality");
  assert.deepEqual(plan.tasks[0].filePaths, ["conferenceCenterDistrict.js"]);
});

test("Yacht and billboard intent map to their existing additive modules", async () => {
  const { engine } = await createEngine();
  const plan = engine.planIntent("Polish yacht deck details and city billboards");
  assert.deepEqual(plan.matchedContracts, ["yacht-luxury-materials", "cinematic-branding"]);
  assert.deepEqual(plan.tasks[0].filePaths, ["yachtLuxuryDetails.js"]);
  assert.deepEqual(plan.tasks[1].filePaths, ["cinematicWorldSkin.js"]);
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

test("Unmapped water-system and landscaping work asks for clarification rather than using an unapproved path", async () => {
  const { director, engine } = await createEngine();
  const plan = engine.planIntent("Improve water simulation and landscaping");
  assert.equal(plan.status, "needs_clarification");
  assert.equal(director.listTasks().length, 0);
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
  assert.throws(() => engine.planIntent("Improve waterfront dock entrance"), /disabled/);
  await assert.rejects(() => engine.submitIntent("Improve waterfront dock entrance"), /disabled/);
});
