
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
  createSpecialistWorkerRoster
} from "./specialistWorkerRoster.js";

import {
  createSpecialistWorkerExecution
} from "../execution/specialistWorkerExecution.js";

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

  const workerRoster = createSpecialistWorkerRoster({
    developmentDirector: director
  });

  const workerExecution = options.specialistExecution
    ? createSpecialistWorkerExecution({
        developmentDirector: director,
        workerRoster,
        ...options.specialistExecution
      })
    : null;

  const policy = getDevelopmentPolicy();

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

  // Register the workforce as one managed module. Individual workers
  // remain scoped entries within the roster rather than duplicate modules.
  registry.registerModule({
    id: "specialist-worker-roster",
    name: "Specialist Development Workforce",
    type: MODULE_TYPES.RUNNER,
    version: workerRoster.version,
    path: "development/engine/specialistWorkerRoster.js",
    enabled: true,
    capabilities: workerRoster.listWorkers().flatMap(worker => worker.capabilities),
    description: "Coordinates eight domain-scoped development specialists."
  });

  let status = DEVELOPMENT_SYSTEM_STATUS.READY;

  function getStatus() {
    return status;
  }

  function assertReady() {
    if (status !== DEVELOPMENT_SYSTEM_STATUS.READY) {
      throw new Error("The development system is disabled.");
    }
  }

  function getSnapshot() {
    return {
      version: DEVELOPMENT_SYSTEM_VERSION,
      status,
      registry: registry.getSnapshot(),
      director: director.getSnapshot(),
      studioRunner: studioRunner.getProfile(),
      workers: workerRoster.listWorkers(),
      configuredExecutionWorkers: workerExecution
        ? workerExecution.getConfiguredWorkers()
        : [],
      policy
    };
  }

  const directorView = Object.freeze({
    initialize: async (...args) => { assertReady(); return director.initialize(...args); },
    createTask: async (...args) => { assertReady(); return director.createTask(...args); },
    approveTask: async (...args) => { assertReady(); return director.approveTask(...args); },
    rejectTask: async (...args) => { assertReady(); return director.rejectTask(...args); },
    claimNextTask: async (...args) => { assertReady(); return director.claimNextTask(...args); },
    updateTask: async (...args) => { assertReady(); return director.updateTask(...args); },
    getTask: director.getTask,
    listTasks: director.listTasks,
    getSnapshot: director.getSnapshot
  });

  const studioRunnerView = Object.freeze({
    getProfile: studioRunner.getProfile,
    submitFinding: async (...args) => { assertReady(); return studioRunner.submitFinding(...args); },
    submitFindings: async (...args) => { assertReady(); return studioRunner.submitFindings(...args); },
    setEnabled: value => { assertReady(); return studioRunner.setEnabled(value); }
  });

  const workerRosterView = Object.freeze({
    version: workerRoster.version,
    listWorkers: (...args) => workerRoster.listWorkers(...args),
    setWorkerEnabled: (workerId, enabled) => {
      assertReady();
      return workerRoster.setWorkerEnabled(workerId, enabled);
    },
    submitFinding: async (workerId, finding) => {
      assertReady();
      return workerRoster.submitFinding(workerId, finding);
    }
  });

  const workerExecutionView = workerExecution ? Object.freeze({
    executeNextTask: workerId => {
      assertReady();
      return workerExecution.executeNextTask(workerId);
    },
    getConfiguredWorkers: () => workerExecution.getConfiguredWorkers(),
    getAllowedPaths: workerId => workerExecution.getAllowedPaths(workerId)
  }) : null;

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

  function submitStudioFinding(finding) {
    assertReady();
    return studioRunner.submitFinding(finding);
  }

  function submitStudioFindings(findings) {
    assertReady();
    return studioRunner.submitFindings(findings);
  }

  return Object.freeze({
    registry,
    director: directorView,
    studioRunner: studioRunnerView,
    workerRoster: workerRosterView,
    getStatus,
    getSnapshot,
    enable,
    disable,
    submitStudioFinding,
    submitStudioFindings,
    submitWorkerFinding: (workerId, finding) => workerRosterView.submitFinding(workerId, finding),
    executeWorkerTask: workerId => {
      assertReady();
      if (!workerExecutionView) {
        throw new Error("Specialist execution adapters have not been configured by the trusted host.");
      }
      return workerExecutionView.executeNextTask(workerId);
    },
    getWorkerExecution: () => workerExecutionView
  });
}
