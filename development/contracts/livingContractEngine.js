/**
 * ALIVE — LIVING CONTRACT INTENT ENGINE
 *
 * Deterministically maps clear owner intent to canonical project contracts.
 * It plans and queues work only; it never edits files, invokes a model,
 * executes code, merges, or deploys.
 */

import { getProjectContract } from "../../alive/contracts/projectContracts.js";

const CONTRACTS = Object.freeze([
  Object.freeze({
    id: "convention-center-materials",
    projectContractId: "world-material-quality",
    area: "world_materials",
    title: "Review Convention Center glass realism",
    triggers: ["convention center", "conference center", "glass facade", "glass exterior", "glass realism"],
    dependsOn: [],
    filePaths: ["conferenceCenterDistrict.js"],
    description: "Inspect and propose focused improvements to glass material response, reflections, and surrounding finish while preserving the approved Convention Center footprint, roads, sidewalks, and district layout.",
    acceptanceCriteria: [
      "Preserve the existing building footprint and approved district coordinates.",
      "Improve glass realism without excessive real-time lighting.",
      "Keep surrounding sidewalks, roads, and access paths unchanged.",
      "Use no new dependencies and remain within the world-material contract budget."
    ]
  }),
  Object.freeze({
    id: "dock-entrance-materials",
    projectContractId: "world-material-quality",
    area: "world_materials",
    title: "Review dock entrance luxury details",
    triggers: ["waterfront", "dock entrance", "dock", "docks", "marina entrance", "marina"],
    dependsOn: [],
    filePaths: ["dockEntranceLuxury.js"],
    description: "Improve the visual finish of the existing dock entrance using its approved additive detail module. Preserve marina geography, dock positions, walking paths, and access.",
    acceptanceCriteria: [
      "Preserve all existing dock and marina positions.",
      "Improve material and detail quality without rebuilding the dock.",
      "Keep walking paths, collision, and access unchanged.",
      "Use no new dependencies or unnecessary real-time lights."
    ]
  }),
  Object.freeze({
    id: "waterfront-storefront-materials",
    projectContractId: "world-material-quality",
    area: "world_materials",
    title: "Review waterfront storefront details",
    triggers: ["waterfront", "storefront", "storefronts", "club vista", "music store", "producer store"],
    dependsOn: [],
    filePaths: ["waterfrontStorefrontDetails.js"],
    description: "Polish the existing waterfront storefront presentation while preserving the three approved storefront positions, identities, street, sidewalks, and marina geometry.",
    acceptanceCriteria: [
      "Preserve the existing Club Vista and storefront identities.",
      "Keep all storefront and street positions unchanged.",
      "Improve material and presentation detail without adding interaction or collision changes.",
      "Keep the module additive and performant."
    ]
  }),
  Object.freeze({
    id: "yacht-luxury-materials",
    projectContractId: "world-material-quality",
    area: "world_materials",
    title: "Review yacht luxury materials and details",
    triggers: ["yacht", "yachts", "helipad", "yacht deck", "yacht hull"],
    dependsOn: [],
    filePaths: ["yachtLuxuryDetails.js"],
    description: "Improve existing yacht material response and luxury detail while preserving the yacht transform, dimensions, placement, and marina relationship.",
    acceptanceCriteria: [
      "Preserve the approved yacht placement and transform.",
      "Improve existing detail before replacing assets.",
      "Avoid excessive texture size and real-time lights.",
      "Keep the yacht module isolated and performant."
    ]
  }),
  Object.freeze({
    id: "cinematic-branding",
    projectContractId: "world-material-quality",
    area: "world_materials",
    title: "Review cinematic world branding",
    triggers: ["billboard", "billboards", "branding", "city signage", "brand signs"],
    dependsOn: [],
    filePaths: ["cinematicWorldSkin.js"],
    description: "Polish the existing LAMBO CITY cinematic billboard and brand presentation while preserving approved placements, identity, and world layout.",
    acceptanceCriteria: [
      "Preserve approved billboard placements and brand identity.",
      "Improve existing artwork and material presentation rather than rebuilding the system.",
      "Avoid expensive real-time effects and heavy frame-loop work.",
      "Keep all world geography and navigation unchanged."
    ]
  }),
  Object.freeze({
    id: "world-performance",
    projectContractId: "performance-quality",
    area: "performance_quality",
    title: "Review world performance and device quality",
    triggers: ["performance", "optimization", "optimize", "frame rate", "memory", "loading"],
    dependsOn: [
      "convention-center-materials",
      "dock-entrance-materials",
      "waterfront-storefront-materials",
      "yacht-luxury-materials",
      "cinematic-branding"
    ],
    filePaths: ["deviceGraphics.js", "performanceMonitor.js"],
    description: "Measure loading, rendering, memory, and device-aware quality while preserving approved visual quality and existing graphics fallbacks.",
    acceptanceCriteria: [
      "Measure performance before and after proposed changes.",
      "Preserve cinematic visual quality and existing device graphics fallbacks.",
      "Avoid unnecessary runtime lights, geometry overload, and frame-loop work.",
      "Report reproducible evidence for iPad and desktop profiles."
    ]
  })
]);

