/**
 * LAMBO CITY — AUTONOMOUS DEVELOPMENT ENGINE
 * Development System Bootstrap
 *
 * Connects the Registry, Director, Policy, Studio and World specialists,
 * and an optional explicitly injected one-shot worker. No background
 * process is started.
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
  createWorldDevelopmentRunner,
  WORLD_RUNNER_ID,
  WORLD_RUNNER_VERSION
} from "../runners/world/worldDevelopmentRunner.js";
import {
  createDevelopmentWorker,
  DEVELOPMENT_WORKER_VERSION
} from "./developmentWorker.js";
import { createControlledDevelopmentExecutor } from "../execution/controlledDevelopmentExecutor.js";
import { createLivingContractEngine } from "../contracts/livingContractEngine.js";
import { createLocalGitWorkspaceAdapter } from "../execution/localGitWorkspaceAdapter.js";
import { createLocalJsonReviewStore } from "../execution/localJsonReviewStore.js";

export const DEVELOPMENT_SYSTEM_VERSION = "1.3.0";

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
    allowedPaths = null,
    localExecutionOptions = null
  } = options;

  const registry = createDevelopmentRegistry();
  const directorOptions = { storage };
  if (typeof clock === "function") directorOptions.clock = clock;

  const director = createDevelopmentDirector(directorOptions);
  await director.initialize();

  const studioRunner = createStudioDevelopmentRunner({
    developmentDirector: director
  });
  const worldRunner = createWorldDevelopmentRunner({
    developmentDirector: director
  });
  const contractEngine = createLivingContractEngine({ worldRunner });
  const policy = getDevelopmentPolicy();

  const hasInjectedAdapters = workspaceAdapter !== null || reviewStore !== null || allowedPaths !== null;
  if (localExecutionOptions && hasInjectedAdapters) {
    throw new Error("Provide localExecutionOptions or injected execution adapters, not both.");
  }
  if (workerExecutor && (hasInjectedAdapters || localExecutionOptions)) {
    throw new Error("Provide either workerExecutor or a controlled workspace configuration, not both.");
  }
  if (hasInjectedAdapters && (!workspaceAdapter || !reviewStore || !Array.isArray(allowedPaths) || allowedPaths.length === 0)) {
    throw new Error("Controlled execution requires workspaceAdapter, reviewStore, and a non-empty allowedPaths array.");
  }

  let resolvedWorkspaceAdapter = workspaceAdapter;
  let resolvedReviewStore = reviewStore;
  let resolvedAllowedPaths = allowedPaths;
  if (localExecutionOptions) {
    if (typeof localExecutionOptions.reviewDirectory !== "string" || !localExecutionOptions.reviewDirectory.trim()) {
      throw new Error("localExecutionOptions.reviewDirectory is required for persistent owner reviews.");
    }
    resolvedWorkspaceAdapter = createLocalGitWorkspaceAdapter(localExecutionOptions);
    resolvedReviewStore = createLocalJsonReviewStore({
      directory: localExecutionOptions.reviewDirectory,
      repositoryRoot: localExecutionOptions.repositoryRoot
    });
    resolvedAllowedPaths = localExecutionOptions.allowedPaths;
  }

  const hasExecutionAdapters = hasInjectedAdapters || !!localExecutionOptions;
  const controlledExecutor = workerExecutor || (hasExecutionAdapters
    ? createControlledDevelopmentExecutor({
        developmentDirector: director,
        workspaceAdapter: resolvedWorkspaceAdapter,
        reviewStore: resolvedReviewStore,
        allowedPaths: resolvedAllowedPaths
      })
    : null);

  // World execution is available only when the host explicitly supplies
  // isolated local Git workspaces or all three controlled adapters.
  // Neither mode commits, merges, deploys, or writes to production.
  const worldExecutor = hasExecutionAdapters ? controlledExecutor : null;

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
    description: "Organizes LAMBO CITY world improvements while preserving approved geography and working systems."
  });

  registry.registerModule({
    id: "living-contract-engine",
    name: "Living Contract Engine",
    type: MODULE_TYPES.ENGINE,
    version: "1.0.0",
    path: "development/contracts/livingContractEngine.js",
    enabled: true,
    capabilities: ["deterministic-intent-resolution", "dependency-graph-planning", "coordinated-task-batches"],
    description: "Resolves creator intent into dependency-aware World task batches without paid AI or sandbox services."
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
      worldRunner: worldRunner.getProfile(),
      contractEngine: {
        status: "ready",
        mode: "deterministic_no_paid_ai",
        contracts: contractEngine.listContracts().length,
        executionEnabled: !!worldExecutor,
        executionMode: localExecutionOptions ? "local_git_worktree" : (worldExecutor ? "injected_adapter" : "disabled")
      },
      worldExecutor: {
        enabled: !!worldExecutor,
        runnerId: WORLD_RUNNER_ID,
        mode: "owner-triggered",
        productionWrites: false
      },
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
    worldRunner.setEnabled(false);
    if (worker) {
      worker.setEnabled(false);
      registry.setModuleEnabled("development-worker", false);
    }
    return getStatus();
  }

  function enable() {
    status = DEVELOPMENT_SYSTEM_STATUS.READY;
    studioRunner.setEnabled(true);
    worldRunner.setEnabled(true);
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

  function submitWorldIntent(intent) {
    if (status !== DEVELOPMENT_SYSTEM_STATUS.READY) {
      throw new Error("The development system is disabled.");
    }
    return contractEngine.submitIntent(intent);
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

  return Object.freeze({
    registry,
    director,
    studioRunner,
    worldRunner,
    contractEngine,
    worldExecutor,
    getStatus,
    getSnapshot,
    enable,
    disable,
    runWorkerOnce,
    executeNextWorldTask,
    submitStudioFinding,
    submitStudioFindings,
    submitWorldIntent,
    submitWorldFinding,
    submitWorldFindings
  });
}
