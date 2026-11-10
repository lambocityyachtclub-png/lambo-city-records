/**
 * LAMBO CITY ALIVE — isolated engine module lifecycle registry.
 *
 * This is an additive prototype. The live Engine is intentionally not wired
 * to it until compatibility and browser performance are verified.
 *
 * Modules expose init(scene, context), update(delta, context), and dispose().
 * Dependencies are resolved before any module is initialized. Initialization
 * failures dispose already-started modules in reverse dependency order.
 */

function requireId(value, label = "Module ID") {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(label + " is required.");
  }
  return value.trim();
}

function isFunction(value) {
  return typeof value === "function";
}

export function createEngineModuleRegistry(options = {}) {
  const modules = new Map();
  let initializedOrder = [];
  let state = "idle";

  function register(input = {}) {
    const id = requireId(input.id);
    const module = input.module;
    if (!module || typeof module !== "object") {
      throw new Error("Module " + id + " must be an object.");
    }
    if (!isFunction(module.init)) {
      throw new Error("Module " + id + " must provide init(scene, context).");
    }
    if (modules.has(id)) {
      throw new Error("Module already registered: " + id);
    }
    if (state !== "idle") {
      throw new Error("Modules can only be registered before initialization.");
    }

    const dependencies = [...new Set((input.dependencies || []).map(
      dependency => requireId(dependency, "Dependency ID")
    ))];
    if (dependencies.includes(id)) {
      throw new Error("A module cannot depend on itself: " + id);
    }

    modules.set(id, Object.freeze({
      id,
      module,
      dependencies: Object.freeze(dependencies),
      enabled: input.enabled !== false
    }));
    return get(id);
  }

  function get(id) {
    const record = modules.get(requireId(id));
    if (!record) return null;
    return Object.freeze({
      id: record.id,
      dependencies: [...record.dependencies],
      enabled: record.enabled,
      initialized: initializedOrder.includes(record.id)
    });
  }

  function resolveOrder() {
    const ordered = [];
    const visiting = new Set();
    const visited = new Set();

    function visit(id, trail = []) {
      const record = modules.get(id);
      if (!record) {
        throw new Error("Missing module dependency: " + id);
      }
      if (!record.enabled || visited.has(id)) return;
      if (visiting.has(id)) {
        throw new Error("Module dependency cycle: " + [...trail, id].join(" -> "));
      }

      visiting.add(id);
      for (const dependency of record.dependencies) {
        const dependencyRecord = modules.get(dependency);
        if (!dependencyRecord || !dependencyRecord.enabled) {
          throw new Error("Required dependency is unavailable: " + dependency);
        }
        visit(dependency, [...trail, id]);
      }
      visiting.delete(id);
      visited.add(id);
      ordered.push(record);
    }

    for (const record of modules.values()) {
      if (record.enabled) visit(record.id);
    }
    return ordered;
  }

  async function initializeAll(scene, context = options.context || {}) {
    if (state === "ready") return getSnapshot();
    if (state !== "idle") throw new Error("Registry is currently " + state + ".");
    const order = resolveOrder();
    state = "initializing";

    try {
      for (const record of order) {
        // Track before init so dispose() can clean up partial initialization
        // if the module throws after allocating resources.
        initializedOrder.push(record.id);
        await record.module.init(scene, context);
      }
      state = "ready";
      return getSnapshot();
    } catch (error) {
      await disposeInitialized(context);
      state = "idle";
      throw error;
    }
  }

  async function updateAll(delta, context = options.context || {}) {
    if (state !== "ready") return;
    for (const id of initializedOrder) {
      const record = modules.get(id);
      if (isFunction(record?.module.update)) {
        await record.module.update(delta, context);
      }
    }
  }

  async function disposeInitialized(context = options.context || {}) {
    const errors = [];
    for (const id of [...initializedOrder].reverse()) {
      const record = modules.get(id);
      if (isFunction(record?.module.dispose)) {
        try {
          await record.module.dispose(context);
        } catch (error) {
          errors.push({ id, message: String(error?.message || error) });
        }
      }
    }
    initializedOrder = [];
    return errors;
  }

  async function disposeAll(context = options.context || {}) {
    const errors = await disposeInitialized(context);
    state = "idle";
    return errors;
  }

  function getSnapshot() {
    return {
      state,
      totalModules: modules.size,
      enabledModules: [...modules.values()].filter(item => item.enabled).length,
      initializationOrder: [...initializedOrder],
      plannedOrder: resolveOrder().map(item => item.id)
    };
  }

  return Object.freeze({
    register,
    get,
    resolveOrder: () => resolveOrder().map(item => item.id),
    initializeAll,
    updateAll,
    disposeAll,
    getSnapshot
  });
}
