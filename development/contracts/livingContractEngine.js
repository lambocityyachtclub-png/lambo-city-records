/**
 * ALIVE — LIVING CONTRACT BATCH ENGINE
 *
 * Provider-independent contract resolver for bounded development intent.
 * It deterministically maps an instruction to reusable contracts, resolves
 * dependencies, and submits one coordinated task batch to the World runner.
 *
 * This engine plans and queues work only. It does not edit files, execute
 * code, call an AI provider, activate a sandbox, or deploy.
 */

const CONTRACTS = Object.freeze([
  Object.freeze({
    id: "water",
    area: "water",
    title: "Improve waterfront water realism",
    triggers: ["water", "waterfront", "ocean", "waves", "reflection", "shoreline"],
    dependsOn: [],
    description: "Improve existing water appearance and behavior using the current water system. Preserve approved shoreline, marina geography, docks, object positions, camera, and navigation.",
    acceptanceCriteria: [
      "Existing water system is upgraded before replacement is considered.",
      "Approved shoreline, marina geography, docks, and object positions remain unchanged.",
      "Water movement and reflections remain performant on supported devices.",
      "No paid AI or paid sandbox service is required."
    ],
    invariants: ["approved_geography", "object_positions", "camera", "navigation", "working_controls"]
  }),
  Object.freeze({
    id: "marina",
    area: "marina",
    title: "Coordinate marina and waterfront transitions",
    triggers: ["waterfront", "marina", "dock", "docks", "pier", "yacht", "shoreline"],
    dependsOn: ["water"],
    description: "Coordinate marina, dock, and shoreline presentation with the water system without moving approved marina assets or changing navigation.",
    acceptanceCriteria: [
      "Existing dock, marina, and yacht positions remain unchanged.",
      "Water-to-shore and water-to-dock transitions appear cohesive.",
      "Existing walking paths and navigation remain functional."
    ],
    invariants: ["approved_geography", "object_positions", "navigation", "walking_paths"]
  }),
  Object.freeze({
    id: "lighting",
    area: "lighting",
    title: "Coordinate waterfront lighting and reflections",
    triggers: ["waterfront", "water", "lighting", "light", "reflection", "night"],
    dependsOn: ["water"],
    description: "Improve the relationship between waterfront materials, environmental lighting, and reflections while respecting the project's performance budget.",
    acceptanceCriteria: [
      "Lighting supports water and nearby materials coherently.",
      "Existing approved lighting direction and scene layout are preserved.",
      "Avoid unnecessary real-time lights and performance regressions."
    ],
    invariants: ["approved_layout", "camera", "performance_budget"]
  }),
  Object.freeze({
    id: "landscaping",
    area: "landscaping",
    title: "Polish waterfront landscaping transitions",
    triggers: ["waterfront", "landscaping", "landscape", "shoreline", "plants", "trees"],
    dependsOn: ["marina"],
    description: "Improve existing waterfront landscaping and material transitions around the marina without moving approved paths, buildings, or planted landmarks.",
    acceptanceCriteria: [
      "Existing landscape assets and positions are preserved.",
      "Shoreline, paving, and planting transitions look cohesive.",
      "Walking paths and street clearances remain unobstructed."
    ],
    invariants: ["approved_geography", "object_positions", "walking_paths", "street_clearance"]
  }),
  Object.freeze({
    id: "world_performance",
    area: "world_performance",
    title: "Verify coordinated waterfront performance",
    triggers: ["waterfront", "water", "performance", "optimization", "optimize", "vr"],
    dependsOn: ["water", "marina", "lighting", "landscaping"],
    description: "Check the coordinated waterfront work for frame-time, rendering, memory, and device-performance risks without weakening visual quality or existing controls.",
    acceptanceCriteria: [
      "Waterfront changes are checked together rather than in isolation.",
      "No avoidable real-time light or geometry overload is introduced.",
      "Existing navigation, controls, and approved world systems remain functional.",
      "Performance findings are reported with reproducible evidence."
    ],
    invariants: ["performance_budget", "camera", "navigation", "working_controls"]
  })
]);

const CONTRACT_BY_ID = new Map(CONTRACTS.map(contract => [contract.id, contract]));

function normalizeIntent(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("A non-empty development intent is required.");
  }
  return value.trim().toLowerCase().replace(/\\s+/g, " ");
}

function matchesTrigger(intent, trigger) {
  const escaped = trigger.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(intent);
}

function resolveContractOrder(selectedIds) {
  const ordered = [];
  const visiting = new Set();
  const visited = new Set();

  function visit(id) {
    if (visited.has(id)) return;
    if (visiting.has(id)) throw new Error(`Living Contract dependency cycle: ${id}`);
    const contract = CONTRACT_BY_ID.get(id);
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

  function listContracts() {
    return CONTRACTS.map(contract => ({
      ...contract,
      triggers: [...contract.triggers],
      dependsOn: [...contract.dependsOn],
      acceptanceCriteria: [...contract.acceptanceCriteria],
      invariants: [...contract.invariants]
    }));
  }

  function planIntent(rawIntent) {
    const intent = normalizeIntent(rawIntent);
    const directlyMatched = CONTRACTS
      .filter(contract => contract.triggers.some(trigger => matchesTrigger(intent, trigger)))
      .map(contract => contract.id);

    if (directlyMatched.length === 0) {
      return Object.freeze({
        status: "needs_clarification",
        intent: rawIntent.trim(),
        reason: "No registered Living Contract matches this instruction yet.",
        matchedContracts: [],
        tasks: []
      });
    }

    const ordered = resolveContractOrder(directlyMatched);
    return Object.freeze({
      status: "planned",
      intent: rawIntent.trim(),
      mode: "deterministic_no_paid_ai",
      matchedContracts: ordered.map(contract => contract.id),
      tasks: ordered.map(contract => ({
        contractId: contract.id,
        title: contract.title,
        area: contract.area,
        dependsOn: [...contract.dependsOn],
        acceptanceCriteria: [...contract.acceptanceCriteria],
        invariants: [...contract.invariants],
        description: contract.description
      }))
    });
  }

  async function submitIntent(rawIntent) {
    const plan = planIntent(rawIntent);
    if (plan.status !== "planned") return plan;

    const taskIds = new Map();
    const submitted = [];

    for (const plannedTask of plan.tasks) {
      const dependencies = plannedTask.dependsOn.map(id => {
        const taskId = taskIds.get(id);
        if (!taskId) throw new Error(`Contract dependency was not submitted first: ${id}`);
        return taskId;
      });

      const result = await worldRunner.submitFinding({
        title: plannedTask.title,
        description: plannedTask.description,
        area: plannedTask.area,
        type: "improvement",
        severity: "normal",
        dependencies,
        acceptanceCriteria: plannedTask.acceptanceCriteria
      });

      taskIds.set(plannedTask.contractId, result.task.id);
      submitted.push({
        contractId: plannedTask.contractId,
        taskId: result.task.id,
        status: result.task.status,
        dependencies: [...dependencies],
        policyDecision: result.policyDecision
      });
    }

    return {
      status: "submitted",
      mode: "deterministic_no_paid_ai",
      intent: plan.intent,
      total: submitted.length,
      submitted,
      execution: "queued_for_owner-controlled_workflow",
      codeChangesMade: false,
      productionChangesMade: false
    };
  }

  return Object.freeze({ listContracts, planIntent, submitIntent });
}
