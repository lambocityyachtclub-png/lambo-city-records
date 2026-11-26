import { listProjectContracts } from "../../alive/contracts/projectContracts.js";
import { createProjectDiscoveryService } from "../blueprints/projectDiscoveryService.js";
import { createIsolatedWorkspaceAdapter } from "../execution/isolatedWorkspaceAdapter.js";
import { createAIGatewayProposalProvider } from "../providers/aiGatewayProposalProvider.js";
import { createAIGatewayWorkspaceProposalProvider } from "../providers/aiGatewayWorkspaceProposalProvider.js";

export const HOSTED_ALIVE_COMPONENTS_VERSION = "1.0.0";

export function createHostedAliveComponents(options = {}) {
  const env = options.env || process.env;
  const projectRoot = options.projectRoot || process.cwd();
  const contracts = listProjectContracts();
  const allowedPaths = [...new Set(
    contracts
      .filter(contract => ["builder", "trusted-operator"].includes(contract.autonomyLevel))
      .flatMap(contract => contract.allowedPaths || [])
      .map(filePath => filePath.replace(/\/+$/, ""))
  )];

  if (allowedPaths.length === 0) {
    throw new Error("No contract-approved ALIVE workspace paths are available.");
  }

  const aiProvider = options.aiProvider || createAIGatewayProposalProvider({
    env,
    fetchImpl: options.fetchImpl
  });
  const projectDiscovery = options.projectDiscovery || createProjectDiscoveryService({
    rootDir: projectRoot
  });
  const proposalProvider = options.proposalProvider || createAIGatewayWorkspaceProposalProvider({
    aiProvider,
    projectDiscovery
  });
  const workspaceAdapter = options.workspaceAdapter || createIsolatedWorkspaceAdapter({
    projectRoot,
    workspaceRoot: options.workspaceRoot,
    allowedPaths,
    proposalProvider,
    testRunner: options.testRunner || null,
    resourceProfiler: options.resourceProfiler || null
  });

  function getSnapshot() {
    const ai = aiProvider.getSnapshot();
    const workspace = workspaceAdapter.getSnapshot();
    return Object.freeze({
      version: HOSTED_ALIVE_COMPONENTS_VERSION,
      projectRootConfigured: true,
      approvedPathCount: allowedPaths.length,
      aiProvider: ai,
      projectDiscovery: projectDiscovery.getSnapshot(),
      workspaceAdapter: workspace,
      proposalGenerationEnabled: ai.enabled === true,
      isolatedExecutionReady: ai.enabled === true && workspace.testRunnerConfigured === true,
      autonomousProductionDeployment: false
    });
  }

  return Object.freeze({
    aiProvider,
    projectDiscovery,
    proposalProvider,
    workspaceAdapter,
    allowedPaths: Object.freeze([...allowedPaths]),
    getSnapshot
  });
}
