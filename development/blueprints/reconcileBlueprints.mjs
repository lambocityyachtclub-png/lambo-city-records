import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const STATUSES = new Set(["present", "partial", "planned", "future", "blocked", "conflict"]);
const VERIFICATION = new Set([
  "source-reviewed",
  "automated-tests-passed",
  "runtime-not-verified",
  "owner-decision-required",
  "not-started"
]);
const CONFIDENCE = new Set(["low", "medium", "high"]);
const SOURCE_ROLES = new Set([
  "owner-direction",
  "architecture-direction",
  "implementation",
  "automated-test",
  "release-record"
]);
const PRIVATE_PATH = /(^|\/)(?:\.env(?:\.|$)|queue|private[-_]?queue|secrets?|credentials?)(?:\/|$)/i;

function assertString(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(label + " must be a non-empty string.");
  }
}

function validateRecord(record, index) {
  const label = "records[" + index + "]";
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    throw new Error(label + " must be an object.");
  }
  for (const key of ["id", "departmentId", "title", "statement", "interpretation"]) {
    assertString(record[key], label + "." + key);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.id)) {
    throw new Error(label + ".id is not a stable kebab-case identifier.");
  }
  if (!["master", "department"].includes(record.scope)) {
    throw new Error(label + ".scope is invalid.");
  }
  if (record.scope === "master" && record.departmentId !== "master") {
    throw new Error(label + " master scope must use departmentId 'master'.");
  }
  if (record.scope === "department" && record.departmentId === "master") {
    throw new Error(label + " department scope requires a department id.");
  }
  if (!STATUSES.has(record.implementationStatus)) {
    throw new Error(label + ".implementationStatus is invalid.");
  }
  if (!VERIFICATION.has(record.verificationStatus)) {
    throw new Error(label + ".verificationStatus is invalid.");
  }
  if (!CONFIDENCE.has(record.confidence)) {
    throw new Error(label + ".confidence is invalid.");
  }
  if (!Array.isArray(record.sources) || record.sources.length === 0) {
    throw new Error(label + " must preserve at least one source reference.");
  }
  for (const [sourceIndex, source] of record.sources.entries()) {
    assertString(source.path, label + ".sources[" + sourceIndex + "].path");
    assertString(source.locator, label + ".sources[" + sourceIndex + "].locator");
    if (PRIVATE_PATH.test(source.path) || source.path.startsWith("/")) {
      throw new Error(label + " contains a prohibited or non-relative source path.");
    }
    if (!SOURCE_ROLES.has(source.role)) {
      throw new Error(label + " contains an invalid source role.");
    }
  }
  for (const key of ["dependencies", "openQuestions"]) {
    if (!Array.isArray(record[key]) || record[key].some(item => typeof item !== "string")) {
      throw new Error(label + "." + key + " must be an array of strings.");
    }
  }
  if (record.implementationStatus === "conflict" &&
      record.verificationStatus !== "owner-decision-required") {
    throw new Error(label + " conflicts must remain owner-decision-required.");
  }
  if (record.implementationStatus === "present" &&
      record.verificationStatus !== "automated-tests-passed") {
    throw new Error(label + " cannot claim present/verified without automated test evidence.");
  }
  if (record.verificationStatus === "automated-tests-passed" &&
      !record.sources.some(source => source.role === "automated-test")) {
    throw new Error(label + " claims passing tests without a test source reference.");
  }
}

