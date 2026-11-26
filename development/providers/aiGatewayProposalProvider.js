/**
 * ALIVE — Vercel AI Gateway proposal provider.
 *
 * Server-side only. Produces bounded code proposals; it does not write files,
 * execute code, approve reviews, merge, or deploy. Disabled unless both the
 * owner enable flag and spend-approval flag are explicitly true.
 */

import { getProjectContract } from "../../alive/contracts/projectContracts.js";

export const AI_GATEWAY_PROPOSAL_PROVIDER_VERSION = "1.0.0";
export const AI_GATEWAY_CHAT_COMPLETIONS_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";

const DEFAULT_MAX_INPUT_BYTES = 512 * 1024;
const DEFAULT_MAX_FILE_BYTES = 256 * 1024;
const DEFAULT_MAX_OUTPUT_TOKENS = 6000;
const DEFAULT_TIMEOUT_MS = 45000;

function requirePositiveInteger(value, name, maximum) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > maximum) {
    throw new Error(name + " must be a positive integer within its configured limit.");
  }
  return number;
}

function requireText(value, name) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(name + " is required.");
  }
  return value.trim();
}

function safeRelativePath(value) {
  const filePath = requireText(value, "Proposal file path");
  const segments = filePath.split("/");
  if (
    filePath.startsWith("/") ||
    filePath.includes("\\") ||
    filePath.includes(String.fromCharCode(0)) ||
    segments.some(segment =>
      !segment || segment === "." || segment === ".." ||
      [".git", ".vercel", "node_modules", "dist", "build"].includes(segment)
    )
  ) {
    throw new Error("Unsafe proposal file path: " + filePath);
  }
  return filePath;
}

function isAllowed(filePath, allowedPaths) {
  return allowedPaths.some(prefix => {
    const normalized = prefix.replace(/\/+$/, "");
    return filePath === normalized || filePath.startsWith(normalized + "/");
  });
}

function byteLength(value) {
  return new TextEncoder().encode(value).length;
}

export function validateAIProposal(proposal, options = {}) {
  if (!proposal || typeof proposal !== "object" || Array.isArray(proposal)) {
    throw new Error("AI proposal must be a JSON object.");
  }
  const allowedPaths = options.allowedPaths;
  const targetPaths = options.targetPaths;
  const maxFiles = requirePositiveInteger(options.maxFiles, "Maximum proposal files", 100);
  const maxFileBytes = requirePositiveInteger(options.maxFileBytes, "Maximum file size", 1024 * 1024);
  const maxTotalBytes = requirePositiveInteger(options.maxTotalBytes, "Maximum proposal size", 2 * 1024 * 1024);

  if (!Array.isArray(allowedPaths) || allowedPaths.length === 0 ||
      !Array.isArray(targetPaths) || targetPaths.length === 0) {
    throw new Error("Canonical allowlisted target paths are required.");
  }

  const summary = requireText(proposal.summary, "Proposal summary");
  if (summary.length > 500) throw new Error("Proposal summary is too long.");
  if (!["low", "medium", "high"].includes(proposal.risk)) {
    throw new Error("Proposal risk must be low, medium, or high.");
  }
  if (!Array.isArray(proposal.files) || proposal.files.length === 0 || proposal.files.length > maxFiles) {
    throw new Error("Proposal file count is empty or exceeds the contract limit.");
  }

  const allowedSet = new Set(targetPaths.map(safeRelativePath));
  const seen = new Set();
  let totalBytes = 0;
  const files = proposal.files.map(file => {
    if (!file || typeof file !== "object" || Array.isArray(file)) {
      throw new Error("Each proposal file must be an object.");
    }
    const filePath = safeRelativePath(file.path);
    if (!allowedSet.has(filePath) || !isAllowed(filePath, allowedPaths)) {
      throw new Error("Proposal attempted to change a file outside its task targets: " + filePath);
    }
    if (seen.has(filePath)) throw new Error("Proposal contains a duplicate file path: " + filePath);
    seen.add(filePath);
    if (typeof file.content !== "string" || !file.content.trim()) {
      throw new Error("Proposal file content is missing: " + filePath);
    }
    const size = byteLength(file.content);
    if (size > maxFileBytes) throw new Error("Proposal file exceeds the per-file size limit: " + filePath);
    totalBytes += size;
    if (totalBytes > maxTotalBytes) throw new Error("Proposal exceeds the total file-size limit.");
    return Object.freeze({ path: filePath, content: file.content });
  });

  const notes = proposal.notes == null ? [] : proposal.notes;
  if (!Array.isArray(notes) || notes.length > 10 ||
      notes.some(note => typeof note !== "string" || note.length > 500)) {
    throw new Error("Proposal notes are invalid.");
  }

  return Object.freeze({
    summary,
    risk: proposal.risk,
    files: Object.freeze(files),
    notes: Object.freeze([...notes])
  });
}

