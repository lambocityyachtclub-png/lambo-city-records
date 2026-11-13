import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { discoverBlueprints, renderBlueprintReport, writeBlueprintDiscovery } from "../blueprints/discoverBlueprints.mjs";

const catalogPath = fileURLToPath(new URL("../blueprints/departmentCatalog.json", import.meta.url));
const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));

async function fixture() {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "lambo-blueprints-"));
  await fs.mkdir(path.join(rootDir, "docs"), { recursive: true });
  await fs.mkdir(path.join(rootDir, "studio"), { recursive: true });
  await fs.mkdir(path.join(rootDir, "development", "queue", "incoming"), { recursive: true });
  await fs.writeFile(path.join(rootDir, "LAMBO_CITY_NORTHSTAR.md"), "# LAMBO CITY\n\n## Preserve existing landmarks\n");
  await fs.writeFile(path.join(rootDir, "docs", "water-plan.md"), "# Waterfront\n\n## Ocean and shoreline\nTODO: connect the dock to the boardwalk\n");
  await fs.writeFile(path.join(rootDir, "studio", "radio.js"), "// LAMBO CITY Radio playlist routing\nexport const station = 'city-radio';\n");
  await fs.writeFile(path.join(rootDir, ".env"), "SECRET_TOKEN=must-not-be-read\n");
  await fs.writeFile(path.join(rootDir, "development", "queue", "incoming", "owner-direction.json"), "{\"vision\":\"private\"}");
  return rootDir;
}

test("discovery creates independent department drafts from repository evidence", async () => {
  const rootDir = await fixture();
  try {
    const result = await discoverBlueprints({ rootDir, catalog });
    assert.equal(result.status, "discovery-only");
    assert.equal(result.master.discoveredSourceFiles.includes("LAMBO_CITY_NORTHSTAR.md"), true);
    assert.equal(result.departments.length, catalog.departments.length);
    const water = result.departments.find(item => item.id === "water-environment");
    const radio = result.departments.find(item => item.id === "lambo-city-radio");
    assert.ok(water.documentationFiles.includes("docs/water-plan.md"));
    assert.ok(radio.sourceFiles.includes("studio/radio.js"));
    assert.equal(water.status, "discovery-draft");
    assert.equal(result.summary.filesScanned, 3);
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("discovery excludes private queues and environment files and redacts sensitive evidence", async () => {
  const rootDir = await fixture();
  try {
    await fs.writeFile(path.join(rootDir, "docs", "security-notes.md"), "Security Authorization: Bearer abcdefghijklmnopqrstuvwxyz123456\n");
    const result = await discoverBlueprints({ rootDir, catalog });
    const paths = result.inventory.map(item => item.path);
    assert.ok(!paths.some(item => item === ".env" || item.includes("private-queue")));
    const security = result.departments.find(item => item.id === "security-release");
    const evidence = security.evidence.flatMap(item => item.evidence).map(item => item.text).join("\n");
    assert.ok(!evidence.includes("abcdefghijklmnopqrstuvwxyz123456"));
    assert.ok(evidence.includes("[REDACTED SENSITIVE VALUE]"));
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("report clearly labels generated blueprints as drafts and makes no completion claims", async () => {
  const rootDir = await fixture();
  try {
    const result = await discoverBlueprints({ rootDir, catalog });
    const report = renderBlueprintReport(result);
    assert.match(report, /not an owner-approved specification/i);
    assert.match(report, /discovery-draft/);
    assert.match(report, /No development tasks were created or submitted/);
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("writer creates a machine-readable discovery snapshot and readable report", async () => {
  const rootDir = await fixture();
  try {
    await fs.mkdir(path.join(rootDir, "development", "blueprints"), { recursive: true });
    await fs.copyFile(catalogPath, path.join(rootDir, "development", "blueprints", "departmentCatalog.json"));
    const outputDir = path.join(rootDir, "development", "planning", "blueprint-discovery");
    const { result } = await writeBlueprintDiscovery({ rootDir, outputDir });
    const secondRun = await discoverBlueprints({ rootDir, catalog });
    const json = JSON.parse(await fs.readFile(path.join(outputDir, "discovery.json"), "utf8"));
    const markdown = await fs.readFile(path.join(outputDir, "README.md"), "utf8");
    assert.equal(json.departments.length, catalog.departments.length);
    assert.equal(result.summary.filesScanned > 0, true);
    assert.equal(secondRun.summary.filesScanned, result.summary.filesScanned);
    assert.match(markdown, /LAMBO CITY ALIVE — Blueprint Discovery Report/);
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("discovery scans the actual repository and identifies the existing master sources", async () => {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const result = await discoverBlueprints({ rootDir, catalog });
  assert.ok(result.summary.filesScanned > 100);
  assert.equal(result.departments.length, 10);
  assert.ok(result.master.discoveredSourceFiles.includes("LAMBO_CITY_NORTHSTAR.md"));
  assert.ok(result.master.discoveredSourceFiles.includes("LAMBO_CITY_MASTER_BLUEPRINT.md"));
  assert.ok(result.departments.every(item => item.status === "discovery-draft"));
  assert.ok(result.departments.every(item => Array.isArray(item.runtimeConnectedSourceFiles)));
  assert.ok(result.departments.every(item => Array.isArray(item.notStaticallyReachableSourceFiles)));
  assert.ok(result.dependencyGraph.rootEntrypoints.includes("main.js"));
  assert.ok(result.dependencyGraph.reachableFiles.includes("main.js"));
  const radio = result.departments.find(item => item.id === "lambo-city-radio");
  const events = result.departments.find(item => item.id === "jumbotron-events");
  const vehicles = result.departments.find(item => item.id === "vehicles-yachts");
  assert.equal(radio.sourceFiles.length, 0);
  assert.ok(events.sourceFiles.includes("heroPerformance.js"));
  assert.ok(!events.sourceFiles.includes("performanceMonitor.js"));
  assert.ok(vehicles.sourceFiles.includes("cars.js"));
});
