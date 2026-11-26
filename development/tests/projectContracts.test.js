import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AUTONOMY,
  getProjectContract,
  listProjectContracts,
  validateProjectContract,
  evaluateProjectAction
} from "../../alive/contracts/projectContracts.js";

test("project contracts are registered, canonical, and valid", () => {
  const contracts = listProjectContracts();
  assert.equal(contracts.length, 7);
  for (const contract of contracts) assert.deepEqual(validateProjectContract(contract), []);
  assert.equal(Object.isFrozen(contracts[0]), true);
});

test("every canonical allowed path exists inside the project repository", async () => {
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  for (const contract of listProjectContracts()) {
    for (const allowedPath of contract.allowedPaths) {
      const resolved = path.resolve(projectRoot, allowedPath);
      assert.ok(
        resolved === projectRoot || resolved.startsWith(projectRoot + path.sep),
        `${contract.id} path escapes project root: ${allowedPath}`
      );
      const stat = await fs.stat(resolved);
      assert.ok(stat.isFile() || stat.isDirectory(), `${contract.id} path is not a file or directory: ${allowedPath}`);
    }
  }
});

test("unknown contracts and forged contract objects cannot grant authority", () => {
  assert.equal(evaluateProjectAction("not-a-contract", "inspect").authorized, false);
  const contract = getProjectContract("world-material-quality");
  assert.ok(validateProjectContract({ ...contract }).some(error => /canonical/.test(error)));
});

test("read-only inspection is available within the approved contracts", () => {
  for (const contract of listProjectContracts()) {
    assert.equal(evaluateProjectAction(contract.id, "inspect").authorized, true);
  }
});

test("builder permissions require an isolated change within exact allowed paths and resource budgets", () => {
  const metrics = {
    changedFiles: 1,
    linesChanged: 40,
    newDependencies: 0
  };
  const good = evaluateProjectAction("alive-development-core", "prepare_isolated_change", {
    ...metrics,
    changedPaths: ["development/engine/newSafeModule.js"]
  });
  const bad = evaluateProjectAction("alive-development-core", "prepare_isolated_change", {
    ...metrics,
    changedPaths: ["main.js"]
  });
  assert.equal(good.authorized, true);
  assert.equal(bad.authorized, false);
});

test("isolated changes are blocked when resource evidence is missing", () => {
  const result = evaluateProjectAction("alive-development-core", "prepare_isolated_change", {
    changedPaths: ["development/engine/newSafeModule.js"]
  });
  assert.equal(result.decision, "blocked_missing_evidence");
  assert.ok(result.missingEvidence.includes("linesChanged"));
  assert.ok(result.missingEvidence.includes("newDependencies"));
});

test("world material resource budgets reject extra lights and oversized textures", () => {
  const paths = ["conferenceCenterDistrict.js"];
  const extraLight = evaluateProjectAction("world-material-quality", "prepare_isolated_change", {
    changedPaths: paths,
    changedFiles: 1,
    linesChanged: 80,
    newDependencies: 0,
    addedRuntimeLights: 2,
    maxTextureDimension: 1024
  });
  const oversizedTexture = evaluateProjectAction("world-material-quality", "prepare_isolated_change", {
    changedPaths: paths,
    changedFiles: 1,
    linesChanged: 80,
    newDependencies: 0,
    addedRuntimeLights: 0,
    maxTextureDimension: 4096
  });
  assert.equal(extraLight.decision, "owner_approval_required");
  assert.equal(oversizedTexture.decision, "owner_approval_required");
});

test("performance changes require frame-loop measurement within the contract budget", () => {
  const result = evaluateProjectAction("performance-quality", "prepare_isolated_change", {
    changedPaths: ["deviceGraphics.js"],
    changedFiles: 1,
    linesChanged: 40,
    newDependencies: 0,
    maxAddedFrameLoopWorkMs: 0.5
  });
  assert.equal(result.decision, "owner_approval_required");
});

