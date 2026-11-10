
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

  assert.equal(snapshot.registry.totalModules, 4);
  assert.equal(snapshot.registry.enabledModules, 4);
  assert.equal(snapshot.studioRunner.id, "studio");
  assert.equal(snapshot.workers.length, 8);
  assert.ok(snapshot.registry.modules.some(module => module.id === "specialist-worker-roster"));
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

  assert.throws(
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
test("Development System restores tasks after a restart", async () => {
  const {
    mkdtemp,
    rm
  } = await import("node:fs/promises");

  const os = await import("node:os");
  const path = await import("node:path");

  const {
    createDevelopmentTaskStorage
  } = await import("../storage/developmentTaskStorage.js");

  const directory = await mkdtemp(
    path.join(
      os.tmpdir(),
      "lambocity-system-persistence-"
    )
  );

  try {
    const storage = createDevelopmentTaskStorage({
      filePath: path.join(
        directory,
        "development-tasks.json"
      )
    });

    // Start the first Development System.
    const firstSystem = await createDevelopmentSystem({
      storage
    });

    // Create a task through the Studio Runner.
    const submitted = await firstSystem.submitStudioFinding({
      title: "Persistence restart verification",
      description: "Verify that tasks survive a system restart.",
      type: "improvement",
      area: "beat_lab",
      severity: "normal",
      acceptanceCriteria: [
        "The task survives a system restart."
      ]
    });

    const originalTask = submitted.task;

    // Start a completely new Development System
    // using the same storage file.
    const restartedSystem = await createDevelopmentSystem({
      storage
    });

    // Retrieve the original task from the new system.
    const restoredTask = restartedSystem.director.getTask(
      originalTask.id
    );

    assert.equal(restoredTask.id, originalTask.id);
    assert.equal(
      restoredTask.title,
      "Persistence restart verification"
    );
    assert.equal(restoredTask.runner, "studio");
    assert.equal(restoredTask.area, "beat_lab");
    assert.equal(restoredTask.status, "queued");

  } finally {
    await rm(directory, {
      recursive: true,
      force: true
    });
  }
});


test("Development System disable guards every exposed specialist worker entry point", async () => {
  const workspaceAdapter = {
    async createWorkspace() { return { workspaceId: "disabled-worker-workspace" }; },
    async readFile() { return ""; },
    async writeFile() { return { written: true }; },
    async listChangedFiles() { return []; },
    async destroyWorkspace() { return { destroyed: true }; }
  };
  const system = await createDevelopmentSystem({
    specialistExecution: {
      workspaceAdapters: { studio: workspaceAdapter },
      changePlanners: { studio: async () => ({ summary: "no-op" }) },
      testRunners: { studio: async () => ({ passed: true }) },
      reviewStore: { async createReview() { return { id: "review-disabled-test" }; } },
      allowedPathsByWorker: { studio: ["development"] }
    }
  });
  const execution = system.getWorkerExecution();

  assert.ok(execution);
  assert.deepEqual(execution.getConfiguredWorkers(), ["studio"]);
  system.disable();

  assert.throws(
    () => system.workerRoster.setWorkerEnabled("studio", false),
    /development system is disabled/
  );
  await assert.rejects(
    () => system.workerRoster.submitFinding("studio", {
      title: "Disabled worker submission",
      description: "This must be blocked through the exposed roster view.",
      area: "studio_audio"
    }),
    /development system is disabled/
  );
  assert.throws(
    () => execution.executeNextTask("studio"),
    /development system is disabled/
  );
  assert.throws(
    () => system.executeWorkerTask("studio"),
    /development system is disabled/
  );
});
