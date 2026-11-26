/**
 * ALIVE — LOCAL PROPOSAL QUEUE
 *
 * A provider-independent handoff for complete, owner-authored or locally
 * generated proposals. One JSON file is matched to one queued task ID.
 * This module does not generate code, execute commands, or approve changes.
 */
import { constants as fsConstants } from "node:fs";
import { lstat, mkdir, open, realpath } from "node:fs/promises";
import path from "node:path";

const MAX_PROPOSAL_BYTES = 5 * 1024 * 1024;
const MAX_FILE_BYTES = 1024 * 1024;
const INVALID_PROPOSAL_FILE =
  "Proposal queue entry must be a regular JSON file no larger than 5 MiB.";

function requiredText(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is required.`);
  }
  return value.trim();
}

function safeTaskId(value) {
  const id = requiredText(value, "task.id");
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new Error("Task ID contains unsupported characters.");
  }
  return id;
}

function safeRelativePath(value) {
  const filePath = requiredText(value, "Proposal file path");
  if (filePath.includes("\\") || filePath.startsWith("/") || filePath.includes("\0")) {
    throw new Error("Proposal file path must be relative.");
  }
  const segments = filePath.split("/");
  const blocked = new Set([".", "..", ".git", ".vercel", "node_modules", "dist", "build"]);
  if (segments.some(part => !part || blocked.has(part))) {
    throw new Error(`Unsafe or protected proposal path: ${filePath}`);
  }
  return filePath;
}

async function readBoundedProposalFile(proposalPath) {
  let handle;
  try {
    // O_NOFOLLOW rejects a symlink at open time on platforms that support it.
    // The post-open lstat/fstat identity check also protects the fallback path.
    const flags = fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW || 0);
    handle = await open(proposalPath, flags);
    const openedStat = await handle.stat();
    if (!openedStat.isFile() || openedStat.size > MAX_PROPOSAL_BYTES) {
      throw new Error(INVALID_PROPOSAL_FILE);
    }

    const pathStat = await lstat(proposalPath);
    if (
      pathStat.isSymbolicLink() ||
      !pathStat.isFile() ||
      pathStat.dev !== openedStat.dev ||
      pathStat.ino !== openedStat.ino
    ) {
      throw new Error(INVALID_PROPOSAL_FILE);
    }

    // Read at most MAX_PROPOSAL_BYTES + 1, even if the file grows after stat().
    const buffer = Buffer.alloc(MAX_PROPOSAL_BYTES + 1);
    let total = 0;
    while (total < buffer.length) {
      const { bytesRead } = await handle.read(buffer, total, buffer.length - total, total);
      if (bytesRead === 0) break;
      total += bytesRead;
    }
    if (total > MAX_PROPOSAL_BYTES) {
      throw new Error(INVALID_PROPOSAL_FILE);
    }
    return buffer.subarray(0, total).toString("utf8");
  } catch (error) {
    if (error.code === "ELOOP") throw new Error(INVALID_PROPOSAL_FILE);
    throw error;
  } finally {
    if (handle) await handle.close().catch(() => {});
  }
}

export function createLocalProposalQueueProvider(options = {}) {
  const directory = path.resolve(requiredText(options.directory, "Proposal queue directory"));
  const repositoryRoot = options.repositoryRoot
    ? path.resolve(requiredText(options.repositoryRoot, "repositoryRoot"))
    : null;

  async function initialize() {
    await mkdir(directory, { recursive: true });
    const queueStat = await lstat(directory);
    if (queueStat.isSymbolicLink() || !queueStat.isDirectory()) {
      throw new Error("Proposal queue must be a real directory, not a symlink.");
    }
    const queueRoot = await realpath(directory);
    if (repositoryRoot) {
      const repoRoot = await realpath(repositoryRoot);
      const relative = path.relative(repoRoot, queueRoot);
      if (!relative || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))) {
        throw new Error("Proposal queue directory must be outside the Git repository.");
      }
    }
    return queueRoot;
  }

  return async function proposalProvider({ task, allowedPaths, readAllowedFile }) {
    const taskId = safeTaskId(task?.id);
    if (!Array.isArray(allowedPaths) || !allowedPaths.length || typeof readAllowedFile !== "function") {
      throw new Error("Proposal provider requires the execution path allowlist and workspace reader.");
    }
    const root = await initialize();
    const proposalPath = path.join(root, `${taskId}.json`);

    let rawProposal;
    try {
      rawProposal = await readBoundedProposalFile(proposalPath);
    } catch (error) {
      if (error.code === "ENOENT") {
        throw new Error(`No local proposal file is queued for task ${taskId}.`);
      }
      if (error.message === INVALID_PROPOSAL_FILE) throw error;
      throw new Error("Unable to read the local proposal file safely.");
    }

    let proposal;
    try {
      proposal = JSON.parse(rawProposal);
    } catch {
      throw new Error("Proposal queue entry is not valid JSON.");
    }
    if (!proposal || typeof proposal !== "object" || Array.isArray(proposal)) {
      throw new Error("Proposal queue entry must contain a JSON object.");
    }
    if (proposal.taskId !== taskId) {
      throw new Error("Proposal taskId does not match the requested task.");
    }
    if (!Array.isArray(proposal.fileChanges) || proposal.fileChanges.length === 0) {
      throw new Error("Proposal must contain at least one complete file change.");
    }

    const seen = new Set();
    const fileChanges = [];
    for (const change of proposal.fileChanges) {
      const filePath = safeRelativePath(change?.path);
      if (seen.has(filePath)) throw new Error(`Duplicate proposal path: ${filePath}`);
      seen.add(filePath);
      const permitted = allowedPaths.some(prefix => filePath === prefix || filePath.startsWith(prefix + "/"));
      if (!permitted) throw new Error(`Proposal path is outside the configured allowlist: ${filePath}`);
      if (typeof change.content !== "string" || Buffer.byteLength(change.content, "utf8") > MAX_FILE_BYTES) {
        throw new Error(`Proposal content must be text and no larger than 1 MiB: ${filePath}`);
      }
      fileChanges.push({ path: filePath, content: change.content });
    }

    return {
      summary: typeof proposal.summary === "string" && proposal.summary.trim()
        ? proposal.summary.trim()
        : task.title,
      provider: "local-json-proposal-queue",
      fileChanges
    };
  };
}
