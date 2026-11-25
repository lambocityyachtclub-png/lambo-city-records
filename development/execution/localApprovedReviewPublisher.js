/**
 * ALIVE — APPROVED REVIEW BRANCH PUBLISHER
 *
 * Publishes only an explicitly approved, complete review package to a new
 * local Git branch. It re-runs the configured test commands before commit.
 * The resulting branch remains local: this module never pushes, merges,
 * deploys, or writes to a production environment.
 */
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, lstat, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const execFile = promisify(execFileCallback);
const BLOCKED = new Set([".git", ".vercel", "node_modules", "dist", "build"]);
const MAX_FILE_BYTES = 1024 * 1024;
const MAX_TIMEOUT = 120000;

function textValue(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(label + " is required.");
  return value.trim();
}

function safePath(value) {
  const filePath = textValue(value, "File path");
  if (filePath.includes("\\") || filePath.startsWith("/") || filePath.includes("\0")) {
    throw new Error("Unsafe file path: " + filePath);
  }
  const parts = filePath.split("/");
  if (parts.some(part => !part || part === "." || part === ".." || BLOCKED.has(part))) {
    throw new Error("Unsafe or protected file path: " + filePath);
  }
  return filePath;
}

function allowed(filePath, prefixes) {
  return prefixes.some(prefix => filePath === prefix || filePath.startsWith(prefix + "/"));
}