const PROTECTED_INTENTS = Object.freeze([
  Object.freeze({
    id: "world-layout-navigation",
    triggers: ["road", "roads", "boardwalk", "sidewalk", "camera", "navigation", "city layout", "district layout", "move a building"],
    reason: "World geography, camera, navigation, and established landmarks are protected and require a separate owner-approved change contract."
  }),
  Object.freeze({
    id: "hero-approved-performance",
    triggers: ["hero", "hero performance", "hero choreography", "hero security"],
    reason: "HERO's approved performance, appearance, route, choreography, music synchronization, and two-guard behavior are protected."
  }),
  Object.freeze({
    id: "player-identity-and-accounts",
    triggers: ["account", "accounts", "phone verification", "player identity", "member registration", "passkey"],
    reason: "Player identity, authentication, recovery, and private profile data require a separate owner-approved workflow."
  }),
  Object.freeze({
    id: "studio-deferred",
    triggers: ["studio", "daw", "mpc", "vocal booth", "pitch correction", "beat lab"],
    reason: "Studio development is deferred and remains observer-only until explicitly reopened."
  })
]);

function normalizeIntent(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("A non-empty ALIVE development intent is required.");
  }
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function matchesTrigger(intent, trigger) {
  const escaped = trigger.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(intent);
}

function resolveOrder(selectedIds) {
  const selected = new Set(selectedIds);
  const ordered = [];
  const visiting = new Set();
  const visited = new Set();

  function visit(id) {
    if (visited.has(id)) return;
    if (visiting.has(id)) throw new Error(`Living Contract dependency cycle: ${id}`);
    const contract = CONTRACTS.find(item => item.id === id);
    if (!contract) throw new Error(`Unknown Living Contract dependency: ${id}`);
    visiting.add(id);
    for (const dependencyId of contract.dependsOn) {
      if (selected.has(dependencyId)) visit(dependencyId);
    }
    visiting.delete(id);
    visited.add(id);
    ordered.push({
      ...contract,
      dependsOn: contract.dependsOn.filter(dependencyId => selected.has(dependencyId))
    });
  }

  for (const id of selectedIds) visit(id);
  return ordered;
}

function validateContractTargets() {
  for (const contract of CONTRACTS) {
    const projectContract = getProjectContract(contract.projectContractId);
    if (!projectContract) throw new Error(`Missing canonical project contract: ${contract.projectContractId}`);
    for (const filePath of contract.filePaths) {
      const allowed = projectContract.allowedPaths.some(prefix => {
const normalizedPrefix = prefix.replace(/\/+$/, "");
        return filePath === normalizedPrefix || filePath.startsWith(`${normalizedPrefix}/`);
      });
      if (!allowed) {
        throw new Error(`Living Contract ${contract.id} references a file outside the canonical allowlist: ${filePath}`);
      }
    }
  }
}

