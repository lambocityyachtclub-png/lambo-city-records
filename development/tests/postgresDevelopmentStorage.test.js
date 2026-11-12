import test from "node:test";
import assert from "node:assert/strict";
import { createPostgresDevelopmentStorage } from "../storage/postgresDevelopmentStorage.js";

function makePool() {
  const tasks = new Map();
  const reviews = new Map();
  return {
    async query(sql, values = []) {
      const q = sql.replace(/\s+/g, " ").trim();
      if (q.startsWith("CREATE TABLE") || q.startsWith("CREATE INDEX")) return { rows: [] };
      if (q.startsWith("SELECT tasks")) {
        return { rows: tasks.has(values[0]) ? [{ tasks: tasks.get(values[0]) }] : [] };
      }
      if (q.startsWith("INSERT INTO lambo_alive_task_state")) {
        tasks.set(values[0], JSON.parse(values[1]));
        return { rows: [] };
      }
      if (q.startsWith("INSERT INTO lambo_alive_reviews")) {
        const review = JSON.parse(values[3]);
        reviews.set(values[0], review);
        return { rows: [] };
      }
      if (q.startsWith("SELECT review FROM lambo_alive_reviews WHERE id")) {
        return { rows: reviews.has(values[0]) ? [{ review: reviews.get(values[0]) }] : [] };
      }
      if (q.startsWith("SELECT review FROM lambo_alive_reviews WHERE status")) {
        return { rows: [...reviews.values()].filter(r => r.status === values[0]).map(review => ({ review })) };
      }
      if (q.startsWith("SELECT review FROM lambo_alive_reviews ORDER")) {
        return { rows: [...reviews.values()].map(review => ({ review })) };
      }
      if (q.startsWith("SELECT review FROM lambo_alive_reviews WHERE id = $1 FOR UPDATE")) {
        return { rows: reviews.has(values[0]) ? [{ review: reviews.get(values[0]) }] : [] };
      }
      if (q.startsWith("UPDATE lambo_alive_reviews")) {
        reviews.set(values[0], JSON.parse(values[2]));
        return { rows: [] };
      }
      if (q === "BEGIN" || q === "COMMIT" || q === "ROLLBACK") return { rows: [] };
      throw new Error("Unexpected SQL in test: " + q);
    }
  };
}

test("PostgreSQL adapter persists task snapshots across adapter instances", async () => {
  const pool = makePool();
  const first = createPostgresDevelopmentStorage({ pool });
  await first.save([{ id: "task-1", status: "queued" }]);
  const second = createPostgresDevelopmentStorage({ pool });
  assert.deepEqual(await second.load(), [{ id: "task-1", status: "queued" }]);
});

test("PostgreSQL adapter stores review records and decisions durably", async () => {
  const pool = makePool();
  const storage = createPostgresDevelopmentStorage({ pool });
  const review = await storage.createReview({
    taskId: "task-1",
    taskTitle: "Improve module",
    changedFiles: ["development/example.js"],
    testResults: { passed: true }
  });
  assert.equal((await storage.getReview(review.id)).status, "awaiting_owner_review");
  const decided = await storage.decideReview({ reviewId: review.id, decision: "approved" });
  assert.equal(decided.status, "approved");
  assert.equal(decided.productionChangesMade, false);
  await assert.rejects(
    storage.decideReview({ reviewId: review.id, decision: "rejected" }),
    /already received a decision/
  );
});

test("PostgreSQL adapter rejects reviews with failing tests", async () => {
  const storage = createPostgresDevelopmentStorage({ pool: makePool() });
  await assert.rejects(storage.createReview({
    taskId: "task-1", taskTitle: "Unsafe", changedFiles: [],
    testResults: { passed: false }
  }), /Only proposals with passing tests/);
});

test("PostgreSQL adapter requires a database pool", () => {
  assert.throws(() => createPostgresDevelopmentStorage(), /pool/);
});
