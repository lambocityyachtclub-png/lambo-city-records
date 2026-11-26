
import test from "node:test";
import assert from "node:assert/strict";

import {
  createDevelopmentDirector,
  TASK_STATUS
} from "../engine/developmentDirector.js";

import {
  createControlledDevelopmentExecutor
} from "../execution/controlledDevelopmentExecutor.js";

async function createTestSetup(options = {}) {
  const director = createDevelopmentDirector();

  await director.initialize();

  const task = await director.createTask({
    title: "Test controlled execution",
    description: "Verify isolated development execution.",
    area: "studio_audio",
    runner: "world"
    ,contractId: options.contractId === null ? undefined : (options.contractId || "alive-development-core")
  });

  const calls = {
    workspace: 0,
    prepare: 0,
    tests: 0,
    review: 0,
    destroy: 0
  };

  const workspaceAdapter = {
    async createWorkspace() {
      calls.workspace++;

      return {
        workspaceId: "isolated-test-workspace"
      };
    },

    async prepareChanges() {
      calls.prepare++;

      return {
        changedFiles: options.changedFiles || [
          "development/engine/example.js"
        ],
        changes: "Test proposed changes."
      };
    },

    async runTests() {
      calls.tests++;

      return options.testResults || {
        passed: true,
        total: 5,
        failed: 0
      };
    },

    async destroyWorkspace() {
      calls.destroy++;
    }
  };

  const reviews = [];

  const reviewStore = {
    async createReview(review) {
      calls.review++;

      const savedReview = {
        id: "review_test_001",
        ...review
      };

      reviews.push(savedReview);

      return savedReview;
    }
  };

  const executor = createControlledDevelopmentExecutor({
    developmentDirector: director,
    workspaceAdapter,
    reviewStore,
    allowedPaths: options.allowedPaths || [
      "development/engine"
    ]
  });

  return {
    director,
    task,
    executor,
    calls,
    reviews
  };
}

test("Executor requires a Development Director", () => {
  assert.throws(
    () => createControlledDevelopmentExecutor({
      workspaceAdapter: {},
      reviewStore: {},
      allowedPaths: ["development/engine"]
    }),
    /Development Director is required/
  );
});

test("Executor requires an isolated workspace adapter", async () => {
  const director = createDevelopmentDirector();

  await director.initialize();

  assert.throws(
    () => createControlledDevelopmentExecutor({
      developmentDirector: director,
      reviewStore: {
        createReview: async () => ({})
      },
      allowedPaths: ["development/engine"]
    }),
    /workspace adapter is required/
  );
});

test("Executor requires an explicit allowed path list", async () => {
  const director = createDevelopmentDirector();

  await director.initialize();

  const workspaceAdapter = {
    createWorkspace: async () => ({}),
    prepareChanges: async () => ({}),
    runTests: async () => ({ passed: true })
  };

  assert.throws(
    () => createControlledDevelopmentExecutor({
      developmentDirector: director,
      workspaceAdapter,
      reviewStore: {
        createReview: async () => ({})
      }
    }),
    /allowedPaths array is required/
  );
});

test("Executor rejects unsafe allowed paths", async () => {
  const director = createDevelopmentDirector();

  await director.initialize();

  const workspaceAdapter = {
    createWorkspace: async () => ({}),
    prepareChanges: async () => ({}),
    runTests: async () => ({ passed: true })
  };

  assert.throws(
    () => createControlledDevelopmentExecutor({
      developmentDirector: director,
      workspaceAdapter,
      reviewStore: {
        createReview: async () => ({})
      },
      allowedPaths: [
        "../live-game"
      ]
    }),
    /Unsafe file path/
  );
});

test("Executor does nothing when no queued task exists", async () => {
  const {
    executor,
    calls
  } = await createTestSetup();

  const result = await executor.executeNextTask({
    runnerId: "unknown-runner"
  });

  assert.equal(result.executed, false);
  assert.equal(calls.workspace, 0);
  assert.equal(calls.prepare, 0);
  assert.equal(calls.tests, 0);
  assert.equal(calls.review, 0);
});

