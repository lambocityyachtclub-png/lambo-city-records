import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { getProjectContract } from "../../alive/contracts/projectContracts.js";

export const ISOLATED_WORKSPACE_ADAPTER_VERSION = "1.0.0";

const BLOCKED_SEGMENTS = new Set([
  ".git", ".vercel", "node_modules", "dist", "build",
  "secrets", "secret", "credentials", "credential", "private", "tokens", "token"
]);
const SECRET_FILE = /^\.env(?:\..*)?$|^.*\.(?:pem|key|p12|pfx|crt|cer)$/i;
const MAX_SOURCE_FILE_BYTES = 1024 * 1024;
const DEFAULT_MAX_FILE_BYTES = 512 * 1024;
const DEFAULT_MAX_TOTAL_BYTES = 1024 * 1024;

function validateRelativePath(value) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.includes("\\") ||
    value.includes("\0") ||
    path.isAbsolute(value)
  ) {
    throw new Error("Unsafe workspace path: " + value);
  }

  const segments = value.split("/");
  if (segments.some(segment =>
    !segment ||
    segment === "." ||
    segment === ".." ||
    BLOCKED_SEGMENTS.has(segment.toLowerCase()) ||
    SECRET_FILE.test(segment)
  )) {
    throw new Error("Unsafe workspace path: " + value);
  }
  return segments.join("/");
}

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (
    relative !== ".." &&
    !relative.startsWith(".." + path.sep) &&
    !path.isAbsolute(relative)
  );
}

function hashBuffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function isAllowed(filePath, allowedPaths) {
  return allowedPaths.some(prefix => {
    const normalized = prefix.replace(/\/+$/, "");
    return filePath === normalized || filePath.startsWith(normalized + "/");
  });
}

