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
import {
  createWorldDevelopmentRunner,
  WORLD_RUNNER_ID,
  WORLD_RUNNER_VERSION
} from "../runners/world/worldDevelopmentRunner.js";
import { listProjectContracts, evaluateProjectAction } from "../../alive/contracts/projectContracts.js";
import { createProjectDiscoveryService, PROJECT_DISCOVERY_VERSION } from "../blueprints/projectDiscoveryService.js";
import { createLivingContractEngine } from "../contracts/livingContractEngine.js";

export const DEVELOPMENT_SYSTEM_VERSION = "1.5.0";

export const DEVELOPMENT_SYSTEM_STATUS = Object.freeze({
  READY: "ready",
  DISABLED: "disabled"
});

export async function createDevelopmentSystem(options = {}) {
  const {
    storage = null,
    clock,
    workerExecutor = null,
    workerRunnerIds = [WORLD_RUNNER_ID],
    workerId = "lambo-city-development-worker",
    maxTasksPerRun = 3,
    workerEnabled = false,
    workspaceAdapter = null,
    reviewStore = null,
    allowedPaths = null,
    projectRoot = process.cwd(),
    projectCatalogPath = "development/blueprints/departmentCatalog.json"
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
  const livingContractEngine = createLivingContractEngine({ worldRunner });
  const policy = getDevelopmentPolicy();
  const projectDiscovery = createProjectDiscoveryService({
    rootDir: projectRoot,
    catalogPath: projectCatalogPath
  });

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
    id: "alive-project-contracts",
    name: "ALIVE Project Contract Registry",
    type: MODULE_TYPES.POLICY,
    version: "1.0.0",
    path: "alive/contracts/projectContracts.js",
    enabled: true,
    capabilities: ["canonical-module-contracts", "bounded-autonomy", "release-evidence-gates"],
    description: "Provides canonical project boundaries and evaluates authorized ALIVE actions."
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
    id: "alive-living-contract-engine",
    name: "ALIVE Living Contract Engine",
    type: MODULE_TYPES.ENGINE,
    version: "1.0.0",
    path: "development/contracts/livingContractEngine.js",
    enabled: true,
    capabilities: [
      "deterministic-intent-planning",
      "dependency-ordered-task-batches",
      "protected-intent-routing"
    ],
    description: "Maps owner intent to canonical project contracts and dependency-ordered development tasks."
  });

  registry.registerModule({
    id: "alive-project-discovery",
    name: "ALIVE Project Discovery",
    type: MODULE_TYPES.SERVICE,
    version: PROJECT_DISCOVERY_VERSION,
    path: "development/blueprints/projectDiscoveryService.js",
    enabled: true,
    capabilities: [
      "read-only-repository-inventory",
      "department-blueprint-discovery",
      "static-dependency-mapping"
    ],
    description: "Scans project files on demand and returns a bounded, read-only discovery report."
  });

  registry.registerModule({
    id: WORLD_RUNNER_ID,
    name: "World Development Runner",
    type: MODULE_TYPES.RUNNER,
    version: WORLD_RUNNER_VERSION,
    path: "development/runners/world/worldDevelopmentRunner.js",
    enabled: true,
    capabilities: [
      "world-quality-improvements",
      "performance-quality-findings",
      "contract-pinned-world-tasks"
    ],
    description: "Organizes world and quality findings under canonical ALIVE module contracts."
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
      projectDiscovery: projectDiscovery.getSnapshot(),
      livingContractEngine: livingContractEngine.getSnapshot(),
      worker: worker
        ? worker.getSnapshot()
        : {
            configured: false,
            enabled: false,
            reason: "No controlled executor was supplied."
          },
      policy,
      contracts: listProjectContracts().map(contract => ({
        id: contract.id,
        name: contract.name,
        version: contract.version,
        autonomyLevel: contract.autonomyLevel,
        productionDeployment: contract.productionDeployment
      }))
    };
  }

  function evaluateAction(contractId, operation, evidence = {}) {
    if (status !== DEVELOPMENT_SYSTEM_STATUS.READY) {
      return Object.freeze({
        authorized: false,
        decision: "denied",
        reason: "The ALIVE Development System is disabled."
      });
    }
    return evaluateProjectAction(contractId, operation, evidence);
  }

  function disable() {
    status = DEVELOPMENT_SYSTEM_STATUS.DISABLED;
    studioRunner.setEnabled(false);
    worldRunner.setEnabled(false);
    projectDiscovery.setEnabled(false);
    livingContractEngine.setEnabled(false);
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
    projectDiscovery.setEnabled(true);
    livingContractEngine.setEnabled(true);
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

  function planIntent(intent) {
    if (status !== DEVELOPMENT_SYSTEM_STATUS.READY) {
      throw new Error("The development system is disabled.");
    }
    return livingContractEngine.planIntent(intent);
  }

  async function submitIntent(intent) {
    if (status !== DEVELOPMENT_SYSTEM_STATUS.READY) {
      throw new Error("The development system is disabled.");
    }
    return livingContractEngine.submitIntent(intent);
  }

  async function discoverProject() {
    if (status !== DEVELOPMENT_SYSTEM_STATUS.READY) {
      throw new Error("The development system is disabled.");
    }
    return projectDiscovery.scan();
  }

  function getProjectDiscoverySnapshot() {
    return projectDiscovery.getSnapshot();
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
    worldRunner,
    projectDiscovery,
    livingContractEngine,
    getStatus,
    getSnapshot,
    evaluateAction,
    discoverProject,
    getProjectDiscoverySnapshot,
    planIntent,
    submitIntent,
    enable,
    disable,
    runWorkerOnce,
    submitWorldFinding,
    submitWorldFindings,
    submitStudioFinding,
    submitStudioFindings
  });
}
