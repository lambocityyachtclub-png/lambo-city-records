
/**
 * LAMBO CITY — AUTONOMOUS DEVELOPMENT ENGINE
 * Studio Development Runner
 *
 * Purpose:
 * - Specialize in LAMBO CITY Studio development.
 * - Organize Studio bugs, improvements, and feature requests.
 * - Convert findings into structured development tasks.
 * - Submit eligible tasks to the Development Director.
 * - Respect owner approval requirements.
 *
 * IMPORTANT:
 * This is server-side development infrastructure.
 * It does NOT execute code or modify live game files.
 */

import {
  evaluateDevelopmentTask
} from "../../policies/developmentPolicy.js";

export const STUDIO_RUNNER_ID = "studio";

export const STUDIO_RUNNER_VERSION = "1.0.0";

export const STUDIO_RUNNER_STATUS = Object.freeze({
  READY: "ready",
  DISABLED: "disabled"
});

export const STUDIO_DEVELOPMENT_AREAS = Object.freeze([
  "studio_audio",
  "beat_lab",
  "mpc",
  "recording",
  "vocals",
  "multitrack",
  "timeline",
  "mixer",
  "effects",
  "instruments",
  "project_saving",
  "project_export",
  "studio_interface",
  "studio_performance"
]);

export const STUDIO_FINDING_TYPES = Object.freeze({
  BUG: "bug",
  IMPROVEMENT: "improvement",
  FEATURE: "feature",
  PERFORMANCE: "performance",
  COMPATIBILITY: "compatibility"
});

const VALID_FINDING_TYPES = new Set(
  Object.values(STUDIO_FINDING_TYPES)
);

const VALID_PRIORITIES = new Set([
  "low",
  "normal",
  "high",
  "critical"
]);

const SEVERITY_TO_PRIORITY = Object.freeze({
  low: "low",
  normal: "normal",
  medium: "normal",
  high: "high",
  critical: "critical"
});

function requireText(value, fieldName) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

function normalizeList(value, fieldName) {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array.`);
  }

  return [...new Set(value.map(item =>
    requireText(item, fieldName)
  ))];
}

function normalizeFinding(input = {}) {
  const title = requireText(input.title, "Finding title");

  const description = requireText(
    input.description,
    "Finding description"
  );

  const type = input.type || STUDIO_FINDING_TYPES.IMPROVEMENT;

  if (!VALID_FINDING_TYPES.has(type)) {
    throw new Error("Invalid Studio finding type.");
  }

  const area = requireText(input.area, "Studio development area");

  if (!STUDIO_DEVELOPMENT_AREAS.includes(area)) {
    throw new Error(`Unsupported Studio area: ${area}`);
  }

  const severity = input.severity || "normal";
  const priority = SEVERITY_TO_PRIORITY[severity];

  if (!priority || !VALID_PRIORITIES.has(priority)) {
    throw new Error("Invalid finding severity.");
  }

  const acceptanceCriteria = normalizeList(
    input.acceptanceCriteria,
    "Acceptance criterion"
  );

  const filePaths = normalizeList(
    input.filePaths,
    "File path"
  );

  const protectedActions = normalizeList(
    input.protectedActions,
    "Protected action"
  );

  return {
    title,
    description,
    type,
    area,
    severity,
    priority,
    acceptanceCriteria,
    filePaths,
    protectedActions,
    requiresApproval: input.requiresApproval === true
  };
}

/**
 * Create the Studio specialist runner.
 *
 * Requires a Development Director instance.
 *
 * The runner only creates and submits development tasks.
 * It does not read or write repository files.
 */
export function createStudioDevelopmentRunner(options = {}) {
  const {
    developmentDirector,
    enabled = true
  } = options;

  if (
    !developmentDirector ||
    typeof developmentDirector.createTask !== "function"
  ) {
    throw new Error(
      "A valid Development Director is required."
    );
  }

  let status = enabled
    ? STUDIO_RUNNER_STATUS.READY
    : STUDIO_RUNNER_STATUS.DISABLED;

  let submittedCount = 0;

  function ensureEnabled() {
    if (status !== STUDIO_RUNNER_STATUS.READY) {
      throw new Error("Studio Development Runner is disabled.");
    }
  }

  /**
   * Return the runner's identity and capabilities.
   */
  function getProfile() {
    return Object.freeze({
      id: STUDIO_RUNNER_ID,
      version: STUDIO_RUNNER_VERSION,
      status,
      submittedCount,
      areas: [...STUDIO_DEVELOPMENT_AREAS],
      findingTypes: [...VALID_FINDING_TYPES],
      capabilities: [
        "organize_studio_findings",
        "classify_studio_work",
        "prepare_development_tasks",
        "submit_tasks_to_development_director"
      ],
      restrictions: [
        "No direct repository writes.",
        "No code execution.",
        "No production deployment.",
        "No spending or paid service activation.",
        "Owner approval required for protected actions."
      ]
    });
  }

  /**
   * Convert one Studio finding into a development task.
   */
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
      runner: STUDIO_RUNNER_ID,
      priority: finding.priority,
      acceptanceCriteria: finding.acceptanceCriteria,
      protectedActions: finding.protectedActions,
      requiresApproval: policyDecision.requiresApproval,
      approvalReason: policyDecision.requiresApproval
        ? policyDecision.approvalReasons
            .map(item => item.reason)
            .join("; ") || "Owner approval requested."
        : null
    });

    submittedCount += 1;

    return {
      runnerId: STUDIO_RUNNER_ID,
      findingType: finding.type,
      relatedFiles: finding.filePaths,
      policyDecision,
      task
    };
  }

  /**
   * Submit multiple Studio findings.
   * Each finding is handled independently.
   */
  async function submitFindings(findings = []) {
    ensureEnabled();

    if (!Array.isArray(findings)) {
      throw new Error("Findings must be an array.");
    }

    const results = [];

    for (const finding of findings) {
      try {
        results.push({
          success: true,
          result: await submitFinding(finding)
        });
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          findingTitle: finding?.title || null
        });
      }
    }

    return {
      runnerId: STUDIO_RUNNER_ID,
      total: findings.length,
      submitted: results.filter(item => item.success).length,
      failed: results.filter(item => !item.success).length,
      results
    };
  }

  /**
   * Enable or disable the runner.
   */
  function setEnabled(value) {
    if (typeof value !== "boolean") {
      throw new Error("Enabled state must be true or false.");
    }

    status = value
      ? STUDIO_RUNNER_STATUS.READY
      : STUDIO_RUNNER_STATUS.DISABLED;

    return getProfile();
  }

  return Object.freeze({
    getProfile,
    submitFinding,
    submitFindings,
    setEnabled
  });
}
