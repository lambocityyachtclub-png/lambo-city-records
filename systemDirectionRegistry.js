/**
 * LAMBO CITY — System Direction Registry
 *
 * Purpose:
 * A data-driven, owner-led questionnaire for defining each LAMBO CITY system
 * before implementation or major expansion.
 *
 * This module is intentionally standalone. It does not import into the live
 * game, mutate project files, or grant autonomous code-writing permissions.
 * The owner answers questions; the resulting direction profile becomes the
 * approved specification for that system.
 */

export const SYSTEM_DIRECTION_VERSION = 2;

export const SYSTEM_DIRECTION_DOMAINS = [
  {
    id: "studio",
    name: "LAMBO CITY Studio",
    scope: "EDIT, MIX & MASTER, recording, MPC, Beat Lab, instruments, audio and project workflows",
    order: 1
  },
  {
    id: "world",
    name: "World & Environment",
    scope: "City layout, districts, streets, waterfront, buildings, lighting, atmosphere and world performance",
    order: 2
  },
  {
    id: "player",
    name: "Player, Camera & Navigation",
    scope: "Player movement, camera behavior, touch controls, desktop controls, navigation and accessibility",
    order: 3
  },
  {
    id: "interactions",
    name: "Interaction System",
    scope: "Interactable objects, stations, doors, elevators, menus, prompts and reusable interaction behavior",
    order: 4
  },
  {
    id: "npcs",
    name: "NPCs & Character Behavior",
    scope: "NPC roles, movement, schedules, dialogue, reactions and environmental activity",
    order: 5
  },
  {
    id: "real-estate",
    name: "Digital Real Estate",
    scope: "Properties, interiors, ownership experiences, functional spaces and future property systems",
    order: 6
  },
  {
    id: "entertainment",
    name: "Entertainment & Events",
    scope: "Grand Stage, HERO performances, Jumbotron, event sequences, audience atmosphere and music experiences",
    order: 7
  },
  {
    id: "vehicles",
    name: "Vehicles & Transportation",
    scope: "Cars, yachts, boats, watercraft, vehicle interaction and transportation experiences",
    order: 8
  },
  {
    id: "audio-visual",
    name: "Audio, Visuals & Atmosphere",
    scope: "Original sound, environmental audio, lighting, effects, visual identity and cinematic presentation",
    order: 9
  },
  {
    id: "platform",
    name: "Platform, Performance & Reliability",
    scope: "Loading, modular integration, device compatibility, performance, recovery, testing and deployment",
    order: 10
  },
  {
    id: "development",
    name: "Development & Quality System",
    scope: "Task planning, modular boundaries, automated checks, change isolation, review and release safeguards",
    order: 11
  },
  {
    id: "company-ecosystem",
    name: "Independent Entertainment Company & Business Ecosystem",
    scope: "LAMBO CITY Records parent-company strategy, touring, fashion, brand collaborations, digital platforms, gaming, entertainment IP, partnerships, ownership and cross-division growth",
    order: 12
  }
];

