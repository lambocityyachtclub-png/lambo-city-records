import test from "node:test";
import assert from "node:assert/strict";
import { createPostgresDevelopmentStorage } from "../storage/postgresDevelopmentStorage.js";

test("PostgreSQL storage verifies the hosted control-plane migration without changing schema", async () => {
  let queries = 0;
  const pool = {
    async query() {
      queries += 1;
      return { rows: [{
        task_table_ready: true,
        review_table_ready: true,
        review_status_constraint: "CHECK (status IN ('awaiting_owner_review','approved','rejected','revision_requested'))"
      }] };
    }
  };
  const storage = createPostgresDevelopmentStorage({ pool });
  assert.deepEqual(await storage.assertSchemaReady(), { ready: true });
  assert.equal(queries, 1);
});

test("PostgreSQL storage refuses the old review constraint until the migration is applied", async () => {
  const pool = {
    async query() {
      return { rows: [{
        task_table_ready: true,
        review_table_ready: true,
        review_status_constraint: "CHECK (status IN ('awaiting_owner_review','approved','rejected'))"
      }] };
    }
  };
  const storage = createPostgresDevelopmentStorage({ pool });
  await assert.rejects(storage.assertSchemaReady(), /revision_requested migration/);
});

test("PostgreSQL task storage reads and writes the durable task snapshot", async () => {
  const calls = [];
  const pool = {
    async query(sql, params) {
      calls.push({ sql, params });
      if (sql.startsWith("SELECT tasks")) return { rows: [{ tasks: [{ id: "task-1" }] }] };
      return { rows: [] };
    }
  };
  const storage = createPostgresDevelopmentStorage({ pool });
  assert.deepEqual(await storage.load(), [{ id: "task-1" }]);
  await storage.save([{ id: "task-2" }]);
  assert.equal(calls.length, 2);
  assert.match(calls[1].sql, /ON CONFLICT/);
  assert.equal(calls[1].params[1], JSON.stringify([{ id: "task-2" }]));
});

test("PostgreSQL review storage preserves proposal source files for owner inspection", async () => {
  let inserted;
  const pool = {
    async query(sql, params) {
      if (sql.includes("INSERT INTO lambo_alive_reviews")) inserted = JSON.parse(params[3]);
      return { rows: [] };
    }
  };
  const storage = createPostgresDevelopmentStorage({ pool });
  const review = await storage.createReview({
    taskId: "task-1",
    taskTitle: "Improve marina detail",
    changedFiles: ["water.js"],
    proposalFiles: [{ path: "water.js", content: "export const water = true;" }],
    testResults: { passed: true, total: 2, failed: 0 }
  });
  assert.equal(review.status, "awaiting_owner_review");
  assert.deepEqual(inserted.proposalFiles, [{ path: "water.js", content: "export const water = true;" }]);
  assert.equal(inserted.productionChangesMade, false);
});
