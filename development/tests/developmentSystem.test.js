
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


test("Development Director enforces canonical file allowlists on task targets", async () => {
  const director = createDevelopmentDirector();
  await director.initialize();

  const task = await director.createTask({
    title: "Review Convention Center glass",
    description: "A bounded material-only task.",
    area: "world_materials",
    runner: "world",
    contractId: "world-material-quality",
    relatedFiles: ["conferenceCenterDistrict.js"]
  });
  assert.deepEqual(task.relatedFiles, ["conferenceCenterDistrict.js"]);

  await assert.rejects(
    () => director.createTask({
      title: "Attempt an out-of-contract file",
      area: "world_materials",
      runner: "world",
      contractId: "world-material-quality",
      relatedFiles: ["main.js"]
    }),
    /outside the canonical ALIVE contract allowlist/
  );

  await assert.rejects(
    () => director.createTask({
      title: "Attempt a traversal path",
      area: "world_materials",
      runner: "world",
      contractId: "world-material-quality",
      relatedFiles: ["../main.js"]
    }),
    /Unsafe related file path/
  );
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

  assert.equal(snapshot.registry.totalModules, 7);
  assert.equal(snapshot.registry.enabledModules, 7);
  assert.equal(snapshot.studioRunner.id, "studio");
  assert.equal(snapshot.worldRunner.id, "world");
  assert.equal(snapshot.projectDiscovery.configured, true);
  assert.equal(snapshot.projectDiscovery.enabled, true);
  assert.equal(snapshot.livingContractEngine.enabled, true);
  assert.equal(snapshot.livingContractEngine.executionEnabled, false);
  assert.equal(snapshot.contracts.length, 7);
  assert.ok(snapshot.contracts.some(contract => contract.id === "world-material-quality"));
});


test("Development System uses the Neon adapter for persistent task state", async () => {
  let savedTasks = [];
  const statements = [];
  const pool = {
    async query(sql, params = []) {
      const normalized = sql.replace(/\s+/g, " ").trim();
      statements.push(normalized);
      if (normalized.startsWith("SELECT to_regclass")) {
        return { rows: [{
          task_table_ready: true,
          review_table_ready: true,
          review_status_constraint: "CHECK (status IN ('awaiting_owner_review', 'approved', 'rejected'))"
        }] };
      }
      if (normalized.startsWith("SELECT tasks FROM")) {
        return { rows: [{ tasks: savedTasks }] };
      }
      if (normalized.startsWith("INSERT INTO public.lambo_alive_task_state")) {
        savedTasks = JSON.parse(params[1]);
        return { rows: [] };
      }
      throw new Error("Unexpected SQL in Neon integration test: " + normalized);
    }
  };

  const system = await createDevelopmentSystem({ postgresPool: pool });
  assert.equal(system.getStatus(), DEVELOPMENT_SYSTEM_STATUS.READY);
  assert.equal(system.director.listTasks().length, 0);

  const result = await system.submitWorldFinding({
    title: "Review Convention Center glass realism",
    description: "Check existing glass materials without changing the approved building footprint.",
    area: "world_materials",
    type: "improvement",
    severity: "normal",
    filePaths: ["conferenceCenterDistrict.js"],
    acceptanceCriteria: ["Preserve the existing building footprint."]
  });

  assert.equal(result.task.status, TASK_STATUS.QUEUED);
  assert.equal(savedTasks.length, 1);
  assert.equal(savedTasks[0].title, "Review Convention Center glass realism");
  assert.deepEqual(savedTasks[0].relatedFiles, ["conferenceCenterDistrict.js"]);
  assert.ok(statements.some(sql => sql.startsWith("SELECT to_regclass")));
  assert.ok(statements.some(sql => sql.startsWith("INSERT INTO public.lambo_alive_task_state")));
});

test("Development System refuses an incompatible Neon schema before starting", async () => {
  const pool = {
    async query() {
      return { rows: [{
        task_table_ready: true,
        review_table_ready: true,
        review_status_constraint: "CHECK (status IN ('awaiting_owner_review', 'approved'))"
      }] };
    }
  };
  await assert.rejects(
    () => createDevelopmentSystem({ postgresPool: pool }),
    /review status constraint is incompatible/
  );
});

