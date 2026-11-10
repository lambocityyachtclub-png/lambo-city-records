/**
 * LAMBO CITY ALIVE — specialist task execution bridge.
 *
 * Connects the scoped workforce to isolated workspaces and the controlled
 * executor. All planners, test runners, workspace adapters and review stores
 * must be injected by a trusted host. This module supplies no code generator,
 * shell access, default test runner, Git write, merge or deployment.
 */
import { createDevelopmentWorkspacePipeline } from "./developmentWorkspacePipeline.js";
import { createControlledDevelopmentExecutor } from "./controlledDevelopmentExecutor.js";

function requireObject(value, name) {
  if (!value || typeof value !== "object") {
    throw new Error(name + " must be provided.");
  }
  return value;
}

function requireFunction(value, name) {
  if (typeof value !== "function") {
    throw new Error(name + " must be a function.");
  }
}

export function createSpecialistWorkerExecution(options = {}) {
  const {
    developmentDirector,
    workerRoster,
    workspaceAdapters,
    changePlanners,
    testRunners,
    reviewStore,
    allowedPathsByWorker
  } = options;

  if (!developmentDirector || typeof developmentDirector.claimNextTask !== "function") {
    throw new Error("A valid Development Director is required.");
  }
  if (!workerRoster || typeof workerRoster.listWorkers !== "function") {
    throw new Error("A valid specialist worker roster is required.");
  }
  requireObject(workspaceAdapters, "workspaceAdapters");
  requireObject(changePlanners, "changePlanners");
  requireObject(testRunners, "testRunners");
  requireObject(allowedPathsByWorker, "allowedPathsByWorker");
  if (!reviewStore || typeof reviewStore.createReview !== "function") {
    throw new Error("A trusted reviewStore with createReview() is required.");
  }

  const executors = new Map();
  const pipelines = new Map();
  const profiles = workerRoster.listWorkers();

  for (const worker of profiles) {
    const id = worker.id;
    if (!worker.enabled) continue;

    const workspaceAdapter = workspaceAdapters[id];
    const changePlanner = changePlanners[id];
    const testRunner = testRunners[id];
    const allowedPaths = allowedPathsByWorker[id];

    if (!workspaceAdapter || !changePlanner || !testRunner || !Array.isArray(allowedPaths) || !allowedPaths.length) {
      throw new Error("Missing explicit isolated execution configuration for worker: " + id);
    }

    const pipeline = createDevelopmentWorkspacePipeline({
      workspaceAdapter,
      changePlanner,
      testRunner
    });
    pipelines.set(id, pipeline);

    executors.set(id, createControlledDevelopmentExecutor({
      developmentDirector,
      workspaceAdapter: pipeline,
      reviewStore,
      allowedPaths
    }));
  }

  async function executeNextTask(workerId) {
    const id = String(workerId || "");
    const worker = workerRoster.listWorkers().find(item => item.id === id);
    if (!worker) throw new Error("Unknown specialist worker: " + id);
    if (!worker.enabled) throw new Error("Specialist worker is disabled: " + id);
    const executor = executors.get(id);
    if (!executor) throw new Error("No trusted execution adapters are configured for worker: " + id);
    return executor.executeNextTask({
      runnerId: worker.runnerId,
      workerId: id
    });
  }

  return Object.freeze({
    executeNextTask,
    getConfiguredWorkers() {
      return [...executors.keys()];
    },
    getAllowedPaths(workerId) {
      const executor = executors.get(workerId);
      if (!executor) throw new Error("No execution configuration for worker: " + workerId);
      return executor.getAllowedPaths();
    }
  });
}