test("Executor sends successful changes to owner review", async () => {
  const {
    director,
    task,
    executor,
    calls,
    reviews
  } = await createTestSetup();

  const result = await executor.executeNextTask({
    runnerId: "world"
  });

  assert.equal(result.executed, true);
  assert.equal(result.status, TASK_STATUS.REVIEW);
  assert.equal(result.taskId, task.id);
  assert.equal(result.productionChangesMade, false);

  assert.equal(calls.workspace, 1);
  assert.equal(calls.prepare, 1);
  assert.equal(calls.tests, 1);
  assert.equal(calls.review, 1);
  assert.equal(calls.destroy, 1);

  assert.equal(reviews.length, 1);
  assert.equal(
    reviews[0].status,
    "awaiting_owner_review"
  );

  assert.deepEqual(
    result.changedFiles,
    ["development/engine/example.js"]
  );

  const updatedTask = director.getTask(task.id);

  assert.equal(updatedTask.status, TASK_STATUS.REVIEW);
  assert.equal(updatedTask.result.success, true);
});

test("Executor blocks tasks without a pinned ALIVE contract before creating a workspace", async () => {
  const { director, task, executor, calls } = await createTestSetup({ contractId: null });
  const result = await executor.executeNextTask({ runnerId: "world" });
  assert.equal(result.status, TASK_STATUS.BLOCKED);
  assert.match(result.reason, /no pinned ALIVE module contract/i);
  assert.equal(calls.workspace, 0);
  assert.equal(director.getTask(task.id).status, TASK_STATUS.BLOCKED);
});

test("Executor enforces the contract allowlist even when the workspace allowlist is broader", async () => {
  const { director, task, executor, calls, reviews } = await createTestSetup({
    changedFiles: ["development/policies/developmentPolicy.js"],
    allowedPaths: ["development"]
  });
  const result = await executor.executeNextTask({ runnerId: "world" });
  assert.equal(result.status, TASK_STATUS.BLOCKED);
  assert.match(result.reason, /ALIVE contract blocked/);
  assert.equal(calls.tests, 0);
  assert.equal(calls.review, 0);
  assert.equal(reviews.length, 0);
  assert.equal(director.getTask(task.id).status, TASK_STATUS.BLOCKED);
});

test("Observer-only Studio contract cannot prepare code changes", async () => {
  const { director, task, executor, calls } = await createTestSetup({
    contractId: "studio-deferred"
  });
  const result = await executor.executeNextTask({ runnerId: "world" });
  assert.equal(result.status, TASK_STATUS.BLOCKED);
  assert.match(result.reason, /ALIVE contract blocked/);
  assert.equal(calls.tests, 0);
  assert.equal(director.getTask(task.id).status, TASK_STATUS.BLOCKED);
});

test("Executor blocks empty proposals before tests and owner review", async () => {
  const { director, task, executor, calls, reviews } = await createTestSetup({
    changedFiles: []
  });

  const result = await executor.executeNextTask({ runnerId: "world" });

  assert.equal(result.status, TASK_STATUS.BLOCKED);
  assert.match(result.reason, /No changed files were produced/);
  assert.equal(calls.tests, 0);
  assert.equal(calls.review, 0);
  assert.equal(calls.destroy, 1);
  assert.equal(reviews.length, 0);
  assert.equal(director.getTask(task.id).status, TASK_STATUS.BLOCKED);
});

