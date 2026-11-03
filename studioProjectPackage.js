
// LAMBO CITY RECORDS
// Portable Song Project Package V1
// Standalone project packaging — independent of Three.js and browser storage.
//
// Supported project data:
// - Project metadata and settings
// - All saved beat patterns
// - Arrangement sections
// - Arrangement clips and pattern references
//
// This module does not change Beat Lab playback or localStorage.

const PACKAGE_FORMAT = "lambo-city-project";
const PACKAGE_VERSION = 1;
const PROJECT_SCHEMA_VERSION = 1;

const REQUIRED_TRACKS = ["kick", "snare", "hat"];

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function requireObject(value, message) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error(message);
  }
}

function requireId(value, message) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(message);
  }
}

function validateProject(project) {
  requireObject(
    project,
    "Invalid LAMBO CITY song project."
  );

  if (project.schemaVersion !== PROJECT_SCHEMA_VERSION) {
    throw new Error(
      "Unsupported song-project schema version."
    );
  }

  requireId(project.id, "Project ID is missing.");

  requireObject(
    project.metadata,
    "Project metadata is missing."
  );

  if (typeof project.metadata.title !== "string") {
    throw new Error("Project title is invalid.");
  }

  requireObject(
    project.settings,
    "Project settings are missing."
  );

  if (
    !Number.isFinite(Number(project.settings.bpm)) ||
    Number(project.settings.bpm) < 60 ||
    Number(project.settings.bpm) > 180
  ) {
    throw new Error("Project BPM is invalid.");
  }

  if (
    !["beatLab", "mpc"].includes(
      project.settings.soundProfile
    )
  ) {
    throw new Error("Project sound profile is invalid.");
  }

  if (!Array.isArray(project.patterns)) {
    throw new Error("Project patterns are invalid.");
  }

  if (
    !project.arrangement ||
    !Array.isArray(project.arrangement.sections)
  ) {
    throw new Error("Project arrangement is invalid.");
  }

  const patternIds = new Set();

  for (const pattern of project.patterns) {
    requireObject(pattern, "Invalid beat pattern.");

    requireId(pattern.id, "Beat pattern ID is missing.");

    if (patternIds.has(pattern.id)) {
      throw new Error("Duplicate beat pattern ID.");
    }

    patternIds.add(pattern.id);

    if (typeof pattern.name !== "string") {
      throw new Error("Beat pattern name is invalid.");
    }

    if (
      !Number.isFinite(Number(pattern.bpm)) ||
      Number(pattern.bpm) < 60 ||
      Number(pattern.bpm) > 180
    ) {
      throw new Error("Beat pattern BPM is invalid.");
    }

    requireObject(
      pattern.steps,
      "Beat pattern steps are missing."
    );

    for (const track of REQUIRED_TRACKS) {
      const steps = pattern.steps[track];

      if (
        !Array.isArray(steps) ||
        steps.length !== 16 ||
        !steps.every((step) => typeof step === "boolean")
      ) {
        throw new Error(
          `Invalid ${track} steps in beat pattern.`
        );
      }
    }
  }

  const sectionIds = new Set();
  const clipIds = new Set();

  for (const section of project.arrangement.sections) {
    requireObject(section, "Invalid arrangement section.");

    requireId(section.id, "Arrangement section ID is missing.");

    if (sectionIds.has(section.id)) {
      throw new Error("Duplicate arrangement section ID.");
    }

    sectionIds.add(section.id);

    if (typeof section.name !== "string") {
      throw new Error("Arrangement section name is invalid.");
    }

    if (
      !Number.isInteger(section.order) ||
      !Number.isFinite(section.bars) ||
      section.bars < 1
    ) {
      throw new Error("Arrangement section settings are invalid.");
    }

    if (!Array.isArray(section.clips)) {
      throw new Error("Arrangement clips are invalid.");
    }

    for (const clip of section.clips) {
      requireObject(clip, "Invalid arrangement clip.");

      requireId(clip.id, "Arrangement clip ID is missing.");

      if (clipIds.has(clip.id)) {
        throw new Error("Duplicate arrangement clip ID.");
      }

      clipIds.add(clip.id);

      requireId(clip.patternId, "Clip pattern reference is missing.");

      if (!patternIds.has(clip.patternId)) {
        throw new Error(
          "An arrangement clip references a missing beat pattern."
        );
      }

      if (
        !Number.isFinite(clip.startBar) ||
        clip.startBar < 0 ||
        !Number.isFinite(clip.lengthBars) ||
        clip.lengthBars < 1
      ) {
        throw new Error("Arrangement clip timing is invalid.");
      }
    }
  }

  if (project.mpcPerformance !== undefined) {
    requireObject(project.mpcPerformance, "MPC performance data is invalid.");
    const performance = project.mpcPerformance;
    if (!Array.isArray(performance.events) || performance.events.length > 12000) {
      throw new Error("MPC performance events are invalid.");
    }
    if (!Number.isFinite(Number(performance.duration)) || Number(performance.duration) < 0) {
      throw new Error("MPC performance duration is invalid.");
    }
    const soundFamilies = ["kick", "bass", "snare", "clap", "hat", "perc", "chop", "stab", "fx"];
    for (const event of performance.events) {
      requireObject(event, "Invalid MPC pad event.");
      if (!Number.isInteger(event.pad) || event.pad < 1 || event.pad > 16) {
        throw new Error("MPC pad number is invalid.");
      }
      if (!["A", "B", "C", "D"].includes(event.bank)) {
        throw new Error("MPC pad bank is invalid.");
      }
      requireId(event.soundId, "MPC sound reference is missing.");
      if (!Number.isFinite(event.at) || event.at < 0) {
        throw new Error("MPC pad event timing is invalid.");
      }
      if (event.sampleId !== undefined && event.sampleId !== null) {
        requireId(event.sampleId, "MPC sample reference is invalid.");
      }
      if (event.velocity !== undefined && (!Number.isFinite(Number(event.velocity)) || Number(event.velocity) < 0 || Number(event.velocity) > 1.5)) {
        throw new Error("MPC pad velocity is invalid.");
      }
      if (event.sampleSettings !== undefined && event.sampleSettings !== null) {
        requireObject(event.sampleSettings, "MPC sample settings are invalid.");
        for (const field of ["start", "end", "pitch", "decay", "volume", "pan"]) {
          if (event.sampleSettings[field] !== undefined && !Number.isFinite(Number(event.sampleSettings[field]))) {
            throw new Error("MPC sample settings are invalid.");
          }
        }
      }
      if (event.sound !== undefined && event.sound !== null) {
        requireObject(event.sound, "MPC sound preset data is invalid.");
        requireId(event.sound.id, "MPC sound preset ID is missing.");
        requireId(event.sound.name, "MPC sound preset name is missing.");
        if (event.sound.id !== event.soundId || !soundFamilies.includes(event.sound.family)) {
          throw new Error("MPC sound preset reference is invalid.");
        }
        for (const field of ["frequency", "decay", "brightness", "seed"]) {
          if (!Number.isFinite(Number(event.sound[field]))) {
            throw new Error("MPC sound preset settings are invalid.");
          }
        }
      }
    }
  }

  if (project.dawSession !== undefined) {
    requireObject(project.dawSession, "DAW session data is invalid.");
    const session = project.dawSession;
    if (session.format !== "lambo-city-daw-session" || session.version !== 1 ||
        !Number.isFinite(Number(session.tempo)) || Number(session.tempo) < 60 ||
        Number(session.tempo) > 180 || !Array.isArray(session.tracks) ||
        session.tracks.length > 64) {
      throw new Error("DAW session settings are invalid.");
    }
    const trackIds = new Set();
    const clipIds = new Set();
    let totalAudioBytes = 0;
    for (const track of session.tracks) {
      requireObject(track, "Invalid DAW track.");
      requireId(track.id, "DAW track ID is missing.");
      requireId(track.name, "DAW track name is missing.");
      if (trackIds.has(track.id) || !["audio", "midi", "instrument"].includes(track.type) ||
          !Number.isFinite(Number(track.volume)) || Number(track.volume) < 0 || Number(track.volume) > 100 ||
          !Number.isFinite(Number(track.pan)) || Number(track.pan) < -1 || Number(track.pan) > 1 ||
          !Array.isArray(track.clips) || track.clips.length > 256) {
        throw new Error("DAW track settings are invalid.");
      }
      trackIds.add(track.id);
      for (const clip of track.clips) {
        requireObject(clip, "Invalid DAW audio clip.");
        requireId(clip.id, "DAW clip ID is missing.");
        requireId(clip.name, "DAW clip name is missing.");
        if (clipIds.has(clip.id) || typeof clip.data !== "string" ||
            !Number.isFinite(Number(clip.startBar)) || Number(clip.startBar) < 1 ||
            !Number.isFinite(Number(clip.lengthBars)) || Number(clip.lengthBars) < 1 ||
            typeof clip.mimeType !== "string") {
          throw new Error("DAW audio clip data is invalid.");
        }
        clipIds.add(clip.id);
        totalAudioBytes += Math.floor(clip.data.length * 3 / 4);
        if (totalAudioBytes > 48000000) {
          throw new Error("DAW session audio exceeds the 48 MB portable limit.");
        }
      }
    }
  }

  if (project.mpcSamplerState !== undefined) {
    requireObject(project.mpcSamplerState, "MPC pad state is invalid.");
    if (project.mpcSamplerState.assignments !== undefined) requireObject(project.mpcSamplerState.assignments, "MPC sample assignments are invalid.");
    if (project.mpcSamplerState.padSettings !== undefined) requireObject(project.mpcSamplerState.padSettings, "MPC pad settings are invalid.");
  }
  if (project.mpcLibraryAssignments !== undefined) {
    requireObject(project.mpcLibraryAssignments, "MPC sound assignments are invalid.");
  }
  if (project.mpcLibrarySounds !== undefined) {
    if (!Array.isArray(project.mpcLibrarySounds) || project.mpcLibrarySounds.length > 320) {
      throw new Error("MPC preset sound definitions are invalid.");
    }
    const soundIds = new Set();
    for (const sound of project.mpcLibrarySounds) {
      requireObject(sound, "Invalid MPC preset sound.");
      requireId(sound.id, "MPC preset sound ID is missing.");
      requireId(sound.name, "MPC preset sound name is missing.");
      if (soundIds.has(sound.id) || !["kick", "bass", "snare", "clap", "hat", "perc", "chop", "stab", "fx"].includes(sound.family)) {
        throw new Error("MPC preset sound definition is invalid.");
      }
      soundIds.add(sound.id);
      for (const field of ["seed", "frequency", "decay", "brightness"]) {
        if (!Number.isFinite(Number(sound[field]))) throw new Error("MPC preset sound settings are invalid.");
      }
    }
  }

  const hasMpcSampleReferences = (project.mpcPerformance?.events || []).some(event => event.sampleId)
    || Object.keys(project.mpcSamplerState?.assignments || {}).length > 0;
  if (hasMpcSampleReferences && project.mpcAssets === undefined) {
    throw new Error("This MPC project references imported samples but does not include the audio assets.");
  }

  if (project.mpcAssets !== undefined) {
    if (!Array.isArray(project.mpcAssets) || project.mpcAssets.length > 256) {
      throw new Error("MPC sample assets are invalid.");
    }
    const assetIds = new Set();
    let encodedBytes = 0;
    for (const asset of project.mpcAssets) {
      requireObject(asset, "Invalid MPC sample asset.");
      requireId(asset.id, "MPC sample asset ID is missing.");
      requireId(asset.name, "MPC sample asset name is missing.");
      if (typeof asset.data !== "string" || asset.data.length > 54000000) {
        throw new Error("MPC sample asset data is invalid.");
      }
      if (assetIds.has(asset.id)) throw new Error("Duplicate MPC sample asset.");
      assetIds.add(asset.id);
      encodedBytes += asset.data.length;
      if (encodedBytes > 54000000) throw new Error("MPC sample assets exceed the portable project limit.");
    }
    for (const event of project.mpcPerformance?.events || []) {
      if (event.sampleId && !assetIds.has(event.sampleId)) {
        throw new Error("An MPC pad event references a sample that is missing from this project package.");
      }
    }
    for (const sampleId of Object.values(project.mpcSamplerState?.assignments || {})) {
      if (!assetIds.has(sampleId)) throw new Error("An MPC pad assignment references a sample that is missing from this project package.");
    }
  }

  return project;
}

