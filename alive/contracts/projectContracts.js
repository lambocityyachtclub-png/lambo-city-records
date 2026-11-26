/**
 * ALIVE — Canonical LAMBO CITY module contracts.
 *
 * This is the policy source for ALIVE's first bounded operating permissions.
 * Contracts are immutable in code and resolved by ID; callers cannot supply
 * replacement contract objects. This module is server-side only.
 */

export const CONTRACT_SCHEMA = "alive-module-contract";
export const CONTRACT_SCHEMA_VERSION = 1;

export const AUTONOMY = Object.freeze({
  OBSERVER: "observer",
  BUILDER: "builder",
  TRUSTED_OPERATOR: "trusted-operator"
});

const LEVEL = Object.freeze({
  observer: 0,
  builder: 1,
  "trusted-operator": 2
});

const freezeList = values => Object.freeze([...values]);

function makeContract(input) {
  return Object.freeze({
    schema: CONTRACT_SCHEMA,
    schemaVersion: CONTRACT_SCHEMA_VERSION,
    version: "1.0.0",
    owner: "LAMBO CITY Records LLC",
    ...input,
    allowedPaths: freezeList(input.allowedPaths),
    allowedOperations: freezeList(input.allowedOperations),
    ownerApprovalOperations: freezeList(input.ownerApprovalOperations),
    forbiddenOperations: freezeList(input.forbiddenOperations),
    protectedInvariants: freezeList(input.protectedInvariants),
    requiredEvidence: freezeList(input.requiredEvidence),
    resourceBudget: Object.freeze({ ...input.resourceBudget }),
    rollback: Object.freeze({ ...input.rollback })
  });
}

const COMMON_FORBIDDEN = [
  "change_owner_authority",
  "change_contract_permissions",
  "disable_safety_controls",
  "exfiltrate_credentials",
  "delete_project_data",
  "spend_money",
  "activate_paid_services"
];

const WORLD_INVARIANTS = [
  "preserve_existing_world_geography",
  "preserve_landmark_positions_and_footprints",
  "preserve_roads_sidewalks_and_navigation",
  "preserve_camera_and_player_controls",
  "preserve_existing_interactions",
  "preserve_iPad_performance"
];

