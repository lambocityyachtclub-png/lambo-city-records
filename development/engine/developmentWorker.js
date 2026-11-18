/**
 * LAMBO CITY — DEVELOPMENT WORKER
 *
 * One-shot, bounded dispatcher for explicitly supplied executors.
 * This module does not create timers, access credentials, commit, merge,
 * deploy, or write to production. The executor owns workspace isolation,
 * path authorization, test execution, and owner-review submission.
 */

function requireText(value, name) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} is required.`);
  }
  return value.trim();
}

function requirePositiveInteger(value, name, maximum) {
  if (!Number.isInteger(value) || value < 1 || value > maximum) {
    throw new Error(`${name} must be an integer between 1 and ${maximum}.`);
  }
  return value;
}

export const DEVELOPMENT_WORKER_VERSION = "1.1.0";

export function createDevelopmentWorker(options = {}) {
  const {
    executor,
    runnerIds = [],
    workerId = "lambo-city-development-worker",
    maxTasksPerRun = 3,
    enabled = false
  } = options;

  if (!executor || typeof executor.executeNextTask !== "function") {
    throw new Error("A controlled development executor is required.");
  }
  if (!Array.isArray(runnerIds) || runnerIds.length === 0) {
    throw new Error("At least one authorized runner ID is required.");
  }

  const normalizedRunnerIds = [...new Set(
    runnerIds.map(id => requireText(id, "Runner ID"))
  )];
  const normalizedWorkerId = requireText(workerId, "Worker ID");
  const taskLimit = requirePositiveInteger(maxTasksPerRun, "maxTasksPerRun", 25);

  let isEnabled = enabled === true;
  let running = false;

  async function runOnce() {
    if (!isEnabled) {
      return { started: false, reason: "Development worker is disabled.", processed: 0, attempted: 0, results: [] };
    }
    if (running) throw new Error("Development worker is already running.");

    running = true;
    const results = [];
    let processed = 0;
    let stopped = false;

    try {
      // Continue round-robin passes until a full pass finds no work or
      // the explicit per-run task ceiling has been reached.
      while (processed < taskLimit) {
        if (!isEnabled) {
          stopped = true;
          break;
        }
        let progressThisPass = false;

        for (const runnerId of normalizedRunnerIds) {
          if (!isEnabled) {
            stopped = true;
            break;
          }
          if (processed >= taskLimit) break;

          const result = await executor.executeNextTask({
            runnerId,
            workerId: normalizedWorkerId
          });

          if (result?.executed === true) {
            processed += 1;
            progressThisPass = true;
            results.push({ runnerId, ...result });
          } else {
            results.push({
              runnerId,
              executed: false,
              reason: result?.reason || "No eligible task."
            });
          }
        }

        if (!progressThisPass) break;
      }

      return {
        started: true,
        workerId: normalizedWorkerId,
        processed,
        attempted: results.length,
        stopped,
        stopReason: stopped ? "Worker disabled before the next task could start." : null,
        results
      };
    } finally {
      running = false;
    }
  }

  function setEnabled(value) {
    if (typeof value !== "boolean") throw new Error("Enabled must be true or false.");
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

  return Object.freeze({ runOnce, setEnabled, getSnapshot });
}
