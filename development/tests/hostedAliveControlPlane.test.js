import test from "node:test";
import assert from "node:assert/strict";
import {
  createHostedAliveControlPlane,
  withPostgresAdvisoryLock
} from "../runtime/hostedAliveControlPlane.js";

function createFakePool() {
  const state = {
    tasks: [],
    reviews: new Map(),
    statements: [],
    releases: 0
  };

  async function query(sql, params = []) {
    const normalized = sql.replace(/\s+/g, " ").trim();
    state.statements.push(normalized);

    if (normalized.startsWith("SELECT to_regclass")) {
      return { rows: [{
        task_table_ready: true,
        review_table_ready: true,
        review_status_constraint: "CHECK (status IN ('awaiting_owner_review', 'approved', 'rejected'))"
      }] };
    }
    if (normalized.startsWith("SELECT tasks FROM")) {
      return { rows: [{ tasks: state.tasks }] };
    }
    if (normalized.startsWith("INSERT INTO public.lambo_alive_task_state")) {
      state.tasks = JSON.parse(params[1]);
      return { rows: [] };
    }
    if (normalized.startsWith("INSERT INTO public.lambo_alive_reviews")) {
      state.reviews.set(params[0], JSON.parse(params[3]));
      return { rows: [] };
    }
    if (normalized.startsWith("SELECT review FROM public.lambo_alive_reviews WHERE id")) {
      const review = state.reviews.get(params[0]);
      return { rows: review ? [{ review }] : [] };
    }
    if (normalized.startsWith("SELECT review FROM public.lambo_alive_reviews WHERE status")) {
      const rows = [...state.reviews.values()]
        .filter(review => review.status === params[0])
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(params[2], params[2] + params[1])
        .map(review => ({ review }));
      return { rows };
    }
    if (normalized.startsWith("SELECT review FROM public.lambo_alive_reviews ORDER BY")) {
      const rows = [...state.reviews.values()]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(params[1], params[1] + params[0])
        .map(review => ({ review }));
      return { rows };
    }
    if (normalized.startsWith("UPDATE public.lambo_alive_reviews")) {
      state.reviews.set(params[0], JSON.parse(params[2]));
      return { rows: [] };
    }
    if (normalized.startsWith("SELECT pg_advisory_lock") || normalized.startsWith("SELECT pg_advisory_unlock")) {
      return { rows: [{ pg_advisory_lock: null, pg_advisory_unlock: true }] };
    }
    if (["BEGIN", "COMMIT", "ROLLBACK"].includes(normalized)) {
      return { rows: [] };
    }
    if (normalized.startsWith("SELECT review FROM public.lambo_alive_reviews WHERE id = $1 FOR UPDATE")) {
      const review = state.reviews.get(params[0]);
      return { rows: review ? [{ review }] : [] };
    }
    throw new Error("Unexpected SQL: " + normalized);
  }

  return {
    state,
    query,
    async connect() {
      return {
        query,
        release() { state.releases += 1; }
      };
    }
  };
}

test("Hosted ALIVE control plane restores and persists tasks through Neon", async () => {
  const pool = createFakePool();
  const controlPlane = createHostedAliveControlPlane({ pool });

  const first = await controlPlane.withSystem({}, async ({ system }) => {
    assert.equal(system.director.listTasks().length, 0);
    return system.submitWorldFinding({
      title: "Review Convention Center glass realism",
      description: "Inspect material response while preserving the approved building footprint.",
      area: "world_materials",
      type: "improvement",
      severity: "normal",
      filePaths: ["conferenceCenterDistrict.js"],
      acceptanceCriteria: ["Preserve the approved building footprint."]
    });
  });

  assert.equal(first.task.status, "queued");
  assert.equal(pool.state.tasks.length, 1);

  const restored = await controlPlane.withSystem({}, async ({ system }) => ({
    tasks: system.director.listTasks()
  }));
  assert.equal(restored.tasks.length, 1);
  assert.equal(restored.tasks[0].title, "Review Convention Center glass realism");
  assert.equal(pool.state.releases, 2);
  assert.equal(controlPlane.getSnapshot().persistentTaskStorage, true);
});

test("Hosted ALIVE control plane persists owner reviews and decisions", async () => {
  const pool = createFakePool();
  const controlPlane = createHostedAliveControlPlane({ pool });

  const review = await controlPlane.withSystem({}, async ({ storage }) => {
    return storage.createReview({
      taskId: "task-review-1",
      taskTitle: "Review a bounded world material proposal",
      contractId: "world-material-quality",
      contractVersion: "1.0.0",
      autonomyLevel: "trusted-operator",
      changedFiles: ["conferenceCenterDistrict.js"],
      resourceMetrics: { filesChanged: 1, linesAdded: 2, linesRemoved: 0 },
      testResults: { passed: true, total: 5, failed: 0 }
    });
  });
  assert.equal(review.status, "awaiting_owner_review");
  assert.equal(review.productionChangesMade, false);

  const decided = await controlPlane.withSystem({}, async ({ storage }) => {
    return storage.decideReview({
      reviewId: review.id,
      decision: "approved",
      ownerNote: "Approved for the next controlled step."
    });
  });
  assert.equal(decided.status, "approved");
  assert.equal(decided.productionChangesMade, false);

  const restored = await controlPlane.withSystem({}, async ({ storage }) => ({
    reviews: await storage.listReviews({ status: "approved" })
  }));
  assert.equal(restored.reviews.length, 1);
  assert.equal(restored.reviews[0].id, review.id);
  assert.equal(controlPlane.getSnapshot().persistentOwnerReviewStorage, true);
});

test("Hosted ALIVE control plane fails closed when execution is requested", async () => {
  const pool = createFakePool();
  const controlPlane = createHostedAliveControlPlane({ pool });
  await assert.rejects(
    () => controlPlane.withSystem({ execution: true }, async () => true),
    /code execution is not configured/
  );
  assert.equal(pool.state.releases, 0);
});

test("Postgres advisory lock uses a session lock and always releases", async () => {
  const pool = createFakePool();
  const result = await withPostgresAdvisoryLock(pool, async () => "completed", 1234);
  assert.equal(result, "completed");
  assert.ok(pool.state.statements.some(sql => sql.startsWith("SELECT pg_advisory_lock")));
  assert.ok(pool.state.statements.some(sql => sql.startsWith("SELECT pg_advisory_unlock")));
  assert.equal(pool.state.statements.includes("BEGIN"), false);
  assert.equal(pool.state.releases, 1);
});

test("Postgres advisory lock releases the connection when the operation fails", async () => {
  const pool = createFakePool();
  await assert.rejects(
    () => withPostgresAdvisoryLock(pool, async () => { throw new Error("expected failure"); }, 1234),
    /expected failure/
  );
  assert.ok(pool.state.statements.some(sql => sql.startsWith("SELECT pg_advisory_unlock")));
  assert.equal(pool.state.releases, 1);
});