export function createAIGatewayProposalProvider(options = {}) {
  const env = options.env || process.env;
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const apiKey = options.apiKey || env.AI_GATEWAY_API_KEY || env.VERCEL_OIDC_TOKEN || "";
  const model = options.model || env.AI_GATEWAY_MODEL || "";
  const endpoint = options.endpoint || AI_GATEWAY_CHAT_COMPLETIONS_URL;
  const enabled = options.enabled === true || env.ALIVE_AI_ENABLED === "true";
  const spendApproved = options.spendApproved === true || env.ALIVE_AI_SPEND_APPROVED === "true";
  const maxOutputTokens = requirePositiveInteger(
    options.maxOutputTokens || env.ALIVE_AI_MAX_OUTPUT_TOKENS || DEFAULT_MAX_OUTPUT_TOKENS,
    "Maximum output tokens",
    12000
  );
  const timeoutMs = requirePositiveInteger(
    options.timeoutMs || env.ALIVE_AI_TIMEOUT_MS || DEFAULT_TIMEOUT_MS,
    "AI request timeout",
    120000
  );
  const maxInputBytes = requirePositiveInteger(
    options.maxInputBytes || DEFAULT_MAX_INPUT_BYTES,
    "Maximum AI input size",
    2 * 1024 * 1024
  );
  const maxFileBytes = requirePositiveInteger(
    options.maxFileBytes || DEFAULT_MAX_FILE_BYTES,
    "Maximum proposal file size",
    1024 * 1024
  );
  const maxTotalBytes = requirePositiveInteger(
    options.maxTotalBytes || 512 * 1024,
    "Maximum total proposal size",
    2 * 1024 * 1024
  );

  if (typeof fetchImpl !== "function") {
    throw new Error("A server-side fetch implementation is required.");
  }

  function getSnapshot() {
    return Object.freeze({
      version: AI_GATEWAY_PROPOSAL_PROVIDER_VERSION,
      provider: "vercel-ai-gateway",
      configured: Boolean(apiKey && model),
      enabled: enabled && spendApproved,
      ownerEnabled: enabled,
      spendApproved,
      modelConfigured: Boolean(model),
      credentialConfigured: Boolean(apiKey),
      requestEndpoint: endpoint,
      writesFiles: false,
      executesCode: false,
      deploysProduction: false
    });
  }

  async function generateProposal(input = {}) {
    if (!enabled || !spendApproved) {
      throw new Error("ALIVE AI proposal generation is disabled until the owner explicitly enables it and approves model spend.");
    }
    if (!apiKey || !model) {
      throw new Error("ALIVE AI Gateway is not configured. A Vercel OIDC/API credential and AI_GATEWAY_MODEL are required.");
    }

    const task = input.task;
    if (!task || typeof task !== "object") throw new Error("A development task is required.");
    const contract = getProjectContract(task.contractId);
    if (!contract || task.contractVersion !== contract.version) {
      throw new Error("The task's canonical ALIVE contract is missing or has changed.");
    }
    if (!Array.isArray(task.relatedFiles) || task.relatedFiles.length === 0) {
      throw new Error("The task has no approved source-file targets.");
    }

    const targetPaths = [...new Set(task.relatedFiles.map(safeRelativePath))];
    for (const filePath of targetPaths) {
      if (!isAllowed(filePath, contract.allowedPaths)) {
        throw new Error("Task source target is outside the canonical contract allowlist: " + filePath);
      }
    }

    if (!Array.isArray(input.sourceFiles) || input.sourceFiles.length !== targetPaths.length) {
      throw new Error("The isolated workspace must supply every approved task source file.");
    }
    const sourceMap = new Map();
    for (const source of input.sourceFiles) {
      const filePath = safeRelativePath(source?.path);
      if (!targetPaths.includes(filePath) || typeof source.content !== "string") {
        throw new Error("Workspace source content is outside the approved task targets.");
      }
      sourceMap.set(filePath, source.content);
    }
    if (sourceMap.size !== targetPaths.length) {
      throw new Error("The isolated workspace source set does not match the approved task targets.");
    }

    const context = {
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        area: task.area,
        contractId: contract.id,
        contractVersion: contract.version,
        autonomyLevel: contract.autonomyLevel,
        acceptanceCriteria: task.acceptanceCriteria || []
      },
      contract: {
        purpose: contract.purpose,
        protectedInvariants: contract.protectedInvariants,
        resourceBudget: contract.resourceBudget,
        allowedOperations: contract.allowedOperations
      },
      approvedTargetFiles: targetPaths.map(filePath => ({
        path: filePath,
        content: sourceMap.get(filePath)
      })),
      projectContext: input.projectContext || null
    };

    const requestText = JSON.stringify(context);
    if (byteLength(requestText) > maxInputBytes) {
      throw new Error("ALIVE AI context exceeds the configured input-size limit.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(endpoint, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + apiKey,
          "Content-Type": "application/json"
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          temperature: 0.1,
          max_tokens: maxOutputTokens,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: [
                "You are ALIVE, the contract-governed development agent for LAMBO CITY.",
                "Return only a JSON object with summary, risk, files, and optional notes.",
                "You may propose complete replacement contents only for the exact approvedTargetFiles listed in the user context.",
                "Never create additional files or change a path not listed in approvedTargetFiles.",
                "Preserve all protected invariants and follow every acceptance criterion.",
                "Do not modify contract rules, trust roots, permissions, credentials, authentication, player identity, or private data.",
                "Do not modify HERO's approved performance, world geography, camera, navigation, or deferred Studio.",
                "Do not add dependencies, unnecessary real-time lights, oversized textures, or expensive frame-loop work.",
                "Do not execute, merge, publish, or deploy anything."
              ].join(" ")
            },
            {
              role: "user",
              content: requestText
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error("ALIVE AI Gateway request failed with HTTP " + response.status + ".");
      }
      const payload = await response.json();
      const content = payload?.choices?.[0]?.message?.content;
      if (typeof content !== "string") {
        throw new Error("ALIVE AI Gateway returned no proposal content.");
      }

      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        throw new Error("ALIVE AI Gateway returned invalid JSON.");
      }

      const proposal = validateAIProposal(parsed, {
        allowedPaths: contract.allowedPaths,
        targetPaths,
        maxFiles: Math.min(contract.resourceBudget.maxChangedFiles, targetPaths.length),
        maxFileBytes,
        maxTotalBytes
      });

      return Object.freeze({
        ...proposal,
        provider: "vercel-ai-gateway",
        model: payload.model || model,
        usage: payload.usage ? Object.freeze({
          promptTokens: payload.usage.prompt_tokens ?? null,
          completionTokens: payload.usage.completion_tokens ?? null,
          totalTokens: payload.usage.total_tokens ?? null
        }) : null
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new Error("ALIVE AI Gateway request timed out.");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  return Object.freeze({ generateProposal, getSnapshot });
}
