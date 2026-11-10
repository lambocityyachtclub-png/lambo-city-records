/**
 * LAMBO CITY ALIVE — bridge approved Development Director tasks to the
 * isolated hosted specialist queue.
 *
 * This module is server-side infrastructure. The queue client must be
 * injected by a trusted host; credentials never enter the browser.
 */
import { TASK_STATUS } from "../engine/developmentDirector.js";
import { validateWorkerTask } from "../automation/specialistWorkerPolicy.js";

export const HOSTED_SPECIALIST_QUEUE_VERSION = "1.0.0";
export const DEFAULT_ALIVE_WORKER_BRANCH = "integration/lc-alive-agentic-worker-2026-11-10";

function requireText(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(field + " is required.");
  }
  return value.trim();
}

export function validateAliveWorkerBranch(branch) {
  const value = requireText(branch, "ALIVE worker branch");
  if (!/^integration\/lc-alive-agentic-worker-[a-z0-9-]+$/.test(value)) {
    throw new Error("Hosted tasks may only be queued to an isolated ALIVE worker integration branch.");
  }
  return value;
}

function createQueueTaskId(taskId) {
  const normalized = requireText(taskId, "Director task ID")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 52);
  const id = "director-" + normalized;
  if (!/^[a-z0-9][a-z0-9-]{2,63}$/.test(id)) {
    throw new Error("Director task ID cannot be converted to a safe hosted queue ID.");
  }
  return id;
}

function errorMessage(error) {
  return error && typeof error.message === "string"
    ? error.message.slice(0, 600)
    : "Unknown hosted queue dispatch error.";
}

