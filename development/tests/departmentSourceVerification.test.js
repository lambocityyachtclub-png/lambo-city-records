import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildDepartmentSourceVerification } from "../blueprints/verifyDepartmentSources.mjs";

const tick = String.fromCharCode(96);

test("department verification follows registered, HTML, and transitive module roots without inventing runtime roots", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "lc-department-verification-"));
  try {
    await fs.mkdir(path.join(root, "development/blueprints/departments"), { recursive: true });
    await fs.mkdir(path.join(root, "development/engine"), { recursive: true });
    await fs.mkdir(path.join(root, "tests"), { recursive: true });
    await fs.mkdir(path.join(root, "scripts"), { recursive: true });
    await fs.writeFile(path.join(root, "development/blueprints/blueprintSet.json"), JSON.stringify({
      departments: [{
        id: "sample-department",
        title: "Sample Department",
        path: "development/blueprints/departments/sample.md",
        status: "partial",
        sourceCount: 7,
        ownerApproved: false
      }]
    }));
    const document = [
      "# Sample",
      "",
      "## 3. Current source inventory",
      "- " + tick + "sampleFeature.js" + tick,
      "- " + tick + "nestedFeature.js" + tick,
      "- " + tick + "missingFeature.js" + tick,
      "- " + tick + "architecture.md" + tick,
      "- " + tick + "flags.json" + tick,
      "- " + tick + "scripts/test-sample.mjs" + tick,
      "- " + tick + "development/engine/developmentSystem.js" + tick,
      "",
      "## 4. Non-goals",
      ""
    ].join("\n");
    await fs.writeFile(path.join(root, "development/blueprints/departments/sample.md"), document);
    await fs.writeFile(path.join(root, "sampleFeature.js"),
      'import {\n  ready\n} from "./nestedFeature.js";\nexport default ready;\n');
    await fs.writeFile(path.join(root, "nestedFeature.js"), "export const ready = true;\n");
    await fs.writeFile(path.join(root, "architecture.md"), "# Architecture\n");
    await fs.writeFile(path.join(root, "flags.json"), "{}\n");
    await fs.writeFile(path.join(root, "scripts/test-sample.mjs"), "console.log('test');\n");
    await fs.writeFile(path.join(root, "development/engine/developmentSystem.js"), "export const libraryOnly = true;\n");
    await fs.writeFile(path.join(root, "studio.html"),
      '<!doctype html>\n<script type="module" src="./studioStandalone.js"></script>\n');
    await fs.writeFile(path.join(root, "studioStandalone.js"),
      'import {\n  default as Sample\n} from "./sampleFeature.js";\nvoid Sample;\n');
    await fs.writeFile(path.join(root, "main.js"),
      'import Sample from "./sampleFeature.js";\nengine.registerSystems({\n  sampleFeature: Sample,\n});\n');
    await fs.writeFile(path.join(root, "engine.js"), 'initialize("sampleFeature");\n');
    await fs.writeFile(path.join(root, "tests/sample.test.mjs"), 'import "../sampleFeature.js";\n');
    for (const file of ["worldSystemHost.js", "worldSystemRuntime.js", "floor2StudioNavigation.js", "floor2StudioSession.js"]) {
      await fs.writeFile(path.join(root, file), "");
    }

    const report = await buildDepartmentSourceVerification(root);
    const capabilities = report.departments[0].capabilities;
    assert.equal(capabilities[0].sourcePresent, true);
    assert.equal(capabilities[0].status, "tested");
    assert.ok(capabilities[0].runtimeReferences.some(item => item.kind === "registered-static-root"));
    assert.equal(capabilities[0].testReferences.length, 1);
    assert.equal(capabilities[0].runtimeDeviceVerification, "not-verified");
    assert.equal(capabilities[1].sourcePresent, true);
    assert.equal(capabilities[1].status, "connected");
    assert.ok(capabilities[1].runtimeReferences.some(item => item.kind === "transitive-static-import"));
    assert.equal(capabilities[2].sourcePresent, false);
    assert.equal(capabilities[2].status, "planned");
    assert.equal(capabilities[3].status, "documentation-reference");
    assert.equal(capabilities[4].status, "configuration-reference");
    assert.equal(capabilities[5].status, "test-source");
    assert.equal(capabilities[6].status, "source-only");
    assert.equal(capabilities[6].runtimeReferences.length, 0);
    assert.ok(report.activeRuntimeRoots.some(item =>
      item.path === "studioStandalone.js" && item.runtimeDomain === "studio-standalone"
    ));
    assert.equal(report.runtimeIsolation.passed, true);
    assert.deepEqual(report.runtimeIsolation.publicExperienceDevelopmentImports, []);
    assert.equal(report.verificationPolicy.testFilePresenceIsNotPassingTestProof, true);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("verification never grants owner approval or creates Development Director tasks", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "lc-department-safety-"));
  try {
    await fs.mkdir(path.join(root, "development/blueprints/departments"), { recursive: true });
    await fs.writeFile(path.join(root, "development/blueprints/blueprintSet.json"), JSON.stringify({
      departments: [{
        id: "empty",
        title: "Empty",
        path: "development/blueprints/departments/empty.md",
        status: "planned",
        sourceCount: 0,
        ownerApproved: false
      }]
    }));
    await fs.writeFile(path.join(root, "development/blueprints/departments/empty.md"),
      "# Empty\n\n## 3. Current source inventory\n\n## 4. Non-goals\n");
    for (const file of ["main.js", "engine.js", "worldSystemHost.js", "worldSystemRuntime.js", "floor2StudioNavigation.js", "floor2StudioSession.js"]) {
      await fs.writeFile(path.join(root, file), "");
    }
    const report = await buildDepartmentSourceVerification(root);
    assert.equal(report.departments[0].ownerApproved, false);
    assert.equal("tasksCreated" in report, false);
    assert.equal(report.verificationPolicy.ownerApprovalRequiredForTaskAuthorization, true);
    assert.equal(report.runtimeIsolation.passed, true);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("verification reports a visitor-world import into ALIVE development infrastructure", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "lc-department-boundary-"));
  try {
    await fs.mkdir(path.join(root, "development/engine"), { recursive: true });
    await fs.mkdir(path.join(root, "server/alive"), { recursive: true });
    await fs.mkdir(path.join(root, "api/alive"), { recursive: true });
    await fs.writeFile(path.join(root, "development/blueprints/blueprintSet.json"), JSON.stringify({
      departments: []
    }));
    await fs.writeFile(path.join(root, "main.js"),
      'import WorldEntry from "./worldEntry.js";\nengine.registerSystems({\n  worldEntry: WorldEntry,\n});\n');
    await fs.writeFile(path.join(root, "engine.js"), 'initialize("worldEntry");\n');
    await fs.writeFile(path.join(root, "worldEntry.js"), 'import "./development/engine/privateCore.js";\n');
    await fs.writeFile(path.join(root, "development/engine/privateCore.js"), "export const privateCore = true;\n");
    const report = await buildDepartmentSourceVerification(root);
    assert.equal(report.runtimeIsolation.passed, false);
    assert.equal(report.runtimeIsolation.publicExperienceDevelopmentImports.length, 3);
    assert.ok(report.runtimeIsolation.publicExperienceDevelopmentImports.some(item => item.path === "development/engine/privateCore.js"));
    assert.ok(report.runtimeIsolation.publicExperienceDevelopmentImports.some(item => item.path === "server/alive/security.js"));
    assert.ok(report.runtimeIsolation.publicExperienceDevelopmentImports.some(item => item.path === "api/alive/session.js"));
    assert.ok(report.runtimeIsolation.publicExperienceDevelopmentImports.every(item => item.runtimeDomain === "visitor-world"));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
