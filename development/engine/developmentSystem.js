
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

export const DEVELOPMENT_SYSTEM_VERSION = "1.0.0";

export const DEVELOPMENT_SYSTEM_STATUS = Object.freeze({
  READY: "ready",
  DISABLED: "disabled"
});

export async function createDevelopmentSystem(options = {}) {
  const {
    storage = null,
    clock
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

  const policy = getDevelopmentPolicy();\n\n  const worker = workerExecutor\n    ? createDevelopmentWorker({\n        executor: workerExecutor,\n        runnerIds: workerRunnerIds,\n        workerId,\n        maxTasksPerRun,\n        enabled: workerEnabled\n      })\n    : null;

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

  if (worker) {\n    registry.registerModule({\n      id: "development-worker",\n      name: "Development Worker",\n      type: MODULE_TYPES.SERVICE,\n      version: DEVELOPMENT_WORKER_VERSION,\n      path: "development/engine/developmentWorker.js",\n      enabled: workerEnabled,\n      capabilities: ["bounded-task-processing", "specialist-runner-dispatch", "one-shot-invocation"],\n      description: "Processes a bounded batch only through an explicitly injected controlled executor."\n    });\n  }\n\n  let status = DEVELOPMENT_SYSTEM_STATUS.READY;

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
      policy
    };
  }

  function disable() {
    status = DEVELOPMENT_SYSTEM_STATUS.DISABLED;
    studioRunner.setEnabled(false);
    return getStatus();
  }

  function enable() {
    status = DEVELOPMENT_SYSTEM_STATUS.READY;
    studioRunner.setEnabled(true);
    return getStatus();
  }

  async function runWorkerOnce() {\n    if (status !== DEVELOPMENT_SYSTEM_STATUS.READY) {\n      return { started: false, reason: "Development system is disabled.", processed: 0, results: [] };\n    }\n    if (!worker) {\n      return { started: false, reason: "No controlled development executor is configured.", processed: 0, results: [] };\n    }\n    return worker.runOnce();\n  }\n\n  function submitStudioFinding(finding) {
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
    getStatus,
    getSnapshot,
    enable,
    disable,
    submitStudioFinding,
    submitStudioFindings
  });
}
