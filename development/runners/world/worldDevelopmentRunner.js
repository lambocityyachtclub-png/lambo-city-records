/**
 * LAMBO CITY — ALIVE World Development Runner
 *
 * Converts structured world-quality findings into contract-pinned tasks.
 * It does not read or write project files and does not execute code.
 */

import { evaluateDevelopmentTask } from "../../policies/developmentPolicy.js";

export const WORLD_RUNNER_ID = "world";
export const WORLD_RUNNER_VERSION = "1.0.0";

export const WORLD_AREAS = Object.freeze([
  "world_materials",
  "performance_quality",
  "world_layout",
  "hero_performance",
  "player_identity",
  "studio_deferred"
]);

const AREA_CONTRACTS = Object.freeze({
  world_materials: {
    contractId: "world-material-quality",
    protectedActions: [],
    requiresApproval: false
  },
  performance_quality: {
    contractId: "performance-quality",
    protectedActions: [],
    requiresApproval: false
  },
  world_layout: {
    contractId: "world-layout-navigation",
    protectedActions: ["protected_landmarks"],
    requiresApproval: true
  },
  hero_performance: {
    contractId: "hero-approved-performance",
    protectedActions: ["protected_landmarks"],
    requiresApproval: true
  },
  player_identity: {
    contractId: "player-identity-and-accounts",
    protectedActions: ["accounts"],
    requiresApproval: true
  },
  studio_deferred: {
    contractId: "studio-deferred",
    protectedActions: ["major_architecture"],
    requiresApproval: true
  }
});

const FINDING_TYPES = Object.freeze([
  "bug",
  "improvement",
  "optimization",
  "maintenance",
  "opportunity"
]);

const PRIORITY = Object.freeze({
  low: "low",
  normal: "normal",
  medium: "normal",
  high: "high",
  critical: "critical"
});

function requireText(value, name) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} is required.`);
  }
  return value.trim();
}

function normalizeList(value, name) {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new Error(`${name} must be an array.`);
  return [...new Set(value.map(item => requireText(item, name)))];
}

function normalizeFinding(input = {}) {
  const title = requireText(input.title, "Finding title");
  const description = requireText(input.description, "Finding description");
  const area = requireText(input.area, "World development area");
  if (!WORLD_AREAS.includes(area)) throw new Error(`Unsupported World area: ${area}`);

  const type = input.type || "improvement";
  if (!FINDING_TYPES.includes(type)) throw new Error("Invalid World finding type.");

  const priority = PRIORITY[input.severity || "normal"];
  if (!priority) throw new Error("Invalid World finding severity.");

  const areaPolicy = AREA_CONTRACTS[area];
  const protectedActions = [...new Set([
    ...areaPolicy.protectedActions,
    ...normalizeList(input.protectedActions, "Protected action")
  ])];

  const acceptanceCriteria = normalizeList(input.acceptanceCriteria, "Acceptance criterion");
  const filePaths = normalizeList(input.filePaths, "File path");

  return {
    title,
    description,
    area,
    type,
    priority,
    protectedActions,
    acceptanceCriteria,
    filePaths,
    contractId: areaPolicy.contractId,
    requiresApproval: areaPolicy.requiresApproval || input.requiresApproval === true
  };
}

export function createWorldDevelopmentRunner(options = {}) {
  const { developmentDirector, enabled = true } = options;
  if (!developmentDirector || typeof developmentDirector.createTask !== "function") {
    throw new Error("A valid Development Director is required.");
  }

  let isEnabled = enabled === true;
  let submittedCount = 0;

  function ensureEnabled() {
    if (!isEnabled) throw new Error("World Development Runner is disabled.");
  }

  function getProfile() {
    return Object.freeze({
      id: WORLD_RUNNER_ID,
      version: WORLD_RUNNER_VERSION,
      status: isEnabled ? "ready" : "disabled",
      submittedCount,
      areas: [...WORLD_AREAS],
      capabilities: [
        "organize_world_quality_findings",
        "classify_world_improvements",
        "assign_canonical_module_contracts",
        "submit_world_tasks_to_development_director"
      ],
      restrictions: [
        "No direct repository writes.",
        "No code execution.",
        "No production deployment.",
        "World layout, camera, navigation, and protected landmarks require owner approval.",
        "HERO, account security, and Studio remain observer-only."
      ]
    });
  }

  async function submitFinding(input = {}) {
    ensureEnabled();
    const finding = normalizeFinding(input);
    const policyDecision = evaluateDevelopmentTask({
      title: finding.title,
      requiresApproval: finding.requiresApproval,
      protectedActions: finding.protectedActions
    });

    const task = await developmentDirector.createTask({
      title: finding.title,
      description: finding.description,
      area: finding.area,
      runner: WORLD_RUNNER_ID,
      contractId: finding.contractId,
      priority: finding.priority,
      acceptanceCriteria: finding.acceptanceCriteria,
      protectedActions: finding.protectedActions,
      requiresApproval: policyDecision.requiresApproval,
      approvalReason: policyDecision.requiresApproval
        ? policyDecision.approvalReasons.map(item => item.reason).join("; ") || "Owner approval requested."
        : null
    });

    submittedCount += 1;
    return {
      runnerId: WORLD_RUNNER_ID,
      findingType: finding.type,
      relatedFiles: finding.filePaths,
      contractId: finding.contractId,
      policyDecision,
      task
    };
  }

  async function submitFindings(findings = []) {
    ensureEnabled();
    if (!Array.isArray(findings)) throw new Error("Findings must be an array.");
    const results = [];
    for (const finding of findings) {
      try {
        results.push({ success: true, result: await submitFinding(finding) });
      } catch (error) {
        results.push({ success: false, error: error.message, findingTitle: finding?.title || null });
      }
    }
    return {
      runnerId: WORLD_RUNNER_ID,
      total: findings.length,
      submitted: results.filter(item => item.success).length,
      failed: results.filter(item => !item.success).length,
      results
    };
  }

  function setEnabled(value) {
    if (typeof value !== "boolean") throw new Error("Enabled state must be true or false.");
    isEnabled = value;
    return getProfile();
  }

  return Object.freeze({ getProfile, submitFinding, submitFindings, setEnabled });
}
