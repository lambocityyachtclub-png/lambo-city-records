/**
 * LAMBO CITY — AUTONOMOUS DEVELOPMENT ENGINE
 * Development System Bootstrap
 *
 * Connects the Registry, Director, Policy, Studio Runner, and an optional
 * explicitly injected one-shot worker. No background process is started.
 */

import { createDevelopmentDirector } from "./developmentDirector.js";
import { createDevelopmentRegistry, MODULE_TYPES } from "./developmentRegistry.js";
import { getDevelopmentPolicy } from "../policies/developmentPolicy.js";
import {
  createStudioDevelopmentRunner,
  STUDIO_RUNNER_ID,
  STUDIO_RUNNER_VERSION
} from "../runners/studio/studioDevelopmentRunner.js";
import {
  createDevelopmentWorker,
  DEVELOPMENT_WORKER_VERSION
} from "./developmentWorker.js";
import { createControlledDevelopmentExecutor } from "../execution/controlledDevelopmentExecutor.js";

export const DEVELOPMENT_SYSTEM_VERSION = "1.1.0";

export const DEVELOPMENT_SYSTEM_STATUS = Object.freeze({
  READY: "ready",
  DISABLED: "disabled"
});

export async function createDevelopmentSystem(options = {}) {
  const {
    storage = null,
    clock,
    workerExecutor = null,
    workerRunnerIds = [STUDIO_RUNNER_ID],
    workerId = "lambo-city-development-worker",
    maxTasksPerRun = 3,
    workerEnabled = false,
    workspaceAdapter = null,
    reviewStore = null,
    allowedPaths = null
  } = options;

  const registry = createDevelopmentRegistry();
  const directorOptions = { storage };
  if (typeof clock === "function") directorOptions.clock = clock;

  const director = createDevelopmentDirector(directorOptions);
  await director.initialize();

  const studioRunner = createStudioDevelopmentRunner({
    developmentDirector: director
  });
  const policy = getDevelopmentPolicy();

  const hasExecutionAdapters = workspaceAdapter !== null || reviewStore !== null || allowedPaths !== null;
  if (workerExecutor && hasExecutionAdapters) {
    throw new Error("Provide either workerExecutor or workspaceAdapter, reviewStore, and allowedPaths; not both.");
  }
  if (hasExecutionAdapters && (!workspaceAdapter || !reviewStore || !Array.isArray(allowedPaths) || allowedPaths.length === 0)) {
    throw new Error("Controlled execution requires workspaceAdapter, reviewStore, and a non-empty allowedPaths array.");
  }

  const controlledExecutor = workerExecutor || (hasExecutionAdapters
    ? createControlledDevelopmentExecutor({
        developmentDirector: director,
        workspaceAdapter,
        reviewStore,
        allowedPaths
      })
    : null);

  const worker = controlledExecutor
    ? createDevelopmentWorker({
        executor: controlledExecutor,
        runnerIds: workerRunnerIds,
        workerId,
        maxTasksPerRun,
        enabled: workerEnabled
      })
    : null;

  registry.registerModule({
    id: "development-policy",
    name: "Development Policy",
    type: MODULE_TYPES.POLICY,
    version: policy.version,
    path: "development/policies/developmentPolicy.js",
    enabled: true,
    capabilities: ["task-protection", "owner-approval", "autonomy-rules"],
    description: "Controls development permissions and owner approval."
  });

  registry.registerModule({
    id: "development-director",
    name: "Development Director",
    type: MODULE_TYPES.ENGINE,
    version: DEVELOPMENT_SYSTEM_VERSION,
    path: "development/engine/developmentDirector.js",
    enabled: true,
    capabilities: ["task-management", "task-prioritization", "approval-management"],
    description: "Coordinates development tasks and their status."
  });

  registry.registerModule({
    id: STUDIO_RUNNER_ID,
    name: "Studio Development Runner",
    type: MODULE_TYPES.RUNNER,
    version: STUDIO_RUNNER_VERSION,
    path: "development/runners/studio/studioDevelopmentRunner.js",
    enabled: true,
    capabilities: [
      "studio-improvements",
      "studio-bug-tracking",
      "beat-lab-improvements",
      "audio-workflow-improvements"
    ],
    description: "Organizes development findings for LAMBO CITY Studio."
  });

  if (worker) {
    registry.registerModule({
      id: "development-worker",
      name: "Development Worker",
      type: MODULE_TYPES.SERVICE,
      version: DEVELOPMENT_WORKER_VERSION,
      path: "development/engine/developmentWorker.js",
      enabled: workerEnabled,
      capabilities: [
        "bounded-task-processing",
        "specialist-runner-dispatch",
        "one-shot-invocation"
      ],
      description: "Processes a bounded batch only through an explicitly injected controlled executor."
    });
  }

  let status = DEVELOPMENT_SYSTEM_STATUS.READY;

  function getStatus() {
    return status;
  }

  function getSnapshot() {
    return {
      version: DEVELOPMENT_SYSTEM_VERSION,
      status,
      registry: registry.getSnapshot(),
      director: director.getSnapshot(),
      studioRunner: studioRunner.getProfile(),
      worker: worker
        ? worker.getSnapshot()
        : {
            configured: false,
            enabled: false,
            reason: "No controlled executor was supplied."
          },
      policy
    };
  }

  function disable() {
    status = DEVELOPMENT_SYSTEM_STATUS.DISABLED;
    studioRunner.setEnabled(false);
    if (worker) {
      worker.setEnabled(false);
      registry.setModuleEnabled("development-worker", false);
    }
    return getStatus();
  }

  function enable() {
    status = DEVELOPMENT_SYSTEM_STATUS.READY;
    studioRunner.setEnabled(true);
    if (worker) {
      worker.setEnabled(workerEnabled);
      registry.setModuleEnabled("development-worker", workerEnabled);
    }
    return getStatus();
  }

  async function runWorkerOnce() {
    if (status !== DEVELOPMENT_SYSTEM_STATUS.READY) {
      return {
        started: false,
        reason: "Development system is disabled.",
        processed: 0,
        results: []
      };
    }
    if (!worker) {
      return {
        started: false,
        reason: "No controlled development executor is configured.",
        processed: 0,
        results: []
      };
    }
    return worker.runOnce();
  }

  function submitStudioFinding(finding) {
    if (status !== DEVELOPMENT_SYSTEM_STATUS.READY) {
      throw new Error("The development system is disabled.");
    }
    return studioRunner.submitFinding(finding);
  }

  function submitStudioFindings(findings) {
    if (status !== DEVELOPMENT_SYSTEM_STATUS.READY) {
      throw new Error("The development system is disabled.");
    }
    return studioRunner.submitFindings(findings);
  }

  return Object.freeze({
    registry,
    director,
    studioRunner,
    getStatus,
    getSnapshot,
    enable,
    disable,
    runWorkerOnce,
    submitStudioFinding,
    submitStudioFindings
  });
}
