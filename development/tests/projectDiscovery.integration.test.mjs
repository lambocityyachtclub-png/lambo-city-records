import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { discoverBlueprints } from "../blueprints/discoverBlueprints.mjs";
import { createProposalProjectContext } from "../blueprints/projectContext.mjs";

test("ALIVE can discover the current repository and produce bounded whole-project context", async () => {
  const rootDir = process.cwd();
  const catalogPath = path.join(rootDir, "development/blueprints/departmentCatalog.json");
  const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));
  const report = await discoverBlueprints({ rootDir, catalog });
  const context = createProposalProjectContext(report);
  assert.ok(report.summary.filesScanned > 0);
  assert.ok(context.dependencyGraph.rootEntrypoints.includes("index.html"));
  assert.equal(context.ownerApproved, false);
  assert.ok(context.departments.length > 0);
  assert.ok(JSON.stringify(context).length <= 160_000);
  assert.equal("inventory" in context, false);
});
