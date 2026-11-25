/**
 * ALIVE — LOCAL GIT WORKSPACE ADAPTER
 *
 * Creates disposable Git worktrees, applies explicit file proposals,
 * runs a fixed owner-configured test command list, and reports changed files.
 * It never commits, pushes, merges, or deploys.
 *
 * Code generation is deliberately injected through proposalProvider. This
 * keeps the execution layer provider-independent and makes it possible to
 * use owner-authored proposals or a locally hosted model without requiring
 * a paid AI API.
 */
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import {
  mkdtemp,
  mkdir,
  lstat,
  readFile,
  realpath,
  rm,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const execFile = promisify(execFileCallback);
const BLOCKED_SEGMENTS = new Set([
  ".git", ".vercel", "node_modules", "dist", "build"
]);
const MAX_FILE_BYTES = 1024 * 1024;
const MAX_TEST_TIMEOUT_MS = 120000;

function requiredText(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is required.`);
  }
  return value.trim();
}

function safeRelativePath(value) {
  const filePath = requiredText(value, "File path");
  if (filePath.includes("\\") || filePath.startsWith("/") || filePath.includes("\0")) {
    throw new Error(`Unsafe file path: ${filePath}`);
  }
  const segments = filePath.split("/");
  if (segments.some(part => !part || part === "." || part === ".." || BLOCKED_SEGMENTS.has(part))) {
    throw new Error(`Unsafe or protected file path: ${filePath}`);
  }
  return filePath;
}

function isAllowed(filePath, allowedPaths) {
  return allowedPaths.some(prefix => filePath === prefix || filePath.startsWith(`${prefix}/`));
}

function parseChangedPaths(statusText) {
  return statusText.split("\n").filter(Boolean).map(line => {
    const raw = line.slice(3).trim();
    const renamed = raw.includes(" -> ") ? raw.split(" -> ").at(-1) : raw;
    return renamed.replace(/^"(.*)"$/, "$1");
  });
}

async function assertNoSymlinkParents(root, filePath) {
  const segments = filePath.split("/");
  let current = root;
  for (const segment of segments.slice(0, -1)) {
    current = path.join(current, segment);
    try {
      const stat = await lstat(current);
      if (stat.isSymbolicLink() || !stat.isDirectory()) {
        throw new Error(`Unsafe symlink or non-directory parent: ${filePath}`);
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
}

async function runGit(repoRoot, args, options = {}) {
  return execFile("git", ["-C", repoRoot, ...args], {
    timeout: 30000,
    maxBuffer: 2 * 1024 * 1024,
    ...options
  });
}

export function createLocalGitWorkspaceAdapter(options = {}) {
  const {
    repositoryRoot,
    baseRef = "HEAD",
    allowedPaths,
    proposalProvider,
    testCommands = [],
    tempRoot = os.tmpdir()
  } = options;

  if (!Array.isArray(allowedPaths) || allowedPaths.length === 0) {
    throw new Error("An explicit non-empty allowedPaths array is required.");
  }
  if (typeof proposalProvider !== "function") {
    throw new Error("A proposalProvider function is required; no code generator is assumed.");
  }
  if (!Array.isArray(testCommands) || testCommands.length === 0) {
    throw new Error("At least one fixed test command is required.");
  }

  const normalizedAllowedPaths = [...new Set(allowedPaths.map(safeRelativePath))];
  const normalizedCommands = testCommands.map((item, index) => {
    if (!item || typeof item.command !== "string" || !item.command.trim() ||
        !Array.isArray(item.args) || item.args.some(arg => typeof arg !== "string")) {
      throw new Error(`Test command ${index + 1} must contain a command and string args array.`);
    }
    if (item.command.includes("/") || item.command.includes("\\")) {
      throw new Error("Test commands must use executable names, not arbitrary paths.");
    }
    return {
      command: item.command,
      args: [...item.args],
      timeout: Math.min(
        Number.isInteger(item.timeout) && item.timeout > 0 ? item.timeout : MAX_TEST_TIMEOUT_MS,
        MAX_TEST_TIMEOUT_MS
      )
    };
  });

  let repoRealPath;
  let tempRealPath;
  const workspaces = new Map();

  async function initialize() {
    if (!repoRealPath) {
      repoRealPath = await realpath(requiredText(repositoryRoot, "repositoryRoot"));
      tempRealPath = await realpath(tempRoot);
      const { stdout } = await runGit(repoRealPath, ["rev-parse", "--show-toplevel"]);
      if (path.resolve(stdout.trim()) !== repoRealPath) {
        throw new Error("repositoryRoot must be the Git repository root.");
      }
      await runGit(repoRealPath, ["rev-parse", "--verify", baseRef]);
    }
  }

  async function createWorkspace({ taskId }) {
    await initialize();
    const safeTaskId = requiredText(taskId, "taskId").replace(/[^a-zA-Z0-9_-]/g, "_");
    const parent = await mkdtemp(path.join(tempRealPath, "alive-worktree-"));
    const workspacePath = path.join(parent, safeTaskId);
    try {
      await runGit(repoRealPath, ["worktree", "add", "--detach", workspacePath, baseRef]);
      const workspaceId = `alive-${safeTaskId}-${workspaces.size + 1}`;
      workspaces.set(workspaceId, { workspacePath, parent });
      return { workspaceId };
    } catch (error) {
      await rm(parent, { recursive: true, force: true });
      throw error;
    }
  }

  function getWorkspace(workspaceId) {
    const record = workspaces.get(requiredText(workspaceId, "workspaceId"));
    if (!record) throw new Error("Unknown or already destroyed workspace.");
    return record;
  }

  async function prepareChanges({ workspaceId, task }) {
    const { workspacePath } = getWorkspace(workspaceId);
    const proposal = await proposalProvider({
      task,
      workspacePath,
      allowedPaths: [...normalizedAllowedPaths]
    });
    if (!proposal || !Array.isArray(proposal.fileChanges) || proposal.fileChanges.length === 0) {
      throw new Error("proposalProvider must return a non-empty fileChanges array.");
    }

    const written = [];
    for (const change of proposal.fileChanges) {
      const filePath = safeRelativePath(change?.path);
      if (!isAllowed(filePath, normalizedAllowedPaths)) {
        throw new Error(`Proposed file is outside allowed paths: ${filePath}`);
      }
      if (typeof change.content !== "string") {
        throw new Error(`Proposed content must be text: ${filePath}`);
      }
      if (Buffer.byteLength(change.content, "utf8") > MAX_FILE_BYTES) {
        throw new Error(`Proposed file exceeds 1 MiB limit: ${filePath}`);
      }
      await assertNoSymlinkParents(workspacePath, filePath);
      const absolutePath = path.join(workspacePath, filePath);
      await mkdir(path.dirname(absolutePath), { recursive: true });
      await assertNoSymlinkParents(workspacePath, filePath);
      try {
        const existing = await lstat(absolutePath);
        if (existing.isSymbolicLink() || !existing.isFile()) {
          throw new Error(`Only regular files may be replaced: ${filePath}`);
        }
        await readFile(absolutePath);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      await writeFile(absolutePath, change.content, { encoding: "utf8", flag: "w" });
      written.push(filePath);
    }

    const { stdout: status } = await runGit(workspacePath, [
      "status", "--porcelain", "--untracked-files=all"
    ]);
    const changedFiles = [...new Set(parseChangedPaths(status))].sort();
    if (changedFiles.length === 0) throw new Error("Proposal did not produce tracked or untracked changes.");
    for (const filePath of changedFiles) {
      const safePath = safeRelativePath(filePath);
      if (!isAllowed(safePath, normalizedAllowedPaths)) {
        throw new Error(`Workspace contains a change outside allowed paths: ${safePath}`);
      }
    }
    return {
      changedFiles,
      changes: {
        summary: typeof proposal.summary === "string" ? proposal.summary : task.title,
        writtenFiles: written,
        provider: proposal.provider || "injected-proposal-provider"
      }
    };
  }

  async function runTests({ workspaceId }) {
    const { workspacePath } = getWorkspace(workspaceId);
    const results = [];
    for (const command of normalizedCommands) {
      try {
        const result = await execFile(command.command, command.args, {
          cwd: workspacePath,
          timeout: command.timeout,
          maxBuffer: 8 * 1024 * 1024,
          windowsHide: true
        });
        results.push({
          command: command.command,
          args: command.args,
          passed: true,
          stdout: result.stdout,
          stderr: result.stderr
        });
      } catch (error) {
        results.push({
          command: command.command,
          args: command.args,
          passed: false,
          code: error.code ?? null,
          signal: error.signal ?? null,
          stdout: error.stdout ?? "",
          stderr: error.stderr ?? error.message
        });
        break;
      }
    }
    const passed = results.length === normalizedCommands.length &&
      results.every(result => result.passed);
    return {
      passed,
      total: normalizedCommands.length,
      completed: results.length,
      failed: results.filter(result => !result.passed).length,
      results
    };
  }

  async function destroyWorkspace(workspaceId) {
    const record = getWorkspace(workspaceId);
    try {
      await runGit(repoRealPath, ["worktree", "remove", "--force", record.workspacePath]);
    } finally {
      await rm(record.parent, { recursive: true, force: true });
      workspaces.delete(workspaceId);
    }
  }

  return Object.freeze({
    createWorkspace,
    prepareChanges,
    runTests,
    destroyWorkspace,
    getConfiguration() {
      return {
        baseRef,
        allowedPaths: [...normalizedAllowedPaths],
        testCommands: normalizedCommands.map(item => ({
          command: item.command, args: [...item.args], timeout: item.timeout
        })),
        productionWrites: false,
        commits: false,
        pushes: false,
        merges: false,
        deployments: false
      };
    }
  });
}
