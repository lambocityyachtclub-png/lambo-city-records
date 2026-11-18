/**
 * ALIVE — PostgreSQL task and owner-review storage.
 * The schema is managed by an explicit SQL migration; this adapter never
 * silently alters the database during a web request.
 */
import { randomUUID } from "node:crypto";

const VALID_REVIEW_STATUSES = new Set([
  "awaiting_owner_review",
  "approved",
  "rejected",
  "revision_requested"
]);

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

  let operationQueue = Promise.resolve();

  function serialize(operation) {
    const result = operationQueue.then(operation);
    operationQueue = result.catch(() => {});
    return result;
  }

  async function assertSchemaReady() {
    const result = await pool.query(
      \`SELECT
         to_regclass('public.lambo_alive_task_state') IS NOT NULL AS task_table_ready,
         to_regclass('public.lambo_alive_reviews') IS NOT NULL AS review_table_ready,
         (
           SELECT pg_get_constraintdef(oid)
           FROM pg_constraint
           WHERE conrelid = to_regclass('public.lambo_alive_reviews')
             AND conname = 'lambo_alive_reviews_status_check'
         ) AS review_status_constraint\`
    );
    const row = result.rows?.[0] || {};
    if (!row.task_table_ready || !row.review_table_ready) {
      throw new Error("ALIVE database schema is missing. Apply development/storage/migrations/001_alive_hosted_control_plane.sql.");
    }
    if (!String(row.review_status_constraint || "").includes("revision_requested")) {
      throw new Error("ALIVE review schema needs the revision_requested migration. Apply development/storage/migrations/001_alive_hosted_control_plane.sql.");
    }
    return { ready: true };
  }

  async function load() {
    const result = await pool.query(
      "SELECT tasks FROM lambo_alive_task_state WHERE state_key = $1",
      ["primary"]
    );
    if (!result.rows?.length) return [];
    const tasks = result.rows[0].tasks;
    if (!Array.isArray(tasks)) throw new Error("Stored ALIVE task state is invalid.");
    return clone(tasks);
  }

  async function save(tasks) {
    if (!Array.isArray(tasks)) throw new Error("Development tasks must be an array.");
    await pool.query(
      \`INSERT INTO lambo_alive_task_state (state_key, tasks, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (state_key) DO UPDATE
       SET tasks = EXCLUDED.tasks, updated_at = NOW()\`,
      ["primary", JSON.stringify(clone(tasks))]
    );
  }

  async function createReview(input = {}) {
    return serialize(async () => {
      const taskId = requireText(input.taskId, "Task ID");
      const taskTitle = requireText(input.taskTitle, "Task title");
      if (!Array.isArray(input.changedFiles)) throw new Error("changedFiles must be an array.");
      if (!input.testResults || input.testResults.passed !== true) {
        throw new Error("Only proposals with passing tests can enter owner review.");
      }
      const now = new Date().toISOString();
      const review = {
        ...clone(input),
        id: "review-" + randomUUID(),
        taskId,
        taskTitle,
        changedFiles: [...new Set(input.changedFiles.map(file => requireText(file, "Changed file")))],
        proposalFiles: Array.isArray(input.proposalFiles) ? clone(input.proposalFiles) : [],
        status: "awaiting_owner_review",
        productionChangesMade: false,
        createdAt: now,
        updatedAt: now,
        decision: null
      };
      await pool.query(
        \`INSERT INTO lambo_alive_reviews (id, task_id, status, review, created_at, updated_at)
         VALUES ($1, $2, $3, $4::jsonb, $5, $5)\`,
        [review.id, taskId, review.status, JSON.stringify(review), now]
      );
      return clone(review);
    });
  }

  async function getReview(reviewId) {
    return serialize(async () => {
      const result = await pool.query(
        "SELECT review FROM lambo_alive_reviews WHERE id = $1",
        [requireText(reviewId, "Review ID")]
      );
      return result.rows?.length ? clone(result.rows[0].review) : null;
    });
  }

  async function listReviews(filters = {}) {
    return serialize(async () => {
      const status = filters.status == null ? null : requireText(filters.status, "Review status");
      if (status && !VALID_REVIEW_STATUSES.has(status)) {
        throw new Error("Unsupported owner-review status.");
      }
      const limit = filters.limit == null ? 50 : Number(filters.limit);
      const offset = filters.offset == null ? 0 : Number(filters.offset);
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new Error("Review limit must be between 1 and 100.");
      }
      if (!Number.isInteger(offset) || offset < 0) throw new Error("Review offset must be non-negative.");

      const result = status
        ? await pool.query(
            "SELECT review FROM lambo_alive_reviews WHERE status = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
            [status, limit, offset]
          )
        : await pool.query(
            "SELECT review FROM lambo_alive_reviews ORDER BY created_at DESC LIMIT $1 OFFSET $2",
            [limit, offset]
          );
      return (result.rows || []).map(row => clone(row.review));
    });
  }

  async function updateReviewDecision(input = {}, status) {
    return serialize(async () => {
      const reviewId = requireText(input.reviewId, "Review ID");
      const ownerNote = input.ownerNote == null ? null : requireText(input.ownerNote, "Owner note");
      const client = typeof pool.connect === "function" ? await pool.connect() : null;
      const db = client || pool;
      try {
        await db.query("BEGIN");
        const selected = await db.query(
          "SELECT review FROM lambo_alive_reviews WHERE id = $1 FOR UPDATE",
          [reviewId]
        );
        if (!selected.rows?.length) throw new Error("Review not found: " + reviewId);
        const review = selected.rows[0].review;
        if (review.status !== "awaiting_owner_review") {
          throw new Error("This review has already received owner feedback.");
        }
        const now = new Date().toISOString();
        review.status = status;
        review.updatedAt = now;
        review.decision = { status, ownerNote, decidedAt: now };
        review.productionChangesMade = false;
        await db.query(
          "UPDATE lambo_alive_reviews SET status = $2, review = $3::jsonb, updated_at = $4 WHERE id = $1",
          [reviewId, status, JSON.stringify(review), now]
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

  async function decideReview(input = {}) {
    const decision = requireText(input.decision, "Decision");
    if (!["approved", "rejected"].includes(decision)) {
      throw new Error("Decision must be approved or rejected.");
    }
    return updateReviewDecision(input, decision);
  }

  async function requestRevision(input = {}) {
    return updateReviewDecision(input, "revision_requested");
  }

  return Object.freeze({
    version: "1.1.0",
    assertSchemaReady,
    load,
    save,
    createReview,
    getReview,
    listReviews,
    decideReview,
    requestRevision,
    REVIEW_STATUSES: Object.freeze({
      PENDING: "awaiting_owner_review",
      APPROVED: "approved",
      REJECTED: "rejected",
      REVISION_REQUESTED: "revision_requested"
    })
  });
}
