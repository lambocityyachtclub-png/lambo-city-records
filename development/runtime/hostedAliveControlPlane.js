/**
 * ALIVE — hosted Neon control-plane composition.
 *
 * Creates a fresh Development System from durable PostgreSQL state for each
 * authenticated server-side request. A session advisory lock serializes
 * control-plane operations across serverless instances.
 *
 * This layer does not enable AI proposals, code execution, source writes,
 * GitHub commits, merges, or production deployment.
 */

import { createDevelopmentSystem } from "../engine/developmentSystem.js";
import { createPostgresDevelopmentStorage } from "../storage/postgresDevelopmentStorage.js";

export const HOSTED_ALIVE_CONTROL_PLANE_VERSION = "1.2.0";
const DEFAULT_LOCK_KEY = 1280068941;

export async function withPostgresAdvisoryLock(pool, operation, lockKey = DEFAULT_LOCK_KEY) {
  if (!pool || typeof pool.connect !== "function") {
    throw new Error("A PostgreSQL pool with connect() is required.");
  }
  if (typeof operation !== "function") {
    throw new Error("A control-plane operation is required.");
  }
  if (!Number.isSafeInteger(lockKey)) {
    throw new Error("The PostgreSQL advisory lock key must be a safe integer.");
  }

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
      if (lockAcquired) {
        await client.query("SELECT pg_advisory_unlock($1::bigint)", [lockKey]);
      }
    } catch (unlockError) {
      if (!operationError) throw unlockError;
    } finally {
      client.release();
    }
  }
}

export function createHostedAliveControlPlane(options = {}) {
  const pool = options.pool;
  const lockKey = options.lockKey ?? DEFAULT_LOCK_KEY;
  const components = options.components || null;
  const workspaceAdapter = options.workspaceAdapter || components?.workspaceAdapter || null;
  const allowedPaths = options.allowedPaths || components?.allowedPaths || [];
  const workerEnabled = options.workerEnabled === true;
  if (!pool || typeof pool.query !== "function" || typeof pool.connect !== "function") {
    throw new Error("A PostgreSQL pool is required for the hosted ALIVE control plane.");
  }

  async function withSystem(requestOptions = {}, callback) {
    if (typeof callback !== "function") {
      throw new Error("A hosted ALIVE callback is required.");
    }
    if (requestOptions.execution === true) {
      throw new Error("Hosted code execution is not configured in this control-plane version.");
    }

    return withPostgresAdvisoryLock(pool, async () => {
      const storage = createPostgresDevelopmentStorage({ pool });
      await storage.assertSchemaReady();
      const system = await createDevelopmentSystem({
        storage,
        reviewStore: storage,
        workspaceAdapter,
        allowedPaths,
        workerEnabled,
        projectDiscovery: components?.projectDiscovery || null
      });
      return callback({ system, storage, components });
    }, lockKey);
  }

  return Object.freeze({
    version: HOSTED_ALIVE_CONTROL_PLANE_VERSION,
    withSystem,
    getSnapshot() {
      const componentSnapshot = components?.getSnapshot?.() || null;
      return Object.freeze({
        version: HOSTED_ALIVE_CONTROL_PLANE_VERSION,
        databaseConfigured: true,
        persistentTaskStorage: true,
        persistentOwnerReviewStorage: true,
        serializedOperations: true,
        aiProposalProviderConfigured: componentSnapshot?.aiProvider?.configured === true,
        aiProposalGenerationEnabled: componentSnapshot?.proposalGenerationEnabled === true,
        projectDiscoveryConfigured: componentSnapshot?.projectDiscovery?.configured === true,
        isolatedWorkspaceConfigured: Boolean(workspaceAdapter),
        sandboxExecution: componentSnapshot?.workspaceAdapter?.testRunnerConfigured === true,
        resourceProfilerConfigured: componentSnapshot?.workspaceAdapter?.resourceProfilerConfigured === true,
        workerEnabled,
        aiProposalExecution: false,
        sourceFileWrites: false,
        gitCommitMerge: false,
        productionDeployment: false
      });
    }
  });
}
