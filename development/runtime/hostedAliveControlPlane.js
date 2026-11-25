/**
 * ALIVE hosted control-plane composition.
 * All state-changing API operations run under one Postgres advisory lock so
 * the Development Director's snapshot-based storage cannot race across
 * concurrent Vercel function instances.
 */
import os from "node:os";
import path from "node:path";
import { createDevelopmentSystem } from "../engine/developmentSystem.js";
import fs from "node:fs/promises";
import { discoverBlueprints } from "../blueprints/discoverBlueprints.mjs";
import { createProposalProjectContext } from "../blueprints/projectContext.mjs";
import { WORLD_RUNNER_ID } from "../runners/world/worldDevelopmentRunner.js";
import { createOpenAIProposalProvider } from "../providers/openAIProposalProvider.js";
import { createPostgresDevelopmentStorage } from "../storage/postgresDevelopmentStorage.js";
import { createIsolatedWorkspaceAdapter } from "../execution/isolatedWorkspaceAdapter.js";
import { createVercelSandboxTestRunner } from "../execution/vercelSandboxTestRunner.js";

const LOCK_KEY = 1280068941;

export async function withPostgresAdvisoryLock(pool, operation, lockKey = LOCK_KEY) {
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
        try {
          await client.query(operationError ? "ROLLBACK" : "COMMIT");
        } catch (releaseError) {
          if (!operationError) throw releaseError;
        }
      }
    } finally {
      client.release();
    }
  }
}

export async function getVerifiedAliveOwner(pool, ownerEmail) {
  const email = required(ownerEmail, "ALIVE_OWNER_EMAIL");
  const result = await pool.query(
    'SELECT id, email FROM alive_owner_user WHERE lower(email) = lower($1) AND "emailVerified" = true LIMIT 1',
    [email]
  );
  const row = result.rows?.[0];
  if (!row) throw new Error("A verified ALIVE owner account is required before scheduled execution.");
  return { id: String(row.id), email: String(row.email), emailVerified: true };
}

function required(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(label + " is required.");
  return value.trim();
}

function readAllowedPaths(value) {
  let paths;
  try { paths = JSON.parse(value || ""); }
  catch { throw new Error("ALIVE_ALLOWED_PATHS must be a JSON array of repository-relative paths."); }
  if (!Array.isArray(paths) || paths.length === 0 || paths.some(item => typeof item !== "string" || !item.trim())) {
    throw new Error("ALIVE_ALLOWED_PATHS must be a non-empty JSON array of paths.");
  }
  const normalized = [...new Set(paths.map(item => item.trim()))];
  if (!normalized.includes("development")) {
    throw new Error("The first hosted pilot must include the development folder so the complete ALIVE automated test suite is available inside the sandbox.");
  }
  return normalized;
}

export function createHostedAliveControlPlane(options = {}) {
  const pool = options.pool;
  const env = options.env || process.env;
  let projectContextPromise;
  if (!pool || typeof pool.connect !== "function" || typeof pool.query !== "function") {
    throw new Error("A PostgreSQL pool is required for the hosted ALIVE control plane.");
  }

  async function getProjectContext() {
    if (!projectContextPromise) {
      projectContextPromise = (async () => {
        const rootDir = options.projectRoot || process.cwd();
        const catalogPath = path.join(rootDir, "development/blueprints/departmentCatalog.json");
        const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));
        const report = await discoverBlueprints({ rootDir, catalog });
        return createProposalProjectContext(report);
      })().catch(() => {
        projectContextPromise = null;
        return createProposalProjectContext(null);
      });
    }
    return projectContextPromise;
  }

  async function withAdvisoryLock(operation) {
    return withPostgresAdvisoryLock(pool, operation, LOCK_KEY);
  }

  async function getConfiguredOwner() {
    return getVerifiedAliveOwner(pool, env.ALIVE_OWNER_EMAIL);
  }

  async function createSystem({ execution = false, storage, owner = null }) {
    if (!execution) return createDevelopmentSystem({ storage });

    if (env.ALIVE_AI_ENABLED !== "true") {
      throw new Error("OpenAI proposal execution is disabled. Set ALIVE_AI_ENABLED=true only after approving API usage.");
    }
    if (env.ALIVE_SANDBOX_ENABLED !== "true") {
      throw new Error("Sandbox testing is disabled. Set ALIVE_SANDBOX_ENABLED=true only after approving sandbox usage.");
    }

    const apiKey = required(env.OPENAI_API_KEY, "OPENAI_API_KEY");
    const allowedPaths = readAllowedPaths(env.ALIVE_ALLOWED_PATHS);
    const proposalProvider = createOpenAIProposalProvider({
      apiKey,
      model: env.OPENAI_MODEL || undefined,
      timeoutMs: 25_000,
      maxOutputTokens: 8_000
    });
    const workspaceAdapter = createIsolatedWorkspaceAdapter({
      projectRoot: options.projectRoot || process.cwd(),
      workspaceRoot: options.workspaceRoot || path.join(os.tmpdir(), "lambo-city-alive-workspaces"),
      allowedPaths
    });
    const sandboxFactory = options.sandboxFactory || (async sandboxOptions => {
      const sdk = await import("@vercel/sandbox");
      return sdk.Sandbox.create(sandboxOptions);
    });
    const sandboxRunner = createVercelSandboxTestRunner({
      enabled: true,
      timeoutMs: 25_000,
      sandboxFactory
    });
    const baseProjectContext = await getProjectContext();
    const resolvedOwner = owner || await getConfiguredOwner();
    const { getOwnerDevelopmentContext } = await import("../../alive/server/personalServices.js");
    const ownerContext = await getOwnerDevelopmentContext(resolvedOwner.id, { pool, env });
    const projectContext = Object.freeze({ ...baseProjectContext, ownerContext });

    const testRunner = input => sandboxRunner.runTests({
      workspace: {
        isolated: true,
        directory: input.workspaceDirectory,
        allowedPaths: input.allowedPaths
      },
      task: input.task
    });

    return createDevelopmentSystem({
      storage,
      worldExecution: {
        proposalProvider,
        workspaceAdapter,
        testRunner,
        reviewStore: storage,
        allowedPaths,
        projectContext
      },
      workerRunnerIds: [WORLD_RUNNER_ID],
      workerId: "alive-hosted-world-worker",
      maxTasksPerRun: 1,
      workerEnabled: true
    });
  }

  async function withSystem(options = {}, callback) {
    if (typeof callback !== "function") throw new Error("A hosted ALIVE operation callback is required.");
    return withAdvisoryLock(async () => {
      const storage = createPostgresDevelopmentStorage({ pool });
      await storage.assertSchemaReady();
      const owner = options.owner || (options.execution === true ? await getConfiguredOwner() : null);
      const system = await createSystem({
        execution: options.execution === true,
        storage,
        owner
      });
      return callback({ system, storage, owner });
    });
  }

  return Object.freeze({ withSystem });
}