test("Executor blocks a task when automated tests fail", async () => {
  const {
    director,
    task,
    executor,
    calls,
    reviews
  } = await createTestSetup({
    testResults: {
      passed: false,
      total: 5,
      failed: 2
    }
  });

  const result = await executor.executeNextTask({
    runnerId: "world"
  });

  assert.equal(result.status, TASK_STATUS.BLOCKED);
  assert.equal(result.taskId, task.id);
  assert.equal(calls.tests, 1);
  assert.equal(calls.review, 0);
  assert.equal(calls.destroy, 1);
  assert.equal(reviews.length, 0);

  const updatedTask = director.getTask(task.id);

  assert.equal(updatedTask.status, TASK_STATUS.BLOCKED);
});

test("Executor blocks changes outside the allowed paths", async () => {
  const {
    director,
    task,
    executor,
    calls,
    reviews
  } = await createTestSetup({
    changedFiles: [
      "src/main.js"
    ]
  });

  const result = await executor.executeNextTask({
    runnerId: "world"
  });

  assert.equal(result.status, TASK_STATUS.BLOCKED);
  assert.match(result.reason, /outside the authorized paths/);

  assert.equal(calls.tests, 0);
  assert.equal(calls.review, 0);
  assert.equal(reviews.length, 0);

  const updatedTask = director.getTask(task.id);

  assert.equal(updatedTask.status, TASK_STATUS.BLOCKED);
});

test("Executor blocks directory traversal in proposed changes", async () => {
  const {
    director,
    task,
    executor,
    calls,
    reviews
  } = await createTestSetup({
    changedFiles: [
      "development/engine/../../src/main.js"
    ]
  });

  const result = await executor.executeNextTask({
    runnerId: "world"
  });

  assert.equal(result.status, TASK_STATUS.BLOCKED);
  assert.match(result.reason, /Unsafe file path/);

  assert.equal(calls.tests, 0);
  assert.equal(calls.review, 0);
  assert.equal(reviews.length, 0);

  const updatedTask = director.getTask(task.id);

  assert.equal(updatedTask.status, TASK_STATUS.BLOCKED);
});

test("Executor blocks changes to protected directories", async () => {
  const {
    director,
    task,
    executor,
    calls,
    reviews
  } = await createTestSetup({
    changedFiles: [
      "development/engine/node_modules/test.js"
    ]
  });

  const result = await executor.executeNextTask({
    runnerId: "world"
  });

  assert.equal(result.status, TASK_STATUS.BLOCKED);
  assert.match(result.reason, /Protected directory/);

  assert.equal(calls.tests, 0);
  assert.equal(calls.review, 0);
  assert.equal(reviews.length, 0);

  const updatedTask = director.getTask(task.id);

  assert.equal(updatedTask.status, TASK_STATUS.BLOCKED);
});

test("Executor exposes a copy of its allowed paths", async () => {
  const {
    executor
  } = await createTestSetup();

  const paths = executor.getAllowedPaths();

  assert.deepEqual(
    paths,
    ["development/engine"]
  );

  paths.push("src");

  assert.deepEqual(
    executor.getAllowedPaths(),
    ["development/engine"]
  );
});

test("Executor blocks a task when workspace creation fails", async () => {
  const director = createDevelopmentDirector();

  await director.initialize();

  const task = await director.createTask({
    title: "Workspace failure test",
    area: "studio_audio",
    runner: "world",
    contractId: "alive-development-core"
  });

  const executor = createControlledDevelopmentExecutor({
    developmentDirector: director,

    workspaceAdapter: {
      async createWorkspace() {
        throw new Error("Workspace creation failed.");
      },

      async prepareChanges() {
        return {
          changedFiles: []
        };
      },

      async runTests() {
        return {
          passed: true
        };
      }
    },

    reviewStore: {
      async createReview() {
        return {};
      }
    },

    allowedPaths: [
      "development/engine"
    ]
  });

  const result = await executor.executeNextTask({
    runnerId: "world"
  });

  assert.equal(result.status, TASK_STATUS.BLOCKED);
  assert.match(result.reason, /Workspace creation failed/);

  const updatedTask = director.getTask(task.id);

  assert.equal(updatedTask.status, TASK_STATUS.BLOCKED);
});
