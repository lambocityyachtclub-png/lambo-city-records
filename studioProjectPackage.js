
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