test("HERO, account security, world layout, and Studio remain protected", () => {
  assert.equal(getProjectContract("hero-approved-performance").autonomyLevel, AUTONOMY.OBSERVER);
  assert.equal(evaluateProjectAction("hero-approved-performance", "add_paparazzi").decision, "owner_approval_required");
  assert.equal(evaluateProjectAction("player-identity-and-accounts", "change_authentication").decision, "owner_approval_required");
  assert.equal(evaluateProjectAction("world-layout-navigation", "change_camera_or_navigation").decision, "owner_approval_required");
  assert.equal(getProjectContract("studio-deferred").autonomyLevel, AUTONOMY.OBSERVER);
});

test("low-risk world material deployment is permitted only with complete evidence", () => {
  const evidence = {
    risk: "low",
    changedPaths: ["conferenceCenterDistrict.js"],
    changedFiles: 1,
    linesChanged: 80,
    newDependencies: 0,
    addedRuntimeLights: 0,
    maxTextureDimension: 1024,
    contract_version_match: true,
    changed_paths_within_allowlist: true,
    automated_tests_passed: true,
    runtime_smoke_passed: true,
    visual_quality_review_passed: true,
    resource_budget_passed: true,
    rollback_ready: true
  };
  const result = evaluateProjectAction("world-material-quality", "deploy_production_low_risk", evidence);
  assert.equal(result.authorized, true);
  assert.equal(result.autonomyLevel, AUTONOMY.TRUSTED_OPERATOR);
});

test("low-risk deployment is blocked when evidence is incomplete or risk is elevated", () => {
  const incomplete = evaluateProjectAction("world-material-quality", "deploy_production_low_risk", {
    risk: "low",
    changedPaths: ["conferenceCenterDistrict.js"],
    changedFiles: 1,
    linesChanged: 80,
    newDependencies: 0,
    addedRuntimeLights: 0,
    maxTextureDimension: 1024
  });
  assert.equal(incomplete.decision, "blocked_missing_evidence");

  const elevated = evaluateProjectAction("world-material-quality", "deploy_production_low_risk", {
    risk: "high",
    changedPaths: ["conferenceCenterDistrict.js"],
    changedFiles: 1,
    linesChanged: 80,
    newDependencies: 0,
    addedRuntimeLights: 0,
    maxTextureDimension: 1024,
    contract_version_match: true,
    changed_paths_within_allowlist: true,
    automated_tests_passed: true,
    runtime_smoke_passed: true,
    visual_quality_review_passed: true,
    resource_budget_passed: true,
    rollback_ready: true
  });
  assert.equal(elevated.decision, "owner_approval_required");
});

test("pre-authorized deployment cannot bypass a failed resource-budget metric", () => {
  const evidence = {
    risk: "low",
    changedPaths: ["conferenceCenterDistrict.js"],
    changedFiles: 1,
    linesChanged: 80,
    newDependencies: 0,
    addedRuntimeLights: 2,
    maxTextureDimension: 1024,
    contract_version_match: true,
    changed_paths_within_allowlist: true,
    automated_tests_passed: true,
    runtime_smoke_passed: true,
    visual_quality_review_passed: true,
    resource_budget_passed: true,
    rollback_ready: true
  };
  const result = evaluateProjectAction("world-material-quality", "deploy_production_low_risk", evidence);
  assert.equal(result.decision, "owner_approval_required");
  assert.equal(result.exceeded[0].metric, "addedRuntimeLights");
});

test("no contract can change its own trust root or safety permissions", () => {
  for (const contract of listProjectContracts()) {
    assert.ok(contract.forbiddenOperations.includes("change_owner_authority"));
    assert.ok(contract.forbiddenOperations.includes("change_contract_permissions"));
    assert.ok(contract.forbiddenOperations.includes("disable_safety_controls"));
  }
  assert.equal(evaluateProjectAction("alive-development-core", "change_contract_permissions").decision, "denied");
});
