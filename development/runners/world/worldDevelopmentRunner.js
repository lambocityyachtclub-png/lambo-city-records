/**
 * LAMBO CITY — WORLD DEVELOPMENT RUNNER
 *
 * Specializes in improving the LAMBO CITY world while preserving
 * approved geography, navigation, cameras, and working systems.
 *
 * This runner creates structured development tasks only. It does not
 * edit repository files, execute code, or deploy changes.
 */
import { evaluateDevelopmentTask } from "../../policies/developmentPolicy.js";

export const WORLD_RUNNER_ID = "world";
export const WORLD_RUNNER_VERSION = "1.0.0";

export const WORLD_DEVELOPMENT_AREAS = Object.freeze([
  "world_environment",
  "water",
  "marina",
  "architecture",
  "lighting",
  "landscaping",
  "roads_navigation",
  "stage",
  "props",
  "world_performance"
]);

export const WORLD_FINDING_TYPES = Object.freeze({
  IMPROVEMENT: "improvement",
  BUG: "bug",
  PERFORMANCE: "performance",
  DETAIL: "detail",
  COMPATIBILITY: "compatibility"
});

const VALID_TYPES = new Set(Object.values(WORLD_FINDING_TYPES));
const PRIORITIES = Object.freeze({
  low: "low",
  normal: "normal",
  medium: "normal",
  high: "high",
  critical: "critical"
});

function requireText(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required.`);
  }
  return value.trim();
}

function normalizeList(value, field) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new Error(`${field} must be an array.`);
  }
  return [...new Set(value.map(item => requireText(item, field)))];
}

function normalizeFinding(input = {}) {
  const title = requireText(input.title, "Finding title");
  const description = requireText(input.description, "Finding description");
  const area = requireText(input.area, "World development area");
  if (!WORLD_DEVELOPMENT_AREAS.includes(area)) {
    throw new Error(`Unsupported World area: ${area}`);
  }

  const type = input.type || WORLD_FINDING_TYPES.IMPROVEMENT;
  if (!VALID_TYPES.has(type)) throw new Error("Invalid World finding type.");

  const severity = input.severity || "normal";
  const priority = PRIORITIES[severity];
  if (!priority) throw new Error("Invalid finding severity.");

  return {
    title,
    description,
    area,
    type,
    severity,
    priority,
    acceptanceCriteria: normalizeList(input.acceptanceCriteria, "Acceptance criterion"),
    filePaths: normalizeList(input.filePaths, "File path"),
    protectedActions: normalizeList(input.protectedActions, "Protected action"),
    requiresApproval: input.requiresApproval === true
  };
}

export function createWorldDevelopmentRunner(options = {}) {
  const { developmentDirector, enabled = true } = options;
  if (!developmentDirector || typeof developmentDirector.createTask !== "function") {
    throw new Error("A valid Development Director is required.");
  }

  let isEnabled = enabled;
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
      areas: [...WORLD_DEVELOPMENT_AREAS],
      findingTypes: [...VALID_TYPES],
      capabilities: [
        "organize_world_findings",
        "classify_world_improvements",
        "prepare_world_development_tasks",
        "preserve_approved_world_layout"
      ],
      preservationRules: [
        "Preserve approved geography and object positions.",
        "Preserve camera, navigation, walking paths, and working controls.",
        "Upgrade existing assets before replacing them.",
        "Prioritize realism, detail, materials, lighting, and performance.",
        "Require explicit owner authorization for protected landmarks or major layout changes."
      ],
      restrictions: [
        "No direct repository writes.",
        "No code execution.",
        "No production deployment.",
        "No paid service activation.",
        "Protected actions remain subject to Development Policy."
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
        results.push({
          success: false,
          error: error.message,
          findingTitle: finding?.title || null
        });
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
