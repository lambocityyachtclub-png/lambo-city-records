/**
 * ALIVE — ISOLATED PROPOSAL WORKSPACE BRIDGE
 *
 * Connects the filesystem-isolated workspace to the validated proposal
 * provider contract. All reads/writes stay inside the disposable workspace.
 * Test execution is delegated to an explicitly injected trusted runner.
 */
import fs from "node:fs/promises";
import path from "node:path";

const BLOCKED_SEGMENTS = new Set([".git", ".vercel", "node_modules", "dist", "build"]);
const MAX_CONTEXT_FILES = 80;
const MAX_CONTEXT_FILE_BYTES = 64 * 1024;
const MAX_CONTEXT_TOTAL_BYTES = 512 * 1024;

function requireText(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required.`);
  return value.trim();
}

function validateRelativePath(value) {
  const filePath = requireText(value, "Workspace file path");
  if (filePath.startsWith("/") || filePath.includes("\\") || filePath.includes("\0")) {
    throw new Error(`Unsafe workspace file path: ${filePath}`);
  }
  const segments = filePath.split("/");
  if (segments.some(segment => !segment || segment === "." || segment === ".." || BLOCKED_SEGMENTS.has(segment))) {
    throw new Error(`Unsafe or blocked workspace file path: ${filePath}`);
  }
  return filePath;
}

function isAllowed(filePath, allowedPaths) {
  return allowedPaths.some(prefix => filePath === prefix || filePath.startsWith(`${prefix}/`));
}

function byteLength(value) {
  return new TextEncoder().encode(value).length;
}

export function createIsolatedProposalWorkspaceAdapter(options = {}) {
  const { workspaceAdapter, testRunner, projectContext } = options;
  const allowedPaths = Array.isArray(options.allowedPaths)
    ? [...new Set(options.allowedPaths.map(validateRelativePath))]
    : [];

  if (!workspaceAdapter) throw new Error("An isolated workspace adapter is required.");
  for (const method of ["createWorkspace", "getWorkspaceInfo", "readFile", "writeFile", "listChangedFiles"]) {
    if (typeof workspaceAdapter[method] !== "function") throw new Error(`workspaceAdapter.${method}() is required.`);
  }
  if (allowedPaths.length === 0) throw new Error("An explicit allowedPaths array is required.");
  if (typeof testRunner !== "function") throw new Error("An explicitly injected trusted testRunner is required.");

  async function readWorkspaceContext(input = {}) {
    const workspaceId = requireText(input.workspaceId, "Workspace ID");
    const info = await workspaceAdapter.getWorkspaceInfo(workspaceId);
    if (info.isolated !== true || typeof info.directory !== "string") {
      throw new Error("Workspace adapter did not confirm an isolated workspace directory.");
    }

    const files = [];
    let totalBytes = 0;

    async function addFile(filePath) {
      if (files.length >= MAX_CONTEXT_FILES) throw new Error("Workspace context exceeds the file-count limit.");
      const content = await workspaceAdapter.readFile({ workspaceId, filePath });
      const size = byteLength(content);
      if (size > MAX_CONTEXT_FILE_BYTES) throw new Error(`Workspace context file is too large: ${filePath}`);
      if (content.includes("\0")) throw new Error(`Binary content is not accepted in proposal context: ${filePath}`);
      totalBytes += size;
      if (totalBytes > MAX_CONTEXT_TOTAL_BYTES) throw new Error("Workspace context exceeds the total size limit.");
      files.push({ path: filePath, content });
    }

    async function visit(directory, relativeDirectory) {
      const entries = await fs.readdir(directory, { withFileTypes: true });
      for (const entry of entries) {
        if (BLOCKED_SEGMENTS.has(entry.name)) continue;
        const relativePath = validateRelativePath(`${relativeDirectory}/${entry.name}`);
        if (!isAllowed(relativePath, allowedPaths)) continue;
        const absolutePath = path.join(directory, entry.name);
        const stat = await fs.lstat(absolutePath);
        if (stat.isSymbolicLink()) throw new Error(`Workspace symlink rejected: ${relativePath}`);
        if (stat.isDirectory()) await visit(absolutePath, relativePath);
        else if (stat.isFile()) await addFile(relativePath);
        else throw new Error(`Unsupported workspace entry: ${relativePath}`);
      }
    }

    for (const allowedPath of allowedPaths) {
      const target = path.join(info.directory, ...allowedPath.split("/"));
      try {
        const stat = await fs.lstat(target);
        if (stat.isSymbolicLink()) throw new Error(`Workspace symlink rejected: ${allowedPath}`);
        if (stat.isDirectory()) await visit(target, allowedPath);
        else if (stat.isFile()) await addFile(allowedPath);
        else throw new Error(`Unsupported workspace entry: ${allowedPath}`);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }

    const context = { files: Object.freeze(files), totalBytes };
    const projectMap = typeof projectContext === "function"
      ? await projectContext({ task: input.task ?? null, allowedPaths: [...allowedPaths] })
      : projectContext;
    if (projectMap && typeof projectMap === "object") {
      const serialized = JSON.stringify(projectMap);
      if (typeof serialized !== "string" || serialized.length > 160_000) {
        throw new Error("Project discovery context exceeds the 160 KB safety limit.");
      }
      context.projectBlueprint = projectMap;
    }
    return Object.freeze(context);
  }

  async function applyProposedFiles(input = {}) {
    const workspaceId = requireText(input.workspaceId, "Workspace ID");
    if (!Array.isArray(input.files) || input.files.length === 0) throw new Error("At least one proposed file is required.");
    if (input.files.length > 20) throw new Error("Proposal exceeds the 20-file workspace limit.");
    const seen = new Set();
    let totalBytes = 0;
    for (const file of input.files) {
      const filePath = validateRelativePath(file?.path);
      if (!isAllowed(filePath, allowedPaths)) throw new Error(`Proposed file is outside allowed paths: ${filePath}`);
      if (seen.has(filePath)) throw new Error(`Duplicate proposed file: ${filePath}`);
      seen.add(filePath);
      if (typeof file.content !== "string" || file.content.includes("\0")) {
        throw new Error(`Proposal must contain text content: ${filePath}`);
      }
      const size = byteLength(file.content);
      if (size > 128 * 1024) throw new Error(`Proposed file exceeds the 128 KB limit: ${filePath}`);
      totalBytes += size;
      if (totalBytes > 512 * 1024) throw new Error("Proposal exceeds the 512 KB workspace limit.");
      await workspaceAdapter.writeFile({ workspaceId, filePath, content: file.content });
    }
    return { applied: true, files: [...seen], totalBytes };
  }

  async function runTests(input = {}) {
    const workspaceId = requireText(input.workspaceId, "Workspace ID");
    const info = await workspaceAdapter.getWorkspaceInfo(workspaceId);
    if (info.isolated !== true) throw new Error("Tests may run only in a confirmed isolated workspace.");
    const result = await testRunner({
      workspaceId,
      workspaceDirectory: info.directory,
      task: input.task ?? null,
      allowedPaths: [...allowedPaths]
    });
    if (!result || typeof result.passed !== "boolean") {
      throw new Error("Trusted testRunner must return a boolean passed field.");
    }
    return result;
  }

  return Object.freeze({
    createWorkspace: input => workspaceAdapter.createWorkspace(input),
    readWorkspaceContext,
    applyProposedFiles,
    runTests,
    listChangedFiles: input => workspaceAdapter.listChangedFiles(input),
    getWorkspaceInfo: workspaceId => workspaceAdapter.getWorkspaceInfo(workspaceId),
    destroyWorkspace: workspaceId => workspaceAdapter.destroyWorkspace?.(workspaceId),
    getAllowedPaths: () => [...allowedPaths]
  });
}
