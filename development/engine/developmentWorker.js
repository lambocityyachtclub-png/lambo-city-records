/**
 * LAMBO CITY — DEVELOPMENT WORKER
 *
 * Runs a bounded batch of already-authorized tasks.
 *
 * This worker is intentionally one-shot: an external scheduler
 * (for example, GitHub Actions) may invoke it. It does not create
 * timers, stay alive indefinitely, access secrets, or deploy code.
 * The supplied executor remains responsible for isolated workspaces,
 * path allowlists, tests, and review-only output.
 */

function requireText(value, name) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} is required.`);
  }

  return value.trim();
}

function requirePositiveInteger(value, name, maximum) {
  if (
    !Number.isInteger(value) ||
    value < 1 ||
    value > maximum
  ) {
    throw new Error(
      `${name} must be an integer between 1 and ${maximum}.`
    );
  }

  return value;
}

export const DEVELOPMENT_WORKER_VERSION = "1.0.0";

export function createDevelopmentWorker(options = {}) {
  const {
    executor,
    runnerIds = [],
    workerId = "lambo-city-development-worker",
    maxTasksPerRun = 3,
    enabled = true
  } = options;

  if (!executor || typeof executor.executeNextTask !== "function") {
    throw new Error("A controlled development executor is required.");
  }

  if (!Array.isArray(runnerIds) || runnerIds.length === 0) {
    throw new Error("At least one authorized runner ID is required.");
  }

  const normalizedRunnerIds = [
    ...new Set(runnerIds.map(id => requireText(id, "Runner ID")))
  ];

  const normalizedWorkerId = requireText(workerId, "Worker ID");
  const taskLimit = requirePositiveInteger(
    maxTasksPerRun,
    "maxTasksPerRun",
    25
  );

  let isEnabled = enabled === true;
  let running = false;

  async function runOnce() {
    if (!isEnabled) {
      return {
        started: false,
        reason: "Development worker is disabled.",
        processed: 0,
        results: []
      };
    }

    if (running) {
      throw new Error("Development worker is already running.");
    }

    running = true;

    const results = [];

    try {
      for (const runnerId of normalizedRunnerIds) {
        if (results.length >= taskLimit) break;

        const result = await executor.executeNextTask({
          runnerId,
          workerId: normalizedWorkerId
        });

        if (!result || result.executed !== true) {
          results.push({
            runnerId,
            executed: false,
            reason: result?.reason || "No eligible task."
          });
          continue;
        }

        results.push({
          runnerId,
          ...result
        });
      }

      return {
        started: true,
        workerId: normalizedWorkerId,
        processed: results.filter(item => item.executed === true).length,
        attempted: results.length,
        results
      };
    } finally {
      running = false;
    }
  }

  function setEnabled(value) {
    if (typeof value !== "boolean") {
      throw new Error("Enabled must be true or false.");
    }

    isEnabled = value;
    return isEnabled;
  }

  function getSnapshot() {
    return {
      version: DEVELOPMENT_WORKER_VERSION,
      enabled: isEnabled,
      running,
      workerId: normalizedWorkerId,
      runnerIds: [...normalizedRunnerIds],
      maxTasksPerRun: taskLimit,
      mode: "one-shot",
      productionWrites: false
    };
  }

  return Object.freeze({
    runOnce,
    setEnabled,
    getSnapshot
  });
}
