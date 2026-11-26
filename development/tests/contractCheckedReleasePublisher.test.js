import test from "node:test";
import assert from "node:assert/strict";
import { createContractCheckedReleasePublisher } from "../execution/contractCheckedReleasePublisher.js";
import { getProjectContract } from "../../alive/contracts/projectContracts.js";

function makeReview(overrides = {}) {
  const contract = getProjectContract("world-material-quality");
  return {
    id: "review-world-001",
    taskId: "task-world-001",
    taskTitle: "Improve Convention Center glass realism",
    contractId: contract.id,
    contractVersion: contract.version,
    status: "awaiting_owner_review",
    risk: "low",
    changedFiles: ["conferenceCenterDistrict.js"],
    resourceMetrics: {
      changedFiles: 1,
      linesChanged: 12,
      newDependencies: 0,
      addedRuntimeLights: 0,
      maxTextureDimension: 0,
      maxAddedFrameLoopWorkMs: 0
    },
    testResults: { passed: true, total: 20, failed: 0 },
    ...overrides
  };
}

function passingEvidence() {
  return {
    protectedScopeTouched: false,
    runtimeSmokePassed: true,
    visualQualityReviewPassed: true
  };
}

test("Release gate publishes only low-risk changes with all contract evidence", async () => {
  let calls = 0;
  const publisher = createContractCheckedReleasePublisher({
    enabled: true,
    async publish(input) {
      calls++;
      assert.equal(input.idempotencyKey, "review-world-001");
      assert.equal(input.contract.id, "world-material-quality");
      assert.equal(input.evidence.risk, "low");
      return {
        status: "deployed",
        deploymentId: "dpl_healthy",
        deploymentUrl: "https://preview.example",
        commitSha: "abc123",
        smokePassed: true
      };
    },
    async rollback() { return { status: "rolled_back" }; }
  });

  const result = await publisher.publishReview({
    review: makeReview(),
    evidence: passingEvidence()
  });

  assert.equal(result.status, "deployed");
  assert.equal(result.productionChangesMade, true);
  assert.equal(result.rollbackAvailable, true);
  assert.equal(calls, 1);
});

test("Release gate blocks missing visual or runtime evidence before publisher is called", async () => {
  let calls = 0;
  const publisher = createContractCheckedReleasePublisher({
    enabled: true,
    async publish() { calls++; return { status: "deployed" }; },
    async rollback() { return { status: "rolled_back" }; }
  });

  const result = await publisher.publishReview({
    review: makeReview(),
    evidence: { protectedScopeTouched: false, runtimeSmokePassed: true, visualQualityReviewPassed: false }
  });

  assert.equal(result.status, "blocked_missing_evidence");
  assert.ok(result.missingEvidence.includes("visual_quality_review_passed"));
  assert.equal(calls, 0);
});

test("Release gate never autonomously deploys medium-risk or out-of-contract changes", async () => {
  let calls = 0;
  const publisher = createContractCheckedReleasePublisher({
    enabled: true,
    async publish() { calls++; return { status: "deployed" }; },
    async rollback() { return { status: "rolled_back" }; }
  });

  const mediumRisk = await publisher.publishReview({
    review: makeReview({ risk: "medium" }),
    evidence: passingEvidence()
  });
  const outsideScope = await publisher.publishReview({
    review: makeReview({ id: "review-outside", changedFiles: ["main.js"] }),
    evidence: passingEvidence()
  });

  assert.equal(mediumRisk.status, "owner_approval_required");
  assert.equal(outsideScope.status, "denied");
  assert.equal(calls, 0);
});

test("Release gate requires explicit proof that protected scope was not touched", async () => {
  const publisher = createContractCheckedReleasePublisher({
    enabled: true,
    async publish() { throw new Error("Must not publish."); },
    async rollback() { return { status: "rolled_back" }; }
  });

  const result = await publisher.publishReview({
    review: makeReview(),
    evidence: { runtimeSmokePassed: true, visualQualityReviewPassed: true }
  });
  assert.equal(result.status, "owner_approval_required");
  assert.equal(result.productionChangesMade, false);
});

test("Release gate requires a rollback adapter and refuses contracts without low-risk preauthorization", async () => {
  const noRollback = createContractCheckedReleasePublisher({
    enabled: true,
    async publish() { throw new Error("Must not publish."); }
  });
  const missingRollback = await noRollback.publishReview({
    review: makeReview(),
    evidence: passingEvidence()
  });
  assert.equal(missingRollback.status, "blocked_missing_evidence");
  assert.ok(missingRollback.missingEvidence.includes("rollback_ready"));

  const performanceContract = getProjectContract("performance-quality");
  const performanceReview = makeReview({
    id: "review-performance",
    contractId: performanceContract.id,
    contractVersion: performanceContract.version,
    changedFiles: ["deviceGraphics.js"]
  });
  const publisher = createContractCheckedReleasePublisher({
    enabled: true,
    async publish() { throw new Error("Must not publish."); },
    async rollback() { return { status: "rolled_back" }; }
  });
  const result = await publisher.publishReview({
    review: performanceReview,
    evidence: passingEvidence()
  });
  assert.equal(result.status, "owner_approval_required");
});

test("Release gate rolls back a merged deployment that fails post-deploy smoke", async () => {
  let rollbackCalls = 0;
  const publisher = createContractCheckedReleasePublisher({
    enabled: true,
    async publish() {
      return {
        status: "deployed",
        merged: true,
        deploymentId: "dpl_unhealthy",
        deploymentUrl: "https://bad.example",
        commitSha: "bad123",
        smokePassed: false
      };
    },
    async rollback(input) {
      rollbackCalls++;
      assert.equal(input.publication.deploymentId, "dpl_unhealthy");
      return { status: "rolled_back", revertCommitSha: "revert123" };
    }
  });

  const result = await publisher.publishReview({
    review: makeReview(),
    evidence: passingEvidence()
  });
  assert.equal(result.status, "rolled_back");
  assert.equal(result.productionChangesMade, false);
  assert.equal(rollbackCalls, 1);
});

test("Release gate is disabled by default and does not change production", async () => {
  let calls = 0;
  const publisher = createContractCheckedReleasePublisher({
    enabled: false,
    async publish() { calls++; return { status: "deployed" }; },
    async rollback() { return { status: "rolled_back" }; }
  });
  const result = await publisher.publishReview({
    review: makeReview(),
    evidence: passingEvidence()
  });
  assert.equal(result.status, "disabled");
  assert.equal(result.productionChangesMade, false);
  assert.equal(calls, 0);
});
