import { randomBytes } from "node:crypto";

const TASK_ID = /^[a-z0-9][a-z0-9-]{2,63}$/;

export function createOwnerVisionTask(vision, options = {}) {
  if (typeof vision !== "string" || !vision.trim()) {
    throw new Error("Owner vision is required.");
  }
  const normalizedVision = vision.trim();
  if (normalizedVision.length > 8000) {
    throw new Error("Your vision is too long. Keep it under 8,000 characters.");
  }

  const generatedId = options.id ||
    "owner-vision-" + (options.now || Date.now()).toString(36) + "-" + randomBytes(5).toString("hex");
  if (typeof generatedId !== "string" || !TASK_ID.test(generatedId)) {
    throw new Error("The generated vision task ID is invalid.");
  }

  return Object.freeze({
    id: generatedId,
    workerId: "vision-planning",
    title: "Turn owner direction into a dependency-aware LAMBO CITY plan",
    vision: normalizedVision,
    acceptanceCriteria: [
      "Create a structured, machine-readable plan under development/planning/ with separate launch, foundation, future, and blocked lanes.",
      "For each proposed task, identify the authorized specialist, area, acceptance criteria, and explicit dependencies; reject missing or cyclic dependencies.",
      "Keep future and blocked items out of the executable task queue. Do not create Director tasks merely because a plan was generated.",
      "Preserve the balanced Create (Studio), Experience (World), and Earn (Commerce) strategy; prioritize LAMBO CITY-owned products before any creator marketplace or seller-payout system.",
      "Treat the raw owner vision as private input. Do not quote or copy it into public PR descriptions, commit messages, code comments, tests, or public documentation; include only a minimal sanitized implementation summary and exclude personal or confidential details.",
      "Preserve approved Studio interface designs, modular architecture, lazy loading, and existing production behavior.",
      "Do not edit live runtime wiring, authentication, payments, secrets, deployment settings, or production branches."
    ],
    priority: "high",
    referenceFiles: [
      "development/engine/visionIntakePlanner.js",
      "development/engine/specialistWorkerRoster.js",
      "docs/LAMBO_CITY_ALIVE_AUTONOMOUS_WORKFORCE.md"
    ]
  });
}
