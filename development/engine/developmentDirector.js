/**
 * LAMBO CITY — Autonomous Development Director
 *
 * Phase 1: Protected task coordination foundation.
 *
 * This module is for the separate development service,
 * NOT the live game or browser runtime.
 *
 * It does not yet call AI models, modify GitHub, execute code,
 * or deploy the website.
 *
 * Without a storage adapter, tasks exist in memory only.
 */

export const TASK_STATUSES = Object.freeze({
  PENDING_APPROVAL: "pending_approval",
  QUEUED: "queued",
  IN_PROGRESS: "in_progress",
  BLOCKED: "blocked",
  REVIEW: "review",
  COMPLETED: "completed",
  REJECTED: "rejected"
});

const VALID_STATUSES = new Set(Object.values(TASK_STATUSES));
const VALID_PRIORITIES = new Set([1, 2, 3, 4, 5]);

function createTaskId() {
  return `lc-task-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function cleanText(value, field, required = false) {
  if (value == null) {
    if (required) throw new Error(`${field} is required.`);
    return "";
  }

  if (typeof value !== "string") {
    throw new TypeError(`${field} must be a string.`);
  }

  const result = value.trim();

  if (required && !result) {
    throw new Error(`${field} is required.`);
  }

  return result;
}

function cloneTask(task) {
  return {
    ...task,
    dependencies: [...task.dependencies],
    acceptanceCriteria: [...task.acceptanceCriteria]
  };
}

function normalizeTask(input, now, idFactory) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("A task must be an object.");
  }

  const title = cleanText(input.title, "Task title", true);
  const description = cleanText(input.description, "Task description");
  const area = cleanText(input.area, "Task area", true);
  const runner = cleanText(input.runner, "Task runner", true);

  const priority = input.priority == null ? 3 : Number(input.priority);

  if (!VALID_PRIORITIES.has(priority)) {
    throw new Error("Priority must be an integer from 1 to 5.");
  }

  const dependencies = input.dependencies ?? [];

  if (
    !Array.isArray(dependencies) ||
    dependencies.some(id => typeof id !== "string" || !id.trim())
  ) {
    throw new TypeError("Dependencies must be an array of task IDs.");
  }

  const acceptanceCriteria = input.acceptanceCriteria ?? [];

  if (
    !Array.isArray(acceptanceCriteria) ||
    acceptanceCriteria.some(item => typeof item !== "string")
  ) {
    throw new TypeError("Acceptance criteria must be an array of strings.");
  }

  const approvalRequired = input.approvalRequired === true;
  const approvalReason = cleanText(input.approvalReason, "Approval reason");

  if (approvalRequired && !approvalReason) {
    throw new Error("An approval reason is required.");
  }

  const timestamp = now();

  return {
    id: cleanText(input.id, "Task ID") || idFactory(),
    title,
    description,
    area,
    runner,
    priority,
    status: approvalRequired
      ? TASK_STATUSES.PENDING_APPROVAL
      : TASK_STATUSES.QUEUED,
    approvalRequired,
    approvalReason,
    approvedBy: null,
    dependencies: [...new Set(dependencies.map(id => id.trim()))],
    acceptanceCriteria: acceptanceCriteria
      .map(item => item.trim())
      .filter(Boolean),
    source: cleanText(input.source, "Task source") || "autonomous_discovery",
    createdAt: timestamp,
    updatedAt: timestamp,
    claimedBy: null,
    result: null,
    lastError: null
  };
}

/**
 * Optional storage adapter:
 *
 * storage.load() returns an array of saved tasks.
 * storage.save(tasks) saves the complete task array.
 *
 * No storage adapter means memory-only operation.
 */
export function createDevelopmentDirector(options = {}) {
  const storage = options.storage || null;

  const now = typeof options.now === "function"
    ? options.now
    : () => new Date().toISOString();

  const idFactory = typeof options.idFactory === "function"
    ? options.idFactory
    : createTaskId;

  const tasks = new Map();
  let initialized = false;

  async function persist() {
    if (!storage) return;

    if (typeof storage.save !== "function") {
      throw new TypeError("Storage must provide save(tasks).");
    }

    await storage.save(
      Array.from(tasks.values(), cloneTask)
    );
  }

  function requireInitialized() {
    if (!initialized) {
      throw new Error("Call and await director.initialize() first.");
    }
  }

  function requireTask(taskId) {
    const id = cleanText(taskId, "Task ID", true);
    const task = tasks.get(id);

    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }

    return task;
  }

  function dependenciesAreComplete(task) {
    return task.dependencies.every(id => {
      const dependency = tasks.get(id);

      return dependency &&
        dependency.status === TASK_STATUSES.COMPLETED;
    });
  }

  const director = {

    async initialize() {
      if (initialized) return director;

      if (storage) {
        if (typeof storage.load !== "function") {
          throw new TypeError("Storage must provide load().");
        }

        const savedTasks = await storage.load();

        if (!Array.isArray(savedTasks)) {
          throw new TypeError("Storage must return an array.");
        }

        for (const task of savedTasks) {
          if (!task || typeof task.id !== "string" || !task.id.trim()) {
            throw new Error("Stored task has an invalid ID.");
          }

          if (!VALID_STATUSES.has(task.status)) {
            throw new Error(`Invalid status on task ${task.id}.`);
          }

          tasks.set(task.id, {
            ...task,
            dependencies: Array.isArray(task.dependencies)
              ? [...task.dependencies]
              : [],
            acceptanceCriteria: Array.isArray(task.acceptanceCriteria)
              ? [...task.acceptanceCriteria]
              : []
          });
        }
      }

      initialized = true;
      return director;
    },

    async createTask(input) {
      requireInitialized();

      const task = normalizeTask(input, now, idFactory);

      if (tasks.has(task.id)) {
        throw new Error(`Task ID already exists: ${task.id}`);
      }

      for (const dependencyId of task.dependencies) {
        if (!tasks.has(dependencyId)) {
          throw new Error(`Unknown dependency: ${dependencyId}`);
        }
      }

      tasks.set(task.id, task);

      try {
        await persist();
      } catch (error) {
        tasks.delete(task.id);
        throw error;
      }

      return cloneTask(task);
    },

    getTask(taskId) {
      requireInitialized();
      return cloneTask(requireTask(taskId));
    },

    listTasks(filters = {}) {
      requireInitialized();

      return Array.from(tasks.values())
        .filter(task => !filters.status || task.status === filters.status)
        .filter(task => !filters.runner || task.runner === filters.runner)
        .filter(task => !filters.area || task.area === filters.area)
        .sort((a, b) =>
          b.priority - a.priority ||
          a.createdAt.localeCompare(b.createdAt)
        )
        .map(cloneTask);
    },

    async approveTask(taskId, approvedBy) {
      requireInitialized();

      const task = requireTask(taskId);

      if (task.status !== TASK_STATUSES.PENDING_APPROVAL) {
        throw new Error("This task is not awaiting approval.");
      }

      task.approvedBy = cleanText(approvedBy, "Approver", true);
      task.status = TASK_STATUSES.QUEUED;
      task.updatedAt = now();

      await persist();
      return cloneTask(task);
    },

    async rejectTask(taskId, reason) {
      requireInitialized();

      const task = requireTask(taskId);

      if (task.status !== TASK_STATUSES.PENDING_APPROVAL) {
        throw new Error("This task is not awaiting approval.");
      }

      task.status = TASK_STATUSES.REJECTED;
      task.lastError =
        cleanText(reason, "Rejection reason") || "Rejected by owner.";
      task.updatedAt = now();

      await persist();
      return cloneTask(task);
    },

    async claimNextTask(runnerId, workerId) {
      requireInitialized();

      const runner = cleanText(runnerId, "Runner ID", true);
      const worker = cleanText(workerId, "Worker ID", true);

      const nextTask = Array.from(tasks.values())
        .filter(task => task.status === TASK_STATUSES.QUEUED)
        .filter(task => task.runner === runner)
        .filter(dependenciesAreComplete)
        .sort((a, b) =>
          b.priority - a.priority ||
          a.createdAt.localeCompare(b.createdAt)
        )[0];

      if (!nextTask) return null;

      nextTask.status = TASK_STATUSES.IN_PROGRESS;
      nextTask.claimedBy = worker;
      nextTask.updatedAt = now();

      await persist();
      return cloneTask(nextTask);
    },

    async updateTask(taskId, update = {}) {
      requireInitialized();

      const task = requireTask(taskId);

      if (!update || typeof update !== "object" || Array.isArray(update)) {
        throw new TypeError("Task update must be an object.");
      }

      const allowedStatuses = new Set([
        TASK_STATUSES.QUEUED,
        TASK_STATUSES.BLOCKED,
        TASK_STATUSES.REVIEW,
        TASK_STATUSES.COMPLETED,
        TASK_STATUSES.REJECTED
      ]);

      if (update.status != null) {
        if (!allowedStatuses.has(update.status)) {
          throw new Error("That status cannot be set through updateTask().");
        }

        if (
          task.status !== TASK_STATUSES.IN_PROGRESS &&
          update.status !== TASK_STATUSES.QUEUED
        ) {
          throw new Error("Invalid task status transition.");
        }

        if (
          update.status === TASK_STATUSES.COMPLETED &&
          !update.result
        ) {
          throw new Error("A completed task requires a result summary.");
        }

        task.status = update.status;
      }

      if (update.result != null) {
        task.result = cleanText(update.result, "Task result");
      }

      if (update.lastError != null) {
        task.lastError = cleanText(update.lastError, "Task error");
      }

      if (update.status === TASK_STATUSES.QUEUED) {
        task.claimedBy = null;
        task.lastError = null;
      }

      task.updatedAt = now();

      await persist();
      return cloneTask(task);
    },

    getSnapshot() {
      requireInitialized();

      const counts = Object.fromEntries(
        Object.values(TASK_STATUSES).map(status => [status, 0])
      );

      for (const task of tasks.values()) {
        counts[task.status] += 1;
      }

      return {
        initialized,
        totalTasks: tasks.size,
        counts,
        storage: storage ? "connected" : "memory_only"
      };
    }
  };

  return director;
}
