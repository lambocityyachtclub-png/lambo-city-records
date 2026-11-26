/**
 * ALIVE — PostgreSQL task and owner-review storage.
 *
 * Uses the existing ALIVE development tables. Schema changes are managed by
 * an explicit migration; this adapter never alters the database at runtime.
 * Pass a server-side PostgreSQL pool. Never import into browser/game code.
 */

import { randomUUID } from "node:crypto";

const REVIEW_STATUSES = Object.freeze({
  PENDING: "awaiting_owner_review",
  APPROVED: "approved",
  REJECTED: "rejected"
});
const VALID_REVIEW_STATUSES = new Set(Object.values(REVIEW_STATUSES));
const MAX_TASK_STATE_BYTES = 8 * 1024 * 1024;
const MAX_REVIEW_BYTES = 2 * 1024 * 1024;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function requireText(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(label + " is required.");
  }
  return value.trim();
}

function serializeJson(value, label, maxBytes) {
  let json;
  try {
    json = JSON.stringify(value);
  } catch {
    throw new Error(label + " must be JSON serializable.");
  }
  if (typeof json !== "string" || Buffer.byteLength(json, "utf8") > maxBytes) {
    throw new Error(label + " exceeds the configured storage size limit.");
  }
  return json;
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
      `SELECT
         to_regclass('public.lambo_alive_task_state') IS NOT NULL AS task_table_ready,
         to_regclass('public.lambo_alive_reviews') IS NOT NULL AS review_table_ready,
         (
           SELECT pg_get_constraintdef(oid)
           FROM pg_constraint
           WHERE conrelid = to_regclass('public.lambo_alive_reviews')
             AND conname = 'lambo_alive_reviews_status_check'
         ) AS review_status_constraint`
    );
    const row = result.rows?.[0] || {};
    if (!row.task_table_ready || !row.review_table_ready) {
      throw new Error("ALIVE database schema is missing. Apply development/storage/migrations/001_alive_development_storage.sql.");
    }
    const constraint = String(row.review_status_constraint || "");
    if (!["awaiting_owner_review", "approved", "rejected"].every(status => constraint.includes(status))) {
      throw new Error("ALIVE review status constraint is incompatible. Apply the current ALIVE development storage migration.");
    }
    return Object.freeze({ ready: true, version: "1.0.0" });
  }

  async function load() {
    return serialize(async () => {
      const result = await pool.query(
        "SELECT tasks FROM public.lambo_alive_task_state WHERE state_key = $1",
        ["primary"]
      );
      if (!result.rows?.length) return [];
      const tasks = result.rows[0].tasks;
      if (!Array.isArray(tasks)) throw new Error("Stored ALIVE task state is invalid.");
      return clone(tasks);
    });
  }

  async function save(tasks) {
    return serialize(async () => {
      if (!Array.isArray(tasks)) throw new Error("Development tasks must be an array.");
      const json = serializeJson(clone(tasks), "Development task state", MAX_TASK_STATE_BYTES);
      await pool.query(
        `INSERT INTO public.lambo_alive_task_state (state_key, tasks, updated_at)
         VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (state_key) DO UPDATE
         SET tasks = EXCLUDED.tasks, updated_at = NOW()`,
        ["primary", json]
      );
    });
  }

  async function createReview(input = {}) {
    return serialize(async () => {
      const taskId = requireText(input.taskId, "Task ID");
      const taskTitle = requireText(input.taskTitle, "Task title");
      requireText(input.contractId, "ALIVE contract ID");
      requireText(input.contractVersion, "ALIVE contract version");
      requireText(input.autonomyLevel, "ALIVE autonomy level");
      if (!input.resourceMetrics || typeof input.resourceMetrics !== "object" || Array.isArray(input.resourceMetrics)) {
        throw new Error("Measured resource metrics are required for owner review.");
      }
      if (!Array.isArray(input.changedFiles) || input.changedFiles.length === 0) {
        throw new Error("A review must contain at least one changed file.");
      }
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
        status: REVIEW_STATUSES.PENDING,
        productionChangesMade: false,
        createdAt: now,
        updatedAt: now,
        decision: null
      };
      const json = serializeJson(review, "Owner review", MAX_REVIEW_BYTES);

      await pool.query(
        `INSERT INTO public.lambo_alive_reviews (id, task_id, status, review, created_at, updated_at)
         VALUES ($1, $2, $3, $4::jsonb, $5, $5)`,
        [review.id, taskId, review.status, json, now]
      );
      return clone(review);
    });
  }

  async function getReview(reviewId) {
    return serialize(async () => {
      const result = await pool.query(
        "SELECT review FROM public.lambo_alive_reviews WHERE id = $1",
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
      if (!Number.isInteger(offset) || offset < 0) {
        throw new Error("Review offset must be a non-negative integer.");
      }

      const result = status
        ? await pool.query(
            "SELECT review FROM public.lambo_alive_reviews WHERE status = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
            [status, limit, offset]
          )
        : await pool.query(
            "SELECT review FROM public.lambo_alive_reviews ORDER BY created_at DESC LIMIT $1 OFFSET $2",
            [limit, offset]
          );
      return (result.rows || []).map(row => clone(row.review));
    });
  }

  async function decideReview(input = {}) {
    return serialize(async () => {
      const reviewId = requireText(input.reviewId, "Review ID");
      const decision = requireText(input.decision, "Decision");
      if (![REVIEW_STATUSES.APPROVED, REVIEW_STATUSES.REJECTED].includes(decision)) {
        throw new Error("Decision must be approved or rejected.");
      }
      const ownerNote = input.ownerNote == null ? null : requireText(input.ownerNote, "Owner note");
      const client = typeof pool.connect === "function" ? await pool.connect() : null;
      const db = client || pool;
      let transactionOpen = false;
      try {
        await db.query("BEGIN");
        transactionOpen = true;
        const selected = await db.query(
          "SELECT review FROM public.lambo_alive_reviews WHERE id = $1 FOR UPDATE",
          [reviewId]
        );
        if (!selected.rows?.length) throw new Error("Review not found: " + reviewId);
        const review = clone(selected.rows[0].review);
        if (review.status !== REVIEW_STATUSES.PENDING) {
          throw new Error("This review has already received an owner decision.");
        }
        const now = new Date().toISOString();
        review.status = decision;
        review.updatedAt = now;
        review.decision = { status: decision, ownerNote, decidedAt: now };
        review.productionChangesMade = false;
        const json = serializeJson(review, "Owner review", MAX_REVIEW_BYTES);
        await db.query(
          "UPDATE public.lambo_alive_reviews SET status = $2, review = $3::jsonb, updated_at = $4 WHERE id = $1",
          [reviewId, decision, json, now]
        );
        await db.query("COMMIT");
        transactionOpen = false;
        return clone(review);
      } catch (error) {
        if (transactionOpen) await db.query("ROLLBACK").catch(() => {});
        throw error;
      } finally {
        client?.release();
      }
    });
  }

  return Object.freeze({
    version: "1.0.0",
    assertSchemaReady,
    load,
    save,
    createReview,
    getReview,
    listReviews,
    decideReview,
    REVIEW_STATUSES
  });
}
