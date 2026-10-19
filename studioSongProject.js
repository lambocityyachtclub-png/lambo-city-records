
 // LAMBO CITY RECORDS
// Song Project Foundation V1
// Separate data layer — does not change Beat Lab playback.

const PROJECT_VERSION = 1;

const DEFAULT_SECTIONS = [
  "Intro",
  "Verse",
  "Chorus",
  "Verse 2",
  "Chorus 2",
  "Bridge",
  "Outro"
];

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function copyPattern(pattern) {
  if (!pattern?.steps) {
    throw new Error("A valid Beat Lab pattern is required.");
  }

  const tracks = ["kick", "snare", "hat"];

  for (const track of tracks) {
    if (
      !Array.isArray(pattern.steps[track]) ||
      pattern.steps[track].length !== 16
    ) {
      throw new Error(`Invalid ${track} pattern.`);
    }
  }

  return {
    bpm: Math.max(
      60,
      Math.min(180, Number(pattern.bpm) || 100)
    ),
    steps: Object.fromEntries(
      tracks.map((track) => [
        track,
        pattern.steps[track].map(Boolean)
      ])
    )
  };
}

export function createSongProject({
  title = "Untitled Song",
  ownerId = null,
  pattern,
  soundProfile = "beatLab"
} = {}) {
  const now = new Date().toISOString();
  const savedPattern = pattern
    ? copyPattern(pattern)
    : null;

  const patternId = savedPattern
    ? makeId("pattern")
    : null;

  return {
    schemaVersion: PROJECT_VERSION,

    id: makeId("song"),

    metadata: {
      title,
      ownerId,
      collaborators: [],
      createdAt: now,
      updatedAt: now
    },

    settings: {
      bpm: savedPattern?.bpm ?? 100,
      soundProfile:
        soundProfile === "mpc" ? "mpc" : "beatLab"
    },

    patterns: savedPattern
      ? [{
          id: patternId,
          name: "Main Beat",
          ...savedPattern
        }]
      : [],

    arrangement: {
      sections: DEFAULT_SECTIONS.map((name, index) => ({
        id: makeId("section"),
        name,
        order: index,
        bars: 4,
        clips: []
      }))
    }
  };
}

export function addPatternToProject(project, pattern, name = "New Beat") {
  if (!project || !Array.isArray(project.patterns) || !project.metadata) {
    throw new Error("A valid song project is required.");
  }

  const savedPattern = copyPattern(pattern);

  const entry = {
    id: makeId("pattern"),
    name,
    ...savedPattern
  };

  project.patterns.push(entry);
  project.metadata.updatedAt = new Date().toISOString();

  return entry.id;
}

export function addClipToSection(
  project,
  sectionId,
  patternId,
  startBar = 0,
  lengthBars = 4
) {
  if (
    !project?.arrangement ||
    !Array.isArray(project.arrangement.sections) ||
    !Array.isArray(project.patterns) ||
    !project.metadata
  ) {
    throw new Error("A valid song project is required.");
  }

  const section = project.arrangement.sections.find(
    (item) => item.id === sectionId
  );

  const patternExists = project.patterns.some(
    (item) => item.id === patternId
  );

  if (!section || !patternExists) {
    throw new Error("Section or beat pattern not found.");
  }

  section.clips.push({
    id: makeId("clip"),
    patternId,
    startBar: Math.max(0, Number(startBar) || 0),
    lengthBars: Math.max(1, Number(lengthBars) || 4)
  });

  project.metadata.updatedAt = new Date().toISOString();
}

