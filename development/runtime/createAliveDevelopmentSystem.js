/**
 * LAMBO CITY ALIVE — execution adapter composition.
 *
 * This is server-side development infrastructure. Never import it from the
 * browser game. Both paid capabilities remain opt-in through environment
 * flags and are disabled by default.
 */
import { createDevelopmentSystem } from "../engine/developmentSystem.js";
import { createIsolatedWorkspaceAdapter } from "../execution/isolatedWorkspaceAdapter.js";
import { createVercelAIGatewayProposalProvider } from "../execution/vercelAIGatewayProposalProvider.js";
import { createVercelSandboxTestRunner } from "../execution/vercelSandboxTestRunner.js";

export function createAliveExecutionAdapters(options = {}) {
  const proposalProvider = createVercelAIGatewayProposalProvider({
    enabled: options.aiEnabled === true,
    ...(options.ai || {})
  });
  const sandboxFactory = options.sandbox?.sandboxFactory || (async sandboxOptions => {
    const sdk = await import("@vercel/sandbox");
    return sdk.Sandbox.create(sandboxOptions);
  });
  const testRunner = createVercelSandboxTestRunner({
    enabled: options.sandboxEnabled === true,
    sandboxFactory,
    ...(options.sandbox || {})
  });
  const workspaceAdapter = createIsolatedWorkspaceAdapter({
    projectRoot: options.projectRoot,
    workspaceRoot: options.workspaceRoot,
    allowedPaths: options.allowedPaths,
    proposalProvider,
    testRunner
  });

  return Object.freeze({
    proposalProvider,
    testRunner,
    workspaceAdapter
  });
}

export async function createAliveDevelopmentSystem(options = {}) {
  if (!options.reviewStore) {
    throw new Error("A persistent reviewStore is required to create the ALIVE execution system.");
  }
  if (!Array.isArray(options.allowedPaths) || options.allowedPaths.length === 0) {
    throw new Error("An explicit allowedPaths list is required.");
  }
  if (typeof options.projectRoot !== "string" || !options.projectRoot.trim()) {
    throw new Error("A projectRoot is required.");
  }

  const adapters = createAliveExecutionAdapters(options);
  const system = await createDevelopmentSystem({
    storage: options.storage || null,
    clock: options.clock,
    workerRunnerIds: options.workerRunnerIds,
    workerId: options.workerId,
    maxTasksPerRun: options.maxTasksPerRun,
    workspaceAdapter: adapters.workspaceAdapter,
    reviewStore: options.reviewStore,
    allowedPaths: options.allowedPaths
  });

  return Object.freeze({ ...adapters, system });
}
