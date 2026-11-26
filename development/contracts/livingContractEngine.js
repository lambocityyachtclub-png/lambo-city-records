/**
 * ALIVE — LIVING CONTRACT INTENT ENGINE
 *
 * Deterministically converts clear owner intent into a dependency-ordered
 * set of canonical project tasks. It plans and queues work only; it never
 * edits files, invokes a model, executes code, or deploys.
 */

const CONTRACTS = Object.freeze([
  Object.freeze({
    id: "water-materials",
    projectContractId: "world-material-quality",
    area: "world_materials",
    title: "Review waterfront water realism",
    triggers: ["water", "waterfront", "ocean", "waves", "reflection", "shoreline"],
    dependsOn: [],
    description: "Inspect and propose focused improvements to the existing water materials and reflections. Preserve approved shoreline, marina geography, docks, object positions, camera, navigation, and controls.",
    acceptanceCriteria: [
      "Improve the existing water system before considering replacement.",
      "Preserve approved shoreline, marina geography, dock positions, camera, and navigation.",
      "Keep reflections and water movement performant on iPad and desktop.",
      "Use no new dependencies or unnecessary real-time lights."
    ]
  }),
  Object.freeze({
    id: "marina-transitions",
    projectContractId: "world-material-quality",
    area: "world_materials",
    title: "Review marina and dock transitions",
    triggers: ["marina", "dock", "docks", "pier", "yacht"],
    dependsOn: ["water-materials"],
    description: "Improve visual continuity between existing marina, docks, yachts, and water without moving approved assets or changing navigation.",
    acceptanceCriteria: [
      "Keep existing dock, marina, and yacht positions unchanged.",
      "Improve water-to-shore and water-to-dock material transitions.",
      "Preserve existing walking paths and collision behavior."
    ]
  }),
  Object.freeze({
    id: "environment-lighting",
    projectContractId: "world-material-quality",
    area: "world_materials",
    title: "Review environmental lighting and reflections",
    triggers: ["lighting", "light", "night", "reflections"],
    dependsOn: ["water-materials"],
    description: "Improve material response and existing environmental lighting coherently while respecting the current performance budget.",
    acceptanceCriteria: [
      "Preserve the approved lighting direction and visual identity.",
      "Prefer emissive or baked detail over unnecessary real-time lights.",
      "Keep the scene within the established device performance budget."
    ]
  }),
  Object.freeze({
    id: "waterfront-landscaping",
    projectContractId: "world-material-quality",
    area: "world_materials",
    title: "Review waterfront landscaping transitions",
    triggers: ["landscaping", "landscape", "plants", "trees", "planting"],
    dependsOn: ["marina-transitions"],
    description: "Polish existing landscaping and material transitions around the waterfront without moving planted landmarks, buildings, paths, or roads.",
    acceptanceCriteria: [
      "Preserve existing landscape asset positions.",
      "Improve transitions between planting, paving, and shoreline.",
      "Keep walkways and street clearances unobstructed."
    ]
  }),
  Object.freeze({
    id: "world-performance",
    projectContractId: "performance-quality",
    area: "performance_quality",
    title: "Verify coordinated world performance",
    triggers: ["performance", "optimization", "optimize", "frame rate", "memory"],
    dependsOn: ["water-materials", "marina-transitions", "environment-lighting", "waterfront-landscaping"],
    description: "Verify the coordinated visual improvements against loading, rendering, memory, and device performance without weakening approved visual quality.",
    acceptanceCriteria: [
      "Measure performance before and after proposed changes.",
      "Preserve visual quality and existing device graphics fallbacks.",
      "Avoid unnecessary runtime lights, geometry overload, and frame-loop work.",
      "Report reproducible evidence for iPad and desktop profiles."
    ]
  }),
  Object.freeze({
    id: "convention-center-materials",
    projectContractId: "world-material-quality",
    area: "world_materials",
    title: "Review Convention Center glass realism",
    triggers: ["convention center", "conference center", "glass facade", "glass exterior", "glass realism"],
    dependsOn: [],
    description: "Improve glass material response, reflections, and surrounding visual finish while preserving the approved Convention Center footprint, roads, sidewalks, and district layout.",
    acceptanceCriteria: [
      "Preserve the existing building footprint and approved district coordinates.",
      "Improve glass realism without excessive real-time lighting.",
      "Keep surrounding sidewalks, roads, and access paths unchanged."
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
  const ordered = [];
  const visiting = new Set();
  const visited = new Set();

  function visit(id) {
    if (visited.has(id)) return;
    if (visiting.has(id)) throw new Error(`Living Contract dependency cycle: ${id}`);
    const contract = CONTRACTS.find(item => item.id === id);
    if (!contract) throw new Error(`Unknown Living Contract dependency: ${id}`);
    visiting.add(id);
    for (const dependencyId of contract.dependsOn) visit(dependencyId);
    visiting.delete(id);
    visited.add(id);
    ordered.push(contract);
  }

  for (const id of selectedIds) visit(id);
  return ordered;
}

export function createLivingContractEngine(options = {}) {
  const { worldRunner } = options;
  if (!worldRunner || typeof worldRunner.submitFinding !== "function") {
    throw new Error("A valid World Development Runner is required.");
  }

  let enabled = true;

  function listContracts() {
    return CONTRACTS.map(contract => Object.freeze({
      ...contract,
      triggers: [...contract.triggers],
      dependsOn: [...contract.dependsOn],
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
      version: "1.0.0",
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
