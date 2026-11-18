/**
 * ALIVE hosted control-plane composition.
 * All state-changing API operations run under one Postgres advisory lock so
 * the Development Director's snapshot-based storage cannot race across
 * concurrent Vercel function instances.
 */
import os from "node:os";
import path from "node:path";
import { createDevelopmentSystem } from "../engine/developmentSystem.js";
import { createOpenAIProposalProvider } from "../providers/openAIProposalProvider.js";
import { createPostgresDevelopmentStorage } from "../storage/postgresDevelopmentStorage.js";
import { createIsolatedWorkspaceAdapter } from "../execution/isolatedWorkspaceAdapter.js";
import { createVercelSandboxTestRunner } from "../execution/vercelSandboxTestRunner.js";

const LOCK_KEY = 1280068941;

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

  async function createSystem({ execution = false, storage }) {
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
        allowedPaths
      }
    });
  }

  async function withSystem(options = {}, callback) {
    if (typeof callback !== "function") throw new Error("A hosted ALIVE operation callback is required.");
    return withAdvisoryLock(async () => {
      const storage = createPostgresDevelopmentStorage({ pool });
      await storage.assertSchemaReady();
      const system = await createSystem({
        execution: options.execution === true,
        storage
      });
      return callback({ system, storage });
    });
  }

  return Object.freeze({ withSystem });
}