export function createLivingContractEngine(options = {}) {
  const { worldRunner } = options;
  if (!worldRunner || typeof worldRunner.submitFinding !== "function") {
    throw new Error("A valid World Development Runner is required.");
  }

  validateContractTargets();
  let enabled = true;

  function listContracts() {
    return CONTRACTS.map(contract => Object.freeze({
      ...contract,
      triggers: [...contract.triggers],
      dependsOn: [...contract.dependsOn],
      filePaths: [...contract.filePaths],
      acceptanceCriteria: [...contract.acceptanceCriteria]
    }));
  }

  function planIntent(rawIntent) {
    if (!enabled) throw new Error("ALIVE Living Contract Engine is disabled.");
    const intent = normalizeIntent(rawIntent);
    const protectedMatches = PROTECTED_INTENTS.filter(item =>
      item.triggers.some(trigger => matchesTrigger(intent, trigger))
    );
    if (protectedMatches.length) {
      return Object.freeze({
        status: "owner_approval_required",
        intent: rawIntent.trim(),
        reason: protectedMatches.map(item => item.reason).join(" "),
        protectedContracts: protectedMatches.map(item => item.id),
        matchedContracts: [],
        tasks: []
      });
    }

    const directMatches = CONTRACTS
      .filter(contract => contract.triggers.some(trigger => matchesTrigger(intent, trigger)))
      .map(contract => contract.id);

    if (!directMatches.length) {
      return Object.freeze({
        status: "needs_clarification",
        intent: rawIntent.trim(),
        reason: "No registered Living Contract matches this instruction yet.",
        protectedContracts: [],
        matchedContracts: [],
        tasks: []
      });
    }

    const ordered = resolveOrder(directMatches);
    return Object.freeze({
      status: "planned",
      mode: "deterministic_contract_planning",
      intent: rawIntent.trim(),
      protectedContracts: [],
      matchedContracts: ordered.map(contract => contract.id),
      tasks: ordered.map(contract => Object.freeze({
        contractId: contract.id,
        projectContractId: contract.projectContractId,
        title: contract.title,
        area: contract.area,
        dependsOn: [...contract.dependsOn],
        filePaths: [...contract.filePaths],
        description: contract.description,
        acceptanceCriteria: [...contract.acceptanceCriteria]
      }))
    });
  }

  async function submitIntent(rawIntent) {
    const plan = planIntent(rawIntent);
    if (plan.status !== "planned") return plan;

    const taskIds = new Map();
    const submitted = [];
    for (const planned of plan.tasks) {
      const dependencies = planned.dependsOn.map(id => {
        const taskId = taskIds.get(id);
        if (!taskId) throw new Error(`Living Contract dependency was not submitted first: ${id}`);
        return taskId;
      });
      const result = await worldRunner.submitFinding({
        title: planned.title,
        description: planned.description,
        area: planned.area,
        type: "improvement",
        severity: "normal",
        dependencies,
        filePaths: planned.filePaths,
        acceptanceCriteria: planned.acceptanceCriteria
      });
      if (result.contractId !== planned.projectContractId) {
        throw new Error(`World Runner contract mismatch for ${planned.contractId}.`);
      }
      taskIds.set(planned.contractId, result.task.id);
      submitted.push(Object.freeze({
        livingContractId: planned.contractId,
        projectContractId: planned.projectContractId,
        taskId: result.task.id,
        status: result.task.status,
        dependencies,
        relatedFiles: [...planned.filePaths],
        policyDecision: result.policyDecision
      }));
    }

    return Object.freeze({
      status: "submitted",
      mode: "deterministic_contract_planning",
      intent: plan.intent,
      total: submitted.length,
      submitted,
      execution: "queued_for_contract_checked_workflow",
      codeChangesMade: false,
      productionChangesMade: false
    });
  }

  function setEnabled(value) {
    if (typeof value !== "boolean") throw new Error("Enabled state must be true or false.");
    enabled = value;
    return getSnapshot();
  }

  function getSnapshot() {
    return Object.freeze({
      version: "1.1.0",
      enabled,
      contractCount: CONTRACTS.length,
      protectedIntentCount: PROTECTED_INTENTS.length,
      mode: "deterministic_contract_planning",
      executionEnabled: false,
      productionDeploymentEnabled: false
    });
  }

  return Object.freeze({ listContracts, planIntent, submitIntent, setEnabled, getSnapshot });
}
