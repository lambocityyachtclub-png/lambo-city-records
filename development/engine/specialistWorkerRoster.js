/**
 * LAMBO CITY ALIVE — temporary specialist development workforce.
 *
 * These workers are development-time task coordinators, not game NPCs.
 * They classify findings and create scoped tasks for the Development Director.
 * They do not generate code, write repository files, execute commands, or deploy.
 *
 * The workforce can be disabled or removed after the build programme completes.
 */

import { evaluateDevelopmentTask } from "../policies/developmentPolicy.js";

export const WORKER_ROSTER_VERSION = "1.0.0";

const WORKERS = Object.freeze([
  {
    id: "studio",
    name: "Studio & DAW Specialist",
    description: "Floor 2 Studio stations, recording, editing, MPC, piano, Beat Lab, mixing and workflow.",
    areas: ["studio_audio", "beat_lab", "mpc", "recording", "vocals", "multitrack", "timeline", "mixer", "effects", "instruments", "project_saving", "project_export", "studio_interface", "studio_performance"],
    capabilities: ["studio_workflow", "audio_recording", "daw_validation", "instrument_integration"]
  },
  {
    id: "audio-assets",
    name: "Audio & Sound Library Specialist",
    description: "Sound packs, sample libraries, audio asset persistence, formats, licensing metadata and audio performance.",
    areas: ["audio_assets", "sound_libraries", "audio_formats", "audio_performance"],
    capabilities: ["asset_catalogs", "sound_pack_validation", "audio_storage"]
  },
  {
    id: "world-architecture",
    name: "World Architecture Specialist",
    description: "World boundaries, district structure, roads, parcels, navigation and world-system integration.",
    areas: ["world_architecture", "districts", "roads", "parcels", "navigation"],
    capabilities: ["district_architecture", "world_integration", "spatial_validation"]
  },
  {
    id: "environment-water",
    name: "Environment & Water Specialist",
    description: "Water, shoreline, terrain, landscaping, environmental materials, lighting and performance.",
    areas: ["environment", "water", "shoreline", "terrain", "landscaping", "environment_lighting"],
    capabilities: ["environment_recipes", "water_systems", "terrain_validation"]
  },
  {
    id: "yachts-vehicles",
    name: "Yachts & Vehicle Specialist",
    description: "Yachts, boats, vehicle models, handling, marina interactions, parking and circulation.",
    areas: ["yachts", "boats", "vehicles", "marina", "vehicle_handling"],
    capabilities: ["vehicle_content", "marina_systems", "vehicle_validation"]
  },
  {
    id: "convention-center",
    name: "Convention & Venue Specialist",
    description: "Convention Center, venues, event spaces, meeting rooms, stages and visitor flows.",
    areas: ["convention_center", "venues", "meeting_rooms", "events", "spectator_spaces", "visitor_flow"],
    capabilities: ["venue_recipes", "event_space_validation", "visitor_flow"]
  },
  {
    id: "performance-qa",
    name: "Performance & Quality Specialist",
    description: "Automated tests, browser compatibility, iPad/desktop performance, regressions and accessibility.",
    areas: ["automated_testing", "browser_compatibility", "performance", "accessibility", "regression_testing"],
    capabilities: ["test_planning", "performance_audits", "compatibility_validation"]
  },
  {
    id: "security-release",
    name: "Security & Release Specialist",
    description: "Dependency review, permission boundaries, release readiness, rollback plans and deployment checks.",
    areas: ["security", "dependencies", "release_readiness", "rollback", "deployment_checks"],
    capabilities: ["security_review", "release_audits", "rollback_planning"]
  }
]);

function requireText(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(field + " is required.");
  }
  return value.trim();
}

function normalizeList(value, field) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error(field + " must be an array.");
  return [...new Set(value.map(item => requireText(item, field)))];
}

export function createSpecialistWorkerRoster(options = {}) {
  const director = options.developmentDirector;
  if (!director || typeof director.createTask !== "function") {
    throw new Error("A valid Development Director is required.");
  }

  const workers = new Map(WORKERS.map(profile => [
    profile.id,
    { profile, enabled: true, submittedCount: 0 }
  ]));

  function getWorker(id) {
    const worker = workers.get(requireText(id, "Worker ID"));
    if (!worker) throw new Error("Unknown specialist worker: " + id);
    return worker;
  }

  function listWorkers(filters = {}) {
    return [...workers.values()]
      .filter(worker => filters.enabled === undefined || worker.enabled === filters.enabled)
      .map(worker => Object.freeze({
        ...worker.profile,
        enabled: worker.enabled,
        submittedCount: worker.submittedCount,
        runnerId: worker.profile.id,
        restrictions: [
          "Creates scoped development tasks only.",
          "No direct repository writes or code execution.",
          "No production deployment or permission changes.",
          "Protected actions require owner approval."
        ]
      }));
  }

  function setWorkerEnabled(id, enabled) {
    const worker = getWorker(id);
    if (typeof enabled !== "boolean") throw new Error("Enabled must be true or false.");
    worker.enabled = enabled;
    return listWorkers().find(item => item.id === id) || {
      ...worker.profile,
      enabled: false,
      submittedCount: worker.submittedCount
    };
  }

  async function submitFinding(workerId, input = {}) {
    const worker = getWorker(workerId);
    if (!worker.enabled) throw new Error("Specialist worker is disabled: " + workerId);

    const title = requireText(input.title, "Finding title");
    const description = requireText(input.description, "Finding description");
    const area = requireText(input.area, "Development area");
    if (!worker.profile.areas.includes(area)) {
      throw new Error("Worker " + workerId + " is not authorized for area: " + area);
    }

    const priority = input.priority || "normal";
    if (!["low", "normal", "high", "critical"].includes(priority)) {
      throw new Error("Invalid task priority.");
    }

    const acceptanceCriteria = normalizeList(input.acceptanceCriteria, "Acceptance criterion");
    const protectedActions = normalizeList(input.protectedActions, "Protected action");
    const policyDecision = evaluateDevelopmentTask({
      title,
      requiresApproval: input.requiresApproval === true,
      protectedActions
    });

    const task = await director.createTask({
      title,
      description,
      area,
      runner: worker.profile.id,
      priority,
      acceptanceCriteria,
      protectedActions,
      requiresApproval: policyDecision.requiresApproval,
      approvalReason: policyDecision.requiresApproval
        ? policyDecision.approvalReasons.map(item => item.reason).join("; ") || "Owner approval requested."
        : null
    });

    worker.submittedCount += 1;
    return {
      workerId,
      workerName: worker.profile.name,
      policyDecision,
      task
    };
  }

  return Object.freeze({
    version: WORKER_ROSTER_VERSION,
    listWorkers,
    setWorkerEnabled,
    submitFinding
  });
}
