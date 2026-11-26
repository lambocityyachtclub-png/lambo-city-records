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
const LOCK_KEY = 1280068941;

export function createHostedAliveControlPlane(options = {}) {
  const pool = options.pool;
  if (!pool || typeof pool.connect !== "function" || typeof pool.query !== "function") {
    throw new Error("A PostgreSQL pool is required for the hosted ALIVE control plane.");
  }

  async function withAdvisoryLock(operation) {
    const client = await pool.connect();
    let locked = false;
    try {
      await client.query("SELECT pg_advisory_lock($1)", [LOCK_KEY]);
      locked = true;
      return await operation();
    } finally {
      if (locked) await client.query("SELECT pg_advisory_unlock($1)", [LOCK_KEY]).catch(() => {});
      client.release();
    }
  }

  async function withSystem(requestOptions = {}, callback) {
    if (typeof callback !== "function") throw new Error("A hosted ALIVE operation callback is required.");
    if (requestOptions.execution === true) {
      throw new Error("ALIVE code execution is not enabled in this hosted control-plane version.");
    }
    return withAdvisoryLock(async () => {
      const storage = createPostgresDevelopmentStorage({ pool });
      await storage.assertSchemaReady();
      const system = await createDevelopmentSystem({ storage });
      return callback({ system, storage });
    });
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