const CONTRACTS = [
  makeContract({
    id: "world-material-quality",
    name: "World Materials and Environmental Finish",
    purpose: "Improve realism, material response, surface finish, and environmental detail without changing established layouts or geometry.",
    autonomyLevel: AUTONOMY.TRUSTED_OPERATOR,
    allowedPaths: [
      "conferenceCenterDistrict.js",
      "waterfrontStorefrontDetails.js",
      "cinematicWorldSkin.js",
      "yachtLuxuryDetails.js",
      "dockEntranceLuxury.js"
    ],
    allowedOperations: [
      "inspect",
      "analyze",
      "prepare_isolated_change",
      "run_tests",
      "deploy_production_low_risk"
    ],
    ownerApprovalOperations: [
      "change_geometry",
      "move_landmark",
      "change_footprint",
      "change_roads_or_sidewalks",
      "change_camera_or_navigation",
      "remove_existing_content",
      "add_paid_service",
      "change_external_service",
      "deploy_production_high_risk"
    ],
    forbiddenOperations: COMMON_FORBIDDEN,
    protectedInvariants: WORLD_INVARIANTS,
    requiredEvidence: [
      "contract_version_match",
      "changed_paths_within_allowlist",
      "automated_tests_passed",
      "runtime_smoke_passed",
      "visual_quality_review_passed",
      "resource_budget_passed",
      "rollback_ready"
    ],
    productionDeployment: "low-risk-preauthorized",
    resourceBudget: {
      maxChangedFiles: 4,
      maxLinesChanged: 300,
      maxNewDependencies: 0,
      maxAddedRuntimeLights: 1,
      maxTextureDimension: 2048
    },
    rollback: {
      required: true,
      strategy: "revert-isolated-commit",
      preserveKnownGoodProduction: true
    }
  }),
  makeContract({
    id: "performance-quality",
    name: "Performance and Device Quality",
    purpose: "Measure and improve loading, rendering, memory, and device-aware quality without reducing approved visual quality or changing gameplay.",
    autonomyLevel: AUTONOMY.BUILDER,
    allowedPaths: [
      "deviceGraphics.js",
      "performanceMonitor.js",
      "development/blueprints/"
    ],
    allowedOperations: [
      "inspect",
      "analyze",
      "prepare_isolated_change",
      "run_tests"
    ],
    ownerApprovalOperations: [
      "change_world_geometry",
      "change_quality_profiles_for_production",
      "change_player_controls",
      "change_render_pipeline",
      "deploy_production"
    ],
    forbiddenOperations: COMMON_FORBIDDEN,
    protectedInvariants: [
      "preserve_iPad_performance",
      "preserve_cinematic_visual_quality",
      "preserve_device_quality_fallbacks",
      "no_heavy_work_in_frame_loop"
    ],
    requiredEvidence: [
      "contract_version_match",
      "changed_paths_within_allowlist",
      "automated_tests_passed",
      "device_profile_tests_passed",
      "resource_budget_passed",
      "rollback_ready"
    ],
    productionDeployment: "owner-approval",
    resourceBudget: {
      maxChangedFiles: 3,
      maxLinesChanged: 250,
      maxNewDependencies: 0,
      maxAddedFrameLoopWorkMs: 0.1
    },
    rollback: {
      required: true,
      strategy: "revert-isolated-commit",
      preserveKnownGoodProduction: true
    }
  }),
  makeContract({
    id: "world-layout-navigation",
    name: "World Layout and Navigation",
    purpose: "Protect established geography, landmark placement, roads, sidewalks, camera paths, movement, and collisions.",
    autonomyLevel: AUTONOMY.OBSERVER,
    allowedPaths: [],
    allowedOperations: ["inspect", "analyze"],
    ownerApprovalOperations: [
      "change_geometry",
      "move_landmark",
      "change_footprint",
      "change_roads_or_sidewalks",
      "change_camera_or_navigation",
      "change_player_controls",
      "change_collision",
      "deploy_production"
    ],
    forbiddenOperations: COMMON_FORBIDDEN,
    protectedInvariants: WORLD_INVARIANTS,
    requiredEvidence: ["dependency_map", "before_after_review", "owner_approval"],
    productionDeployment: "owner-approval",
    resourceBudget: { maxChangedFiles: 0, maxLinesChanged: 0, maxNewDependencies: 0 },
    rollback: { required: true, strategy: "owner-directed-recovery", preserveKnownGoodProduction: true }
  }),
  makeContract({
    id: "hero-approved-performance",
    name: "HERO Approved Performance",
    purpose: "Preserve HERO's approved appearance, entrance, route, choreography, music synchronization, and existing performance behavior.",
    autonomyLevel: AUTONOMY.OBSERVER,
    allowedPaths: [],
    allowedOperations: ["inspect", "analyze"],
    ownerApprovalOperations: [
      "change_hero_appearance",
      "change_hero_choreography",
      "change_hero_music",
      "change_hero_route",
      "change_hero_security_formation",
      "add_paparazzi",
      "remove_hero_behavior",
      "deploy_production"
    ],
    forbiddenOperations: COMMON_FORBIDDEN,
    protectedInvariants: [
      "preserve_approved_hero_performance",
      "preserve_existing_two_guard_behavior",
      "do_not_reintroduce_paparazzi"
    ],
    requiredEvidence: ["dependency_map", "owner_approval"],
    productionDeployment: "owner-approval",
    resourceBudget: { maxChangedFiles: 0, maxLinesChanged: 0, maxNewDependencies: 0 },
    rollback: { required: true, strategy: "owner-directed-recovery", preserveKnownGoodProduction: true }
  }),
  makeContract({
    id: "player-identity-and-accounts",
    name: "Player Identity and Accounts",
    purpose: "Protect authentication, account recovery, private identity data, and player profile ownership while the simplified onboarding is completed.",
    autonomyLevel: AUTONOMY.OBSERVER,
    allowedPaths: [],
    allowedOperations: ["inspect", "analyze"],
    ownerApprovalOperations: [
      "change_authentication",
      "change_phone_verification",
      "change_email_recovery",
      "change_passkeys",
      "change_profile_privacy",
      "change_identity_ownership",
      "deploy_production"
    ],
    forbiddenOperations: COMMON_FORBIDDEN,
    protectedInvariants: [
      "account_authenticates_person_not_character",
      "personal_identity_remains_owner_controlled",
      "private_data_is_not_exposed",
      "recovery_path_remains_available"
    ],
    requiredEvidence: ["security_review", "privacy_review", "owner_approval"],
    productionDeployment: "owner-approval",
    resourceBudget: { maxChangedFiles: 0, maxLinesChanged: 0, maxNewDependencies: 0 },
    rollback: { required: true, strategy: "owner-directed-recovery", preserveKnownGoodProduction: true }
  }),
  makeContract({
    id: "studio-deferred",
    name: "LAMBO CITY Studio",
    purpose: "Preserve the existing shared production core and approved interfaces while Studio development is deferred.",
    autonomyLevel: AUTONOMY.OBSERVER,
    allowedPaths: [],
    allowedOperations: ["inspect", "analyze"],
    ownerApprovalOperations: ["change_studio", "change_audio_engine", "change_project_format", "deploy_production"],
    forbiddenOperations: COMMON_FORBIDDEN,
    protectedInvariants: [
      "preserve_shared_production_core",
      "preserve_approved_studio_interfaces",
      "preserve_existing_sessions_and_audio_workflows"
    ],
    requiredEvidence: ["dependency_map", "owner_approval"],
    productionDeployment: "owner-approval",
    resourceBudget: { maxChangedFiles: 0, maxLinesChanged: 0, maxNewDependencies: 0 },
    rollback: { required: true, strategy: "owner-directed-recovery", preserveKnownGoodProduction: true }
  }),
  makeContract({
    id: "alive-development-core",
    name: "ALIVE Development Core",
    purpose: "Improve ALIVE's planning, discovery, isolated execution, validation, and audit capabilities without altering trust roots or granting itself authority.",
    autonomyLevel: AUTONOMY.BUILDER,
    allowedPaths: [
      "development/engine/",
      "development/execution/",
      "development/blueprints/",
      "development/tests/"
    ],
    allowedOperations: ["inspect", "analyze", "prepare_isolated_change", "run_tests"],
    ownerApprovalOperations: [
      "change_development_policy",
      "change_contracts",
      "change_owner_authority",
      "change_execution_permissions",
      "connect_production_credentials",
      "enable_background_worker",
      "deploy_production"
    ],
    forbiddenOperations: COMMON_FORBIDDEN,
    protectedInvariants: [
      "alive_cannot_expand_its_own_authority",
      "generated_code_cannot_authorize_itself",
      "production_credentials_remain_outside_worker",
      "isolated_workspace_required",
      "owner_can_revoke_permissions"
    ],
    requiredEvidence: ["contract_version_match", "automated_tests_passed", "security_tests_passed", "rollback_ready"],
    productionDeployment: "owner-approval",
    resourceBudget: {
      maxChangedFiles: 6,
      maxLinesChanged: 700,
      maxNewDependencies: 0
    },
    rollback: { required: true, strategy: "revert-isolated-commit", preserveKnownGoodProduction: true }
  })
];

