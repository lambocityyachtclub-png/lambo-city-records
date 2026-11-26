/**
 * ALIVE — bridge exact isolated workspace files into the AI Gateway provider.
 * This adapter reads only task.relatedFiles and passes a read-only discovery
 * report as optional project context. It never writes files or executes code.
 */

export function createAIGatewayWorkspaceProposalProvider(options = {}) {
  const aiProvider = options.aiProvider;
  const projectDiscovery = options.projectDiscovery || null;
  const includeProjectContext = options.includeProjectContext !== false;

  if (!aiProvider || typeof aiProvider.generateProposal !== "function") {
    throw new Error("A configured AI Gateway proposal provider is required.");
  }
  if (projectDiscovery && typeof projectDiscovery.scan !== "function") {
    throw new Error("Project Discovery must expose scan().");
  }

  async function proposeChanges(input = {}) {
    const task = input.task;
    if (!task || typeof task !== "object") throw new Error("A development task is required.");
    if (!Array.isArray(task.relatedFiles) || task.relatedFiles.length === 0) {
      throw new Error("The task has no exact approved source-file targets.");
    }
    if (typeof input.listFiles !== "function" || typeof input.readFile !== "function") {
      throw new Error("The isolated workspace must provide listFiles() and readFile().");
    }

    const workspaceFiles = await input.listFiles();
    const targets = [...new Set(task.relatedFiles)];
    if (!Array.isArray(workspaceFiles) ||
        workspaceFiles.length !== targets.length ||
        targets.some(target => !workspaceFiles.includes(target))) {
      throw new Error("Workspace file list does not exactly match the task's approved targets.");
    }

    const sourceFiles = [];
    for (const filePath of targets) {
      const content = await input.readFile(filePath);
      if (typeof content !== "string") {
        throw new Error("Workspace source file could not be read: " + filePath);
      }
      sourceFiles.push({ path: filePath, content });
    }

    const projectContext = includeProjectContext && projectDiscovery
      ? await projectDiscovery.scan()
      : null;

    return aiProvider.generateProposal({
      task,
      sourceFiles,
      projectContext
    });
  }

  function getSnapshot() {
    return Object.freeze({
      configured: true,
      provider: "vercel-ai-gateway",
      projectDiscoveryConnected: Boolean(projectDiscovery && includeProjectContext),
      readsOnlyTaskTargets: true,
      writesFiles: false,
      executesCode: false,
      deploysProduction: false
    });
  }

  return Object.freeze({ proposeChanges, getSnapshot });
}
