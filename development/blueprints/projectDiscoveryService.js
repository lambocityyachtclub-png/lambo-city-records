/**
 * LAMBO CITY — ALIVE Project Discovery Service
 *
 * Runs the repository's existing read-only blueprint scanner on demand and
 * returns a bounded metadata report. It never writes files or creates tasks.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { discoverBlueprints } from "./discoverBlueprints.mjs";

export const PROJECT_DISCOVERY_VERSION = "1.0.0";

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

function requireDirectory(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("A project root directory is required.");
  }
  return path.resolve(value);
}

function createPublicReport(result, maxUnresolvedReferences) {
  return Object.freeze({
    schemaVersion: result.schemaVersion,
    generatedAt: result.generatedAt,
    status: "discovery-only",
    master: Object.freeze({
      id: result.master.id,
      title: result.master.title,
      status: result.master.status,
      discoveredSourceFiles: [...result.master.discoveredSourceFiles]
    }),
    summary: Object.freeze({ ...result.summary }),
    dependencyGraph: Object.freeze({
      summary: Object.freeze({ ...result.dependencyGraph.summary }),
      rootEntrypoints: [...result.dependencyGraph.rootEntrypoints],
      unresolvedLocalReferences: result.dependencyGraph.edges
        .filter(edge => edge.status === "unresolved-local")
        .slice(0, maxUnresolvedReferences)
        .map(edge => Object.freeze({
          from: edge.from,
          specifier: edge.specifier
        })),
      limitations: [...result.dependencyGraph.limitations]
    }),
    departments: result.departments.map(department => Object.freeze({
      id: department.id,
      title: department.title,
      status: department.status,
      specialistIds: [...department.specialistIds],
      sourceFiles: [...department.sourceFiles],
      testFiles: [...department.testFiles],
      documentationFiles: [...department.documentationFiles],
      configurationFiles: [...department.configurationFiles],
      runtimeConnectedSourceFiles: [...department.runtimeConnectedSourceFiles],
      notStaticallyReachableSourceFiles: [...department.notStaticallyReachableSourceFiles],
      keywordEvidenceFiles: [...department.keywordEvidenceFiles],
      notes: [...department.notes]
    })),
    safety: Object.freeze({
      readOnly: true,
      sourceFilesModified: false,
      tasksCreated: false,
      rawFileContentsReturned: false,
      privateQueueAndEnvironmentPathsExcluded: true
    })
  });
}

export function createProjectDiscoveryService(options = {}) {
  const rootDir = requireDirectory(options.rootDir || process.cwd());
  const catalogRelativePath = options.catalogPath || "development/blueprints/departmentCatalog.json";
  if (typeof catalogRelativePath !== "string" || !catalogRelativePath.trim() || path.isAbsolute(catalogRelativePath)) {
    throw new Error("A safe relative department catalog path is required.");
  }

  const catalogPath = path.resolve(rootDir, catalogRelativePath);
  if (!isInside(rootDir, catalogPath)) {
    throw new Error("Department catalog path must remain inside the project root.");
  }

  const maxUnresolvedReferences = options.maxUnresolvedReferences ?? 50;
  if (!Number.isInteger(maxUnresolvedReferences) || maxUnresolvedReferences < 0 || maxUnresolvedReferences > 200) {
    throw new Error("maxUnresolvedReferences must be between 0 and 200.");
  }

  let enabled = true;
  let running = false;
  let lastReport = null;
  let lastError = null;

  async function scan() {
    if (!enabled) throw new Error("ALIVE Project Discovery is disabled.");
    if (running) throw new Error("An ALIVE project discovery scan is already running.");

    running = true;
    lastError = null;
    try {
      const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));
      const result = await discoverBlueprints({ rootDir, catalog });
      lastReport = createPublicReport(result, maxUnresolvedReferences);
      return lastReport;
    } catch (error) {
      lastError = error.message;
      throw error;
    } finally {
      running = false;
    }
  }

  function setEnabled(value) {
    if (typeof value !== "boolean") throw new Error("Enabled state must be true or false.");
    enabled = value;
    return getSnapshot();
  }

  function getSnapshot() {
    return Object.freeze({
      version: PROJECT_DISCOVERY_VERSION,
      configured: true,
      enabled,
      running,
      rootConfigured: true,
      lastScanAt: lastReport?.generatedAt || null,
      lastScanStatus: lastReport?.status || null,
      lastError
    });
  }

  return Object.freeze({ scan, setEnabled, getSnapshot });
}
