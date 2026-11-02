
/**
 * LAMBO CITY — AUTONOMOUS DEVELOPMENT ENGINE
 * Development Registry
 *
 * Purpose:
 * - Register development modules.
 * - Track specialist development runners.
 * - Identify available system capabilities.
 * - Prevent duplicate module registrations.
 * - Provide a central development-system directory.
 *
 * This module does not execute code or modify game files.
 */

export const REGISTRY_VERSION = "1.0.0";

export const MODULE_TYPES = Object.freeze({
  ENGINE: "engine",
  POLICY: "policy",
  RUNNER: "runner",
  SERVICE: "service"
});

const VALID_MODULE_TYPES = new Set(
  Object.values(MODULE_TYPES)
);

export function createDevelopmentRegistry() {
  const modules = new Map();

  function requireText(value, field) {
    if (typeof value !== "string" || !value.trim()) {
      throw new Error(`${field} is required.`);
    }

    return value.trim();
  }

  function registerModule(input = {}) {
    const id = requireText(input.id, "Module ID");
    const name = requireText(input.name, "Module name");
    const type = requireText(input.type, "Module type");
    const version = requireText(input.version, "Module version");
    const description = requireText(
      input.description,
      "Module description"
    );

    const path = requireText(input.path, "Module path");

    if (!VALID_MODULE_TYPES.has(type)) {
      throw new Error(`Invalid module type: ${type}`);
    }

    if (modules.has(id)) {
      throw new Error(`Module already registered: ${id}`);
    }

    const moduleRecord = Object.freeze({
      id,
      name,
      type,
      version,
      description,
      path,
      enabled: input.enabled !== false,
      capabilities: Object.freeze([
        ...(input.capabilities || [])
      ]),
      registeredAt: new Date().toISOString()
    });

    modules.set(id, moduleRecord);

    return moduleRecord;
  }

  function unregisterModule(id) {
    const moduleId = requireText(id, "Module ID");

    if (!modules.has(moduleId)) {
      return false;
    }

    return modules.delete(moduleId);
  }

  function getModule(id) {
    const moduleId = requireText(id, "Module ID");

    return modules.get(moduleId) || null;
  }

  function listModules(filters = {}) {
    return Array.from(modules.values())
      .filter(module =>
        !filters.type || module.type === filters.type
      )
      .filter(module =>
        filters.enabled === undefined ||
        module.enabled === filters.enabled
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  function setModuleEnabled(id, enabled) {
    const moduleId = requireText(id, "Module ID");

    if (typeof enabled !== "boolean") {
      throw new Error("Enabled must be true or false.");
    }

    const existing = modules.get(moduleId);

    if (!existing) {
      throw new Error(`Module not found: ${moduleId}`);
    }

    const updated = Object.freeze({
      ...existing,
      enabled
    });

    modules.set(moduleId, updated);

    return updated;
  }

  function findByCapability(capability) {
    const requested = requireText(
      capability,
      "Capability"
    );

    return listModules({ enabled: true })
      .filter(module =>
        module.capabilities.includes(requested)
      );
  }

  function getSnapshot() {
    const records = listModules();

    return {
      version: REGISTRY_VERSION,
      totalModules: records.length,
      enabledModules: records.filter(
        module => module.enabled
      ).length,
      disabledModules: records.filter(
        module => !module.enabled
      ).length,
      types: Object.fromEntries(
        Object.values(MODULE_TYPES).map(type => [
          type,
          records.filter(module => module.type === type).length
        ])
      ),
      modules: records
    };
  }

  return Object.freeze({
    registerModule,
    unregisterModule,
    getModule,
    listModules,
    setModuleEnabled,
    findByCapability,
    getSnapshot
  });
}
