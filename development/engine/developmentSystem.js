
/**
 * LAMBO CITY — AUTONOMOUS DEVELOPMENT ENGINE
 * Development System Bootstrap
 *
 * Connects the Registry, Director, Policy, and Studio Runner.
 *
 * This module does not:
 * - Modify game files.
 * - Execute generated code.
 * - Deploy changes.
 * - Start a background worker.
 */

import {
  createDevelopmentDirector
} from "./developmentDirector.js";

import {
  createDevelopmentRegistry,
  MODULE_TYPES
} from "./developmentRegistry.js";

import {
  getDevelopmentPolicy
} from "../policies/developmentPolicy.js";

import {
  createStudioDevelopmentRunner,
  STUDIO_RUNNER_ID,
  STUDIO_RUNNER_VERSION
} from "../runners/studio/studioDevelopmentRunner.js";

import {
  createDevelopmentWorker,
  DEVELOPMENT_WORKER_VERSION
} from "./developmentWorker.js";

export const DEVELOPMENT_SYSTEM_VERSION = "1.0.0";

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
    maxTasksPerRun = 3
  } = options;

  const registry = createDevelopmentRegistry();

  const directorOptions = { storage };

  if (typeof clock === "function") {
    directorOptions.clock = clock;
  }

  const director = createDevelopmentDirector(
    directorOptions
  );

  await director.initialize();

  const studioRunner = createStudioDevelopmentRunner({
    developmentDirector: director
  });

  const policy = getDevelopmentPolicy();

  const worker = workerExecutor
    ? createDevelopmentWorker({
        executor: workerExecutor,
        runnerIds: workerRunnerIds,
        workerId,
        maxTasksPerRun
      })
    : null;

  registry.registerModule({
    id: "development-policy",
    name: "Development Policy",
    type: MODULE_TYPES.POLICY,
    version: policy.version,
    path: "development/policies/developmentPolicy.js",
    enabled: true,
    capabilities: [
      "task-protection",
      "owner-approval",
      "autonomy-rules"
    ],
    description:
      "Controls development permissions and owner approval."
  });

  registry.registerModule({
    id: "development-director",
    name: "Development Director",
    type: MODULE_TYPES.ENGINE,
    version: DEVELOPMENT_SYSTEM_VERSION,
    path: "development/engine/developmentDirector.js",
    enabled: true,
    capabilities: [
      "task-management",
      "task-prioritization",
      "approval-management"
    ],
    description:
      "Coordinates development tasks and their status."
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
    description:
      "Organizes development findings for LAMBO CITY Studio."
  });

  registry.registerModule({
    id: "development-worker",
    name: "Development Worker",
    type: MODULE_TYPES.SERVICE,
    version: DEVELOPMENT_WORKER_VERSION,
    path: "development/engine/developmentWorker.js",
    enabled: worker !== null,
    capabilities: [
      "bounded-task-processing",
      "specialist-runner-dispatch",
      "one-shot-background-invocation"
    ],
    description:
      "Runs a bounded batch through an explicitly supplied controlled executor."
  });

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
      worker: worker ? worker.getSnapshot() : {
        version: DEVELOPMENT_WORKER_VERSION,
        enabled: false,
        mode: "one-shot",
        reason: "A controlled executor has not been supplied."
      },
      policy
    };
  }

  function disable() {
    status = DEVELOPMENT_SYSTEM_STATUS.DISABLED;
    studioRunner.setEnabled(false);
    worker?.setEnabled(false);
    return getStatus();
  }

  function enable() {
    status = DEVELOPMENT_SYSTEM_STATUS.READY;
    studioRunner.setEnabled(true);
    worker?.setEnabled(true);
    return getStatus();
  }

  async function runWorkerOnce() {
    if (status !== DEVELOPMENT_SYSTEM_STATUS.READY) {
      throw new Error("The development system is disabled.");
    }

    if (!worker) {
      throw new Error(
        "The development worker is not configured. Supply a controlled executor."
      );
    }

    return worker.runOnce();
  }

  function submitStudioFinding(finding) {
    if (status !== DEVELOPMENT_SYSTEM_STATUS.READY) {
      throw new Error(
        "The development system is disabled."
      );
    }

    return studioRunner.submitFinding(finding);
  }

  function submitStudioFindings(findings) {
    if (status !== DEVELOPMENT_SYSTEM_STATUS.READY) {
      throw new Error(
        "The development system is disabled."
      );
    }

    return studioRunner.submitFindings(findings);
  }

  return Object.freeze({
    registry,
    director,
    studioRunner,
    worker,
    runWorkerOnce,
    getStatus,
    getSnapshot,
    enable,
    disable,
    submitStudioFinding,
    submitStudioFindings
  });
}
