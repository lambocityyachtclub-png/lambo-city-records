import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  reconcileBlueprintRegister,
  renderReconciliationReport,
  writeBlueprintReconciliation
} from "../blueprints/reconcileBlueprints.mjs";

const base = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const register = JSON.parse(await fs.readFile(path.join(base, "development/blueprints/reconciliationRegister.json"), "utf8"));
const catalog = JSON.parse(await fs.readFile(path.join(base, "development/blueprints/departmentCatalog.json"), "utf8"));

test("reconciliation classifies evidence without promoting source presence to verified completion", () => {
  const result = reconcileBlueprintRegister(register, catalog, {
    generatedAt: "2026-11-12T00:00:00.000Z"
  });
  assert.equal(result.status, "reconciliation-draft");
  assert.equal(result.summary.totalRecords, register.records.length);
  assert.ok(result.summary.partial > 0);
  assert.ok(result.summary.planned > 0);
  assert.ok(result.summary.future > 0);
  assert.equal(result.summary.present, 0);
  assert.equal(result.safety.developmentTasksCreated, false);
  assert.equal(result.safety.discoveryEvidenceAutomaticallyPromoted, false);
});

test("all ten departments are represented even when some have no reconciled records", () => {
  const result = reconcileBlueprintRegister(register, catalog);
  assert.equal(result.departments.length, 10);
  assert.ok(result.departments.some(item => item.id === "water-environment" && item.records.length > 0));
  assert.ok(result.departments.some(item => item.id === "jumbotron-events" && item.records.length > 0));
  assert.ok(result.departments.some(item => item.id === "lambo-city-radio" && item.records.length === 0));
});

test("source provenance is required and private or absolute paths are rejected", () => {
  const invalid = structuredClone(register);
  invalid.records[0].sources[0].path = ".env";
  assert.throws(() => reconcileBlueprintRegister(invalid, catalog), /prohibited/);
  const traversal = structuredClone(register);
  traversal.records[0].sources[0].path = "../outside.md";
  assert.throws(() => reconcileBlueprintRegister(traversal, catalog), /prohibited/);
  const missing = structuredClone(register);
  missing.records[0].sources = [];
  assert.throws(() => reconcileBlueprintRegister(missing, catalog), /at least one source/);
});

test("conflicting scope statements remain flagged for owner decision", () => {
  const result = reconcileBlueprintRegister(register, catalog);
  assert.equal(result.summary.conflicts, 1);
  assert.equal(result.conflicts[0].id, "scope-game-backend-vs-alive");
  assert.equal(result.conflicts[0].sources.length, 2);
  assert.equal(result.conflicts[0].openQuestions.length > 0, true);
});

test("a conflict cannot be silently marked resolved and a verified-present claim needs test evidence", () => {
  const invalidConflict = structuredClone(register);
  invalidConflict.records.find(item => item.implementationStatus === "conflict").verificationStatus = "source-reviewed";
  assert.throws(() => reconcileBlueprintRegister(invalidConflict, catalog), /conflicts must remain/);
  const invalidPresent = structuredClone(register);
  invalidPresent.records[0].implementationStatus = "present";
  assert.throws(() => reconcileBlueprintRegister(invalidPresent, catalog), /automated test evidence/);
});

test("unknown departments and duplicate record identifiers are rejected", () => {
  const unknown = structuredClone(register);
  unknown.records.find(item => item.scope === "department").departmentId = "unknown-team";
  assert.throws(() => reconcileBlueprintRegister(unknown, catalog), /Unknown department/);
  const duplicate = structuredClone(register);
  duplicate.records.push(structuredClone(duplicate.records[0]));
  assert.throws(() => reconcileBlueprintRegister(duplicate, catalog), /Duplicate/);
});

test("report clearly communicates draft status, source provenance and approval gates", () => {
  const result = reconcileBlueprintRegister(register, catalog);
  const report = renderReconciliationReport(result);
  assert.match(report, /source-linked reconciliation draft/i);
  assert.match(report, /No Development Director tasks are created or submitted/);
  assert.match(report, /stageVideo\.js/);
  assert.match(report, /scope-game-backend-vs-alive|Separate visitor-facing game scope/i);
});

test("writer verifies every referenced source path and emits JSON plus Markdown", async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "lambo-reconcile-"));
  try {
    await fs.mkdir(path.join(rootDir, "development/blueprints"), { recursive: true });
    await fs.writeFile(path.join(rootDir, "development/blueprints/reconciliationRegister.json"), JSON.stringify(register));
    await fs.writeFile(path.join(rootDir, "development/blueprints/departmentCatalog.json"), JSON.stringify(catalog));
    for (const record of register.records) {
      for (const source of record.sources) {
        const filePath = path.join(rootDir, source.path);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        try {
          await fs.access(filePath);
        } catch (_) {
          await fs.writeFile(filePath, "fixture source\n");
        }
      }
    }
    const sourcePaths = new Set(register.records.flatMap(record => record.sources.map(source => source.path)));
    const { result } = await writeBlueprintReconciliation({ rootDir, sourcePaths });
    assert.equal(result.summary.missingSources, 0);
    assert.ok(await fs.readFile(path.join(rootDir, "development/planning/blueprint-reconciliation/reconciliation.json"), "utf8"));
    const report = await fs.readFile(path.join(rootDir, "development/planning/blueprint-reconciliation/README.md"), "utf8");
    assert.match(report, /Blueprint Reconciliation Draft/);
    await fs.rm(path.join(rootDir, register.records[0].sources[0].path));
    const second = await writeBlueprintReconciliation({ rootDir });
    assert.ok(second.result.summary.missingSources > 0);\n    assert.ok(second.result.missingSources.some(item => item.path === register.records[0].sources[0].path));
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});