export function reconcileBlueprintRegister(register, catalog, options = {}) {
  if (!register || register.schemaVersion !== 1 ||
      register.system !== "lambo-city-blueprint-reconciliation" ||
      register.status !== "reconciliation-draft") {
    throw new Error("A version 1 reconciliation-draft register is required.");
  }
  if (!register.policy || register.policy.noAutomaticPromotion !== true ||
      register.policy.noTaskCreation !== true ||
      register.policy.ownerApprovalRequiredForBlueprintAuthority !== true) {
    throw new Error("The reconciliation safety policy must remain fail-closed.");
  }
  if (!catalog || catalog.schemaVersion !== 1 || !Array.isArray(catalog.departments)) {
    throw new Error("A version 1 department catalog is required.");
  }

  const departmentIds = new Set(catalog.departments.map(item => item.id));
  const ids = new Set();
  const records = register.records || [];
  if (!Array.isArray(records)) throw new Error("records must be an array.");

  records.forEach((record, index) => {
    validateRecord(record, index);
    if (ids.has(record.id)) throw new Error("Duplicate reconciliation record id: " + record.id);
    ids.add(record.id);
    if (record.scope === "department" && !departmentIds.has(record.departmentId)) {
      throw new Error("Unknown department id in record " + record.id + ": " + record.departmentId);
    }
  });

  const expectedSourceExists = options.sourceExists;
  const missingSources = [];
  if (typeof expectedSourceExists === "function") {
    for (const record of records) {
      for (const source of record.sources) {
        if (!expectedSourceExists(source.path)) {
          missingSources.push({ recordId: record.id, path: source.path });
        }
      }
    }
  }

  const byDepartment = new Map();
  for (const department of catalog.departments) {
    byDepartment.set(department.id, {
      id: department.id,
      title: department.title,
      records: records.filter(record => record.departmentId === department.id)
    });
  }
  const masterRecords = records.filter(record => record.departmentId === "master");
  const conflicts = records
    .filter(record => record.implementationStatus === "conflict")
    .map(record => ({
      id: record.id,
      title: record.title,
      statement: record.statement,
      interpretation: record.interpretation,
      sources: record.sources,
      openQuestions: record.openQuestions
    }));

  return {
    schemaVersion: 1,
    status: "reconciliation-draft",
    generatedAt: options.generatedAt || new Date().toISOString(),
    summary: {
      totalRecords: records.length,
      masterRecords: masterRecords.length,
      departmentsCovered: [...byDepartment.values()].filter(item => item.records.length > 0).length,
      present: records.filter(item => item.implementationStatus === "present").length,
      partial: records.filter(item => item.implementationStatus === "partial").length,
      planned: records.filter(item => item.implementationStatus === "planned").length,
      future: records.filter(item => item.implementationStatus === "future").length,
      blocked: records.filter(item => item.implementationStatus === "blocked").length,
      conflicts: conflicts.length,
      missingSources: missingSources.length
    },
    master: { id: "master", records: masterRecords },
    departments: [...byDepartment.values()],
    conflicts,
    missingSources,
    safety: {
      sourceDocumentsWereModified: false,
      developmentTasksCreated: false,
      ownerApprovalRequiredBeforeAuthority: true,
      discoveryEvidenceAutomaticallyPromoted: false
    }
  };
}

