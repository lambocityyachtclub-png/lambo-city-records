import { createDevelopmentSystem } from "../engine/developmentSystem.js";
import { createIndexedDbDevelopmentStorage } from "../storage/indexedDbDevelopmentStorage.js";

/**
 * Start the ALIVE owner control plane with browser-local persistence.
 *
 * This path intentionally configures no AI provider, hosted queue, database,
 * sandbox, code generator, or code executor. Those capabilities remain
 * separate opt-in adapters. Task/review records stay in this browser profile.
 */
export async function createLocalAliveControlPlane(options = {}) {
  const persistence = createIndexedDbDevelopmentStorage(options);
  try {
    const systemOptions = { storage: persistence.taskStorage };
    if (typeof options.clock === "function") systemOptions.clock = options.clock;
    const system = await createDevelopmentSystem(systemOptions);
    return Object.freeze({
      system,
      taskStorage: persistence.taskStorage,
      reviewStore: persistence.reviewStore,
      storageMode: "browser-indexeddb",
      localOnly: true,
      hostedQueueConfigured: false,
      configuredExecutionWorkers: Object.freeze([]),
      aiProviderConfigured: false,
      sandboxConfigured: false,
      getSnapshot: () => system.getSnapshot(),
      close: persistence.close
    });
  } catch (error) {
    await persistence.close();
    throw error;
  }
}
