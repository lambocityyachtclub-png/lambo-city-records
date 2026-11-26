/**
 * ALIVE — hosted Neon control-plane composition.
 *
 * Serializes task-state operations across serverless instances and creates a
 * fresh Development System from durable PostgreSQL state for each request.
 * No AI provider, executor, code writer, or deployment adapter is enabled here.
 */

import { createDevelopmentSystem } from "../engine/developmentSystem.js";
import { createPostgresDevelopmentStorage } from "../storage/postgresDevelopmentStorage.js";

export const HOSTED_ALIVE_CONTROL_PLANE_VERSION = "1.0.0";
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
  let transactionOpen = false;
  let operationError = null;

  try {
    await client.query("BEGIN");
    transactionOpen = true;
    await client.query("SELECT pg_advisory_xact_lock($1::bigint)", [lockKey]);
    return await operation();
  } catch (error) {
    operationError = error;
    throw error;
  } finally {
    try {
      if (transactionOpen) {
        await client.query(operationError ? "ROLLBACK" : "COMMIT");
      }
    } finally {
      client.release();
    }
  }
}

export function createHostedAliveControlPlane(options = {}) {
  const pool = options.pool;
  const lockKey = options.lockKey ?? DEFAULT_LOCK_KEY;
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
      const system = await createDevelopmentSystem({ storage });
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
        serializedOperations: true,
        aiProposalExecution: false,
        sandboxExecution: false,
        sourceFileWrites: false,
        productionDeployment: false
      });
    }
  });
}
