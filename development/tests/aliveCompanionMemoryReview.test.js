import test from "node:test";
import assert from "node:assert/strict";
import { createCompanionMemoryReviewService } from "../../alive/companion/memoryApprovalService.js";

const ownerId = "owner-1";
const identityId = "identity-1";
const proposal = {
  memoryId: "proposal-1", ownerId, identityId, category: "preference",
  content: "The owner may prefer a concise session summary.",
  tags: ["studio"], state: "proposed", source: "companion-suggested",
  visibility: "owner-only", trainingUse: false, crossWorldSharing: false,
  createdAt: "2026-11-20T00:00:00.000Z"
};

function setup() {
  const rows = [proposal];
  const identityService = {
    async get({ actorId, identityId: requested, requiredRole }) {
      if (actorId !== ownerId || requested !== identityId || requiredRole !== "owner") {
        const error = new Error("Access denied.");
        error.code = "ALIVE_IDENTITY_ACCESS_DENIED";
        throw error;
      }
      return {
        ownerId, identityId,
        privacy: { memoryAccess: "owner-only", trainingUse: false },
        memoryPolicy: { ownerControlled: true, sharing: "private" }
      };
    }
  };
  const repository = {
    async listPendingMemoryProposals() { return rows.filter(row => row.state === "proposed"); },
    async approveMemoryProposal({ ownerId: requestedOwner, identityId: requestedIdentity, memoryId }) {
      const row = rows.find(item => item.memoryId === memoryId && item.ownerId === requestedOwner &&
        item.identityId === requestedIdentity && item.state === "proposed");
      if (!row) return null;
      row.state = "approved";
      row.approvedBy = requestedOwner;
      row.approvedAt = "2026-11-20T00:01:00.000Z";
      return { ...row };
    },
    async archiveMemoryProposal({ ownerId: requestedOwner, identityId: requestedIdentity, memoryId }) {
      const row = rows.find(item => item.memoryId === memoryId && item.ownerId === requestedOwner &&
        item.identityId === requestedIdentity && item.state === "proposed");
      if (!row) return false;
      row.state = "archived";
      return true;
    }
  };
  return { service: createCompanionMemoryReviewService({ identityService, repository }), rows, repository };
}

test("owner can inspect pending Companion suggestions without adding them to approved memory", async () => {
  const { service } = setup();
  const pending = await service.listPending({ actorId: ownerId, identityId });
  assert.equal(pending.length, 1);
  assert.equal(pending[0].state, "proposed");
  assert.equal(pending[0].privacy.trainingUse, false);
  assert.equal(Object.isFrozen(pending[0]), true);
});

test("only explicit owner approval changes a proposed memory to approved", async () => {
  const { service, rows } = setup();
  const approved = await service.approve({ actorId: ownerId, identityId, memoryId: "proposal-1" });
  assert.equal(approved.state, "approved");
  assert.equal(approved.approvedBy, ownerId);
  assert.equal(rows[0].state, "approved");
  assert.equal(await service.approve({ actorId: ownerId, identityId, memoryId: "proposal-1" }), null);
});

test("owner can archive a proposed memory without approving it", async () => {
  const { service, rows } = setup();
  assert.equal(await service.archive({ actorId: ownerId, identityId, memoryId: "proposal-1" }), true);
  assert.equal(rows[0].state, "archived");
  assert.equal(await service.approve({ actorId: ownerId, identityId, memoryId: "proposal-1" }), null);
});

test("delegated and unrelated actors cannot inspect or approve proposals", async () => {
  const { service } = setup();
  for (const actorId of ["editor-1", "viewer-1", "stranger-1"]) {
    await assert.rejects(service.listPending({ actorId, identityId }));
    await assert.rejects(service.approve({ actorId, identityId, memoryId: "proposal-1" }));
    await assert.rejects(service.archive({ actorId, identityId, memoryId: "proposal-1" }));
  }
});

test("service rejects malformed, foreign, or non-proposal repository records", async () => {
  const { service, repository } = setup();
  repository.listPendingMemoryProposals = async () => [{
    ...proposal, ownerId: "foreign-owner"
  }];
  await assert.rejects(
    service.listPending({ actorId: ownerId, identityId }),
    error => error.code === "ALIVE_MEMORY_REVIEW_RECORD_INVALID"
  );
  repository.listPendingMemoryProposals = async () => [{
    ...proposal, source: "owner-stated"
  }];
  await assert.rejects(
    service.listPending({ actorId: ownerId, identityId }),
    error => error.code === "ALIVE_MEMORY_REVIEW_RECORD_INVALID"
  );
});
