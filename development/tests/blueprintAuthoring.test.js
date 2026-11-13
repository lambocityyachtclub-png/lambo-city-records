import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const set = JSON.parse(await fs.readFile(path.join(root, "development/blueprints/blueprintSet.json"), "utf8"));
const catalog = JSON.parse(await fs.readFile(path.join(root, "development/blueprints/departmentCatalog.json"), "utf8"));

test("Master and all ten Department Blueprints exist and remain unapproved drafts", async () => {
  assert.equal(set.schemaVersion, 1);
  assert.equal(set.status, "draft-owner-review");
  assert.equal(set.departments.length, 10);
  assert.equal(new Set(set.departments.map(item => item.id)).size, 10);
  assert.equal(set.rules.draftsAreNotTaskAuthorization, true);
  assert.equal(set.rules.productionChangesRequireSeparateApproval, true);
  await fs.access(path.join(root, set.master));
  await fs.access(path.join(root, set.readme));
  assert.deepEqual(
    set.departments.map(item => item.id).sort(),
    catalog.departments.map(item => item.id).sort()
  );
  for (const department of set.departments) {
    assert.equal(department.ownerApproved, false);
    assert.ok(department.sourceCount > 0);
    const document = await fs.readFile(path.join(root, department.path), "utf8");
    assert.match(document, /Department Blueprint \(Draft v1\)/);
    assert.match(document, /## 2\. Scope and ownership/);
    assert.match(document, /## 5\. Dependencies/);
    assert.match(document, /## 6\. Proposed roadmap/);
    assert.match(document, /## 7\. Draft acceptance criteria/);
    assert.match(document, /## 8\. Open questions \/ evidence gaps/);
    assert.match(document, /No Development Director task is created or submitted/);
  }
});

test("every source path named in a Department Blueprint exists in this repository snapshot", async () => {
  for (const department of set.departments) {
    const document = await fs.readFile(path.join(root, department.path), "utf8");
    const section = document.split("## 3. Current source inventory")[1]?.split("## 4. Non-goals")[0];
    assert.ok(section, "Missing source inventory section: " + department.id);
    const sourcePaths = [...section.matchAll(/- \x60([^\x60]+)\x60/g)].map(match => match[1]);
    assert.equal(sourcePaths.length, department.sourceCount, "Source count mismatch: " + department.id);
    for (const sourcePath of sourcePaths) {
      await fs.access(path.join(root, sourcePath));
    }
  }
});

test("Master Blueprint preserves owner-authored sources and explicit unresolved boundaries", async () => {
  const master = await fs.readFile(path.join(root, set.master), "utf8");
  assert.match(master, /LAMBO_CITY_NORTHSTAR\.md/);
  assert.match(master, /LAMBO_CITY_MASTER_BLUEPRINT\.md/);
  assert.match(master, /owner-decision-required/);
  assert.match(master, /visitor-facing Version 1 world/);
  assert.match(master, /not a task authorization/i);
  assert.match(master, /live checkout, payment credentials/i);
});

test("ALIVE implementation convergence audit preserves the local-first core boundary", async () => {
  const audit = await fs.readFile(
    path.join(root, "development/blueprints/ALIVE_IMPLEMENTATION_CONVERGENCE_DRAFT.md"),
    "utf8"
  );
  const readme = await fs.readFile(path.join(root, "development/blueprints/README.md"), "utf8");
  assert.match(audit, /PR #31/);
  assert.match(audit, /PR #44/);
  assert.match(audit, /PR #52/);
  assert.match(audit, /browser IndexedDB/);
  assert.match(audit, /local owner bootstrap starts with no AI, Sandbox, Vercel token, or database credentials/i);
  assert.match(audit, /must not be imported by the public game runtime/i);
  assert.match(audit, /No branch is merged by this audit/);
  assert.match(readme, /ALIVE_IMPLEMENTATION_CONVERGENCE_DRAFT\.md/);
  assert.match(readme, /Local-first ALIVE foundation/);
});

test("owner vision submission defaults to local storage and does not trigger the hosted worker", async () => {
  const ownerWorkspace = await fs.readFile(path.join(root, "alive.js"), "utf8");
  const localStorage = await fs.readFile(
    path.join(root, "development/storage/indexedDbDevelopmentStorage.js"),
    "utf8"
  );
  assert.match(ownerWorkspace, /createLocalAliveControlPlane/);
  assert.match(ownerWorkspace, /visionStore\.createVision/);
  assert.doesNotMatch(ownerWorkspace, /api\(["']\/api\/alive\/vision/);
  assert.match(ownerWorkspace, /Hosted specialist execution remains off by default/);
  assert.match(localStorage, /const VISION_STORE = "visions"/);
  assert.match(localStorage, /remoteStatus: "not_submitted"/);
});