// Create a versioned portable project package.
export function createSongProjectPackage(project) {
  validateProject(project);

  return {
    format: PACKAGE_FORMAT,
    packageVersion: PACKAGE_VERSION,
    exportedAt: new Date().toISOString(),
    project: cloneData(project)
  };
}

// Convert a project into portable JSON text.
// The .lcp extension will be used when download support is connected.
export function exportSongProjectPackage(project) {
  const packageData = createSongProjectPackage(project);

  return JSON.stringify(packageData, null, 2);
}

// Validate and import a portable project package.
// Accepts either JSON text or an already parsed object.
export function importSongProjectPackage(input) {
  let packageData;

  try {
    packageData =
      typeof input === "string"
        ? JSON.parse(input)
        : cloneData(input);
  } catch {
    throw new Error(
      "The LAMBO CITY project file contains invalid JSON."
    );
  }

  requireObject(
    packageData,
    "Invalid LAMBO CITY project package."
  );

  if (packageData.format !== PACKAGE_FORMAT) {
    throw new Error(
      "This file is not a LAMBO CITY project package."
    );
  }

  if (packageData.packageVersion !== PACKAGE_VERSION) {
    throw new Error(
      "This LAMBO CITY project package version is not supported."
    );
  }

  validateProject(packageData.project);

  // Return an independent copy.
  // No existing saved project is modified here.
  return cloneData(packageData.project);
}

// Expose the supported package version to other modules.
export function getSongProjectPackageVersion() {
  return PACKAGE_VERSION;
}

