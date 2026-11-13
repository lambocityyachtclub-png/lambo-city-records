import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildDepartmentSourceVerification } from "../blueprints/verifyDepartmentSources.mjs";

test("department verification distinguishes source presence, runtime references and test references", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "lc-department-verification-"));
  try {
    await fs.mkdir(path.join(root, "development/blueprints/departments"), { recursive: true });
    await fs.mkdir(path.join(root, "tests"), { recursive: true });
    await fs.writeFile(path.join(root, "development/blueprints/blueprintSet.json"), JSON.stringify({
      departments: [{
        id: "sample-department",
        title: "Sample Department",
        path: "development/blueprints/departments/sample.md",
        status: "partial",
        sourceCount: 2,
        ownerApproved: false
      }]
    }));
    await fs.writeFile(path.join(root, "development/blueprints/departments/sample.md"),
      "# Sample\n\n## 3. Current source inventory\n- `sampleFeature.js`\n- `missingFeature.js`\n\n## 4. Non-goals\n");
    await fs.writeFile(path.join(root, "sampleFeature.js"), "export default {};\n");
    await fs.writeFile(path.join(root, "main.js"), 'import Sample from "./sampleFeature.js";\nengine.registerSystems({\n  sampleFeature: Sample,\n});\n');
    await fs.writeFile(path.join(root, "engine.js"), 'initialize("sampleFeature");\n');
    await fs.writeFile(path.join(root, "tests/sample.test.mjs"), 'import "../sampleFeature.js";\n');
    for (const file of ["worldSystemHost.js", "worldSystemRuntime.js", "floor2StudioNavigation.js", "floor2StudioSession.js"]) {
      await fs.writeFile(path.join(root, file), "");
    }

    const report = await buildDepartmentSourceVerification(root);
    const capabilities = report.departments[0].capabilities;
    assert.equal(capabilities[0].sourcePresent, true);
    assert.equal(capabilities[0].status, "tested");
    assert.equal(capabilities[0].runtimeReferences.length, 1);
    assert.equal(capabilities[0].testReferences.length, 1);
    assert.equal(capabilities[0].runtimeDeviceVerification, "not-verified");
    assert.equal(capabilities[1].sourcePresent, false);
    assert.equal(capabilities[1].status, "planned");
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
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