export function createHostedSpecialistQueueAdapter(options = {}) {
  const {
    developmentDirector,
    workerRoster,
    queueClient,
    branch = DEFAULT_ALIVE_WORKER_BRANCH,
    getReferenceFiles = () => []
  } = options;

  if (!developmentDirector ||
      typeof developmentDirector.claimNextTask !== "function" ||
      typeof developmentDirector.updateTask !== "function") {
    throw new Error("A Development Director with claimNextTask() and updateTask() is required.");
  }
  if (!workerRoster || typeof workerRoster.listWorkers !== "function") {
    throw new Error("A specialist worker roster is required.");
  }
  if (!queueClient || typeof queueClient.createTaskFile !== "function") {
    throw new Error("A trusted queueClient with createTaskFile() is required.");
  }
  if (typeof getReferenceFiles !== "function") {
    throw new Error("getReferenceFiles must be a function.");
  }

  const targetBranch = validateAliveWorkerBranch(branch);

  async function dispatchNextTask(workerId) {
    const id = requireText(workerId, "Worker ID");
    const worker = workerRoster.listWorkers().find(profile => profile.id === id);
    if (!worker) throw new Error("Unknown specialist worker: " + id);
    if (!worker.enabled) throw new Error("Specialist worker is disabled: " + id);

    const task = await developmentDirector.claimNextTask(
      worker.runnerId || worker.id,
      worker.id
    );
    if (!task) return null;

    let queueSubmissionState = "not_attempted";
    try {
      if (task.status !== TASK_STATUS.IN_PROGRESS) {
        throw new Error("Director did not move the selected task into progress.");
      }
      if (task.requiresApproval === true &&
          !task.history.some(entry => entry.event === "task_approved")) {
        throw new Error("Protected task has no recorded owner approval.");
      }
      if (typeof task.description !== "string" || !task.description.trim()) {
        throw new Error("Hosted tasks require a non-empty task description.");
      }
      if (!Array.isArray(task.acceptanceCriteria) || task.acceptanceCriteria.length === 0) {
        throw new Error("Hosted tasks require at least one acceptance criterion.");
      }
      if (!Array.isArray(worker.areas) || !worker.areas.includes(task.area)) {
        throw new Error("The assigned specialist is not authorized for task area: " + task.area);
      }

      const queueTaskId = createQueueTaskId(task.id);
      const referenceFiles = await getReferenceFiles(task);
      const queueTask = validateWorkerTask({
        id: queueTaskId,
        workerId: worker.id,
        title: task.title,
        vision: "Development Director task " + task.id + "\n\n" + task.description,
        acceptanceCriteria: task.acceptanceCriteria,
        priority: task.priority,
        referenceFiles
      });

      const path = "development/queue/incoming/" + queueTaskId + ".json";
      const content = JSON.stringify(queueTask, null, 2) + "\n";
      queueSubmissionState = "submitting";
      const commit = await queueClient.createTaskFile({
        branch: targetBranch,
        path,
        content,
        commitMessage: "chore(alive): queue specialist task " + queueTaskId
      });

      if (!commit || typeof commit.commitSha !== "string" || !commit.commitSha.trim()) {
        throw new Error("The hosted queue client did not confirm a Git commit SHA.");
      }

      queueSubmissionState = "submitted";
      const hostedQueue = Object.freeze({
        state: "submitted",
        branch: targetBranch,
        path,
        queueTaskId,
        commitSha: commit.commitSha,
        submittedAt: new Date().toISOString()
      });

      let updatedTask = task;
      let trackingError = null;
      try {
        updatedTask = await developmentDirector.updateTask(task.id, {
          result: {
            ...(task.result && typeof task.result === "object" ? task.result : {}),
            hostedQueue
          }
        });
      } catch (error) {
        // The queue commit already exists. Do not mark the task blocked:
        // the hosted worker may already be processing it.
        trackingError = errorMessage(error);
      }

      return Object.freeze({
        submitted: true,
        taskId: task.id,
        workerId: worker.id,
        task: updatedTask,
        queue: hostedQueue,
        trackingError
      });
    } catch (error) {
      const reason = errorMessage(error);
      const queueState = queueSubmissionState === "not_attempted" ? "blocked" : "unknown";
      let trackingError = null;
      let statusConfirmed = false;
      try {
        const update = {
          result: {
            ...(task.result && typeof task.result === "object" ? task.result : {}),
            hostedQueue: { state: queueState, reason }
          }
        };
        if (queueState === "blocked") update.status = TASK_STATUS.BLOCKED;
        const updatedTask = await developmentDirector.updateTask(task.id, update);
        const expectedStatus = queueState === "blocked" ? TASK_STATUS.BLOCKED : TASK_STATUS.IN_PROGRESS;
        statusConfirmed = updatedTask?.status === expectedStatus;
        if (!statusConfirmed) {
          trackingError = "Development Director did not confirm the expected task status.";
        }
      } catch (trackingFailure) {
        trackingError = errorMessage(trackingFailure);
      }

      let message;
      if (queueState === "blocked" && statusConfirmed) {
        message = "Hosted specialist dispatch failed before queue submission; task moved to blocked: " + reason;
      } else if (queueState === "blocked") {
        message = "Hosted specialist dispatch failed before queue submission, but the task could not be confirmed as blocked. Manual review required. Dispatch error: " +
          reason + ". Status update error: " + (trackingError || "status not confirmed");
      } else if (statusConfirmed) {
        message = "Hosted specialist queue submission result is uncertain; task remains in progress pending reconciliation: " + reason;
      } else {
        message = "Hosted specialist queue submission result is uncertain and task status could not be confirmed. Manual review required. Dispatch error: " +
          reason + ". Status update error: " + (trackingError || "status not confirmed");
      }

      const dispatchError = new Error(message, { cause: error });
      dispatchError.taskId = task.id;
      dispatchError.dispatchState = statusConfirmed ? queueState : "status_unconfirmed";
      dispatchError.queueSubmissionState = queueSubmissionState;
      dispatchError.trackingError = trackingError;
      throw dispatchError;
    }
  }

  return Object.freeze({
    version: HOSTED_SPECIALIST_QUEUE_VERSION,
    dispatchNextTask,
    getSnapshot() {
      return Object.freeze({
        version: HOSTED_SPECIALIST_QUEUE_VERSION,
        branch: targetBranch,
        configuredWorkers: workerRoster.listWorkers()
          .filter(worker => worker.enabled)
          .map(worker => worker.id)
      });
    }
  });
}