async function assertSafeParents(root, filePath) {
  let current = root;
  const parts = filePath.split("/");
  for (const part of parts.slice(0, -1)) {
    current = path.join(current, part);
    try {
      const stat = await lstat(current);
      if (stat.isSymbolicLink() || !stat.isDirectory()) {
        throw new Error("Unsafe symlink or non-directory parent: " + filePath);
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
}

async function git(root, args, options = {}) {
  return execFile("git", ["-C", root, ...args], {
    timeout: 30000,
    maxBuffer: 4 * 1024 * 1024,
    ...options
  });
}

export function createLocalApprovedReviewPublisher(options = {}) {
  const {
    repositoryRoot,
    baseRef = "HEAD",
    allowedPaths,
    testCommands,
    commitName = "ALIVE Owner-Approved Publisher",
    commitEmail = "alive-publisher@example.invalid"
  } = options;

  if (!Array.isArray(allowedPaths) || !allowedPaths.length) {
    throw new Error("An explicit non-empty allowedPaths array is required.");
  }
  if (!Array.isArray(testCommands) || !testCommands.length) {
    throw new Error("At least one fixed test command is required.");
  }
  const prefixes = [...new Set(allowedPaths.map(safePath))];
  const commands = testCommands.map((item, index) => {
    if (!item || typeof item.command !== "string" || !item.command.trim() ||
        item.command.includes("/") || item.command.includes("\\") ||
        !Array.isArray(item.args) || item.args.some(arg => typeof arg !== "string")) {
      throw new Error("Test command " + (index + 1) + " must use a fixed executable and string arguments.");
    }
    return {
      command: item.command,
      args: [...item.args],
      timeout: Math.min(Number.isInteger(item.timeout) && item.timeout > 0 ? item.timeout : MAX_TIMEOUT, MAX_TIMEOUT)
    };
  });

  let rootPromise;
  async function initialize() {
    if (!rootPromise) {
      rootPromise = (async () => {
        const root = await import("node:fs/promises").then(fs => fs.realpath(textValue(repositoryRoot, "repositoryRoot")));
        const { stdout } = await git(root, ["rev-parse", "--show-toplevel"]);
        if (path.resolve(stdout.trim()) !== root) throw new Error("repositoryRoot must be the Git repository root.");
        await git(root, ["rev-parse", "--verify", baseRef]);
        return root;
      })();
    }
    return rootPromise;
  }

  async function publishApprovedReview({ reviewStore, reviewId, branchName }) {
    if (!reviewStore || typeof reviewStore.getReview !== "function") {
      throw new Error("A persistent reviewStore is required.");
    }
    const id = textValue(reviewId, "reviewId");
    const branch = textValue(branchName, "branchName");
    const review = await reviewStore.getReview(id);
    if (!review) throw new Error("Approved review was not found.");
    if (review.status !== "approved" || review.decision?.status !== "approved" ||
        !review.decision?.decidedBy || !review.decision?.decidedAt) {
      throw new Error("Only a recorded owner-approved review can be published.");
    }
    if (!Array.isArray(review.changes?.fileChanges) || !review.changes.fileChanges.length) {
      throw new Error("The approved review does not contain complete proposed file contents.");
    }
    if (review.productionChangesMade !== false) {
      throw new Error("Review record does not satisfy the no-production-write invariant.");
    }

    const root = await initialize();
    await git(root, ["check-ref-format", "--branch", branch]);
    try {
      await git(root, ["show-ref", "--verify", "--quiet", "refs/heads/" + branch]);
      throw new Error("Target branch already exists; refusing to overwrite it.");
    } catch (error) {
      if (error.message.includes("already exists")) throw error;
      if (error.code !== 1) throw error;
    }

    const parent = path.dirname(root);
    const worktree = path.join(parent, ".alive-approved-" + branch.replace(/[^a-zA-Z0-9_-]/g, "-"));
    const changed = [];
    let added = false;
    try {
      await git(root, ["worktree", "add", "-b", branch, worktree, baseRef]);
      added = true;
      for (const change of review.changes.fileChanges) {
        const filePath = safePath(change?.path);
        if (!allowed(filePath, prefixes)) throw new Error("Approved file is outside allowed paths: " + filePath);
        if (typeof change.content !== "string" || Buffer.byteLength(change.content, "utf8") > MAX_FILE_BYTES) {
          throw new Error("Approved file content is invalid or exceeds 1 MiB: " + filePath);
        }
        await assertSafeParents(worktree, filePath);
        const target = path.join(worktree, filePath);
        try {
          const stat = await lstat(target);
          if (stat.isSymbolicLink() || !stat.isFile()) throw new Error("Only regular files may be replaced: " + filePath);
          const current = await readFile(target, "utf8");
          if (current === change.content) continue;
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
        }
        await mkdir(path.dirname(target), { recursive: true });
        await assertSafeParents(worktree, filePath);
        await writeFile(target, change.content, { encoding: "utf8", flag: "w" });
        changed.push(filePath);
      }
      if (!changed.length) throw new Error("Approved proposal contains no effective file changes.");

      const status = await git(worktree, ["status", "--porcelain", "--untracked-files=all"]);
      if (!status.stdout.trim()) throw new Error("No changes remain to publish.");
      await git(worktree, ["add", "--", ...changed]);
      const staged = await git(worktree, ["diff", "--cached", "--name-only"]);
      const stagedPaths = staged.stdout.split("\n").filter(Boolean);
      if (!stagedPaths.length || stagedPaths.some(file => !changed.includes(file))) {
        throw new Error("Staged changes do not exactly match the approved file list.");
      }

      const testResults = [];
      for (const command of commands) {
        try {
          const result = await execFile(command.command, command.args, {
            cwd: worktree,
            timeout: command.timeout,
            maxBuffer: 8 * 1024 * 1024,
            windowsHide: true
          });
          testResults.push({ command: command.command, args: command.args, passed: true, stdout: result.stdout, stderr: result.stderr });
        } catch (error) {
          testResults.push({ command: command.command, args: command.args, passed: false, code: error.code ?? null, stdout: error.stdout ?? "", stderr: error.stderr ?? error.message });
          return { published: false, reason: "Fresh verification failed; no commit was created.", branch, changedFiles: changed, testResults, productionChangesMade: false };
        }
      }

      await git(worktree, ["-c", "user.name=" + textValue(commitName, "commitName"),
        "-c", "user.email=" + textValue(commitEmail, "commitEmail"),
        "commit", "-m", "ALIVE: publish owner-approved review " + id]);
      const { stdout: commitSha } = await git(worktree, ["rev-parse", "HEAD"]);
      return {
        published: true,
        reviewId: id,
        branch,
        commitSha: commitSha.trim(),
        changedFiles: changed,
        testResults: { passed: true, total: testResults.length, results: testResults },
        ownerDecision: review.decision,
        productionChangesMade: false,
        pushed: false,
        merged: false,
        deployed: false
      };
    } finally {
      if (added) {
        try { await git(root, ["worktree", "remove", "--force", worktree]); }
        catch { /* Leave the branch intact; cleanup can be retried by the host. */ }
      }
    }
  }

  return Object.freeze({
    publishApprovedReview,
    getConfiguration() {
      return {
        baseRef,
        allowedPaths: [...prefixes],
        testCommands: commands.map(item => ({ command: item.command, args: [...item.args], timeout: item.timeout })),
        localBranchOnly: true,
        pushes: false,
        merges: false,
        deployments: false
      };
    }
  });
}