export function renderReconciliationReport(result) {
  const lines = [
    "# LAMBO CITY ALIVE — Blueprint Reconciliation Draft",
    "",
    "> This is a source-linked reconciliation draft. It does not replace owner-authored documents, certify runtime behavior, approve requirements, or create development tasks.",
    "",
    "## Summary",
    "",
    "- Records: " + result.summary.totalRecords,
    "- Departments with records: " + result.summary.departmentsCovered,
    "- Source-present: " + result.summary.present,
    "- Partial: " + result.summary.partial,
    "- Planned: " + result.summary.planned,
    "- Future: " + result.summary.future,
    "- Blocked: " + result.summary.blocked,
    "- Conflicts requiring review: " + result.summary.conflicts,
    "- Missing source references: " + result.summary.missingSources,
    "",
    "## Master Blueprint reconciliation",
    ""
  ];
  for (const record of result.master.records) {
    lines.push("### " + record.title, "");
    lines.push("- Status: " + record.implementationStatus);
    lines.push("- Verification: " + record.verificationStatus);
    lines.push("- Confidence: " + record.confidence);
    lines.push("- Statement: " + record.statement);
    lines.push("- Interpretation: " + record.interpretation);
    lines.push("- Sources: " + record.sources.map(source => source.path + " (" + source.locator + ")").join("; "));
    if (record.openQuestions.length) lines.push("- Open questions: " + record.openQuestions.join("; "));
    lines.push("");
  }
  lines.push("## Department reconciliation", "");
  for (const department of result.departments) {
    lines.push("### " + department.title, "");
    if (!department.records.length) {
      lines.push("- No authored reconciliation records yet. Discovery matches remain unverified candidates.", "");
      continue;
    }
    for (const record of department.records) {
      lines.push("- **" + record.title + "** — " + record.implementationStatus +
        " / " + record.verificationStatus + " (" + record.confidence + " confidence)");
      lines.push("  - " + record.interpretation);
      lines.push("  - Sources: " + record.sources.map(source => source.path + " [" + source.locator + "]").join("; "));
    }
    lines.push("");
  }
  lines.push("## Conflicts and decisions", "");
  if (!result.conflicts.length) lines.push("- No explicit conflicts recorded.");
  for (const conflict of result.conflicts) {
    lines.push("### " + conflict.title, "", conflict.interpretation, "",
      "**Sources:** " + conflict.sources.map(source => source.path + " [" + source.locator + "]").join("; "), "",
      "**Open questions:** " + (conflict.openQuestions.join("; ") || "None recorded."), "");
  }
  lines.push("## Approval and safety", "",
    "- Original owner-authored source documents remain unchanged.",
    "- Source presence is not the same as an end-to-end working feature.",
    "- No discovery result is automatically promoted to an approved requirement.",
    "- No Development Director tasks are created or submitted.",
    "- Department blueprints remain drafts until owner review and approval.",
    "");
  return lines.join("\n");
}

export async function writeBlueprintReconciliation(options = {}) {
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const registerPath = path.resolve(rootDir, options.registerPath || "development/blueprints/reconciliationRegister.json");
  const catalogPath = path.resolve(rootDir, options.catalogPath || "development/blueprints/departmentCatalog.json");
  const outputDir = path.resolve(rootDir, options.outputDir || "development/planning/blueprint-reconciliation");
  const register = JSON.parse(await fs.readFile(registerPath, "utf8"));
  const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));
  const result = reconcileBlueprintRegister(register, catalog, {
    sourceExists: relativePath => !relativePath.split("/").includes("..") &&
      !PRIVATE_PATH.test(relativePath) &&
      options.sourcePaths?.has(relativePath) === true
  });
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, "reconciliation.json"), JSON.stringify(result, null, 2) + "\n", "utf8");
  await fs.writeFile(path.join(outputDir, "README.md"), renderReconciliationReport(result), "utf8");
  return { result, outputDir };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath && invokedPath === fileURLToPath(import.meta.url)) {
  try {
    const rootDir = path.resolve(process.argv[2] || process.cwd());
    const registerPath = path.join(rootDir, "development/blueprints/reconciliationRegister.json");
    const catalogPath = path.join(rootDir, "development/blueprints/departmentCatalog.json");
    const [register, catalog] = await Promise.all([
      fs.readFile(registerPath, "utf8").then(JSON.parse),
      fs.readFile(catalogPath, "utf8").then(JSON.parse)
    ]);
    const sourcePaths = new Set();
    for (const record of register.records) {
      for (const source of record.sources) sourcePaths.add(source.path);
    }
    const { result, outputDir } = await writeBlueprintReconciliation({
      rootDir,
      sourcePaths,
      outputDir: process.argv[3] || "development/planning/blueprint-reconciliation"
    });
    if (result.summary.missingSources) {
      throw new Error("Reconciliation has missing source references: " + result.summary.missingSources);
    }
    process.stdout.write("LAMBO CITY blueprint reconciliation complete: " +
      result.summary.totalRecords + " records, " + result.summary.conflicts +
      " conflict(s) flagged, output: " + outputDir + "\n");
  } catch (error) {
    process.stderr.write("Blueprint reconciliation failed: " + error.message + "\n");
    process.exitCode = 1;
  }
}
