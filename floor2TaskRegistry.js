
/**
 * LAMBO CITY RECORDS
 * FLOOR 2 TASK REGISTRY
 *
 * Mission:
 * Register approved tasks, validate their boundaries,
 * execute explicitly registered handlers, and track results.
 *
 * SAFETY:
 * - No AI or third-party services.
 * - No execution of arbitrary task text.
 * - No automatic source-code modifications.
 * - Only registered handlers can perform operations.
 * - Floor 2 tasks must declare their permitted files.
 */

export const FLOOR2_TASK_STATUS = Object.freeze({
  CREATED: "CREATED",
  VALIDATING: "VALIDATING",
  RUNNING: "RUNNING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  BLOCKED: "BLOCKED"
});

export function createFloor2TaskRegistry() {
  const handlers = new Map();
  const tasks = new Map();
  const history = [];

  function registerHandler(id, handler) {
    if (
      typeof id !== "string" ||
      !id.trim() ||
      typeof handler !== "function"
    ) {
      throw new Error("A valid handler ID and function are required.");
    }

    if (handlers.has(id)) {
      throw new Error(`Handler already exists: ${id}`);
    }

    handlers.set(id, handler);

    return { ok: true, handlerId: id };
  }

  function validateTask(task) {
    const errors = [];

    if (!task || typeof task !== "object") {
      return { ok: false, errors: ["Task must be an object."] };
    }

    if (typeof task.id !== "string" || !task.id.trim()) {
      errors.push("A task ID is required.");
    }

    if (tasks.has(task.id)) {
      errors.push("That task ID is already registered.");
    }

    if (task.target !== "floor2") {
      errors.push("Tasks must target Floor 2.");
    }

    if (
      typeof task.objective !== "string" ||
      !task.objective.trim()
    ) {
      errors.push("A task objective is required.");
    }

    if (
      !Array.isArray(task.allowedFiles) ||
      task.allowedFiles.length === 0
    ) {
      errors.push("Permitted files must be declared.");
    } else {
      for (const file of task.allowedFiles) {
        if (
          typeof file !== "string" ||
          !file.trim() ||
          file.startsWith("/") ||
          file.replace(/\\/g, "/").split("/").includes("..")
        ) {
          errors.push("An invalid permitted file path was supplied.");
          break;
        }
      }
    }

    if (!handlers.has(task.handlerId)) {
      errors.push("The requested handler is not registered.");
    }

    if (
      task.inputs !== undefined &&
      (
        task.inputs === null ||
        typeof task.inputs !== "object" ||
        Array.isArray(task.inputs)
      )
    ) {
      errors.push("Task inputs must be an object.");
    }

    return { ok: errors.length === 0, errors };
  }

  function registerTask(definition) {
    const validation = validateTask(definition);

    if (!validation.ok) {
      return {
        ok: false,
        status: FLOOR2_TASK_STATUS.BLOCKED,
        errors: validation.errors
      };
    }

    const task = {
      ...definition,
      allowedFiles: [...definition.allowedFiles],
      inputs: { ...(definition.inputs || {}) },
      status: FLOOR2_TASK_STATUS.CREATED
    };

    tasks.set(task.id, task);

    history.push({
      taskId: task.id,
      status: task.status,
      timestamp: new Date().toISOString()
    });

    return {
      ok: true,
      task: { ...task, allowedFiles: [...task.allowedFiles] }
    };
  }

  async function runTask(id, inputOverrides = {}) {
    const task = tasks.get(id);

    if (!task) {
      return {
        ok: false,
        status: FLOOR2_TASK_STATUS.BLOCKED,
        errors: ["Task is not registered."]
      };
    }

    if (task.status === FLOOR2_TASK_STATUS.RUNNING) {
      return {
        ok: false,
        status: FLOOR2_TASK_STATUS.BLOCKED,
        errors: ["Task is already running."]
      };
    }

    if (
      !inputOverrides ||
      typeof inputOverrides !== "object" ||
      Array.isArray(inputOverrides)
    ) {
      return {
        ok: false,
        status: FLOOR2_TASK_STATUS.BLOCKED,
        errors: ["Input overrides must be an object."]
      };
    }

    task.status = FLOOR2_TASK_STATUS.VALIDATING;

    const validation = {
      ok: handlers.has(task.handlerId),
      errors: []
    };

    if (!validation.ok) {
      validation.errors.push("Task handler is unavailable.");
    }

    if (!validation.ok) {
      task.status = FLOOR2_TASK_STATUS.BLOCKED;
      history.push({
        taskId: id,
        status: task.status,
        timestamp: new Date().toISOString()
      });

      return {
        ok: false,
        status: task.status,
        errors: validation.errors
      };
    }

    task.status = FLOOR2_TASK_STATUS.RUNNING;

    try {
      const result = await handlers.get(task.handlerId)({
        task: { ...task, allowedFiles: [...task.allowedFiles] },
        inputs: { ...task.inputs, ...inputOverrides },
        allowedFiles: [...task.allowedFiles]
      });

      task.status = FLOOR2_TASK_STATUS.COMPLETED;

      history.push({
        taskId: id,
        status: task.status,
        timestamp: new Date().toISOString()
      });

      return {
        ok: true,
        taskId: id,
        status: task.status,
        result
      };
    } catch (error) {
      task.status = FLOOR2_TASK_STATUS.FAILED;

      history.push({
        taskId: id,
        status: task.status,
        timestamp: new Date().toISOString(),
        error: String(error?.message || error)
      });

      return {
        ok: false,
        taskId: id,
        status: task.status,
        errors: [String(error?.message || error)]
      };
    }
  }

  function getTask(id) {
    const task = tasks.get(id);

    return task
      ? { ...task, allowedFiles: [...task.allowedFiles] }
      : null;
  }

  function listTasks() {
    return [...tasks.keys()].map(getTask);
  }

  function getHistory() {
    return history.map(entry => ({ ...entry }));
  }

  return Object.freeze({
    registerHandler,
    validateTask,
    registerTask,
    runTask,
    getTask,
    listTasks,
    getHistory
  });
}

