/**
 * ALIVE — contract-checked low-risk release gate.
 *
 * This module does not create branches, merge pull requests, or deploy by
 * itself. It authorizes an injected publisher only when the canonical Living
 * Contract, risk level, resource budget, test results, runtime smoke check,
 * visual review, and rollback readiness all pass.
 */
import {
  evaluateProjectAction,
  getProjectContract,
  listProjectContracts
} from "../../alive/contracts/projectContracts.js";

function isAllowedPath(filePath, allowedPaths) {
  if (typeof filePath !== "string" || !filePath.trim()) return false;
  const normalized = filePath.replace(/\\/g, "/");
  if (
    normalized.startsWith("/") ||
    normalized.includes(String.fromCharCode(0)) ||
    normalized.split("/").some(part => !part || part === "." || part === "..")
  ) return false;
  return allowedPaths.some(allowed => {
    const prefix = allowed.replace(/\\/g, "/").replace(/\/$/, "");
    return normalized === prefix || normalized.startsWith(prefix + "/");
  });
}

function pathsAreAllowed(paths, allowedPaths) {
  return Array.isArray(paths) && paths.length > 0 &&
    paths.every(filePath => isAllowedPath(filePath, allowedPaths));
}

function hasResourceMetrics(metrics) {
  return Boolean(
    metrics &&
    Number.isFinite(metrics.changedFiles) &&
    Number.isFinite(metrics.linesChanged) &&
    Number.isFinite(metrics.newDependencies) &&
    Number.isFinite(metrics.addedRuntimeLights) &&
    Number.isFinite(metrics.maxTextureDimension) &&
    Number.isFinite(metrics.maxAddedFrameLoopWorkMs)
  );
}

export function createContractCheckedReleasePublisher(options = {}) {
  const enabled = options.enabled ?? process.env.ALIVE_AUTONOMOUS_RELEASES_ENABLED === "true";
  const publish = options.publish;
  const rollback = options.rollback;
  const inFlight = new Set();
  const completed = new Map();

  async function publishReview(input = {}) {
    const review = input.review;
    if (!enabled) {
      return Object.freeze({ status: "disabled", productionChangesMade: false });
    }
    if (!review || typeof review !== "object") {
      throw new Error("A complete ALIVE owner-review record is required.");
    }
    const reviewId = typeof review.id === "string" ? review.id.trim() : "";
    if (!reviewId) throw new Error("The ALIVE review ID is required.");
    if (completed.has(reviewId)) return completed.get(reviewId);
    if (inFlight.has(reviewId)) {
      return Object.freeze({ status: "already_in_progress", reviewId, productionChangesMade: false });
    }
    if (review.status !== "awaiting_owner_review") {
      return Object.freeze({
        status: "not_pending_review",
        reviewId,
        reviewStatus: review.status || "unknown",
        productionChangesMade: false
      });
    }

    const contract = getProjectContract(review.contractId);
    if (!contract) {
      return Object.freeze({ status: "denied", reviewId, reason: "Unknown project contract.", productionChangesMade: false });
    }
    if (input.evidence?.protectedScopeTouched !== false) {
      return Object.freeze({
        status: "owner_approval_required",
        reviewId,
        reason: "Protected-scope status must be explicitly verified as false.",
        productionChangesMade: false
      });
    }

    const changedPaths = Array.isArray(review.changedFiles) ? review.changedFiles : [];
    const metrics = review.resourceMetrics || {};
    const evidence = {
      contract_version_match: review.contractVersion === contract.version,
      changed_paths_within_allowlist: pathsAreAllowed(changedPaths, contract.allowedPaths),
      automated_tests_passed: review.testResults?.passed === true,
      runtime_smoke_passed: input.evidence?.runtimeSmokePassed === true,
      visual_quality_review_passed: input.evidence?.visualQualityReviewPassed === true,
      resource_budget_passed: hasResourceMetrics(metrics),
      rollback_ready: typeof rollback === "function",
      changedPaths,
      risk: review.risk,
      protectedScopeTouched: false,
      ...metrics
    };

    const decision = evaluateProjectAction(
      review.contractId,
      "deploy_production_low_risk",
      evidence
    );
    if (!decision.authorized) {
      return Object.freeze({
        status: decision.decision,
        reviewId,
        contractId: review.contractId,
        reason: decision.reason,
        missingEvidence: decision.missingEvidence || [],
        productionChangesMade: false
      });
    }
    if (typeof publish !== "function") {
      return Object.freeze({
        status: "publisher_unavailable",
        reviewId,
        contractId: review.contractId,
        reason: "No verified GitHub/Vercel release adapter is connected.",
        productionChangesMade: false
      });
    }

    inFlight.add(reviewId);
    try {
      const publication = await publish({
        review,
        contract,
        evidence,
        idempotencyKey: reviewId
      });
      if (
        publication?.status === "deployed" &&
        publication.smokePassed === true &&
        typeof publication.deploymentId === "string" &&
        typeof publication.deploymentUrl === "string" &&
        typeof publication.commitSha === "string"
      ) {
        const result = Object.freeze({
          status: "deployed",
          reviewId,
          contractId: contract.id,
          contractVersion: contract.version,
          deploymentId: publication.deploymentId,
          deploymentUrl: publication.deploymentUrl,
          commitSha: publication.commitSha,
          productionChangesMade: true,
          rollbackAvailable: true
        });
        completed.set(reviewId, result);
        return result;
      }

      if (publication?.merged === true && typeof rollback === "function") {
        try {
          const rollbackResult = await rollback({
            review,
            publication,
            reason: "The production deployment did not pass its post-deploy smoke check."
          });
          return Object.freeze({
            status: rollbackResult?.status === "rolled_back" ? "rolled_back" : "rollback_unverified",
            reviewId,
            deploymentId: publication.deploymentId || null,
            rollback: rollbackResult || null,
            productionChangesMade: rollbackResult?.status !== "rolled_back"
          });
        } catch (error) {
          return Object.freeze({
            status: "rollback_failed",
            reviewId,
            deploymentId: publication.deploymentId || null,
            reason: error.message || "Rollback failed.",
            productionChangesMade: true
          });
        }
      }

      return Object.freeze({
        status: "publication_unverified",
        reviewId,
        reason: "The release adapter did not return a verified healthy production deployment.",
        productionChangesMade: publication?.merged === true
      });
    } finally {
      inFlight.delete(reviewId);
    }
  }

  return Object.freeze({
    version: "1.0.0",
    getSnapshot() {
      return Object.freeze({
        enabled,
        supportedContracts: listProjectContracts()
          .filter(contract => contract.productionDeployment === "low-risk-preauthorized")
          .map(contract => contract.id),
        requiresEvidence: [
          "contract_version_match",
          "changed_paths_within_allowlist",
          "automated_tests_passed",
          "runtime_smoke_passed",
          "visual_quality_review_passed",
          "resource_budget_passed",
          "rollback_ready"
        ],
        publisherConnected: typeof publish === "function",
        rollbackConnected: typeof rollback === "function"
      });
    },
    publishReview
  });
}
