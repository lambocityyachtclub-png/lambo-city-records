/**
 * One-shot ALIVE worker entrypoint for a trusted external scheduler.
 * Requires durable PostgreSQL and explicitly enabled paid execution services.
 */
import os from "node:os";
import path from "node:path";
import { createAliveDevelopmentSystem } from "./createAliveDevelopmentSystem.js";

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) throw new Error(name + " is required.");
  return value.trim();
}

async function main() {
  if (process.env.ALIVE_WORKER_ENABLED !== "true") {
    throw new Error("ALIVE_WORKER_ENABLED must be true before a scheduled worker can run.");
  }
  if (process.env.ALIVE_AI_ENABLED !== "true" || process.env.ALIVE_SANDBOX_ENABLED !== "true") {
    throw new Error("Both ALIVE_AI_ENABLED and ALIVE_SANDBOX_ENABLED must be true for autonomous code execution.");
  }
  required("AI_GATEWAY_API_KEY");
  required("VERCEL_TOKEN");
  required("VERCEL_TEAM_ID");
  required("VERCEL_PROJECT_ID");
  required("DATABASE_URL");

  let allowedPaths;
  try {
    allowedPaths = JSON.parse(required("ALIVE_ALLOWED_PATHS"));
  } catch {
    throw new Error("ALIVE_ALLOWED_PATHS must be a JSON array of repository-relative paths.");
  }
  if (!Array.isArray(allowedPaths) || allowedPaths.length === 0 || allowedPaths.some(item => typeof item !== "string")) {
    throw new Error("ALIVE_ALLOWED_PATHS must be a non-empty JSON array of strings.");
  }

  const runtime = await createAliveDevelopmentSystem({
    projectRoot: process.cwd(),
    workspaceRoot: path.join(os.tmpdir(), "lambo-city-alive-workspaces"),
    allowedPaths,
    maxTasksPerRun: 1,
    aiEnabled: true,
    sandboxEnabled: true
  });

  try {
    const result = await runtime.system.runWorkerOnce();
    const report = {
      started: result.started,
      processed: result.processed,
      attempted: result.attempted,
      results: result.results.map(item => ({
        taskId: item.taskId || null,
        status: item.status || null,
        executed: item.executed === true,
        reason: item.reason || null,
        reviewId: item.review?.id || null,
        changedFiles: item.changedFiles || []
      }))
    };
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    if (result.results.some(item => item.status === "blocked")) {
      process.exitCode = 2;
    }
  } finally {
    await runtime.close();
  }
}

main().catch(error => {
  process.stderr.write("ALIVE worker failed: " + error.message + "\n");
  process.exitCode = 1;
});
