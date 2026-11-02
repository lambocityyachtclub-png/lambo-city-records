
/**
 * LAMBO CITY — AUTONOMOUS DEVELOPMENT ENGINE
 * Central Development Director
 *
 * Purpose:
 * - Create and organize development tasks.
 * - Track task status and priority.
 * - Assign tasks to specialist runners.
 * - Enforce approval requirements.
 * - Track dependencies and development history.
 *
 * IMPORTANT:
 * This module is server-side development infrastructure.
 * Do NOT import it into the live game.
 */

export const TASK_STATUS = Object.freeze({
  PENDING_APPROVAL: "pending_approval",
  QUEUED: "queued",
  IN_PROGRESS: "in_progress",
  BLOCKED: "blocked",
  REVIEW: "review",
  COMPLETED: "completed",
  REJECTED: "rejected"
});

export const TASK_PRIORITY = Object.freeze({
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  CRITICAL: "critical"
});

const PRIORITY_WEIGHT = Object.freeze({
  low: 1,
  normal: 2,
  high: 3,
  critical: 4
});

const VALID_STATUSES = new Set(Object.values(TASK_STATUS));
const VALID_PRIORITIES = new Set(Object.values(TASK_PRIORITY));

const PROTECTED_ACTIONS = new Set([
  "spending_money",
  "paid_services",
  "billing",
  "payments",
  "security_permissions",
  "data_deletion",
  "major_architecture",
  "production_release",
  "crypto",
  "wallets",
  "accounts",
  "multiplayer",
  "protected_landmarks"
]);

