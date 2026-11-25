import test from "node:test";
import assert from "node:assert/strict";
import { withPostgresAdvisoryLock } from "../runtime/hostedAliveControlPlane.js";

function fakePool() {
  const calls = [];
  let released = false;
  const client = {
    async query(sql, values) { calls.push({ sql, values }); return { rows: [] }; },
    release() { released = true; }
  };
  return {
    calls,
    get released() { return released; },
    async connect() { return client; }
  };
}

test("hosted ALIVE serializes operations with a transaction-scoped advisory lock", async () => {
  const pool = fakePool();
  const value = await withPostgresAdvisoryLock(pool, async () => {
    pool.calls.push({ operation: "run" });
    return "completed";
  }, 1234);
  assert.equal(value, "completed");
  assert.deepEqual(pool.calls.map(call => call.sql || call.operation), [
    "BEGIN",
    "SELECT pg_advisory_xact_lock($1::bigint)",
    "run",
    "COMMIT"
  ]);
  assert.deepEqual(pool.calls[1].values, [1234]);
  assert.equal(pool.released, true);
});

test("hosted ALIVE rolls back and releases the advisory lock after an operation failure", async () => {
  const pool = fakePool();
  await assert.rejects(
    withPostgresAdvisoryLock(pool, async () => { throw new Error("controlled failure"); }),
    /controlled failure/
  );
  assert.deepEqual(pool.calls.map(call => call.sql), [
    "BEGIN",
    "SELECT pg_advisory_xact_lock($1::bigint)",
    "ROLLBACK"
  ]);
  assert.equal(pool.released, true);
});

test("scheduled ALIVE resolves only the verified configured owner account", async () => {
  let query;
  const owner = await (await import("../runtime/hostedAliveControlPlane.js")).getVerifiedAliveOwner({
    async query(sql, values) {
      query = { sql, values };
      return { rows: [{ id: "owner-123", email: "owner@example.com" }] };
    }
  }, "OWNER@example.com");
  assert.deepEqual(owner, { id: "owner-123", email: "owner@example.com", emailVerified: true });
  assert.match(query.sql, /"emailVerified" = true/);
  assert.deepEqual(query.values, ["OWNER@example.com"]);
});

test("scheduled ALIVE refuses to run without a verified owner account", async () => {
  const module = await import("../runtime/hostedAliveControlPlane.js");
  await assert.rejects(
    module.getVerifiedAliveOwner({ async query() { return { rows: [] }; } }, "owner@example.com"),
    /verified ALIVE owner account/
  );
});
