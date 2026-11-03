
import test from "node:test";
import assert from "node:assert/strict";

import {
  createDevelopmentRegistry,
  MODULE_TYPES
} from "../engine/developmentRegistry.js";

import {
  createDevelopmentDirector,
  TASK_STATUS,
  TASK_PRIORITY
} from "../engine/developmentDirector.js";

import {
  evaluateDevelopmentTask,
  getDevelopmentPolicy
} from "../policies/developmentPolicy.js";

import {
  createStudioDevelopmentRunner
} from "../runners/studio/studioDevelopmentRunner.js";

import {
  createDevelopmentSystem,
  DEVELOPMENT_SYSTEM_STATUS
} from "../engine/developmentSystem.js";


test("Registry registers and retrieves modules", () => {
  const registry = createDevelopmentRegistry();

  const moduleRecord = registry.registerModule({
    id: "test-engine",
    name: "Test Engine",
    type: MODULE_TYPES.ENGINE,
    version: "1.0.0",
    path: "development/tests/test-engine.js",
    description: "Test module",
    capabilities: ["testing"]
  });

  assert.equal(moduleRecord.id, "test-engine");
  assert.equal(registry.getModule("test-engine").name, "Test Engine");
  assert.equal(registry.getSnapshot().totalModules, 1);
});


test("Registry rejects duplicate module IDs", () => {
  const registry = createDevelopmentRegistry();

  const moduleRecord = {
    id: "duplicate-test",
    name: "Duplicate Test",
    type: MODULE_TYPES.ENGINE,
    version: "1.0.0",
    path: "development/tests/duplicate.js",
    description: "Duplicate test module"
  };

  registry.registerModule(moduleRecord);

  assert.throws(
    () => registry.registerModule(moduleRecord),
    /already registered/
  );
});


test("Policy requires approval for protected actions", () => {
  const decision = evaluateDevelopmentTask({
    title: "Production release",
    protectedActions: ["production_release"]
  });

  assert.equal(decision.requiresApproval, true);
  assert.equal(decision.canEnterAutonomousQueue, false);
  assert.equal(
    decision.decision,
    "owner_approval_required"
  );
});


test("Policy allows an ordinary task into the queue", () => {
  const decision = evaluateDevelopmentTask({
    title: "Improve Studio interface",
    protectedActions: []
  });

  assert.equal(decision.requiresApproval, false);
  assert.equal(decision.canEnterAutonomousQueue, true);
});


test("Development Director requires initialization", async () => {
  const director = createDevelopmentDirector();

  await assert.rejects(
    () => director.createTask({
      title: "Test task",
      area: "studio_audio",
      runner: "studio"
    }),
    /not been initialized/
  );
});


test("Development Director creates a queued task", async () => {
  const director = createDevelopmentDirector();

  await director.initialize();

  const task = await director.createTask({
    title: "Improve Studio workflow",
    description: "Test task creation.",
    area: "studio_audio",
    runner: "studio",
    priority: TASK_PRIORITY.NORMAL
  });

  assert.equal(task.status, TASK_STATUS.QUEUED);
  assert.equal(task.runner, "studio");
  assert.equal(task.area, "studio_audio");
});


test("Development Director requires approval for protected tasks", async () => {
  const director = createDevelopmentDirector();

  await director.initialize();

  const task = await director.createTask({
    title: "Release to production",
    area: "studio_audio",
    runner: "studio",
    protectedActions: ["production_release"]
  });

  assert.equal(
    task.status,
    TASK_STATUS.PENDING_APPROVAL
  );

  const approved = await director.approveTask(task.id);

  assert.equal(approved.status, TASK_STATUS.QUEUED);
});


test("Studio Runner submits findings to the Director", async () => {
  const director = createDevelopmentDirector();

  await director.initialize();

  const runner = createStudioDevelopmentRunner({
    developmentDirector: director
  });

  const result = await runner.submitFinding({
    title: "Improve Beat Lab workflow",
    description: "Test Studio finding submission.",
    type: "improvement",
    area: "beat_lab",
    severity: "normal",
    acceptanceCriteria: [
      "The workflow remains functional."
    ]
  });

  assert.equal(result.runnerId, "studio");
  assert.equal(result.task.runner, "studio");
  assert.equal(result.task.area, "beat_lab");
  assert.equal(result.task.status, TASK_STATUS.QUEUED);
});


test("Studio Runner rejects unsupported development areas", async () => {
  const director = createDevelopmentDirector();

  await director.initialize();

  const runner = createStudioDevelopmentRunner({
    developmentDirector: director
  });

  await assert.rejects(
    () => runner.submitFinding({
      title: "Unsupported task",
      description: "This should be rejected.",
      area: "unsupported_area"
    }),
    /Unsupported Studio area/
  );
});


test("Development System initializes all modules", async () => {
  const system = await createDevelopmentSystem();

  const snapshot = system.getSnapshot();

  assert.equal(
    system.getStatus(),
    DEVELOPMENT_SYSTEM_STATUS.READY
  );

  assert.equal(snapshot.registry.totalModules, 3);
  assert.equal(snapshot.registry.enabledModules, 3);
  assert.equal(snapshot.studioRunner.id, "studio");
});


test("Development System can be disabled and re-enabled", async () => {
  const system = await createDevelopmentSystem();

  assert.equal(
    system.disable(),
    DEVELOPMENT_SYSTEM_STATUS.DISABLED
  );

  assert.equal(
    system.enable(),
    DEVELOPMENT_SYSTEM_STATUS.READY
  );
});


test("Development System rejects submissions while disabled", async () => {
  const system = await createDevelopmentSystem();

  system.disable();

  await assert.rejects(
    () => system.submitStudioFinding({
      title: "Disabled test",
      description: "This should not be submitted.",
      area: "beat_lab"
    }),
    /development system is disabled/
  );
});


test("Development Policy exposes its version", () => {
  const policy = getDevelopmentPolicy();

  assert.equal(policy.version, "1.0.0");
  assert.ok(policy.autonomousPermissions.length > 0);
});