const CONTRACT_BY_ID = new Map(CONTRACTS.map(contract => [contract.id, contract]));

export function listProjectContracts() {
  return Object.freeze([...CONTRACTS]);
}

export function getProjectContract(contractId) {
  return CONTRACT_BY_ID.get(contractId) || null;
}

export function validateProjectContract(contract) {
  const errors = [];
  if (!contract || typeof contract !== "object") return ["A contract is required."];
  if (contract.schema !== CONTRACT_SCHEMA) errors.push("Contract schema is invalid.");
  if (contract.schemaVersion !== CONTRACT_SCHEMA_VERSION) errors.push("Contract schema version is unsupported.");
  if (!contract.id || !CONTRACT_BY_ID.has(contract.id)) errors.push("Contract ID is not registered.");
  if (contract.id && CONTRACT_BY_ID.has(contract.id) && CONTRACT_BY_ID.get(contract.id) !== contract) {
    errors.push("Only the canonical registered contract may be evaluated.");
  }
  if (!Object.hasOwn(LEVEL, contract.autonomyLevel)) errors.push("Autonomy level is invalid.");
  if (!Array.isArray(contract.allowedPaths) || !Array.isArray(contract.allowedOperations)) errors.push("Contract allowlists are invalid.");
  if (!Array.isArray(contract.protectedInvariants) || contract.protectedInvariants.length === 0) errors.push("Protected invariants are required.");
  if (!contract.rollback?.required || !contract.rollback?.strategy) errors.push("A rollback strategy is required.");
  if (!["owner-approval", "low-risk-preauthorized"].includes(contract.productionDeployment)) {
    errors.push("Production deployment policy is invalid.");
  }
  return errors;
}

function pathsAreAllowed(changedPaths, allowedPaths) {
  if (!Array.isArray(changedPaths) || changedPaths.length === 0) return false;
  return changedPaths.every(path => typeof path === "string" && allowedPaths.some(allowed =>
    allowed.endsWith("/") ? path.startsWith(allowed) : path === allowed
  ));
}

const RESOURCE_METRIC_FIELDS = Object.freeze({
  maxChangedFiles: "changedFiles",
  maxLinesChanged: "linesChanged",
  maxNewDependencies: "newDependencies",
  maxAddedRuntimeLights: "addedRuntimeLights",
  maxTextureDimension: "maxTextureDimension",
  maxAddedFrameLoopWorkMs: "maxAddedFrameLoopWorkMs"
});

