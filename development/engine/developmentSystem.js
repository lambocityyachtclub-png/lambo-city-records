
/**
 * LAMBO CITY — AUTONOMOUS DEVELOPMENT ENGINE
 * Development System Bootstrap
 *
 * Purpose:
 * - Connect the development engine modules.
 * - Create the central Development Director.
 * - Register the Studio Development Runner.
 * - Keep development separate from the live game.
 *
 * Important:
 * - This is a setup layer, not a background worker.
 * - It does not write to project files.
 * - It does not execute generated code.
 * - It does not deploy changes.
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

/**
 * Create and connect the LAMBO CITY development system.
 *
 * Optional:
 * storage:
 *   A future-compatible storage adapter for the Director.
 *
 * clock:
 *   An optional clock function for task timestamps.
 */
export function createDevelopmentSystem(options = {}) {
  const {
    storage = null,
    clock
  } = options;

  const registry = createDevelopmentRegistry();

  const directorOptions = {
    storage
  };

  if (typeof clock === "function") {
    directorOptions.clock = clock;
  }

  const director = createDevelopmentDirector(
    directorOptions
  );

  const studioRunner = createStudioDevelopmentRunner({
    developmentDirector: director
  });

  const policy = getDevelopmentPolicy();

  registry.registerModule({
    id: "development-policy",
    name: "Development Policy",
    type: MODULE_TYPES.POLICY,
    version: policy.version,
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
    getStatus,
    getSnapshot,
    enable,
    disable,
    submitStudioFinding,
    submitStudioFindings
  });
}