async function assertNoSymlinks(root, target) {
  if (!isInside(root, target)) throw new Error("Workspace path escapes its root.");
  const relative = path.relative(root, target);
  const segments = relative ? relative.split(path.sep) : [];
  let current = root;
  for (const segment of segments) {
    current = path.join(current, segment);
    try {
      const info = await fs.lstat(current);
      if (info.isSymbolicLink()) throw new Error("Symbolic links are not allowed in ALIVE workspaces.");
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
  }
}

function splitLines(value) {
  return value.replace(/\r\n/g, "\n").split("\n");
}

function countChangedLines(before, after) {
  const oldLines = splitLines(before);
  const newLines = splitLines(after);
  let prefix = 0;
  while (prefix < oldLines.length && prefix < newLines.length && oldLines[prefix] === newLines[prefix]) prefix++;
  let suffix = 0;
  while (
    suffix < oldLines.length - prefix &&
    suffix < newLines.length - prefix &&
    oldLines[oldLines.length - 1 - suffix] === newLines[newLines.length - 1 - suffix]
  ) suffix++;
  return (oldLines.length - prefix - suffix) + (newLines.length - prefix - suffix);
}

function addedLines(before, after) {
  const oldLines = splitLines(before);
  const newLines = splitLines(after);
  let prefix = 0;
  while (prefix < oldLines.length && prefix < newLines.length && oldLines[prefix] === newLines[prefix]) prefix++;
  let suffix = 0;
  while (
    suffix < oldLines.length - prefix &&
    suffix < newLines.length - prefix &&
    oldLines[oldLines.length - 1 - suffix] === newLines[newLines.length - 1 - suffix]
  ) suffix++;
  return newLines.slice(prefix, newLines.length - suffix);
}

function extractImports(source) {
  const found = new Set();
  const patterns = [
    /^\s*import\s+(?:[^'"]*?\s+from\s*)?['"]([^'"]+)['"]/gm,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const specifier = match[1];
      if (!specifier.startsWith(".") && !specifier.startsWith("/") && !/^https?:\/\//i.test(specifier)) {
        found.add(specifier);
      }
    }
  }
  return found;
}

function countRuntimeLights(source) {
  const matches = source.match(/new\s+(?:THREE\.)?(?:PointLight|SpotLight|DirectionalLight|HemisphereLight|AmbientLight|RectAreaLight)\b/g);
  return matches ? matches.length : 0;
}

function analyzeChange(before, after) {
  const added = addedLines(before, after).join("\n");
  const beforeImports = extractImports(before);
  const newDependencies = [...extractImports(after)].filter(item => !beforeImports.has(item));
  return {
    linesChanged: countChangedLines(before, after),
    newDependencies,
    addedRuntimeLights: Math.max(0, countRuntimeLights(after) - countRuntimeLights(before)),
    textureTouched: /\b(?:TextureLoader|CanvasTexture|DataTexture|CubeTexture|texture\.(?:image|needsUpdate|wrapS|wrapT)|(?:map|normalMap|roughnessMap|metalnessMap)\s*:)/i.test(added),
    frameLoopTouched: /requestAnimationFrame|setAnimationLoop|renderer\.render|\bupdate\s*\(/i.test(added)
  };
}

function createReviewDiff(filePath, before, after) {
  const oldLines = splitLines(before);
  const newLines = splitLines(after);
  return [
    "--- a/" + filePath,
    "+++ b/" + filePath,
    "@@",
    ...oldLines.map(line => "-" + line),
    ...newLines.map(line => "+" + line)
  ].join("\n");
}

export function createIsolatedWorkspaceAdapter(options = {}) {
  const {
    projectRoot,
    allowedPaths,
    workspaceRoot = os.tmpdir(),
    proposalProvider = null,
    testRunner = null,
    resourceProfiler = null,
    maxProposalFiles = 40,
    maxFileBytes = DEFAULT_MAX_FILE_BYTES,
    maxTotalBytes = DEFAULT_MAX_TOTAL_BYTES
  } = options;

  if (typeof projectRoot !== "string" || !projectRoot.trim()) {
    throw new Error("A projectRoot directory is required.");
  }
  if (!Array.isArray(allowedPaths) || allowedPaths.length === 0) {
    throw new Error("An explicit allowedPaths list is required.");
  }

  const normalizedPaths = [...new Set(allowedPaths.map(value => validateRelativePath(value.replace(/\/+$/, ""))))];
  if (!Number.isInteger(maxProposalFiles) || maxProposalFiles < 1 || maxProposalFiles > 200) {
    throw new Error("maxProposalFiles must be between 1 and 200.");
  }
  if (!Number.isInteger(maxFileBytes) || maxFileBytes < 1 || maxFileBytes > 2 * 1024 * 1024) {
    throw new Error("maxFileBytes must be between 1 byte and 2 MiB.");
  }
  if (!Number.isInteger(maxTotalBytes) || maxTotalBytes < 1 || maxTotalBytes > 4 * 1024 * 1024) {
    throw new Error("maxTotalBytes must be between 1 byte and 4 MiB.");
  }

  function getProposalMethod() {
    if (typeof proposalProvider === "function") return proposalProvider;
    if (proposalProvider && typeof proposalProvider.proposeChanges === "function") {
      return proposalProvider.proposeChanges.bind(proposalProvider);
    }
    return null;
  }

  function getTestMethod() {
    if (typeof testRunner === "function") return testRunner;
    if (testRunner && typeof testRunner.runTests === "function") return testRunner.runTests.bind(testRunner);
    return null;
  }

  const workspaces = new Map();
  let resolvedProjectRoot;
  let resolvedWorkspaceRoot;

  async function initializeRoots() {
    if (resolvedProjectRoot && resolvedWorkspaceRoot) return;
    resolvedProjectRoot = await fs.realpath(projectRoot);
    await fs.mkdir(workspaceRoot, { recursive: true });
    resolvedWorkspaceRoot = await fs.realpath(workspaceRoot);
    if (isInside(resolvedProjectRoot, resolvedWorkspaceRoot)) {
      throw new Error("Workspace storage must be outside the project directory.");
    }
  }

  function getWorkspace(workspaceId) {
    const workspace = workspaces.get(workspaceId);
    if (!workspace) throw new Error("Workspace not found: " + workspaceId);
    return workspace;
  }

  async function resolveWorkspaceFile(workspace, filePath) {
    const safePath = validateRelativePath(filePath);
    if (!workspace.allowedPaths.includes(safePath)) {
      throw new Error("Path is outside the exact task targets: " + safePath);
    }
    const target = path.resolve(workspace.directory, ...safePath.split("/"));
    if (!isInside(workspace.directory, target)) throw new Error("Workspace path escapes its root.");
    await assertNoSymlinks(workspace.directory, target);
    return { safePath, target };
  }

  async function createWorkspace(input = {}) {
    await initializeRoots();
    const task = input.task;
    const taskId = String(input.taskId || task?.id || "").trim();
    if (!taskId) throw new Error("A taskId is required.");
    if (!task || task.id !== taskId) throw new Error("A matching development task is required.");

    const contract = getProjectContract(task.contractId);
    if (!contract || task.contractVersion !== contract.version) {
      throw new Error("The task's canonical ALIVE contract is missing or has changed.");
    }
    if (!Array.isArray(task.relatedFiles) || task.relatedFiles.length === 0) {
      throw new Error("Task has no exact approved source-file targets.");
    }

    const targets = [...new Set(task.relatedFiles.map(validateRelativePath))];
    const requested = Array.isArray(input.allowedPaths) ? input.allowedPaths.map(validateRelativePath) : [];
    if (requested.length !== targets.length || targets.some(target => !requested.includes(target))) {
      throw new Error("Workspace paths must exactly match the task's approved source-file targets.");
    }
    for (const target of targets) {
      if (!isAllowed(target, normalizedPaths)) throw new Error("Task target is outside the workspace allowlist: " + target);
      if (!isAllowed(target, contract.allowedPaths)) throw new Error("Task target is outside the canonical ALIVE contract allowlist: " + target);
    }

    const directory = await fs.mkdtemp(path.join(resolvedWorkspaceRoot, "lambo-city-task-"));
    const workspaceId = path.basename(directory);
    const baselineHashes = new Map();
    const baselineContents = new Map();

    try {
      for (const target of targets) {
        const source = path.resolve(resolvedProjectRoot, ...target.split("/"));
        if (!isInside(resolvedProjectRoot, source)) throw new Error("Source path escapes project root: " + target);
        await assertNoSymlinks(resolvedProjectRoot, source);
        const info = await fs.lstat(source);
        if (!info.isFile() || info.isSymbolicLink()) throw new Error("Task target must be an existing regular file: " + target);
        if (info.size > MAX_SOURCE_FILE_BYTES) throw new Error("Task source file exceeds the size limit: " + target);
        const content = await fs.readFile(source, "utf8");
        const destination = path.resolve(directory, ...target.split("/"));
        if (!isInside(directory, destination)) throw new Error("Workspace destination escapes isolated root.");
        await fs.mkdir(path.dirname(destination), { recursive: true });
        await fs.writeFile(destination, content, { encoding: "utf8", mode: 0o600, flag: "wx" });
        baselineContents.set(target, content);
        baselineHashes.set(target, hashBuffer(Buffer.from(content, "utf8")));
      }
    } catch (error) {
      await fs.rm(directory, { recursive: true, force: true });
      throw error;
    }

    workspaces.set(workspaceId, {
      workspaceId,
      taskId,
      task,
      contract,
      directory,
      allowedPaths: targets,
      baselineHashes,
      baselineContents
    });

    return {
      workspaceId,
      taskId,
      isolated: true,
      directory,
      allowedPaths: [...targets]
    };
  }

  async function readFile(input = {}) {
    const workspace = getWorkspace(input.workspaceId);
    const { target } = await resolveWorkspaceFile(workspace, input.filePath);
    const info = await fs.lstat(target);
    if (!info.isFile() || info.isSymbolicLink()) throw new Error("Requested path is not a regular file.");
    return fs.readFile(target, "utf8");
  }

  async function writeFile(input = {}) {
    const workspace = getWorkspace(input.workspaceId);
    const { target } = await resolveWorkspaceFile(workspace, input.filePath);
    if (typeof input.content !== "string") throw new Error("File content must be a string.");
    if (Buffer.byteLength(input.content, "utf8") > maxFileBytes) throw new Error("Proposed file exceeds the per-file size limit.");
    await fs.mkdir(path.dirname(target), { recursive: true });
    await assertNoSymlinks(workspace.directory, target);
    await fs.writeFile(target, input.content, { encoding: "utf8", flag: "w", mode: 0o600 });
    return { written: true, filePath: input.filePath };
  }

  async function listChangedFiles(input = {}) {
    const workspace = getWorkspace(input.workspaceId);
    const changedFiles = [];
    for (const filePath of workspace.allowedPaths) {
      const target = path.resolve(workspace.directory, ...filePath.split("/"));
      if (!isInside(workspace.directory, target)) throw new Error("Workspace path escapes its root.");
      let info;
      try {
        info = await fs.lstat(target);
      } catch (error) {
        if (error.code === "ENOENT") throw new Error("Deleting an approved task target is not permitted: " + filePath);
        throw error;
      }
      if (!info.isFile() || info.isSymbolicLink()) throw new Error("Task target is no longer a regular file: " + filePath);
      const buffer = await fs.readFile(target);
      if (hashBuffer(buffer) !== workspace.baselineHashes.get(filePath)) changedFiles.push(filePath);
    }
    return changedFiles.sort();
  }

  async function measureChanges(input = {}) {
    const workspace = getWorkspace(input.workspaceId);
    const changedFiles = input.changedFiles || await listChangedFiles({ workspaceId: workspace.workspaceId });
    let linesChanged = 0;
    let addedRuntimeLights = 0;
    const newDependencies = new Set();
    let textureTouched = false;
    let frameLoopTouched = false;

    for (const filePath of changedFiles) {
      if (!workspace.allowedPaths.includes(filePath)) throw new Error("Metrics requested outside exact task targets.");
      const before = workspace.baselineContents.get(filePath);
      const after = await readFile({ workspaceId: workspace.workspaceId, filePath });
      const analysis = analyzeChange(before, after);
      linesChanged += analysis.linesChanged;
      addedRuntimeLights += analysis.addedRuntimeLights;
      analysis.newDependencies.forEach(item => newDependencies.add(item));
      textureTouched ||= analysis.textureTouched;
      frameLoopTouched ||= analysis.frameLoopTouched;
    }

    let profiled = {};
    if ((textureTouched || frameLoopTouched) && typeof resourceProfiler === "function") {
      profiled = await resourceProfiler({
        workspaceId: workspace.workspaceId,
        workspaceDirectory: workspace.directory,
        task: workspace.task,
        changedFiles: [...changedFiles],
        textureTouched,
        frameLoopTouched
      }) || {};
    }

    return Object.freeze({
      changedFiles: changedFiles.length,
      linesChanged,
      newDependencies: newDependencies.size,
      addedRuntimeLights,
      maxTextureDimension: textureTouched
        ? (Number.isFinite(profiled.maxTextureDimension) ? profiled.maxTextureDimension : null)
        : 0,
      maxAddedFrameLoopWorkMs: frameLoopTouched
        ? (Number.isFinite(profiled.maxAddedFrameLoopWorkMs) ? profiled.maxAddedFrameLoopWorkMs : null)
        : 0,
      textureTouched,
      frameLoopTouched
    });
  }

  async function prepareChanges(input = {}) {
    const workspace = getWorkspace(input.workspaceId);
    if (input.task?.id !== workspace.taskId) throw new Error("Workspace task identity mismatch.");
    const propose = getProposalMethod();
    if (!propose) throw new Error("No trusted proposalProvider is configured for isolated code preparation.");

    const proposal = await propose({
      task: workspace.task,
      workspace: {
        workspaceId: workspace.workspaceId,
        taskId: workspace.taskId,
        allowedPaths: [...workspace.allowedPaths]
      },
      listFiles: async () => [...workspace.allowedPaths],
      readFile: filePath => readFile({ workspaceId: workspace.workspaceId, filePath })
    });

    if (!proposal || !Array.isArray(proposal.files) || proposal.files.length === 0) {
      throw new Error("Proposal provider must return a non-empty files array.");
    }
    const maxFiles = Math.min(maxProposalFiles, workspace.contract.resourceBudget.maxChangedFiles, workspace.allowedPaths.length);
    if (proposal.files.length > maxFiles) throw new Error("Proposal exceeds the canonical changed-file limit.");

    const seen = new Set();
    let totalBytes = 0;
    for (const file of proposal.files) {
      if (!file || typeof file !== "object") throw new Error("Every proposed file must be an object.");
      const safePath = validateRelativePath(file.path);
      if (!workspace.allowedPaths.includes(safePath)) throw new Error("Proposal attempted to change a file outside exact task targets: " + safePath);
      if (seen.has(safePath)) throw new Error("Duplicate proposed file path: " + safePath);
      seen.add(safePath);
      if (typeof file.content !== "string" || !file.content.trim()) throw new Error("Proposed file content must be non-empty text: " + safePath);
      const bytes = Buffer.byteLength(file.content, "utf8");
      totalBytes += bytes;
      if (bytes > maxFileBytes) throw new Error("Proposed file exceeds the per-file size limit: " + safePath);
      if (totalBytes > maxTotalBytes) throw new Error("Proposal exceeds the total file-size limit.");
      await writeFile({ workspaceId: workspace.workspaceId, filePath: safePath, content: file.content });
    }

    const changedFiles = await listChangedFiles({ workspaceId: workspace.workspaceId });
    if (changedFiles.length === 0) throw new Error("Proposal did not change any approved source files.");
    const metrics = await measureChanges({ workspaceId: workspace.workspaceId, changedFiles });
    const diffs = [];
    for (const filePath of changedFiles) {
      const before = workspace.baselineContents.get(filePath);
      const after = await readFile({ workspaceId: workspace.workspaceId, filePath });
      diffs.push(createReviewDiff(filePath, before, after));
    }
    const diff = diffs.join("\n\n");
    return {
      changedFiles,
      metrics,
      changes: {
        summary: typeof proposal.summary === "string" ? proposal.summary.slice(0, 2000) : "Proposed changes prepared in an isolated workspace.",
        risk: typeof proposal.risk === "string" ? proposal.risk : "unknown",
        notes: Array.isArray(proposal.notes) ? [...proposal.notes] : [],
        provider: proposal.provider || null,
        model: proposal.model || null,
        usage: proposal.usage || null,
        diff: Buffer.byteLength(diff, "utf8") <= 1024 * 1024 ? diff : null,
        proposedFileCount: proposal.files.length
      }
    };
  }

  async function runTests(input = {}) {
    const workspace = getWorkspace(input.workspaceId);
    if (input.task?.id !== workspace.taskId) throw new Error("Workspace task identity mismatch.");
    const run = getTestMethod();
    if (!run) throw new Error("No trusted sandboxed testRunner is configured; generated code will not be executed.");
    const changedFiles = await listChangedFiles({ workspaceId: workspace.workspaceId });
    const result = await run({
      task: workspace.task,
      workspace: await getWorkspaceInfo(workspace.workspaceId),
      changedFiles
    });
    if (!result || typeof result.passed !== "boolean") {
      throw new Error("Test runner must return a boolean passed field.");
    }
    return {
      ...result,
      passed: result.passed === true,
      isolatedWorkspace: true,
      executionAdapter: "injected-test-runner"
    };
  }

  async function getWorkspaceInfo(workspaceId) {
    const workspace = getWorkspace(workspaceId);
    return {
      workspaceId: workspace.workspaceId,
      taskId: workspace.taskId,
      directory: workspace.directory,
      isolated: true,
      allowedPaths: [...workspace.allowedPaths]
    };
  }

  async function destroyWorkspace(input) {
    const workspaceId = typeof input === "string" ? input : input?.workspaceId;
    const workspace = getWorkspace(workspaceId);
    await fs.rm(workspace.directory, { recursive: true, force: true });
    workspaces.delete(workspaceId);
    return { destroyed: true, workspaceId };
  }

  function getSnapshot() {
    return Object.freeze({
      version: ISOLATED_WORKSPACE_ADAPTER_VERSION,
      configured: true,
      activeWorkspaces: workspaces.size,
      writesProjectFiles: false,
      readsOutsideTaskTargets: false,
      copiesSecretPaths: false,
      executesCode: false,
      deploysProduction: false,
      testRunnerConfigured: typeof getTestMethod() === "function",
      resourceProfilerConfigured: typeof resourceProfiler === "function"
    });
  }

  return Object.freeze({
    createWorkspace,
    readFile,
    writeFile,
    prepareChanges,
    runTests,
    listChangedFiles,
    measureChanges,
    getWorkspaceInfo,
    destroyWorkspace,
    getAllowedPaths() {
      return [...normalizedPaths];
    },
    getSnapshot
  });
}