function evaluateResourceBudget(contract, evidence) {
  const budget = contract.resourceBudget || {};
  const missing = [];
  const exceeded = [];

  for (const [limitKey, limit] of Object.entries(budget)) {
    const metricKey = RESOURCE_METRIC_FIELDS[limitKey];
    if (!metricKey) continue;
    const value = evidence[metricKey];
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      missing.push(metricKey);
      continue;
    }
    if (Number.isInteger(limit) && !Number.isInteger(value)) {
      missing.push(metricKey);
      continue;
    }
    if (value > limit) exceeded.push({ metric: metricKey, limit, actual: value });
  }

  if (missing.length) {
    return Object.freeze({
      authorized: false,
      decision: "blocked_missing_evidence",
      reason: "Required resource-budget measurements are missing or invalid.",
      missingEvidence: missing
    });
  }

  if (evidence.textureTouched === true && !Object.hasOwn(budget, "maxTextureDimension")) {
    return Object.freeze({
      authorized: false,
      decision: "owner_approval_required",
      reason: "This contract does not authorize texture changes."
    });
  }
  if (evidence.frameLoopTouched === true && !Object.hasOwn(budget, "maxAddedFrameLoopWorkMs")) {
    return Object.freeze({
      authorized: false,
      decision: "owner_approval_required",
      reason: "This contract does not authorize frame-loop changes."
    });
  }

  if (Number.isInteger(evidence.changedFiles) &&
      Array.isArray(evidence.changedPaths) &&
      evidence.changedFiles !== evidence.changedPaths.length) {
    return Object.freeze({
      authorized: false,
      decision: "denied",
      reason: "Changed-file count does not match the validated changed paths."
    });
  }

  if (exceeded.length) {
    return Object.freeze({
      authorized: false,
      decision: "owner_approval_required",
      reason: "The proposed change exceeds its canonical resource budget.",
      exceeded
    });
  }

  return null;
}

export function evaluateProjectAction(contractId, operation, evidence = {}) {
  const contract = getProjectContract(contractId);
  if (!contract) return Object.freeze({ authorized: false, decision: "denied", reason: "Unknown contract." });
  const errors = validateProjectContract(contract);
  if (errors.length) return Object.freeze({ authorized: false, decision: "denied", reason: errors.join(" ") });
  if (contract.forbiddenOperations.includes(operation)) {
    return Object.freeze({ authorized: false, decision: "denied", reason: "This operation is forbidden by the project trust contract." });
  }
  if (contract.ownerApprovalOperations.includes(operation)) {
    return Object.freeze({ authorized: false, decision: "owner_approval_required", reason: "This operation is reserved for explicit owner approval." });
  }
  if (!contract.allowedOperations.includes(operation)) {
    return Object.freeze({ authorized: false, decision: "not_authorized", reason: "This operation is outside the contract's allowed operations." });
  }
  if (operation === "prepare_isolated_change") {
    if (LEVEL[contract.autonomyLevel] < LEVEL.builder || !Array.isArray(evidence.changedPaths) ||
      !pathsAreAllowed(evidence.changedPaths, contract.allowedPaths)) {
      return Object.freeze({ authorized: false, decision: "denied", reason: "The contract does not authorize these changed paths." });
    }
    const budgetDecision = evaluateResourceBudget(contract, evidence);
    if (budgetDecision) return budgetDecision;
  }
  if (operation === "deploy_production_low_risk") {
    if (contract.productionDeployment !== "low-risk-preauthorized" ||
      contract.autonomyLevel !== AUTONOMY.TRUSTED_OPERATOR) {
      return Object.freeze({ authorized: false, decision: "owner_approval_required", reason: "Production deployment is not pre-authorized by this contract." });
    }
    const required = contract.requiredEvidence;
    const missing = required.filter(key => evidence[key] !== true);
    if (missing.length) {
      return Object.freeze({ authorized: false, decision: "blocked_missing_evidence", reason: "Required release evidence is missing.", missingEvidence: missing });
    }
    if (evidence.risk !== "low") {
      return Object.freeze({ authorized: false, decision: "owner_approval_required", reason: "Only low-risk changes are covered by the standing owner authorization." });
    }
    if (!pathsAreAllowed(evidence.changedPaths, contract.allowedPaths)) {
      return Object.freeze({ authorized: false, decision: "denied", reason: "Changed paths are outside this contract's allowlist." });
    }
    if (evidence.protectedScopeTouched === true) {
      return Object.freeze({ authorized: false, decision: "owner_approval_required", reason: "The change touches protected project scope." });
    }
    const budgetDecision = evaluateResourceBudget(contract, evidence);
    if (budgetDecision) return budgetDecision;
  }
  return Object.freeze({
    authorized: true,
    decision: "authorized",
    contractId: contract.id,
    contractVersion: contract.version,
    autonomyLevel: contract.autonomyLevel,
    operation
  });
}
