
/**
 * LAMBO CITY — AUTONOMOUS DEVELOPMENT ENGINE
 * Development Policy
 *
 * Purpose:
 * - Protect the existing LAMBO CITY project.
 * - Define actions requiring owner approval.
 * - Establish autonomous development boundaries.
 * - Prevent protected work from being treated as routine work.
 *
 * IMPORTANT:
 * This is server-side development infrastructure.
 * Do NOT import it into the live game.
 */

export const DEVELOPMENT_POLICY_VERSION = "1.0.0";

export const OWNER_APPROVAL_ACTIONS = Object.freeze([
  "spending_money",
  "paid_services",
  "billing",
  "payments",
  "security_permissions",
  "data_deletion",
  "major_architecture",
  "production_release",
  "crypto",
  "wallets",
  "accounts",
  "multiplayer",
  "protected_landmarks"
]);

export const AUTONOMOUS_PERMISSIONS = Object.freeze([
  "inspect_repository",
  "read_project_files",
  "analyze_architecture",
  "identify_improvements",
  "create_development_tasks",
  "prioritize_tasks",
  "assign_eligible_tasks",
  "modify_isolated_workspace",
  "run_available_tests",
  "record_development_results",
  "prepare_changes_for_review"
]);

export const PROTECTED_PROJECT_RULES = Object.freeze([
  "Never silently overwrite production code.",
  "Never delete important project data without owner approval.",
  "Never spend money or activate paid services without owner approval.",
  "Never change billing or payment systems without owner approval.",
  "Never change security permissions without owner approval.",
  "Never introduce accounts, cryptocurrency, wallets, or multiplayer without owner approval.",
  "Never make major architectural changes without owner approval.",
  "Never publish significant changes to the live website without owner approval.",
  "Never disable safety controls or expand autonomous permissions.",
  "Preserve existing working features and project identity."
]);

const PROTECTED_ACTION_SET = new Set(
  OWNER_APPROVAL_ACTIONS
);

const AUTONOMOUS_PERMISSION_SET = new Set(
  AUTONOMOUS_PERMISSIONS
);

/**
 * Normalize and validate action lists.
 */
function normalizeActions(actions = []) {
  if (!Array.isArray(actions)) {
    throw new Error("Actions must be an array.");
  }

  return [...new Set(actions.map(action => {
    if (
      typeof action !== "string" ||
      !action.trim()
    ) {
      throw new Error("Every action must be a non-empty string.");
    }

    return action.trim();
  }))];
}

/**
 * Evaluate a proposed development task.
 *
 * Any protected action requires owner approval,
 * even if the task requests no approval.
 */
export function evaluateDevelopmentTask(task = {}) {
  const actions = normalizeActions(
    task.protectedActions || []
  );

  const approvalReasons = actions
    .filter(action => PROTECTED_ACTION_SET.has(action))
    .map(action => ({
      action,
      reason: `Owner approval required for: ${action}`
    }));

  const requiresApproval =
    task.requiresApproval === true ||
    approvalReasons.length > 0;

  return Object.freeze({
    policyVersion: DEVELOPMENT_POLICY_VERSION,
    taskTitle: task.title || null,
    requiresApproval,
    approvalReasons,
    canEnterAutonomousQueue: !requiresApproval,
    decision: requiresApproval
      ? "owner_approval_required"
      : "eligible_for_autonomous_queue"
  });
}

/**
 * Check whether an action is within the
 * established autonomous permission list.
 */
export function isAutonomousPermissionAllowed(action) {
  return (
    typeof action === "string" &&
    AUTONOMOUS_PERMISSION_SET.has(action)
  );
}

/**
 * Check whether an action requires owner approval.
 */
export function requiresOwnerApproval(action) {
  return (
    typeof action === "string" &&
    PROTECTED_ACTION_SET.has(action)
  );
}

/**
 * Return a read-only copy of the policy.
 */
export function getDevelopmentPolicy() {
  return Object.freeze({
    version: DEVELOPMENT_POLICY_VERSION,
    autonomousPermissions: [...AUTONOMOUS_PERMISSIONS],
    ownerApprovalActions: [...OWNER_APPROVAL_ACTIONS],
    protectedProjectRules: [...PROTECTED_PROJECT_RULES]
  });
}
