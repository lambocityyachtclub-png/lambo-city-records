/**
 * ALIVE — exact-target AI Gateway workspace bridge (version 1.0.0).
 *
 * Reads only the files explicitly attached to a task, optionally adds the
 * bounded read-only project-discovery report, and delegates proposal creation
 * to the separately budget-gated AI Gateway provider.
 */
function requireText(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(label + " is required.");
  return value.trim();
}

function safeTargetPath(value) {
  const filePath = requireText(value, "Approved source-file target");
  const parts = filePath.split("/");
  if (
    filePath.startsWith("/") ||
    filePath.includes("\\") ||
    filePath.includes(String.fromCharCode(0)) ||
    parts.some(part => !part || part === "." || part === ".." ||
      [".git", ".vercel", "node_modules", "dist", "build"].includes(part))
  ) {
    throw new Error("Unsafe approved source-file target: " + filePath);
  }
  return filePath;
}

function containsExactTargets(actual, expected) {
  if (!Array.isArray(actual)) return false;
  const available = new Set(actual.map(safeTargetPath));
  return expected.every(target => available.has(target));
}

function isCoveredByWorkspaceAllowlist(target, allowlist) {
  if (!Array.isArray(allowlist)) return true;
  return allowlist.some(value => {
    const allowed = safeTargetPath(value);
    return target === allowed || target.startsWith(allowed + "/");
  });
}

export function createAIGatewayWorkspaceProposalProvider(options = {}) {
  const aiProvider = options.aiProvider;
  const projectDiscovery = options.projectDiscovery || null;
  const includeProjectContext = options.includeProjectContext !== false;

  if (!aiProvider || typeof aiProvider.generateProposal !== "function") {
    throw new Error("A budget-gated AI Gateway proposal provider is required.");
  }
  if (includeProjectContext && projectDiscovery && typeof projectDiscovery.scan !== "function") {
    throw new Error("Project discovery must expose scan() when project context is enabled.");
  }

  async function proposeChanges(input = {}) {
    const task = input.task;
    if (!task || typeof task !== "object") throw new Error("A canonical ALIVE task is required.");
    if (!Array.isArray(task.relatedFiles) || task.relatedFiles.length === 0) {
      throw new Error("The ALIVE task has no exact approved source-file targets.");
    }

    const targets = task.relatedFiles.map(safeTargetPath);
    if (new Set(targets).size !== targets.length) {
      throw new Error("The ALIVE task contains duplicate approved source-file targets.");
    }
    if (typeof input.listFiles !== "function" || typeof input.readFile !== "function") {
      throw new Error("The isolated workspace must expose listFiles() and readFile().");
    }

    const listedFiles = await input.listFiles();
    if (!containsExactTargets(listedFiles, targets)) {
      throw new Error("The isolated workspace file list does not exactly match or contain every task-approved source-file target.");
    }
    if (!targets.every(target => isCoveredByWorkspaceAllowlist(target, input.workspace?.allowedPaths))) {
      throw new Error("The isolated workspace allowlist does not cover every task-approved source-file target.");
    }

    const sourceFiles = [];
    for (const filePath of targets) {
      const content = await input.readFile(filePath);
      if (typeof content !== "string" || content.includes(String.fromCharCode(0))) {
        throw new Error("The approved workspace source file must contain text: " + filePath);
      }
      sourceFiles.push(Object.freeze({ path: filePath, content }));
    }

    let projectContext = null;
    if (includeProjectContext && projectDiscovery) {
      projectContext = await projectDiscovery.scan();
    }

    return aiProvider.generateProposal({
      task,
      sourceFiles,
      projectContext
    });
  }

  return Object.freeze({ proposeChanges });
}
