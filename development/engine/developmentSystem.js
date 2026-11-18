
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
  createControlledDevelopmentExecutor
} from "../execution/controlledDevelopmentExecutor.js";

import {
  createOwnerReviewFeedback
} from "./ownerReviewFeedback.js";

import {
  createDevelopmentRegistry,
  MODULE_TYPES
} from "./developmentRegistry.js";

import {
  getDevelopmentPolicy
} from "../policies/developmentPolicy.js";

import {
  createWorldDevelopmentRunner,
  WORLD_RUNNER_ID,
  WORLD_RUNNER_VERSION
} from "../runners/world/worldDevelopmentRunner.js";

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
    clock,
    worldExecution = null
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

  const worldRunner = createWorldDevelopmentRunner({
    developmentDirector: director
  });

  // Execution is opt-in and requires explicit isolated workspace,
  // review storage, and path allowlist adapters from the host.
  const worldExecutor = worldExecution
    ? createControlledDevelopmentExecutor({
        developmentDirector: director,
        workspaceAdapter: worldExecution.workspaceAdapter,
        reviewStore: worldExecution.reviewStore,
        allowedPaths: worldExecution.allowedPaths
      })
    : null;

  const ownerReviewFeedback = worldExecution?.reviewStore?.requestRevision
    ? createOwnerReviewFeedback({
        developmentDirector: director,
        reviewStore: worldExecution.reviewStore
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

  registry.registerModule({
    id: WORLD_RUNNER_ID,
    name: "World Development Runner",
    type: MODULE_TYPES.RUNNER,
    version: WORLD_RUNNER_VERSION,
    path: "development/runners/world/worldDevelopmentRunner.js",
    enabled: true,
    capabilities: [
      "world_environment_improvements",
      "water_and_marina_improvements",
      "architecture_and_landscaping",
      "world_performance_improvements",
      "preserve_approved_world_layout"
    ],
    description:
      "Organizes LAMBO CITY world improvements while preserving approved geography and working systems."
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
      worldRunner: worldRunner.getProfile(),
      worldExecutor: worldExecutor
        ? { enabled: true, allowedPaths: worldExecutor.getAllowedPaths() }
        : { enabled: false, reason: "Explicit execution adapters are not configured." },
      policy
    };
  }

  function disable() {
    status = DEVELOPMENT_SYSTEM_STATUS.DISABLED;
    studioRunner.setEnabled(false);
    worldRunner.setEnabled(false);
    return getStatus();
  }

  function enable() {
    status = DEVELOPMENT_SYSTEM_STATUS.READY;
    studioRunner.setEnabled(true);
    worldRunner.setEnabled(true);
    return getStatus();
  }

  async function executeNextWorldTask(input = {}) {
    if (status !== DEVELOPMENT_SYSTEM_STATUS.READY) {
      throw new Error("The development system is disabled.");
    }
    if (!worldExecutor) {
      throw new Error("World execution is not configured. Supply an isolated workspace adapter, review store, and explicit allowed paths.");
    }
    return worldExecutor.executeNextTask({
      ...input,
      runnerId: WORLD_RUNNER_ID
    });
  }

  async function markWorldReviewPerfect(input = {}) {
    if (!ownerReviewFeedback) {
      throw new Error("Owner review feedback is not configured with a persistent review store.");
    }
    return ownerReviewFeedback.markPerfect(input);
  }

  async function requestWorldReviewChanges(input = {}) {
    if (!ownerReviewFeedback) {
      throw new Error("Owner review feedback is not configured with a persistent review store.");
    }
    return ownerReviewFeedback.requestChange(input);
  }

  function submitStudioFinding(finding) {
    if (status !== DEVELOPMENT_SYSTEM_STATUS.READY) {
      throw new Error(
        "The development system is disabled."
      );
    }

    return studioRunner.submitFinding(finding);
  }

  function submitWorldFinding(finding) {
    if (status !== DEVELOPMENT_SYSTEM_STATUS.READY) {
      throw new Error("The development system is disabled.");
    }
    return worldRunner.submitFinding(finding);
  }

  function submitWorldFindings(findings) {
    if (status !== DEVELOPMENT_SYSTEM_STATUS.READY) {
      throw new Error("The development system is disabled.");
    }
    return worldRunner.submitFindings(findings);
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
    worldRunner,
    worldExecutor,
    getStatus,
    getSnapshot,
    enable,
    disable,
    submitStudioFinding,
    submitStudioFindings,
    submitWorldFinding,
    submitWorldFindings,
    executeNextWorldTask,
    markWorldReviewPerfect,
    requestWorldReviewChanges
  });
}
