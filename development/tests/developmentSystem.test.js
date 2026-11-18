
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
  createWorldDevelopmentRunner
} from "../runners/world/worldDevelopmentRunner.js";

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


test("World Runner submits protected-layout-aware development tasks", async () => {
  const director = createDevelopmentDirector();
  await director.initialize();

  const runner = createWorldDevelopmentRunner({
    developmentDirector: director
  });

  const result = await runner.submitFinding({
    title: "Improve marina water realism",
    description: "Improve reflections, material detail, and water movement while preserving approved marina geography, docks, camera, and navigation.",
    area: "water",
    type: "improvement",
    severity: "high",
    acceptanceCriteria: [
      "Approved marina layout and object positions remain unchanged.",
      "Existing camera and navigation continue working.",
      "Water detail improves without excessive real-time lights."
    ]
  });

  assert.equal(result.runnerId, "world");
  assert.equal(result.task.runner, "world");
  assert.equal(result.task.area, "water");
  assert.equal(result.task.status, TASK_STATUS.QUEUED);
  assert.ok(runner.getProfile().preservationRules.length >= 4);
});

test("World Runner requires owner approval for protected landmarks", async () => {
  const director = createDevelopmentDirector();
  await director.initialize();

  const runner = createWorldDevelopmentRunner({
    developmentDirector: director
  });

  const result = await runner.submitFinding({
    title: "Relocate protected marina landmark",
    description: "Test protected landmark handling.",
    area: "marina",
    protectedActions: ["protected_landmarks"]
  });

  assert.equal(result.policyDecision.requiresApproval, true);
  assert.equal(result.task.status, TASK_STATUS.PENDING_APPROVAL);
});