export const SYSTEM_DIRECTION_QUESTIONS = [
  {
    id: "mission",
    title: "Purpose and mission",
    prompt: "What is this system supposed to do, and why does LAMBO CITY need it?",
    guidance: "Describe its core job in your own words. Separate its essential purpose from optional future ideas.",
    required: true
  },
  {
    id: "experience",
    title: "The experience",
    prompt: "What should a person see, feel, and be able to do when they use or encounter this system?",
    guidance: "Describe the ideal experience from the user's point of view, including the first moment they encounter it.",
    required: true
  },
  {
    id: "behavior",
    title: "How it behaves",
    prompt: "How should this system behave from beginning to end?",
    guidance: "Describe the normal workflow, important states, controls, feedback, and what should happen when something goes wrong.",
    required: true
  },
  {
    id: "capabilities",
    title: "Capabilities and features",
    prompt: "What must this system be capable of doing?",
    guidance: "Name the must-have capabilities first. We can record later-phase and optional capabilities separately.",
    required: true
  },
  {
    id: "boundaries",
    title: "Boundaries and non-goals",
    prompt: "What should this system never do, change, or take responsibility for?",
    guidance: "Identify protected features, forbidden scope, decisions that require your approval, and responsibilities belonging to other systems.",
    required: true
  },
  {
    id: "connections",
    title: "Connections to other systems",
    prompt: "Which other LAMBO CITY systems should this one connect to, and what should each connection allow?",
    guidance: "Define what information or actions cross each boundary. Avoid duplicate engines, duplicate project state, and hidden dependencies.",
    required: true
  },
  {
    id: "modularity",
    title: "Modular structure",
    prompt: "What parts should live inside this system's own modular files, and what should remain shared?",
    guidance: "Identify the system's internal modules, shared services it should reuse, and the small public interface other systems should call.",
    required: true
  },
  {
    id: "growth",
    title: "Growth direction",
    prompt: "As this system improves over time, what direction should it keep growing in?",
    guidance: "Describe the long-term ambition and the kinds of improvements that would fit. Growth should happen within approved boundaries, not by rewriting unrelated systems.",
    required: true
  },
  {
    id: "design",
    title: "Design and usability",
    prompt: "What should this system look and feel like, and how should people control it?",
    guidance: "Include visual identity, level of realism, simplicity versus depth, touch-first behavior, and desktop/mouse support where relevant.",
    required: true
  },
  {
    id: "devices",
    title: "Devices and performance",
    prompt: "Which devices must this system support, and what performance standards matter?",
    guidance: "Consider iPad Safari, phones, desktop browsers, memory, loading time, frame rate, audio latency, and graceful fallbacks as relevant.",
    required: true
  },
  {
    id: "reliability",
    title: "Reliability and protection",
    prompt: "What must be saved, recovered, tested, or protected so this system can be trusted?",
    guidance: "Define persistence, recovery, failure handling, compatibility, rollback expectations, and what must never be lost.",
    required: true
  },
  {
    id: "acceptance",
    title: "Definition of done",
    prompt: "What exact results would make you say this system is finished and working correctly?",
    guidance: "Give observable acceptance criteria. Include important workflows that must be tested before a change is considered complete.",
    required: true
  },
  {
    id: "priorities",
    title: "Priorities and phases",
    prompt: "What should be built first, what comes next, and what belongs in a later phase?",
    guidance: "Order the work by importance and dependencies. We will not start lower-priority expansion before its foundations are ready.",
    required: true
  },
  {
    id: "approval",
    title: "Owner approval rules",
    prompt: "Which decisions may the system team make within your direction, and which decisions must come back to you?",
    guidance: "You remain the creative director. Define what can be improved within standing direction and what needs explicit approval.",
    required: true
  }
];

const domainSpecificQuestions = {
  studio: [
    "How should EDIT, MIX & MASTER, recording, MPC, Beat Lab, and instruments divide responsibilities?",
    "Which audio workflows must be shared between the standalone Studio and Floor 2, and which presentation details may differ?",
    "What recording, editing, mixing, mastering, MIDI, export, and project-recovery workflows are essential?"
  ],
  world: [
    "Which existing landmarks, locations, routes, and coordinates are protected?",
    "How should districts and destinations connect into a natural journey?",
    "What level of environmental realism and interactivity is expected in each location?"
  ],
  player: [
    "How should touch swipe, tap, keyboard, mouse, and trackpad controls behave?",
    "When should the camera follow, orbit, lock, or transition?",
    "What movement, collision, comfort, and accessibility rules are non-negotiable?"
  ],
  interactions: [
    "How should an object advertise that it can be interacted with?",
    "How should an interaction open, remain active, close, and restore the player view?",
    "How can new interactables be registered without editing central game files repeatedly?"
  ],
  npcs: [
    "What roles should different NPCs have in the world?",
    "Should NPCs follow schedules, react to the player, converse, or perform contextual activities?",
    "What behavior should remain active when the player is not nearby?"
  ],
  "real-estate": [
    "What makes a property feel like a real, functional digital place?",
    "Which interior systems should be reusable across different properties?",
    "Which ownership, access, customization, or transaction ideas are current-phase versus future-only?"
  ],
  entertainment: [
    "What should a complete event or HERO performance feel like from arrival through finish?",
    "How should stage, Jumbotron, lighting, audio, crowd, and performer systems coordinate?",
    "Which existing stage systems must be reused and protected?"
  ],
  vehicles: [
    "Which vehicles are for viewing, interaction, boarding, driving, or navigation?",
    "What should the boarding, control, camera, physics, and exit experience feel like?",
    "Which vehicle behaviors should be shared and which should be vehicle-specific?"
  ],
  "audio-visual": [
    "What is the approved sound and visual identity for this system?",
    "Which assets must be original, and what external assets or services are prohibited?",
    "How should effects scale down gracefully on iPad and mobile?"
  ],
  platform: [
    "What are the minimum supported devices and browsers?",
    "What loading, recovery, performance, and compatibility guarantees are required?",
    "What checks must pass before a release can replace the last known working version?"
  ],
  development: [
    "How much work may be proposed or implemented without asking you first?",
    "What isolation, testing, review, deployment, and rollback steps are mandatory?",
    "What kinds of changes must always stop for your explicit approval?"
  ],
  "company-ecosystem": [
    "Which independent business capabilities should LAMBO CITY own, operate, or strategically control, and which should begin through partnerships?",
    "How should Records, Touring, Fashion, Digital, Gaming, and Entertainment create opportunities for one another without becoming one fragile, tightly coupled system?",
    "Which business models, brand collaborations, distribution channels, touring operations, and creator relationships fit the LAMBO CITY identity?",
    "What must remain owner-controlled, including intellectual property, masters, brand identity, customer relationships, data, and major commercial decisions?",
    "Which opportunities belong in the current phase, which require operational or financial readiness, and which are long-term ambitions?",
    "What measurable evidence would show that each division is building a durable independent business?"
  ]
};

