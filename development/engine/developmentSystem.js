/**
 * LAMBO CITY — ALIVE DEVELOPMENT SYSTEM
 *
 * Combines specialist task intake, policy, durable task storage,
 * isolated proposal execution, and a bounded one-shot worker.
 * No timer or background process is started by this module.
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
import { createOwnerReviewFeedback } from "./ownerReviewFeedback.js";
import {
  createDevelopmentProposalProvider,
  createProposalWorkspaceAdapter
} from "../providers/developmentProposalProvider.js";
import { createIsolatedProposalWorkspaceAdapter } from "../execution/isolatedProposalWorkspaceAdapter.js";

export const DEVELOPMENT_SYSTEM_VERSION = "1.2.0";
export const DEVELOPMENT_SYSTEM_STATUS = Object.freeze({
  READY: "ready",
  DISABLED: "disabled"
});

export async function createDevelopmentSystem(options = {}) {
  const {
    storage = null,
    clock,
    workerExecutor = null,
    workerId = "lambo-city-development-worker",
    workerEnabled = false,
    worldExecution = null
  } = options;

  const workerRunnerIds = options.workerRunnerIds ||
    (worldExecution ? [WORLD_RUNNER_ID] : [STUDIO_RUNNER_ID]);
  const maxTasksPerRun = options.maxTasksPerRun ??
    (worldExecution ? 1 : 3);

  const registry = createDevelopmentRegistry();
  const directorOptions = { storage };
  if (typeof clock === "function") directorOptions.clock = clock;
  const director = createDevelopmentDirector(directorOptions);
  await director.initialize();

  const studioRunner = createStudioDevelopmentRunner({ developmentDirector: director });
  const worldRunner = createWorldDevelopmentRunner({ developmentDirector: director });
  const policy = getDevelopmentPolicy();

  let workspaceAdapter = options.workspaceAdapter || null;
  let reviewStore = options.reviewStore || null;
  let allowedPaths = options.allowedPaths || null;

  if (worldExecution) {
    if (workspaceAdapter || reviewStore || allowedPaths) {
      throw new Error("Provide worldExecution or direct execution adapters, not both.");
    }
    workspaceAdapter = worldExecution.proposalProvider
      ? (
          typeof worldExecution.testRunner === "function"
            ? createIsolatedProposalWorkspaceAdapter({
                workspaceAdapter: worldExecution.workspaceAdapter,
                testRunner: worldExecution.testRunner,
                allowedPaths: worldExecution.allowedPaths,
                projectContext: worldExecution.projectContext
              })
            : worldExecution.workspaceAdapter
        )
      : worldExecution.workspaceAdapter;
    if (worldExecution.proposalProvider) {
      workspaceAdapter = createProposalWorkspaceAdapter({
        workspaceAdapter,
        proposalProvider: createDevelopmentProposalProvider({
          provider: worldExecution.proposalProvider,
          allowedPaths: worldExecution.allowedPaths
        }),
        allowedPaths: worldExecution.allowedPaths
      });
    }
    reviewStore = worldExecution.reviewStore;
    allowedPaths = worldExecution.allowedPaths;
  }

  const hasExecutionAdapters =
    workspaceAdapter !== null || reviewStore !== null || allowedPaths !== null;
  if (workerExecutor && hasExecutionAdapters) {
    throw new Error("Provide either workerExecutor or workspaceAdapter, reviewStore, and allowedPaths; not both.");
  }
  if (hasExecutionAdapters &&
      (!workspaceAdapter || !reviewStore ||
       !Array.isArray(allowedPaths) || allowedPaths.length === 0)) {
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

  const ownerReviewFeedback =
    reviewStore &&
    typeof reviewStore.getReview === "function" &&
    typeof reviewStore.decideReview === "function" &&
    typeof reviewStore.requestRevision === "function"
      ? createOwnerReviewFeedback({ developmentDirector: director, reviewStore })
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
  if (worker) {
    registry.registerModule({
      id: "development-worker",
      name: "Development Worker",
      type: MODULE_TYPES.SERVICE,
      version: DEVELOPMENT_WORKER_VERSION,
      path: "development/engine/developmentWorker.js",
      enabled: workerEnabled,
      capabilities: ["bounded-task-processing", "specialist-runner-dispatch", "one-shot-invocation"],
      description: "Processes a bounded batch only through an explicitly injected controlled executor."
    });
  }

  let status = DEVELOPMENT_SYSTEM_STATUS.READY;

  function getSnapshot() {
    const workerSnapshot = worker?.getSnapshot() || {
      configured: false,
      enabled: false,
      reason: "No controlled executor was supplied."
    };
    return {
      version: DEVELOPMENT_SYSTEM_VERSION,
      status,
      registry: registry.getSnapshot(),
      director: director.getSnapshot(),
      studioRunner: studioRunner.getProfile(),
      worldRunner: worldRunner.getProfile(),
      worker: workerSnapshot,
      worldExecutor: {
        enabled: !!controlledExecutor,
        allowedPaths: controlledExecutor?.getAllowedPaths?.() || []
      },
      proposalProvider: worldExecution?.proposalProvider
        ? { enabled: true, mode: "injected_vendor_neutral_adapter" }
        : { enabled: false, reason: "No proposal provider has been explicitly configured." },
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
    return status;
  }

  function enable() {
    status = DEVELOPMENT_SYSTEM_STATUS.READY;
    studioRunner.setEnabled(true);
    worldRunner.setEnabled(true);
    if (worker) {
      worker.setEnabled(workerEnabled);
      registry.setModuleEnabled("development-worker", workerEnabled);
    }
    return status;
  }

  async function runWorkerOnce() {
    if (status !== DEVELOPMENT_SYSTEM_STATUS.READY) {
      return { started: false, reason: "Development system is disabled.", processed: 0, attempted: 0, results: [] };
    }
    if (!worker) {
      return { started: false, reason: "No controlled development executor is configured.", processed: 0, attempted: 0, results: [] };
    }
    return worker.runOnce();
  }

  async function executeNextWorldTask(input = {}) {
    if (status !== DEVELOPMENT_SYSTEM_STATUS.READY) {
      throw new Error("The development system is disabled.");
    }
    if (!controlledExecutor) {
      throw new Error("World execution is not configured. Supply an isolated workspace adapter, review store, and explicit allowed paths.");
    }
    return controlledExecutor.executeNextTask({
      ...input,
      runnerId: WORLD_RUNNER_ID
    });
  }

  function submitStudioFinding(finding) {
    if (status !== DEVELOPMENT_SYSTEM_STATUS.READY) throw new Error("The development system is disabled.");
    return studioRunner.submitFinding(finding);
  }
  function submitStudioFindings(findings) {
    if (status !== DEVELOPMENT_SYSTEM_STATUS.READY) throw new Error("The development system is disabled.");
    return studioRunner.submitFindings(findings);
  }
  function submitWorldFinding(finding) {
    if (status !== DEVELOPMENT_SYSTEM_STATUS.READY) throw new Error("The development system is disabled.");
    return worldRunner.submitFinding(finding);
  }
  function submitWorldFindings(findings) {
    if (status !== DEVELOPMENT_SYSTEM_STATUS.READY) throw new Error("The development system is disabled.");
    return worldRunner.submitFindings(findings);
  }

  async function markWorldReviewPerfect(input = {}) {
    if (!ownerReviewFeedback) throw new Error("Owner review feedback is not configured with a persistent review store.");
    return ownerReviewFeedback.markPerfect(input);
  }
  async function requestWorldReviewChanges(input = {}) {
    if (!ownerReviewFeedback) throw new Error("Owner review feedback is not configured with a persistent review store.");
    return ownerReviewFeedback.requestChange(input);
  }

  return Object.freeze({
    registry,
    director,
    studioRunner,
    worldRunner,
    worker,
    worldExecutor: controlledExecutor,
    getStatus: () => status,
    getSnapshot,
    enable,
    disable,
    runWorkerOnce,
    executeNextWorldTask,
    submitStudioFinding,
    submitStudioFindings,
    submitWorldFinding,
    submitWorldFindings,
    markWorldReviewPerfect,
    requestWorldReviewChanges
  });
}
