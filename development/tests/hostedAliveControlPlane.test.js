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