test("World Runner rejects unsupported areas and can be disabled", async () => {
  const director = createDevelopmentDirector();
  await director.initialize();

  const runner = createWorldDevelopmentRunner({
    developmentDirector: director
  });

  await assert.rejects(
    () => runner.submitFinding({
      title: "Unsupported task",
      description: "This should be rejected.",
      area: "unsupported_area"
    }),
    /Unsupported World area/
  );

  runner.setEnabled(false);
  await assert.rejects(
    () => runner.submitFinding({
      title: "Disabled task",
      description: "This should be rejected.",
      area: "water"
    }),
    /disabled/
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
  assert.equal(snapshot.worldRunner.id, "world");
});


test("Development System submits world tasks through the world specialist", async () => {
  const system = await createDevelopmentSystem();
  const result = await system.submitWorldFinding({
    title: "Improve waterfront atmosphere",
    description: "Improve environmental detail while preserving approved positions.",
    area: "water"
  });
  assert.equal(result.runnerId, "world");
  assert.equal(result.task.runner, "world");
  assert.equal(result.task.status, TASK_STATUS.QUEUED);
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


test("Development System keeps world execution disabled without explicit adapters", async () => {
  const system = await createDevelopmentSystem();

  assert.equal(system.getSnapshot().worldExecutor.enabled, false);

  await assert.rejects(
    () => system.executeNextWorldTask(),
    /World execution is not configured/
  );
});

test("Development System executes one world task through isolated adapters and queues owner review", async () => {
  const reviews = [];
  const calls = { create: 0, prepare: 0, tests: 0, destroy: 0 };

  const system = await createDevelopmentSystem({
    worldExecution: {
      allowedPaths: ["development/example"],
      workspaceAdapter: {
        async createWorkspace() {
          calls.create += 1;
          return { workspaceId: "world-isolated-test" };
        },
        async prepareChanges() {
          calls.prepare += 1;
          return {
            changedFiles: ["development/example/water.js"],
            changes: "Prepared isolated water improvement."
          };
        },
        async runTests() {
          calls.tests += 1;
          return { passed: true, total: 4, failed: 0 };
        },
        async destroyWorkspace() {
          calls.destroy += 1;
          return { destroyed: true };
        }
      },
      reviewStore: {
        async createReview(review) {
          const saved = { id: "world-review-001", ...review };
          reviews.push(saved);
          return saved;
        }
      }
    }
  });

  const submitted = await system.submitWorldFinding({
    title: "Improve marina water",
    description: "Improve water reflections while preserving marina layout.",
    area: "water",
    acceptanceCriteria: [
      "Preserve approved marina geography.",
      "Do not change camera or navigation."
    ]
  });

  assert.equal(submitted.task.status, TASK_STATUS.QUEUED);

  const result = await system.executeNextWorldTask();

  assert.equal(result.status, TASK_STATUS.REVIEW);
  assert.equal(result.productionChangesMade, false);
  assert.deepEqual(result.changedFiles, ["development/example/water.js"]);
  assert.equal(reviews.length, 1);
  assert.equal(reviews[0].status, "awaiting_owner_review");
  assert.deepEqual(calls, { create: 1, prepare: 1, tests: 1, destroy: 1 });
  assert.equal(
    system.director.getTask(submitted.task.id).status,
    TASK_STATUS.REVIEW
  );
});


test("Owner PERFECT records an approved reference without publishing production", async () => {
  const { mkdtemp, rm } = await import("node:fs/promises");
  const os = await import("node:os");
  const path = await import("node:path");
  const { createDevelopmentReviewStorage } = await import("../storage/developmentReviewStorage.js");
  const directory = await mkdtemp(path.join(os.tmpdir(), "alive-perfect-review-"));

  try {
    const reviewStore = createDevelopmentReviewStorage({ storageDirectory: directory });
    const system = await createDevelopmentSystem({
      worldExecution: {
        allowedPaths: ["development/example"],
        workspaceAdapter: {
          async createWorkspace() { return { workspaceId: "perfect-workspace" }; },
          async prepareChanges() {
            return { changedFiles: ["development/example/world.js"], changes: "Approved world detail." };
          },
          async runTests() { return { passed: true, total: 3, failed: 0 }; }
        },
        reviewStore
      }
    });

    const submitted = await system.submitWorldFinding({
      title: "Improve waterfront detail",
      description: "Improve detail without moving approved objects.",
      area: "water"
    });
    const execution = await system.executeNextWorldTask();
    const result = await system.markWorldReviewPerfect({
      taskId: submitted.task.id,
      reviewId: execution.review.id,
      ownerNote: "PERFECT — preserve this visual standard."
    });

    assert.equal(result.feedback, "perfect");
    assert.equal(result.task.status, TASK_STATUS.COMPLETED);
    assert.equal(result.review.status, "approved");
    assert.equal(result.productionChangesMade, false);
    assert.equal(result.task.result.ownerFeedback.type, "perfect");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("Owner CHANGE records revision instructions and safely requeues the task", async () => {
  const { mkdtemp, rm } = await import("node:fs/promises");
  const os = await import("node:os");
  const path = await import("node:path");
  const { createDevelopmentReviewStorage } = await import("../storage/developmentReviewStorage.js");
  const directory = await mkdtemp(path.join(os.tmpdir(), "alive-change-review-"));

  try {
    const reviewStore = createDevelopmentReviewStorage({ storageDirectory: directory });
    const system = await createDevelopmentSystem({
      worldExecution: {
        allowedPaths: ["development/example"],
        workspaceAdapter: {
          async createWorkspace() { return { workspaceId: "change-workspace" }; },
          async prepareChanges() {
            return { changedFiles: ["development/example/world.js"], changes: "First proposal." };
          },
          async runTests() { return { passed: true, total: 3, failed: 0 }; }
        },
        reviewStore
      }
    });

    const submitted = await system.submitWorldFinding({
      title: "Improve marina reflections",
      description: "Improve reflections while preserving marina layout.",
      area: "water"
    });
    const execution = await system.executeNextWorldTask();
    const result = await system.requestWorldReviewChanges({
      taskId: submitted.task.id,
      reviewId: execution.review.id,
      ownerNote: "CHANGE — reduce the reflection intensity and preserve the existing horizon."
    });

    assert.equal(result.feedback, "change");
    assert.equal(result.task.status, TASK_STATUS.QUEUED);
    assert.equal(result.review.status, "revision_requested");
    assert.equal(result.task.result.ownerFeedback.type, "change");
    assert.equal(result.productionChangesMade, false);
    await assert.rejects(
      () => system.markWorldReviewPerfect({
        taskId: submitted.task.id,
        reviewId: execution.review.id
      }),
      /Only tasks awaiting owner review/
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
