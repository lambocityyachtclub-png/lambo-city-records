/**
 * LAMBO CITY ALIVE — durable PostgreSQL task and review storage.
 *
 * Uses a caller-supplied pg-compatible pool. Schema creation is idempotent.
 * All task and review records live in PostgreSQL, not an ephemeral worker disk.
 */
import { randomUUID } from "node:crypto";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS lambo_alive_task_state (
  state_key TEXT PRIMARY KEY,
  tasks JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS lambo_alive_reviews (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('awaiting_owner_review', 'approved', 'rejected')),
  review JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS lambo_alive_reviews_status_created
  ON lambo_alive_reviews (status, created_at DESC);
CREATE INDEX IF NOT EXISTS lambo_alive_reviews_task
  ON lambo_alive_reviews (task_id);
`;

const REVIEW_STATUSES = Object.freeze({
  PENDING: "awaiting_owner_review",
  APPROVED: "approved",
  REJECTED: "rejected"
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function requireText(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(label + " is required.");
  }
  return value.trim();
}

export function createPostgresDevelopmentStorage(options = {}) {
  const pool = options.pool;
  if (!pool || typeof pool.query !== "function") {
    throw new Error("A PostgreSQL pool with query() is required.");
  }

  let schemaPromise;
  let operationQueue = Promise.resolve();

  async function ensureSchema() {
    if (!schemaPromise) {
      schemaPromise = pool.query(SCHEMA_SQL).catch(error => {
        schemaPromise = null;
        throw error;
      });
    }
    await schemaPromise;
  }

  function serialize(operation) {
    const result = operationQueue.then(operation);
    operationQueue = result.catch(() => {});
    return result;
  }

  async function load() {
    await ensureSchema();
    const result = await pool.query(
      "SELECT tasks FROM lambo_alive_task_state WHERE state_key = $1",
      ["primary"]
    );
    if (!result.rows.length) return [];
    const tasks = result.rows[0].tasks;
    if (!Array.isArray(tasks)) {
      throw new Error("Stored ALIVE task state is not an array.");
    }
    return clone(tasks);
  }

  async function save(tasks) {
    if (!Array.isArray(tasks)) {
      throw new Error("Development tasks must be an array.");
    }
    const snapshot = clone(tasks);
    await ensureSchema();
    await pool.query(
      `INSERT INTO lambo_alive_task_state (state_key, tasks, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (state_key) DO UPDATE
       SET tasks = EXCLUDED.tasks, updated_at = NOW()`,
      ["primary", JSON.stringify(snapshot)]
    );
  }

  async function createReview(input = {}) {
    return serialize(async () => {
      const taskId = requireText(input.taskId, "Task ID");
      const taskTitle = requireText(input.taskTitle, "Task title");
      if (!Array.isArray(input.changedFiles)) {
        throw new Error("changedFiles must be an array.");
      }
      if (!input.testResults || input.testResults.passed !== true) {
        throw new Error("Only proposals with passing tests can enter review.");
      }
      await ensureSchema();
      const now = new Date().toISOString();
      const review = {
        id: "review-" + randomUUID(),
        taskId,
        taskTitle,
        area: input.area || null,
        runner: input.runner || null,
        workspaceId: input.workspaceId || null,
        changedFiles: [...new Set(input.changedFiles.map(file => requireText(file, "Changed file")))],
        changes: input.changes || null,
        testResults: clone(input.testResults),
        status: REVIEW_STATUSES.PENDING,
        productionChangesMade: false,
        createdAt: now,
        updatedAt: now,
        decision: null
      };
      await pool.query(
        `INSERT INTO lambo_alive_reviews (id, task_id, status, review, created_at, updated_at)
         VALUES ($1, $2, $3, $4::jsonb, $5, $5)`,
        [review.id, taskId, review.status, JSON.stringify(review), now]
      );
      return clone(review);
    });
  }

  async function getReview(reviewId) {
    return serialize(async () => {
      await ensureSchema();
      const result = await pool.query(
        "SELECT review FROM lambo_alive_reviews WHERE id = $1",
        [requireText(reviewId, "Review ID")]
      );
      return result.rows.length ? clone(result.rows[0].review) : null;
    });
  }

  async function listReviews(filters = {}) {
    return serialize(async () => {
      await ensureSchema();
      const result = filters.status
        ? await pool.query(
            "SELECT review FROM lambo_alive_reviews WHERE status = $1 ORDER BY created_at DESC",
            [filters.status]
          )
        : await pool.query(
            "SELECT review FROM lambo_alive_reviews ORDER BY created_at DESC"
          );
      return result.rows.map(row => clone(row.review));
    });
  }

  async function decideReview(input = {}) {
    return serialize(async () => {
      const reviewId = requireText(input.reviewId, "Review ID");
      const decision = requireText(input.decision, "Decision");
      if (![REVIEW_STATUSES.APPROVED, REVIEW_STATUSES.REJECTED].includes(decision)) {
        throw new Error("Decision must be approved or rejected.");
      }
      const ownerNote = input.ownerNote == null
        ? null
        : requireText(input.ownerNote, "Owner note");
      await ensureSchema();
      const client = typeof pool.connect === "function" ? await pool.connect() : null;
      const db = client || pool;
      try {
        await db.query("BEGIN");
        const selected = await db.query(
          "SELECT review FROM lambo_alive_reviews WHERE id = $1 FOR UPDATE",
          [reviewId]
        );
        if (!selected.rows.length) throw new Error("Review not found: " + reviewId);
        const review = selected.rows[0].review;
        if (review.status !== REVIEW_STATUSES.PENDING) {
          throw new Error("This review has already received a decision.");
        }
        const now = new Date().toISOString();
        review.status = decision;
        review.updatedAt = now;
        review.decision = { status: decision, ownerNote, decidedAt: now };
        review.productionChangesMade = false;
        await db.query(
          "UPDATE lambo_alive_reviews SET status = $2, review = $3::jsonb, updated_at = $4 WHERE id = $1",
          [reviewId, decision, JSON.stringify(review), now]
        );
        await db.query("COMMIT");
        return clone(review);
      } catch (error) {
        await db.query("ROLLBACK").catch(() => {});
        throw error;
      } finally {
        client?.release();
      }
    });
  }

  return Object.freeze({
    version: "1.0.0",
    load,
    save,
    createReview,
    getReview,
    listReviews,
    decideReview,
    ensureSchema,
    REVIEW_STATUSES
  });
}
