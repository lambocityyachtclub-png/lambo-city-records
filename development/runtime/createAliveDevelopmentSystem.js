/**
 * LAMBO CITY ALIVE — execution adapter composition and durable bootstrap.
 *
 * Server-side only. Never import this module from browser/game code.
 * Paid AI and Sandbox capabilities remain disabled unless explicitly enabled.
 */
import { createDevelopmentSystem } from "../engine/developmentSystem.js";
import { createIsolatedWorkspaceAdapter } from "../execution/isolatedWorkspaceAdapter.js";
import { createVercelAIGatewayProposalProvider } from "../execution/vercelAIGatewayProposalProvider.js";
import { createVercelSandboxTestRunner } from "../execution/vercelSandboxTestRunner.js";
import { createPostgresDevelopmentStorage } from "../storage/postgresDevelopmentStorage.js";

export function createAliveExecutionAdapters(options = {}) {
  const proposalProvider = createVercelAIGatewayProposalProvider({
    ...(options.ai || {}),
    enabled: options.aiEnabled ?? (process.env.ALIVE_AI_ENABLED === "true")
  });
  const sandboxFactory = options.sandbox?.sandboxFactory || (async sandboxOptions => {
    const sdk = await import("@vercel/sandbox");
    return sdk.Sandbox.create(sandboxOptions);
  });
  const testRunner = createVercelSandboxTestRunner({
    ...(options.sandbox || {}),
    enabled: options.sandboxEnabled ?? (process.env.ALIVE_SANDBOX_ENABLED === "true"),
    sandboxFactory
  });
  const workspaceAdapter = createIsolatedWorkspaceAdapter({
    projectRoot: options.projectRoot,
    workspaceRoot: options.workspaceRoot,
    allowedPaths: options.allowedPaths,
    proposalProvider,
    testRunner
  });

  return Object.freeze({ proposalProvider, testRunner, workspaceAdapter });
}

export async function createAliveDevelopmentSystem(options = {}) {
  if (!Array.isArray(options.allowedPaths) || options.allowedPaths.length === 0) {
    throw new Error("An explicit allowedPaths list is required.");
  }
  if (typeof options.projectRoot !== "string" || !options.projectRoot.trim()) {
    throw new Error("A projectRoot is required.");
  }

  let pool = options.postgresPool || null;
  let ownedPool = false;
  let durableStorage = null;

  if (!options.storage || !options.reviewStore) {
    if (!pool) {
      const connectionString = options.databaseUrl || process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error("DATABASE_URL is required for durable ALIVE task and review storage.");
      }
      const { Pool } = await import("pg");
      pool = new Pool({
        connectionString,
        max: 3,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000
      });
      ownedPool = true;
    }
    durableStorage = createPostgresDevelopmentStorage({ pool });
    await durableStorage.ensureSchema();
  }

  const storage = options.storage || durableStorage;
  const reviewStore = options.reviewStore || durableStorage;
  if (!storage || !reviewStore) {
    throw new Error("Durable task storage and persistent review storage are required.");
  }

  try {
    const adapters = createAliveExecutionAdapters(options);
    const system = await createDevelopmentSystem({
      storage,
      clock: options.clock,
      workerRunnerIds: options.workerRunnerIds,
      workerId: options.workerId,
      maxTasksPerRun: options.maxTasksPerRun,
      workspaceAdapter: adapters.workspaceAdapter,
      reviewStore,
      allowedPaths: options.allowedPaths
    });

    return Object.freeze({
      ...adapters,
      storage,
      reviewStore,
      system,
      async close() {
        if (ownedPool) await pool.end();
      }
    });
  } catch (error) {
    if (ownedPool) await pool.end().catch(() => {});
    throw error;
  }
}
