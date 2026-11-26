import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createProjectDiscoveryService } from "../blueprints/projectDiscoveryService.js";

const catalogSource = fileURLToPath(new URL("../blueprints/departmentCatalog.json", import.meta.url));

async function makeProjectFixture() {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "alive-project-discovery-"));
  await fs.mkdir(path.join(rootDir, "development", "blueprints"), { recursive: true });
  await fs.mkdir(path.join(rootDir, "world"), { recursive: true });
  await fs.copyFile(catalogSource, path.join(rootDir, "development", "blueprints", "departmentCatalog.json"));
  await fs.writeFile(path.join(rootDir, "LAMBO_CITY_NORTHSTAR.md"), "# LAMBO CITY\n\nPreserve approved landmarks.\n");
  await fs.writeFile(path.join(rootDir, "world", "water.js"), "export const water = true; // ocean environment\n");
  await fs.writeFile(path.join(rootDir, ".env"), "PRIVATE_TOKEN=never-return-this\n");
  return rootDir;
}

test("Project Discovery returns a bounded read-only report without raw file contents", async () => {
  const rootDir = await makeProjectFixture();
  try {
    const service = createProjectDiscoveryService({ rootDir });
    const report = await service.scan();

    assert.equal(report.status, "discovery-only");
    assert.equal(report.summary.departmentCount, 10);
    assert.equal(report.master.discoveredSourceFiles.includes("LAMBO_CITY_NORTHSTAR.md"), true);
    assert.equal(report.safety.readOnly, true);
    assert.equal(report.safety.sourceFilesModified, false);
    assert.equal(report.safety.tasksCreated, false);
    assert.equal(report.safety.rawFileContentsReturned, false);
    assert.equal(Object.hasOwn(report, "inventory"), false);
    assert.equal(JSON.stringify(report).includes("PRIVATE_TOKEN"), false);
    assert.equal(JSON.stringify(report).includes("never-return-this"), false);
    assert.equal(service.getSnapshot().lastScanStatus, "discovery-only");
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("Project Discovery rejects catalog paths that escape the project root", async () => {
  const rootDir = await makeProjectFixture();
  try {
    assert.throws(
      () => createProjectDiscoveryService({ rootDir, catalogPath: "../outside.json" }),
      /must remain inside the project root/
    );
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("Project Discovery can be disabled and refuses to scan", async () => {
  const rootDir = await makeProjectFixture();
  try {
    const service = createProjectDiscoveryService({ rootDir });
    service.setEnabled(false);
    assert.equal(service.getSnapshot().enabled, false);
    await assert.rejects(() => service.scan(), /is disabled/);
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});
