/**
 * LAMBO CITY ALIVE — owner-vision intake and dependency-aware task planner.
 *
 * The language model is injected by a trusted host. This module validates
 * its proposed plan, keeps future/blocked work out of execution, and only
 * creates Director tasks when the owner explicitly submits selected items.
 */
const LANES = new Set(["launch", "foundation", "future", "blocked"]);
const PRIORITIES = new Set(["low", "normal", "high", "critical"]);

function text(value, field, max = 1000) {
  if (typeof value !== "string" || !value.trim()) throw new Error(field + " is required.");
  const result = value.trim();
  if (result.length > max) throw new Error(field + " exceeds " + max + " characters.");
  return result;
}
function list(value, field, maxItems = 12, maxLength = 400) {
  if (!Array.isArray(value) || value.length < 1 || value.length > maxItems) {
    throw new Error(field + " must contain 1–" + maxItems + " items.");
  }
  return [...new Set(value.map((item, i) => text(item, field + " " + (i + 1), maxLength)))];
}
function clone(value) { return JSON.parse(JSON.stringify(value)); }

export function validateVisionPlan(raw, workerRoster) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Vision planner must return an object.");
  const title = text(raw.title, "Plan title", 140);
  const summary = text(raw.summary, "Plan summary", 2000);
  if (!Array.isArray(raw.items) || raw.items.length < 1 || raw.items.length > 40) {
    throw new Error("Vision plan must contain 1–40 work items.");
  }
  const workers = new Map(workerRoster.listWorkers().map(worker => [worker.id, worker]));
  const seen = new Set();
  const items = raw.items.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("Plan item " + index + " must be an object.");
    const key = text(item.key, "Task key", 64).toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]{2,63}$/.test(key)) throw new Error("Task keys must be 3–64 lowercase letters, numbers, or hyphens.");
    if (seen.has(key)) throw new Error("Duplicate task key: " + key);
    seen.add(key);
    const lane = text(item.lane, "Task lane", 20);
    if (!LANES.has(lane)) throw new Error("Unsupported task lane: " + lane);
    const workerId = text(item.workerId, "Worker ID", 64);
    const worker = workers.get(workerId);
    if (!worker) throw new Error("Unknown specialist worker: " + workerId);
    if (!worker.enabled) throw new Error("Specialist worker is disabled: " + workerId);
    const area = text(item.area, "Development area", 80);
    if (!worker.areas.includes(area)) throw new Error("Worker " + workerId + " is not authorized for area: " + area);
    const priority = item.priority === undefined ? "normal" : item.priority;
    if (!PRIORITIES.has(priority)) throw new Error("Invalid priority for " + key);
    const dependencies = item.dependencies === undefined ? [] : item.dependencies;
    if (!Array.isArray(dependencies) || dependencies.length > 20) throw new Error("Dependencies for " + key + " must be an array of at most 20 task keys.");
    const protectedActions = item.protectedActions === undefined ? [] : item.protectedActions;
    if (!Array.isArray(protectedActions) || protectedActions.some(v => typeof v !== "string" || !v.trim())) throw new Error("Protected actions for " + key + " must be an array of strings.");
    return Object.freeze({
      key, lane, workerId,
      title: text(item.title, "Task title", 140),
      description: text(item.description, "Task description", 4000),
      area, priority,
      acceptanceCriteria: list(item.acceptanceCriteria, "Acceptance criterion", 12, 400),
      dependencies: [...new Set(dependencies.map(v => text(v, "Dependency key", 64).toLowerCase()))],
      protectedActions: [...new Set(protectedActions.map(v => v.trim()))]
    });
  });
  const byKey = new Map(items.map(item => [item.key, item]));
  for (const item of items) {
    for (const dep of item.dependencies) {
      if (!byKey.has(dep)) throw new Error("Unknown dependency " + dep + " referenced by " + item.key);
      if (dep === item.key) throw new Error("Task cannot depend on itself: " + item.key);
    }
  }
  const visiting = new Set();
  const visited = new Set();
  function visit(key) {
    if (visiting.has(key)) throw new Error("Vision plan dependency cycle detected at " + key);
    if (visited.has(key)) return;
    visiting.add(key);
    for (const dep of byKey.get(key).dependencies) visit(dep);
    visiting.delete(key);
    visited.add(key);
  }
  items.forEach(item => visit(item.key));
  return Object.freeze({ title, summary, items: Object.freeze(items) });
}

export function createVisionIntakePlanner(options = {}) {
  const planner = options.planner;
  const workerRoster = options.workerRoster;
  const director = options.developmentDirector;
  if (typeof planner !== "function") throw new Error("A trusted vision planner function is required.");
  if (!workerRoster || typeof workerRoster.listWorkers !== "function") throw new Error("A specialist worker roster is required.");
  if (!director || typeof director.createTask !== "function") throw new Error("A Development Director is required.");
  let lastPlan = null;

  async function intakeVision(input = {}) {
    const vision = text(input.vision, "Owner vision", 8000);
    const context = input.context === undefined ? {} : input.context;
    if (!context || typeof context !== "object" || Array.isArray(context)) throw new Error("Vision context must be an object.");
    const proposed = await planner({ vision, context: clone(context) });
    const validated = validateVisionPlan(proposed, workerRoster);
    lastPlan = Object.freeze({
      ...validated,
      sourceVision: vision,
      createdAt: new Date().toISOString()
    });
    return getPlan();
  }

  function getPlan() {
    return lastPlan ? clone(lastPlan) : null;
  }

  async function submitPlanTasks(taskKeys) {
    if (!lastPlan) throw new Error("No vision plan is available. Call intakeVision() first.");
    if (!Array.isArray(taskKeys) || taskKeys.length < 1) throw new Error("Select at least one task key to submit.");
    const selected = new Set(taskKeys.map(key => text(key, "Selected task key", 64).toLowerCase()));
    const byKey = new Map(lastPlan.items.map(item => [item.key, item]));
    for (const key of selected) {
      const item = byKey.get(key);
      if (!item) throw new Error("Unknown selected task key: " + key);
      if (item.lane === "blocked") throw new Error("Blocked work cannot be submitted: " + key);
      for (const dep of item.dependencies) {
        if (!selected.has(dep)) throw new Error("Select dependency " + dep + " before submitting " + key);
      }
    }
    const ordered = [];
    const visited = new Set();
    function visit(key) {
      if (visited.has(key)) return;
      const item = byKey.get(key);
      item.dependencies.forEach(visit);
      visited.add(key);
      ordered.push(item);
    }
    selected.forEach(visit);
    const created = new Map();
    const results = [];
    for (const item of ordered) {
      const task = await director.createTask({
        title: item.title,
        description: item.description,
        area: item.area,
        runner: item.workerId,
        priority: item.priority,
        acceptanceCriteria: item.acceptanceCriteria,
        dependencies: item.dependencies.map(dep => created.get(dep).id),
        protectedActions: item.protectedActions
      });
      created.set(item.key, task);
      results.push(Object.freeze({ key: item.key, lane: item.lane, task }));
    }
    return Object.freeze(results);
  }

  return Object.freeze({
    intakeVision,
    getPlan,
    submitPlanTasks
  });
}