test("Development System exposes read-only project discovery", async () => {
  const system = await createDevelopmentSystem();
  const report = await system.discoverProject();
  assert.equal(report.status, "discovery-only");
  assert.equal(report.summary.departmentCount, 10);
  assert.equal(report.safety.readOnly, true);
  assert.equal(report.safety.tasksCreated, false);
  assert.equal(Object.hasOwn(report, "inventory"), false);
  assert.equal(system.getProjectDiscoverySnapshot().lastScanStatus, "discovery-only");
});

test("Development System exposes deterministic Living Contract planning and submission", async () => {
  const system = await createDevelopmentSystem();
  const plan = system.planIntent("Improve dock entrance and waterfront storefront materials");
  assert.equal(plan.status, "planned");
  assert.ok(plan.matchedContracts.includes("dock-entrance-materials"));
  assert.ok(plan.matchedContracts.includes("waterfront-storefront-materials"));
  const result = await system.submitIntent("Improve Convention Center glass realism");
  assert.equal(result.status, "submitted");
  assert.equal(result.total, 1);
  assert.equal(result.productionChangesMade, false);
  assert.deepEqual(result.submitted[0].relatedFiles, ["conferenceCenterDistrict.js"]);
  assert.deepEqual(system.director.listTasks()[0].relatedFiles, ["conferenceCenterDistrict.js"]);
  assert.equal(system.director.listTasks().length, 1);
});

test("Development System refuses protected intent before creating tasks", async () => {
  const system = await createDevelopmentSystem();
  const result = await system.submitIntent("Change HERO performance choreography");
  assert.equal(result.status, "owner_approval_required");
  assert.equal(system.director.listTasks().length, 0);
});

test("Development System evaluates actions through canonical ALIVE contracts", async () => {
  const system = await createDevelopmentSystem();
  const allowed = system.evaluateAction("world-layout-navigation", "inspect");
  const protectedAction = system.evaluateAction("world-layout-navigation", "change_camera_or_navigation");
  assert.equal(allowed.authorized, true);
  assert.equal(protectedAction.decision, "owner_approval_required");
});

test("Disabled Development System cannot authorize ALIVE actions", async () => {
  const system = await createDevelopmentSystem();
  system.disable();
  const decision = system.evaluateAction("world-material-quality", "inspect");
  assert.equal(decision.authorized, false);
  assert.equal(decision.decision, "denied");
});

test("World Runner submits a contract-pinned low-risk materials task", async () => {
  const system = await createDevelopmentSystem();
  const result = await system.submitWorldFinding({
    title: "Review Convention Center glass realism",
    description: "Evaluate material response and reflections without changing the building footprint or district layout.",
    type: "improvement",
    area: "world_materials",
    severity: "high",
    filePaths: ["conferenceCenterDistrict.js"],
    acceptanceCriteria: [
      "Preserve the existing Convention Center footprint.",
      "Improve material realism without adding expensive real-time lights."
    ]
  });
  assert.equal(result.runnerId, "world");
  assert.equal(result.contractId, "world-material-quality");
  assert.equal(result.task.runner, "world");
  assert.equal(result.task.contractId, "world-material-quality");
  assert.equal(result.task.status, TASK_STATUS.QUEUED);
  assert.equal(result.task.requiresApproval, false);
});

test("World Runner routes protected layout findings to owner approval", async () => {
  const system = await createDevelopmentSystem();
  const result = await system.submitWorldFinding({
    title: "Consider changing the boardwalk route",
    description: "This is a protected layout proposal and must not be executed autonomously.",
    area: "world_layout",
    type: "opportunity"
  });
  assert.equal(result.contractId, "world-layout-navigation");
  assert.equal(result.task.contractId, "world-layout-navigation");
  assert.equal(result.task.status, TASK_STATUS.PENDING_APPROVAL);
  assert.equal(result.policyDecision.requiresApproval, true);
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


test("Disabled Development System rejects World Runner findings", async () => {
  const system = await createDevelopmentSystem();
  system.disable();
  assert.throws(
    () => system.submitWorldFinding({
      title: "Disabled world finding",
      description: "This must not be accepted.",
      area: "world_materials"
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