export function createDirectionProfile(domainId) {
  const domain = SYSTEM_DIRECTION_DOMAINS.find(item => item.id === domainId);
  if (!domain) throw new Error(`Unknown LAMBO CITY system: ${domainId}`);

  return {
    schema: "lambo-city-system-direction",
    version: SYSTEM_DIRECTION_VERSION,
    system: { id: domain.id, name: domain.name, scope: domain.scope },
    status: "in-discovery",
    answers: {},
    domainQuestions: domainSpecificQuestions[domainId] || [],
    approvedAt: null,
    updatedAt: null
  };
}

export function getNextDirectionQuestion(profile) {
  if (!profile || !profile.answers) throw new Error("A valid direction profile is required.");
  return SYSTEM_DIRECTION_QUESTIONS.find(question => {
    const answer = profile.answers[question.id];
    return question.required && !(typeof answer === "string" && answer.trim());
  }) || null;
}

export function recordDirectionAnswer(profile, questionId, answer) {
  if (!profile || !profile.answers) throw new Error("A valid direction profile is required.");
  const question = SYSTEM_DIRECTION_QUESTIONS.find(item => item.id === questionId);
  if (!question) throw new Error(`Unknown direction question: ${questionId}`);
  if (typeof answer !== "string" || !answer.trim()) {
    throw new Error("Direction answers must be non-empty text. Use an explicit 'not decided yet' answer when needed.");
  }

  return {
    ...profile,
    status: "in-discovery",
    answers: { ...profile.answers, [questionId]: answer.trim() },
    updatedAt: new Date().toISOString()
  };
}

export function getDirectionProgress(profile) {
  const answered = SYSTEM_DIRECTION_QUESTIONS.filter(question => {
    const value = profile?.answers?.[question.id];
    return typeof value === "string" && value.trim();
  }).length;
  return {
    answered,
    total: SYSTEM_DIRECTION_QUESTIONS.filter(question => question.required).length,
    nextQuestion: getNextDirectionQuestion(profile)
  };
}

export function validateDirectionProfile(profile) {
  const missing = SYSTEM_DIRECTION_QUESTIONS
    .filter(question => question.required)
    .filter(question => {
      const value = profile?.answers?.[question.id];
      return !(typeof value === "string" && value.trim());
    })
    .map(question => question.id);

  return { valid: missing.length === 0, missing };
}

export function approveDirectionProfile(profile) {
  const validation = validateDirectionProfile(profile);
  if (!validation.valid) {
    throw new Error(`Cannot approve an incomplete direction profile. Missing: ${validation.missing.join(", ")}`);
  }

  return {
    ...profile,
    status: "approved",
    approvedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function exportDirectionProfile(profile) {
  return JSON.stringify(profile, null, 2);
}