function createId() {
  return `task_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function timestamp() {
  return new Date().toISOString();
}

function requireText(value, fieldName) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

function normalizeList(value) {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error("Expected an array.");
  }

  return [...new Set(value.map(item =>
    requireText(item, "List item")
  ))];
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function hasProtectedAction(actions = []) {
  return actions.some(action =>
    PROTECTED_ACTIONS.has(action)
  );
}

function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const priorityDifference =
      PRIORITY_WEIGHT[b.priority] -
      PRIORITY_WEIGHT[a.priority];

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return a.createdAt.localeCompare(b.createdAt);
  });
}

/**
 * Create the central Development Director.
 *
 * Optional storage adapter:
 * {
 *   load: async () => [],
 *   save: async (tasks) => {}
 * }
 *
 * Without an adapter, tasks remain in memory only.
 */
export function createDevelopmentDirector(options = {}) {
  const {
    storage = null,
    clock = timestamp
  } = options;

  if (
    storage !== null &&
    (
      typeof storage.load !== "function" ||
      typeof storage.save !== "function"
    )
  ) {
    throw new Error(
      "Storage must provide load() and save() functions."
    );
  }

  let tasks = [];
  let initialized = false;

  async function persist() {
    if (storage) {
      await storage.save(clone(tasks));
    }
  }

  function findTask(taskId) {
    const task = tasks.find(item => item.id === taskId);

    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    return task;
  }

  function record(task, event, details = {}) {
    task.history.push({
      event,
      details: clone(details),
      timestamp: clock()
    });

    task.updatedAt = clock();
  }

  function ensureInitialized() {
    if (!initialized) {
      throw new Error(
        "Development Director has not been initialized. Call initialize() first."
      );
    }
  }

  function ensureDependenciesComplete(task) {
    const incomplete = task.dependencies.filter(dependencyId => {
      const dependency = tasks.find(
        item => item.id === dependencyId
      );

      return !dependency ||
        dependency.status !== TASK_STATUS.COMPLETED;
    });

    if (incomplete.length > 0) {
      throw new Error(
        `Unfinished dependencies: ${incomplete.join(", ")}`
      );
    }
  }

  function ensureNoDependencyCycle(taskId, dependencies) {
    const visited = new Set();

    function visit(id) {
      if (id === taskId) {
        throw new Error("Task dependency cycle detected.");
      }

      if (visited.has(id)) {
        return;
      }

      visited.add(id);

      const dependency = tasks.find(item => item.id === id);

      if (dependency) {
        dependency.dependencies.forEach(visit);
      }
    }

    dependencies.forEach(visit);
  }

  /**
   * Load previously saved tasks.
   */
  async function initialize() {
    if (initialized) {
      return getSnapshot();
    }

    if (storage) {
      const savedTasks = await storage.load();

      if (!Array.isArray(savedTasks)) {
        throw new Error(
          "Storage load() must return an array."
        );
      }

      tasks = clone(savedTasks);
    }

    initialized = true;

    return getSnapshot();
  }

  /**
   * Create a new development task.
   */
  async function createTask(input = {}) {
    ensureInitialized();

    const title = requireText(input.title, "Task title");
    const area = requireText(input.area, "Task area");
    const runner = requireText(input.runner, "Runner");

    const description = input.description || "";
    const priority = input.priority || TASK_PRIORITY.NORMAL;

    if (!VALID_PRIORITIES.has(priority)) {
      throw new Error("Invalid task priority.");
    }

    const dependencies = normalizeList(input.dependencies);
    const acceptanceCriteria = normalizeList(
      input.acceptanceCriteria
    );

    const protectedActions = normalizeList(
      input.protectedActions
    );

    for (const dependencyId of dependencies) {
      if (!tasks.some(task => task.id === dependencyId)) {
        throw new Error(
          `Dependency does not exist: ${dependencyId}`
        );
      }
    }

    const id = createId();

    ensureNoDependencyCycle(id, dependencies);

    const requiresApproval =
      input.requiresApproval === true ||
      hasProtectedAction(protectedActions);

    const task = {
      id,
      title,
      description,
      area,
      runner,
      priority,
      status: requiresApproval
        ? TASK_STATUS.PENDING_APPROVAL
        : TASK_STATUS.QUEUED,

      requiresApproval,
      approvalReason: input.approvalReason || null,

      dependencies,
      acceptanceCriteria,

      assignedWorker: null,
      result: null,
      rejectionReason: null,

      createdAt: clock(),
      updatedAt: clock(),

      history: [{
        event: "task_created",
        details: {
          area,
          runner,
          priority,
          requiresApproval
        },
        timestamp: clock()
      }]
    };

    tasks.push(task);
    await persist();

    return clone(task);
  }

  /**
   * Approve a task that requires owner approval.
   */
  async function approveTask(taskId, approvedBy = "owner") {
    ensureInitialized();

    const task = findTask(taskId);

    if (task.status !== TASK_STATUS.PENDING_APPROVAL) {
      throw new Error(
        "Only tasks pending approval can be approved."
      );
    }

    task.status = TASK_STATUS.QUEUED;

    record(task, "task_approved", {
      approvedBy
    });

    await persist();

    return clone(task);
  }

  /**
   * Reject a task requiring approval.
   */
  async function rejectTask(taskId, reason) {
    ensureInitialized();

    const task = findTask(taskId);

    if (task.status !== TASK_STATUS.PENDING_APPROVAL) {
      throw new Error(
        "Only tasks pending approval can be rejected."
      );
    }

    task.status = TASK_STATUS.REJECTED;
    task.rejectionReason = requireText(
      reason,
      "Rejection reason"
    );

    record(task, "task_rejected", {
      reason: task.rejectionReason
    });

    await persist();

    return clone(task);
  }

  /**
   * Find the next eligible task for a specialist runner.
   */
  async function claimNextTask(runnerId, workerId) {
    ensureInitialized();

    requireText(runnerId, "Runner ID");
    requireText(workerId, "Worker ID");

    const eligible = sortTasks(tasks).find(task => {
      if (task.runner !== runnerId) return false;
      if (task.status !== TASK_STATUS.QUEUED) return false;

      return task.dependencies.every(dependencyId => {
        const dependency = tasks.find(
          item => item.id === dependencyId
        );

        return dependency &&
          dependency.status === TASK_STATUS.COMPLETED;
      });
    });

    if (!eligible) {
      return null;
    }

    eligible.status = TASK_STATUS.IN_PROGRESS;
    eligible.assignedWorker = workerId;

    record(eligible, "task_claimed", {
      runnerId,
      workerId
    });

    await persist();

    return clone(eligible);
  }

  /**
   * Update task progress or move it to another valid state.
   */
  async function updateTask(taskId, updates = {}) {
    ensureInitialized();

    const task = findTask(taskId);

    const allowedUpdates = [
      "description",
      "priority",
      "status",
      "assignedWorker",
      "result"
    ];

    for (const key of Object.keys(updates)) {
      if (!allowedUpdates.includes(key)) {
        throw new Error(
          `Task field cannot be updated directly: ${key}`
        );
      }
    }

    if (
      updates.priority !== undefined &&
      !VALID_PRIORITIES.has(updates.priority)
    ) {
      throw new Error("Invalid task priority.");
    }

    if (
      updates.status !== undefined &&
      !VALID_STATUSES.has(updates.status)
    ) {
      throw new Error("Invalid task status.");
    }

    if (
      updates.status === TASK_STATUS.COMPLETED &&
      task.status !== TASK_STATUS.REVIEW
    ) {
      throw new Error(
        "A task must pass review before completion."
      );
    }

    if (updates.status === TASK_STATUS.IN_PROGRESS) {
      ensureDependenciesComplete(task);
    }

    const previousStatus = task.status;

    Object.assign(task, updates);

    record(task, "task_updated", {
      previousStatus,
      updates
    });

    await persist();

    return clone(task);
  }

  /**
   * Return a task by ID.
   */
  function getTask(taskId) {
    ensureInitialized();
    return clone(findTask(taskId));
  }

  /**
   * List tasks with optional filters.
   */
  function listTasks(filters = {}) {
    ensureInitialized();

    let results = [...tasks];

    if (filters.status) {
      results = results.filter(
        task => task.status === filters.status
      );
    }

    if (filters.runner) {
      results = results.filter(
        task => task.runner === filters.runner
      );
    }

    if (filters.area) {
      results = results.filter(
        task => task.area === filters.area
      );
    }

    if (filters.priority) {
      results = results.filter(
        task => task.priority === filters.priority
      );
    }

    return clone(sortTasks(results));
  }

  /**
   * Return a summary of the development system.
   */
  function getSnapshot() {
    ensureInitialized();

    const counts = {};

    for (const status of VALID_STATUSES) {
      counts[status] = tasks.filter(
        task => task.status === status
      ).length;
    }

    return {
      initialized,
      totalTasks: tasks.length,
      counts,
      tasks: clone(sortTasks(tasks))
    };
  }

  return Object.freeze({
    initialize,
    createTask,
    approveTask,
    rejectTask,
    claimNextTask,
    updateTask,
    getTask,
    listTasks,
    getSnapshot
  });
}

