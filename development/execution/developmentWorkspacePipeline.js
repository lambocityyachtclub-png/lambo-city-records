/**
 * LAMBO CITY ALIVE — bridge between the isolated workspace and the
 * Controlled Development Executor.
 *
 * The existing executor requires createWorkspace(), prepareChanges(), and
 * runTests(). The low-level isolated workspace currently supplies only file
 * operations. This adapter composes them without adding shell execution,
 * repository writes, commits, merges, or deployments.
 *
 * changePlanner and testRunner are explicit injected capabilities. They must
 * be trusted, separately sandboxed implementations. No default runner exists.
 */

function requireFunction(value, name) {
  if (typeof value !== "function") {
    throw new Error(name + " must be a function.");
  }
}

export function createDevelopmentWorkspacePipeline(options = {}) {
  const { workspaceAdapter, changePlanner, testRunner } = options;

  if (!workspaceAdapter) {
    throw new Error("An isolated workspace adapter is required.");
  }
  for (const method of ["createWorkspace", "readFile", "writeFile", "listChangedFiles"]) {
    requireFunction(workspaceAdapter[method], "workspaceAdapter." + method);
  }
  requireFunction(changePlanner, "changePlanner");
  requireFunction(testRunner, "testRunner");

  const proposals = new Map();

  async function createWorkspace(input = {}) {
    const workspace = await workspaceAdapter.createWorkspace(input);
    if (!workspace || typeof workspace.workspaceId !== "string" || !workspace.workspaceId) {
      throw new Error("Workspace adapter did not return a valid workspaceId.");
    }
    return workspace;
  }

  async function prepareChanges(input = {}) {
    const workspaceId = String(input.workspaceId || "");
    if (!workspaceId) throw new Error("workspaceId is required.");

    const plannerResult = await changePlanner({
      task: input.task,
      workspaceId,
      files: Object.freeze({
        read: filePath => workspaceAdapter.readFile({ workspaceId, filePath }),
        write: (filePath, content) => workspaceAdapter.writeFile({
          workspaceId,
          filePath,
          content
        })
      })
    });

    const changedFiles = await workspaceAdapter.listChangedFiles({ workspaceId });
    const uniqueChangedFiles = [...new Set(changedFiles)].sort();
    proposals.set(workspaceId, {
      taskId: input.task?.id || null,
      changedFiles: uniqueChangedFiles,
      summary: plannerResult?.summary || null
    });

    return {
      changedFiles: uniqueChangedFiles,
      changes: plannerResult?.summary || null
    };
  }

  async function runTests(input = {}) {
    const workspaceId = String(input.workspaceId || "");
    const proposal = proposals.get(workspaceId);
    if (!proposal) {
      throw new Error("Changes must be prepared before tests can run.");
    }

    const result = await testRunner({
      task: input.task,
      workspaceId,
      changedFiles: [...proposal.changedFiles]
    });

    if (!result || typeof result.passed !== "boolean") {
      throw new Error("testRunner must return an explicit boolean passed result.");
    }
    return result;
  }

  async function destroyWorkspace(workspaceId) {
    if (typeof workspaceAdapter.destroyWorkspace !== "function") {
      throw new Error("Workspace adapter does not support cleanup.");
    }
    proposals.delete(workspaceId);
    return workspaceAdapter.destroyWorkspace(workspaceId);
  }

  return Object.freeze({
    createWorkspace,
    prepareChanges,
    runTests,
    destroyWorkspace
  });
}
