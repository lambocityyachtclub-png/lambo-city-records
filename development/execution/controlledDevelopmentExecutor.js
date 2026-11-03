
/**
 * LAMBO CITY — CONTROLLED DEVELOPMENT EXECUTOR
 *
 * Purpose:
 * - Claim eligible development tasks.
 * - Create an isolated development workspace.
 * - Restrict which project paths may be changed.
 * - Prepare proposed code changes.
 * - Run tests before review.
 * - Send successful changes to the review queue.
 *
 * SAFETY:
 * - Never writes directly to the live game.
 * - Never commits, merges, or deploys code.
 * - Never executes shell commands directly.
 * - Requires explicitly supplied workspace and review adapters.
 * - Requires an explicit file-path allowlist.
 *
 * This module must remain separate from the live game.
 */

import {
  TASK_STATUS
} from "../engine/developmentDirector.js";

const DEFAULT_WORKER_ID = "controlled-development-executor";

const BLOCKED_PATH_SEGMENTS = new Set([
  ".git",
  ".vercel",
  "node_modules",
  "dist",
  "build"
]);

function requireFunction(value, name) {
  if (typeof value !== "function") {
    throw new Error(`${name} must be a function.`);
  }
}

function requireText(value, name) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} is required.`);
  }

  return value.trim();
}

/**
 * Validate a relative project path.
 * Absolute paths and directory traversal are rejected.
 */
function validateRelativePath(filePath) {
  requireText(filePath, "Changed file path");

  if (
    filePath.includes("\\") ||
    filePath.startsWith("/") ||
    filePath.includes("\0")
  ) {
    throw new Error(`Unsafe file path: ${filePath}`);
  }

  const segments = filePath.split("/");

  if (
    segments.some(segment =>
      !segment ||
      segment === "." ||
      segment === ".."
    )
  ) {
    throw new Error(`Unsafe file path: ${filePath}`);
  }

  if (
    segments.some(segment =>
      BLOCKED_PATH_SEGMENTS.has(segment)
    )
  ) {
    throw new Error(
      `Protected directory cannot be changed: ${filePath}`
    );
  }

  return filePath;
}

/**
 * Confirm that a file is inside an explicitly
 * authorized path or folder.
 */
function isPathAllowed(filePath, allowedPaths) {
  return allowedPaths.some(prefix =>
    filePath === prefix ||
    filePath.startsWith(`${prefix}/`)
  );
}

/**
 * Create the Controlled Development Executor.
 *
 * Required workspaceAdapter methods:
 * - createWorkspace({ taskId, task, allowedPaths })
 * - prepareChanges({ workspaceId, task })
 * - runTests({ workspaceId, task })
 *
 * Required reviewStore method:
 * - createReview(review)
 *
 * These adapters must be implemented separately.
 * They are responsible for enforcing isolated workspace
 * and review-storage behavior.
 */
export function createControlledDevelopmentExecutor(options = {}) {
  const {
    developmentDirector,
    workspaceAdapter,
    reviewStore,
    allowedPaths
  } = options;

  if (
    !developmentDirector ||
    typeof developmentDirector.claimNextTask !== "function" ||
    typeof developmentDirector.updateTask !== "function"
  ) {
    throw new Error(
      "A valid Development Director is required."
    );
  }

  if (!workspaceAdapter) {
    throw new Error(
      "An isolated workspace adapter is required."
    );
  }

  requireFunction(
    workspaceAdapter.createWorkspace,
    "workspaceAdapter.createWorkspace"
  );

  requireFunction(
    workspaceAdapter.prepareChanges,
    "workspaceAdapter.prepareChanges"
  );

  requireFunction(
    workspaceAdapter.runTests,
    "workspaceAdapter.runTests"
  );

  if (
    !reviewStore ||
    typeof reviewStore.createReview !== "function"
  ) {
    throw new Error(
      "A valid review store is required."
    );
  }

  if (
    !Array.isArray(allowedPaths) ||
    allowedPaths.length === 0
  ) {
    throw new Error(
      "An explicit allowedPaths array is required."
    );
  }

  const normalizedAllowedPaths = [
    ...new Set(
      allowedPaths.map(validateRelativePath)
    )
  ];

  /**
   * Record a blocked task without allowing an error
   * to accidentally hide the original failure.
   */
  async function markBlocked(taskId, reason) {
    try {
      await developmentDirector.updateTask(taskId, {
        status: TASK_STATUS.BLOCKED,
        result: {
          success: false,
          stage: "controlled_execution",
          reason: String(reason)
        }
      });
    } catch (error) {
      return {
        updated: false,
        error: error.message
      };
    }

    return {
      updated: true
    };
  }

  /**
   * Claim and process one eligible task.
   *
   * Successful tasks are moved to REVIEW.
   * Failed tasks are moved to BLOCKED.
   */
  async function executeNextTask(input = {}) {
    const runnerId = requireText(
      input.runnerId,
      "Runner ID"
    );

    const workerId = input.workerId
      ? requireText(input.workerId, "Worker ID")
      : DEFAULT_WORKER_ID;

    const task = await developmentDirector.claimNextTask(
      runnerId,
      workerId
    );

    if (!task) {
      return {
        executed: false,
        reason: "No eligible queued task was found."
      };
    }

    let workspaceId = null;

    try {
      // STEP 1: Create an isolated workspace.
      const workspace = await workspaceAdapter.createWorkspace({
        taskId: task.id,
        task,
        allowedPaths: [...normalizedAllowedPaths]
      });

      workspaceId = requireText(
        workspace?.workspaceId,
        "Workspace ID"
      );

      // STEP 2: Prepare proposed changes.
      const proposal = await workspaceAdapter.prepareChanges({
        workspaceId,
        task
      });

      if (
        !proposal ||
        !Array.isArray(proposal.changedFiles)
      ) {
        throw new Error(
          "Workspace adapter must return a changedFiles array."
        );
      }

      // STEP 3: Validate every proposed file path.
      const changedFiles = [
        ...new Set(
          proposal.changedFiles.map(filePath => {
            const safePath = validateRelativePath(filePath);

            if (
              !isPathAllowed(
                safePath,
                normalizedAllowedPaths
              )
            ) {
              throw new Error(
                `File is outside the authorized paths: ${safePath}`
              );
            }

            return safePath;
          })
        )
      ];

      // STEP 4: Run tests in the isolated workspace.
      const testResults = await workspaceAdapter.runTests({
        workspaceId,
        task
      });

      if (
        !testResults ||
        testResults.passed !== true
      ) {
        const reason = "Automated tests did not pass.";

        await markBlocked(task.id, reason);

        return {
          executed: true,
          status: TASK_STATUS.BLOCKED,
          taskId: task.id,
          workspaceId,
          changedFiles,
          testResults,
          reason
        };
      }

      // STEP 5: Prepare a review package.
      const review = {
        taskId: task.id,
        taskTitle: task.title,
        area: task.area,
        runner: task.runner,
        workspaceId,
        changedFiles,
        changes: proposal.changes || null,
        testResults,
        status: "awaiting_owner_review",
        productionChangesMade: false,
        createdAt: new Date().toISOString()
      };

      const savedReview = await reviewStore.createReview(
        review
      );

      // STEP 6: Move the task into the review stage.
      await developmentDirector.updateTask(task.id, {
        status: TASK_STATUS.REVIEW,
        result: {
          success: true,
          workspaceId,
          changedFiles,
          testResults,
          reviewId: savedReview?.id || null,
          status: "awaiting_owner_review"
        }
      });

      return {
        executed: true,
        status: TASK_STATUS.REVIEW,
        taskId: task.id,
        workspaceId,
        changedFiles,
        testResults,
        review: savedReview || review,
        productionChangesMade: false
      };

    } catch (error) {
      const blocked = await markBlocked(
        task.id,
        error.message
      );

      return {
        executed: true,
        status: TASK_STATUS.BLOCKED,
        taskId: task.id,
        workspaceId,
        reason: error.message,
        taskUpdated: blocked.updated
      };
    }
  }

  return Object.freeze({
    executeNextTask,
    getAllowedPaths() {
      return [...normalizedAllowedPaths];
    }
  });
}
