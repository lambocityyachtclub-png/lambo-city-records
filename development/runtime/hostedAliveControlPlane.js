/**
 * ALIVE hosted Neon control plane.
 *
 * Serializes state-changing requests across serverless instances, restores
 * task state from PostgreSQL, and fails closed if execution is requested.
 * AI generation, sandbox execution, source writes, and deployment are added
 * only through separately tested, explicitly enabled adapters.
 */
import { createDevelopmentSystem } from "../engine/developmentSystem.js";
import { createPostgresDevelopmentStorage } from "../storage/postgresDevelopmentStorage.js";

export const HOSTED_ALIVE_CONTROL_PLANE_VERSION = "1.1.0";
const DEFAULT_LOCK_KEY = 1280068941;

export async function withPostgresAdvisoryLock(pool, operation, lockKey = DEFAULT_LOCK_KEY) {
  if (!pool || typeof pool.connect !== "function") throw new Error("A PostgreSQL pool with connect() is required.");
  if (typeof operation !== "function") throw new Error("A control-plane operation is required.");
  if (!Number.isSafeInteger(lockKey)) throw new Error("The advisory lock key must be a safe integer.");

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
      if (transactionOpen) await client.query(operationError ? "ROLLBACK" : "COMMIT");
    } finally {
      client.release();
    }
  }
}

export function createHostedAliveControlPlane(options = {}) {
  const pool = options.pool;
  const lockKey = options.lockKey ?? DEFAULT_LOCK_KEY;
  if (!pool || typeof pool.connect !== "function" || typeof pool.query !== "function") {
    throw new Error("A PostgreSQL pool is required for the hosted ALIVE control plane.");
  }

  async function withSystem(requestOptions = {}, callback) {
    if (typeof callback !== "function") throw new Error("A hosted ALIVE operation callback is required.");
    if (requestOptions.execution === true) {
      throw new Error("ALIVE code execution is not enabled in this hosted control-plane version.");
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
