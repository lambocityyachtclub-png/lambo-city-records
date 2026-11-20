import test from "node:test";
import assert from "node:assert/strict";
import { createPostgresCompanionMemoryReviewRepository } from "../../alive/companion/postgresCompanionMemoryReviewRepository.js";

function fakePool() {
  const calls = [];
  const rows = [{
    memory_id: "proposal-1", owner_id: "owner-1", identity_id: "identity-1",
    category: "fact", content: "A suggested memory.", tags: ["tag"],
    state: "proposed", source: "companion-suggested", visibility: "owner-only",
    training_use: false, created_at: new Date("2026-11-20T00:00:00.000Z"),
    approved_at: null, approved_by: null
  }];
  return {
    calls,
    async query(sql, values) {
      calls.push({ sql, values });
      if (sql.includes("SELECT memory_id")) return { rows: rows.filter(row => row.state === "proposed") };
      if (sql.includes("SET state = 'approved'")) {
        const row = rows.find(item => item.memory_id === values[2] && item.owner_id === values[0] &&
          item.identity_id === values[1] && item.state === "proposed");
        if (!row) return { rows: [] };
        row.state = "approved"; row.approved_by = values[0];
        row.approved_at = new Date("2026-11-20T00:01:00.000Z");
        return { rows: [{ ...row }] };
      }
      if (sql.includes("SET state = 'archived'")) {
        const row = rows.find(item => item.memory_id === values[2] && item.owner_id === values[0] &&
          item.identity_id === values[1] && item.state === "proposed");
        if (!row) return { rows: [] };
        row.state = "archived";
        return { rows: [{ memory_id: row.memory_id }] };
      }
      throw new Error("Unexpected SQL");
    }
  };
}

test("pending query is scoped to owner, identity, proposed state, and Companion source", async () => {
  const pool = fakePool();
  const repository = createPostgresCompanionMemoryReviewRepository(pool);
  const pending = await repository.listPendingMemoryProposals({ ownerId: "owner-1", identityId: "identity-1" });
  assert.equal(pending.length, 1);
  assert.equal(pending[0].source, "companion-suggested");
  assert.match(pool.calls[0].sql, /owner_id = \$1 AND identity_id = \$2/);
  assert.match(pool.calls[0].sql, /state = 'proposed' AND source = 'companion-suggested'/);
});

test("approval is an atomic conditional state transition attributed to the owner", async () => {
  const pool = fakePool();
  const repository = createPostgresCompanionMemoryReviewRepository(pool);
  const approved = await repository.approveMemoryProposal({
    ownerId: "owner-1", identityId: "identity-1", memoryId: "proposal-1"
  });
  assert.equal(approved.state, "approved");
  assert.equal(approved.approvedBy, "owner-1");
  assert.match(pool.calls[0].sql, /state = 'proposed' AND source = 'companion-suggested'/);
  assert.match(pool.calls[0].sql, /approved_by = \$1/);
});

test("archive is scoped and only transitions pending Companion proposals", async () => {
  const pool = fakePool();
  const repository = createPostgresCompanionMemoryReviewRepository(pool);
  assert.equal(await repository.archiveMemoryProposal({
    ownerId: "owner-1", identityId: "identity-1", memoryId: "proposal-1"
  }), true);
  assert.match(pool.calls[0].sql, /state = 'proposed' AND source = 'companion-suggested'/);
});

test("repository rejects missing scope before querying", async () => {
  const pool = fakePool();
  const repository = createPostgresCompanionMemoryReviewRepository(pool);
  await assert.rejects(repository.listPendingMemoryProposals({ ownerId: "", identityId: "identity-1" }));
  assert.equal(pool.calls.length, 0);
});
