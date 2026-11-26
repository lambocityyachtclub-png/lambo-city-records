import test from "node:test";
import assert from "node:assert/strict";
import { createPostgresDevelopmentStorage } from "../storage/postgresDevelopmentStorage.js";

function createFakePool(options = {}) {
  const state = {
    tasks: [],
    taskStateExists: options.taskStateExists !== false,
    reviewTableExists: options.reviewTableExists !== false,
    constraint: options.constraint || "CHECK (status IN ('awaiting_owner_review', 'approved', 'rejected'))",
    reviews: new Map(),
    statements: []
  };

  async function query(sql, params = []) {
    const normalized = sql.replace(/\s+/g, " ").trim();
    state.statements.push(normalized);

    if (normalized.startsWith("SELECT to_regclass")) {
      return { rows: [{
        task_table_ready: state.taskStateExists,
        review_table_ready: state.reviewTableExists,
        review_status_constraint: state.constraint
      }] };
    }
    if (normalized.startsWith("SELECT tasks FROM")) {
      return { rows: state.taskStateExists ? [{ tasks: state.tasks }] : [] };
    }
    if (normalized.startsWith("INSERT INTO public.lambo_alive_task_state")) {
      state.tasks = JSON.parse(params[1]);
      return { rows: [] };
    }
    if (normalized.startsWith("INSERT INTO public.lambo_alive_reviews")) {
      const review = JSON.parse(params[3]);
      state.reviews.set(params[0], review);
      return { rows: [] };
    }
    if (normalized.startsWith("SELECT review FROM public.lambo_alive_reviews WHERE id")) {
      const review = state.reviews.get(params[0]);
      return { rows: review ? [{ review }] : [] };
    }
    if (normalized.startsWith("SELECT review FROM public.lambo_alive_reviews WHERE status")) {
      const reviews = [...state.reviews.values()]
        .filter(review => review.status === params[0])
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(params[2], params[2] + params[1]);
      return { rows: reviews.map(review => ({ review })) };
    }
    if (normalized.startsWith("SELECT review FROM public.lambo_alive_reviews ORDER BY")) {
      const reviews = [...state.reviews.values()]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(params[1], params[1] + params[0]);
      return { rows: reviews.map(review => ({ review })) };
    }
    if (normalized.startsWith("UPDATE public.lambo_alive_reviews")) {
      const review = state.reviews.get(params[0]);
      if (review) state.reviews.set(params[0], JSON.parse(params[2]));
      return { rows: [] };
    }
    if (["BEGIN", "COMMIT", "ROLLBACK"].includes(normalized)) return { rows: [] };
    throw new Error("Unexpected SQL in fake pool: " + normalized);
  }

  return {
    state,
    query,
    async connect() {
      return { query, release() {} };
    }
  };
}

test("Postgres storage checks the existing ALIVE schema without changing it", async () => {
  const pool = createFakePool();
  const storage = createPostgresDevelopmentStorage({ pool });
  const result = await storage.assertSchemaReady();
  assert.equal(result.ready, true);
  assert.ok(pool.state.statements.every(sql => /^SELECT\b/i.test(sql)));
});

test("Postgres storage fails closed when required tables are missing", async () => {
  const pool = createFakePool({ taskStateExists: false });
  const storage = createPostgresDevelopmentStorage({ pool });
  await assert.rejects(() => storage.assertSchemaReady(), /schema is missing/);
});

test("Postgres storage rejects an incompatible review status constraint", async () => {
  const pool = createFakePool({ constraint: "CHECK (status IN ('awaiting_owner_review', 'approved'))" });
  const storage = createPostgresDevelopmentStorage({ pool });
  await assert.rejects(() => storage.assertSchemaReady(), /status constraint is incompatible/);
});

test("Postgres storage persists and restores task snapshots", async () => {
  const pool = createFakePool();
  const storage = createPostgresDevelopmentStorage({ pool });
  const tasks = [{ id: "task-1", contractId: "world-material-quality", status: "queued" }];
  await storage.save(tasks);
  tasks[0].status = "changed-after-save";
  const restored = await storage.load();
  assert.equal(restored[0].status, "queued");
  assert.ok(pool.state.statements.some(sql => sql.startsWith("INSERT INTO public.lambo_alive_task_state")));
});

test("Postgres storage creates, lists, retrieves, and decides owner reviews", async () => {
  const pool = createFakePool();
  const storage = createPostgresDevelopmentStorage({ pool });
  const created = await storage.createReview({
    taskId: "task-42",
    taskTitle: "Improve Convention Center glass",
    area: "world_materials",
    runner: "world",
    contractId: "world-material-quality",
    contractVersion: "1.0.0",
    autonomyLevel: "trusted_operator",
    resourceMetrics: { changedFiles: 1, linesChanged: 24, newDependencies: 0, addedRuntimeLights: 0, maxTextureDimension: 1024 },
    changedFiles: ["conferenceCenterDistrict.js"],
    changes: { summary: "Material-only proposal." },
    testResults: { passed: true, total: 4, failed: 0 }
  });

  assert.equal(created.status, "awaiting_owner_review");
  assert.equal(created.productionChangesMade, false);
  assert.equal((await storage.getReview(created.id)).contractId, "world-material-quality");
  assert.equal((await storage.listReviews({ status: "awaiting_owner_review" })).length, 1);

  const decided = await storage.decideReview({
    reviewId: created.id,
    decision: "approved",
    ownerNote: "Looks good for a separate approved branch."
  });
  assert.equal(decided.status, "approved");
  assert.equal(decided.decision.ownerNote, "Looks good for a separate approved branch.");
  assert.equal(decided.productionChangesMade, false);
  assert.equal((await storage.listReviews({ status: "awaiting_owner_review" })).length, 0);
  assert.equal((await storage.listReviews({ status: "approved" })).length, 1);
});

test("Postgres storage refuses reviews with failed tests or unsupported states", async () => {
  const storage = createPostgresDevelopmentStorage({ pool: createFakePool() });
  await assert.rejects(() => storage.createReview({
    taskId: "task-failed",
    taskTitle: "Failed proposal",
    contractId: "alive-development-core",
    contractVersion: "1.0.0",
    autonomyLevel: "builder",
    resourceMetrics: { changedFiles: 1, linesChanged: 24, newDependencies: 0 },
    changedFiles: ["development/example.js"],
    testResults: { passed: false }
  }), /passing tests/);
  await assert.rejects(() => storage.listReviews({ status: "revision_requested" }), /Unsupported owner-review status/);
});

test("Postgres storage prevents a second owner decision", async () => {
  const storage = createPostgresDevelopmentStorage({ pool: createFakePool() });
  const review = await storage.createReview({
    taskId: "task-2",
    taskTitle: "Another proposal",
    contractId: "alive-development-core",
    contractVersion: "1.0.0",
    autonomyLevel: "builder",
    resourceMetrics: { changedFiles: 1, linesChanged: 24, newDependencies: 0 },
    changedFiles: ["development/example.js"],
    testResults: { passed: true }
  });
  await storage.decideReview({ reviewId: review.id, decision: "rejected", ownerNote: "Needs more work." });
  await assert.rejects(
    () => storage.decideReview({ reviewId: review.id, decision: "approved" }),
    /already received/
  );
});
