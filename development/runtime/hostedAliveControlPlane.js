/**
 * ALIVE hosted Neon control plane.
 *
 * Composes the budget-gated AI Gateway proposal provider, exact-target
 * workspace bridge, isolated workspace adapter, and network-denied sandbox.
 * Every execution gate is false unless its explicit server-side flag is set.
 * This version prepares tested proposals for owner review; it does not merge
 * or deploy production changes.
 */
import { createDevelopmentSystem } from "../engine/developmentSystem.js";
import { createPostgresDevelopmentStorage } from "../storage/postgresDevelopmentStorage.js";
import { createAIGatewayProposalProvider } from "../providers/aiGatewayProposalProvider.js";
import { createAIGatewayWorkspaceProposalProvider } from "../providers/aiGatewayWorkspaceProposalProvider.js";
import { createIsolatedWorkspaceAdapter } from "../execution/isolatedWorkspaceAdapter.js";
import { createVercelSandboxTestRunner } from "../execution/vercelSandboxTestRunner.js";
import { createProjectDiscoveryService } from "../blueprints/projectDiscoveryService.js";

export const HOSTED_ALIVE_CONTROL_PLANE_VERSION = "1.2.0";
const DEFAULT_LOCK_KEY = 1280068941;
const DEFAULT_ALLOWED_PATHS = Object.freeze([
  "development",
  "alive/contracts",
  "alive/server",
  "package.json",
  "conferenceCenterDistrict.js",
  "waterfrontStorefrontDetails.js",
  "cinematicWorldSkin.js",
  "yachtLuxuryDetails.js",
  "dockEntranceLuxury.js",
  "deviceGraphics.js",
  "performanceMonitor.js"
]);

function isTrue(value) {
  return value === true || value === "true";
}

function getRuntimeConfig(env) {
  const aiCredentialConfigured = Boolean(env.AI_GATEWAY_API_KEY || env.VERCEL_OIDC_TOKEN);
  const modelConfigured = typeof env.AI_GATEWAY_MODEL === "string" && env.AI_GATEWAY_MODEL.trim().length > 0;
  const aiSpendApproved = isTrue(env.ALIVE_AI_SPEND_APPROVED);
  const aiEnabled = isTrue(env.ALIVE_AI_ENABLED) && aiSpendApproved && aiCredentialConfigured && modelConfigured;
  const sandboxEnabled = isTrue(env.ALIVE_SANDBOX_ENABLED);
  const workerEnabled = isTrue(env.ALIVE_WORKER_ENABLED) && aiEnabled && sandboxEnabled;
  const autoRunEnabled = workerEnabled && isTrue(env.ALIVE_AUTO_RUN);
  return Object.freeze({
    aiCredentialConfigured,
    modelConfigured,
    aiSpendApproved,
    aiEnabled,
    sandboxEnabled,
    workerEnabled,
    autoRunEnabled
  });
}

export async function withPostgresAdvisoryLock(pool, operation, lockKey = DEFAULT_LOCK_KEY) {
  if (!pool || typeof pool.connect !== "function") throw new Error("A PostgreSQL pool with connect() is required.");
  if (typeof operation !== "function") throw new Error("A control-plane operation is required.");
  if (!Number.isSafeInteger(lockKey)) throw new Error("The PostgreSQL advisory lock key must be a safe integer.");

  const client = await pool.connect();
  let lockAcquired = false;
  let operationError = null;
  try {
    await client.query("SELECT pg_advisory_lock($1::bigint)", [lockKey]);
    lockAcquired = true;
    return await operation();
  } catch (error) {
    operationError = error;
    throw error;
  } finally {
    try {
      if (lockAcquired) await client.query("SELECT pg_advisory_unlock($1::bigint)", [lockKey]);
    } catch (unlockError) {
      if (!operationError) throw unlockError;
    } finally {
      client.release();
    }
  }
}

export function createHostedAliveControlPlane(options = {}) {
  const pool = options.pool;
  const env = options.env || process.env;
  const lockKey = options.lockKey ?? DEFAULT_LOCK_KEY;
  const projectRoot = options.projectRoot || process.cwd();
  const allowedPaths = options.allowedPaths || [...DEFAULT_ALLOWED_PATHS];
  const projectCatalogPath = options.projectCatalogPath || "development/blueprints/departmentCatalog.json";
  if (!pool || typeof pool.query !== "function" || typeof pool.connect !== "function") {
    throw new Error("A PostgreSQL pool is required for the hosted ALIVE control plane.");
  }
  if (!Array.isArray(allowedPaths) || allowedPaths.length === 0) {
    throw new Error("ALIVE requires a non-empty explicit workspace allowlist.");
  }

  const runtime = getRuntimeConfig(env);

  function createExecutionAdapters() {
    const discovery = createProjectDiscoveryService({
      rootDir: projectRoot,
      catalogPath: projectCatalogPath
    });
    const aiProvider = createAIGatewayProposalProvider({
      env,
      enabled: runtime.aiEnabled,
      spendApproved: runtime.aiSpendApproved,
      maxOutputTokens: 4000,
      maxInputBytes: 128 * 1024,
      maxFileBytes: 64 * 1024,
      maxTotalBytes: 256 * 1024,
      maxFiles: 5
    });
    const proposalProvider = createAIGatewayWorkspaceProposalProvider({
      aiProvider,
      projectDiscovery: discovery,
      includeProjectContext: true
    });
    const testRunner = createVercelSandboxTestRunner({
      enabled: runtime.sandboxEnabled
    });
    const workspaceAdapter = createIsolatedWorkspaceAdapter({
      projectRoot,
      allowedPaths,
      proposalProvider,
      testRunner,
      maxProposalFiles: 5,
      maxFileBytes: 512 * 1024
    });
    return { workspaceAdapter };
  }

  async function withSystem(requestOptions = {}, callback) {
    if (typeof callback !== "function") throw new Error("A hosted ALIVE callback is required.");
    if (requestOptions.execution === true && !runtime.workerEnabled) {
      throw new Error("ALIVE execution is disabled until AI spend approval, AI Gateway credentials, sandbox, and worker flags are all enabled.");
    }

    return withPostgresAdvisoryLock(pool, async () => {
      const storage = createPostgresDevelopmentStorage({ pool });
      await storage.assertSchemaReady();
      const { workspaceAdapter } = createExecutionAdapters();
      const system = await createDevelopmentSystem({
        storage,
        workspaceAdapter,
        reviewStore: storage,
        allowedPaths,
        projectRoot,
        projectCatalogPath,
        workerEnabled: runtime.workerEnabled,
        maxTasksPerRun: 1
      });
      return callback({ system, storage });
    }, lockKey);
  }

  return Object.freeze({
    version: HOSTED_ALIVE_CONTROL_PLANE_VERSION,
    withSystem,
    getSnapshot() {
      return Object.freeze({
        version: HOSTED_ALIVE_CONTROL_PLANE_VERSION,
        databaseConfigured: true,
        persistentTaskStorage: true,
        persistentOwnerReviewStorage: true,
        serializedOperations: true,
        aiProviderConfigured: runtime.aiCredentialConfigured && runtime.modelConfigured,
        aiSpendApproved: runtime.aiSpendApproved,
        aiExecutionEnabled: runtime.aiEnabled,
        sandboxEnabled: runtime.sandboxEnabled,
        workerEnabled: runtime.workerEnabled,
        autoRunEnabled: runtime.autoRunEnabled,
        sourceFileWrites: runtime.workerEnabled,
        gitCommitMerge: false,
        productionDeployment: false,
        allowedPaths: [...allowedPaths]
      });
    }
  });
}
