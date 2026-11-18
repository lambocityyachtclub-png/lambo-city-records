/**
 * ALIVE — VENDOR-NEUTRAL DEVELOPMENT PROPOSAL PROVIDER
 *
 * Defines the safe boundary between an AI/code-generation provider and
 * ALIVE's isolated workspace. Providers return complete text files only.
 * This module does not call a vendor, access the network, execute code,
 * or write to the live repository.
 */

const MAX_FILES = 20;
const MAX_FILE_BYTES = 128 * 1024;
const MAX_TOTAL_BYTES = 512 * 1024;
const MAX_SUMMARY_LENGTH = 4000;

const BLOCKED_SEGMENTS = new Set([
  ".git",
  ".vercel",
  "node_modules",
  "dist",
  "build"
]);

function requireText(value, name) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} is required.`);
  }
  return value.trim();
}

function validateRelativePath(value) {
  const filePath = requireText(value, "Proposal file path");
  if (
    filePath.startsWith("/") ||
    filePath.includes("\\") ||
    filePath.includes("\0") ||
    filePath.endsWith("/")
  ) {
    throw new Error(`Unsafe proposal file path: ${filePath}`);
  }

  const segments = filePath.split("/");
  if (segments.some(segment =>
    !segment || segment === "." || segment === ".." ||
    BLOCKED_SEGMENTS.has(segment)
  )) {
    throw new Error(`Unsafe or protected proposal file path: ${filePath}`);
  }
  return filePath;
}

function normalizeAllowedPaths(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("An explicit allowedPaths array is required.");
  }
  return [...new Set(value.map(validateRelativePath))];
}

function isAllowed(filePath, allowedPaths) {
  return allowedPaths.some(allowed =>
    filePath === allowed || filePath.startsWith(`${allowed}/`)
  );
}

function byteLength(value) {
  return new TextEncoder().encode(value).length;
}

/**
 * Validate a provider response before it can be applied to an isolated
 * workspace. Deletions, binary payloads, patches, and out-of-scope files
 * are intentionally not part of this first contract.
 */
export function validateDevelopmentProposal(proposal, options = {}) {
  const allowedPaths = normalizeAllowedPaths(options.allowedPaths);

  if (!proposal || typeof proposal !== "object" || Array.isArray(proposal)) {
    throw new Error("Proposal must be an object.");
  }
  if (!Array.isArray(proposal.files) || proposal.files.length === 0) {
    throw new Error("Proposal must contain at least one file.");
  }
  if (proposal.files.length > MAX_FILES) {
    throw new Error(`Proposal exceeds the ${MAX_FILES}-file limit.`);
  }

  const seen = new Set();
  let totalBytes = 0;
  const files = proposal.files.map((file, index) => {
    if (!file || typeof file !== "object" || Array.isArray(file)) {
      throw new Error(`Proposal file ${index + 1} must be an object.`);
    }

    const path = validateRelativePath(file.path);
    if (seen.has(path)) {
      throw new Error(`Proposal contains a duplicate file path: ${path}`);
    }
    seen.add(path);

    if (!isAllowed(path, allowedPaths)) {
      throw new Error(`Proposal file is outside the authorized paths: ${path}`);
    }
    if (typeof file.content !== "string") {
      throw new Error(`Proposal content must be text: ${path}`);
    }

    const size = byteLength(file.content);
    if (size > MAX_FILE_BYTES) {
      throw new Error(`Proposal file exceeds the per-file size limit: ${path}`);
    }
    totalBytes += size;
    if (totalBytes > MAX_TOTAL_BYTES) {
      throw new Error("Proposal exceeds the total content size limit.");
    }

    return Object.freeze({ path, content: file.content });
  });

  const summary = requireText(proposal.summary, "Proposal summary");
  if (summary.length > MAX_SUMMARY_LENGTH) {
    throw new Error("Proposal summary exceeds the length limit.");
  }

  return Object.freeze({
    summary,
    files: Object.freeze(files),
    totalBytes
  });
}

/**
 * Wraps any provider implementing generateProposal(). A provider can be
 * swapped without changing ALIVE's development engine or workspace layer.
 */
export function createDevelopmentProposalProvider(options = {}) {
  const { provider } = options;
  const allowedPaths = normalizeAllowedPaths(options.allowedPaths);

  if (!provider || typeof provider.generateProposal !== "function") {
    throw new Error("A provider with generateProposal() is required.");
  }

  async function generateProposal(input = {}) {
    if (!input.task || typeof input.task !== "object") {
      throw new Error("A development task is required.");
    }

    const rawProposal = await provider.generateProposal({
      task: input.task,
      context: input.context ?? null,
      allowedPaths: [...allowedPaths]
    });

    return validateDevelopmentProposal(rawProposal, { allowedPaths });
  }

  return Object.freeze({ generateProposal });
}

/**
 * Adapts a host-provided isolated workspace to ALIVE's executor contract.
 * The host must implement readWorkspaceContext() and applyProposedFiles();
 * those methods must operate only inside the isolated workspace.
 */
export function createProposalWorkspaceAdapter(options = {}) {
  const { workspaceAdapter, proposalProvider } = options;
  const allowedPaths = normalizeAllowedPaths(options.allowedPaths);

  const requiredMethods = [
    "createWorkspace",
    "readWorkspaceContext",
    "applyProposedFiles",
    "runTests"
  ];
  for (const method of requiredMethods) {
    if (typeof workspaceAdapter?.[method] !== "function") {
      throw new Error(`workspaceAdapter.${method}() is required.`);
    }
  }
  if (typeof proposalProvider?.generateProposal !== "function") {
    throw new Error("A validated proposalProvider is required.");
  }

  async function prepareChanges(input = {}) {
    const workspaceId = requireText(input.workspaceId, "Workspace ID");
    if (!input.task || typeof input.task !== "object") {
      throw new Error("A development task is required.");
    }

    const context = await workspaceAdapter.readWorkspaceContext({
      workspaceId,
      task: input.task,
      allowedPaths: [...allowedPaths]
    });

    const proposal = await proposalProvider.generateProposal({
      task: input.task,
      context,
      allowedPaths: [...allowedPaths]
    });

    // Validate again at the workspace boundary, even if the provider wrapper
    // already validated the response. This prevents unsafe alternate adapters.
    const validated = validateDevelopmentProposal(proposal, { allowedPaths });

    await workspaceAdapter.applyProposedFiles({
      workspaceId,
      files: validated.files
    });

    return {
      changedFiles: validated.files.map(file => file.path),
      changes: validated.summary,
      proposalBytes: validated.totalBytes
    };
  }

  return Object.freeze({
    createWorkspace: input => workspaceAdapter.createWorkspace(input),
    prepareChanges,
    runTests: input => workspaceAdapter.runTests(input)
  });
}

export const DEVELOPMENT_PROPOSAL_LIMITS = Object.freeze({
  maxFiles: MAX_FILES,
  maxFileBytes: MAX_FILE_BYTES,
  maxTotalBytes: MAX_TOTAL_BYTES,
  maxSummaryLength: MAX_SUMMARY_LENGTH
});
