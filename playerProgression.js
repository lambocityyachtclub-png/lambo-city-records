const STORAGE_KEY = "lambocity-player-progression-v1";
const ACTIVE_PERFORMANCE_STATES = new Set(["ENTERING", "PERFORMING", "EXITING"]);
const STARTING_PERFORMANCE_STATES = new Set(["WAITING_FOR_AUDIO"]);

let progress = {
  version: 1,
  heroPerformanceComplete: false,
  studioInvitationUnlocked: false
};
let lastPerformanceState = "IDLE";
let lastPublishedSnapshot = "";

function normalizeProgress(value) {
  const complete = value?.heroPerformanceComplete === true;
  return {
    version: 1,
    heroPerformanceComplete: complete,
    studioInvitationUnlocked: complete || value?.studioInvitationUnlocked === true
  };
}

function loadProgress() {
  try {
    const raw = globalThis.window?.localStorage?.getItem(STORAGE_KEY);
    return raw ? normalizeProgress(JSON.parse(raw)) : normalizeProgress(null);
  } catch {
    return normalizeProgress(null);
  }
}

function saveProgress() {
  try {
    globalThis.window?.localStorage?.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Progress remains available for the current session if storage is blocked.
  }
}

function makeSnapshot() {
  if (progress.studioInvitationUnlocked && !progress.heroPerformanceComplete) {
    return Object.freeze({
      version: 1,
      stage: "studio-invitation",
      studioInvitationUnlocked: true,
      eyebrow: "NEW MESSAGE FROM HERO",
      title: "CHECK YOUR CITY PHONE",
      detail: "HERO has your Studio invitation. Open your in-game phone whenever you're ready.",
      completed: false
    });
  }

  if (progress.studioInvitationUnlocked) {
    return Object.freeze({
      version: 1,
      stage: "studio-invitation",
      studioInvitationUnlocked: true,
      eyebrow: "MILESTONE COMPLETE",
      title: "STUDIO INVITATION UNLOCKED",
      detail: "HERO's performance is complete. Visit Records HQ and take the elevator to Floor 2 to begin your music journey.",
      completed: true
    });
  }

  if (ACTIVE_PERFORMANCE_STATES.has(lastPerformanceState)) {
    return Object.freeze({
      version: 1,
      stage: "hero-performance",
      studioInvitationUnlocked: false,
      eyebrow: "LIVE EVENT IN PROGRESS",
      title: "EXPERIENCE HERO'S PERFORMANCE",
      detail: "Your invitation will arrive on your city phone once the performance begins.",
      completed: false
    });
  }

  if (STARTING_PERFORMANCE_STATES.has(lastPerformanceState)) {
    return Object.freeze({
      version: 1,
      stage: "hero-performance",
      studioInvitationUnlocked: false,
      eyebrow: "YOUR FIRST MILESTONE",
      title: "HERO'S PERFORMANCE IS STARTING",
      detail: "Stay near the waterfront stage while the live performance begins.",
      completed: false
    });
  }

  return Object.freeze({
    version: 1,
    stage: "reach-stage",
    studioInvitationUnlocked: false,
    eyebrow: "YOUR FIRST MILESTONE",
    title: "HEAD TO THE MAIN STAGE",
    detail: "Explore the waterfront and walk toward the main stage. HERO's live performance is your first major city milestone.",
    completed: false
  });
}

function dispatch(name, detail) {
  const target = globalThis.window;
  if (!target?.dispatchEvent) return;
  const event = typeof CustomEvent === "function"
    ? new CustomEvent(name, { detail })
    : { type: name, detail };
  target.dispatchEvent(event);
}

function publish(force = false) {
  const snapshot = makeSnapshot();
  const signature = JSON.stringify(snapshot);
  if (!force && signature === lastPublishedSnapshot) return snapshot;

  lastPublishedSnapshot = signature;
  if (globalThis.window) {
    globalThis.window.__lamboCityProgressionSnapshot = snapshot;
    globalThis.window.__lamboCityStudioInvitationUnlocked = progress.studioInvitationUnlocked;
    globalThis.window.__lamboCityProgressionState = Object.freeze({
      version: progress.version,
      heroPerformanceComplete: progress.heroPerformanceComplete,
      studioInvitationUnlocked: progress.studioInvitationUnlocked
    });
  }
  dispatch("lc-progression-update", snapshot);
  return snapshot;
}

const PlayerProgression = {
  init() {
    progress = loadProgress();
    lastPerformanceState = "IDLE";
    lastPublishedSnapshot = "";
    publish(true);
  },

  update(_delta, context) {
    const state = context?.systems?.heroPerformance?.getState?.() || "IDLE";
    lastPerformanceState = String(state).toUpperCase();

    const wasInvitationUnlocked = progress.studioInvitationUnlocked;
    const wasPerformanceComplete = progress.heroPerformanceComplete;

    if (ACTIVE_PERFORMANCE_STATES.has(lastPerformanceState)) {
      progress.studioInvitationUnlocked = true;
    }
    if (lastPerformanceState === "COMPLETE") {
      progress.heroPerformanceComplete = true;
      progress.studioInvitationUnlocked = true;
    }

    if (
      wasInvitationUnlocked !== progress.studioInvitationUnlocked ||
      wasPerformanceComplete !== progress.heroPerformanceComplete
    ) {
      saveProgress();
    }

    if (!wasInvitationUnlocked && progress.studioInvitationUnlocked) {
      dispatch("lc-studio-invitation-unlocked", Object.freeze({
        source: "hero-performance",
        milestone: "studio-invitation",
        triggerState: lastPerformanceState,
        version: 1
      }));
    }

    publish();
  },

  getSnapshot() {
    return makeSnapshot();
  },

  isStudioInvitationUnlocked() {
    return progress.studioInvitationUnlocked;
  }
};

export default PlayerProgression;
