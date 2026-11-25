/**
 * ALIVE — LOCAL REVIEW STORE
 *
 * Small filesystem-backed review queue for local, owner-controlled execution.
 * Review records are written atomically outside the Git worktree. This module
 * never approves, merges, commits, or deploys a proposal.
 */
import { mkdir, readFile, readdir, realpath, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

function requireDirectory(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("A review directory is required.");
  }
  return path.resolve(value);
}

function safeId(value) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]+$/.test(value)) {
    throw new Error("Invalid review ID.");
  }
  return value;
}

export function createLocalJsonReviewStore(options = {}) {
  const directory = requireDirectory(options.directory);
  const repositoryRoot = options.repositoryRoot ? path.resolve(options.repositoryRoot) : null;

  async function ensureDirectory() {
    await mkdir(directory, { recursive: true });
    if (repositoryRoot) {
      const [repoRealPath, reviewRealPath] = await Promise.all([
        realpath(repositoryRoot),
        realpath(directory)
      ]);
      const relative = path.relative(repoRealPath, reviewRealPath);
      if (!relative || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))) {
        throw new Error("The persistent review directory must be outside the Git repository.");
      }
    }
  }

  async function createReview(review) {
    if (!review || typeof review !== "object" || Array.isArray(review)) {
      throw new Error("A review record is required.");
    }
    await ensureDirectory();
    const id = `review_${Date.now()}_${randomUUID().slice(0, 8)}`;
    const record = {
      ...review,
      id,
      status: "awaiting_owner_review",
      productionChangesMade: false,
      createdAt: review.createdAt || new Date().toISOString()
    };
    const target = path.join(directory, `${id}.json`);
    const temporary = path.join(directory, `.${id}.tmp`);
    await writeFile(temporary, JSON.stringify(record, null, 2), {
      encoding: "utf8",
      flag: "wx"
    });
    await rename(temporary, target);
    return structuredClone(record);
  }

  async function getReview(id) {
    await ensureDirectory();
    const filePath = path.join(directory, `${safeId(id)}.json`);
    try {
      return JSON.parse(await readFile(filePath, "utf8"));
    } catch (error) {
      if (error.code === "ENOENT") return null;
      throw error;
    }
  }

  async function listReviews() {
    await ensureDirectory();
    const names = (await readdir(directory))
      .filter(name => /^review_[a-zA-Z0-9_-]+\.json$/.test(name))
      .sort();
    const records = [];
    for (const name of names) {
      records.push(JSON.parse(await readFile(path.join(directory, name), "utf8")));
    }
    return records;
  }

  async function decideReview(id, decision, metadata = {}) {
    const reviewId = safeId(id);
    const decidedBy = typeof metadata.decidedBy === "string" ? metadata.decidedBy.trim() : "";
    if (!decidedBy) throw new Error("A verified owner identity (decidedBy) is required.");
    if (decision !== "approved" && decision !== "rejected") throw new Error("Unsupported review decision.");
    const reason = typeof metadata.reason === "string" ? metadata.reason.trim() : "";
    if (decision === "rejected" && !reason) throw new Error("A reason is required when rejecting a review.");
    await ensureDirectory();
    const lockPath = path.join(directory, "." + reviewId + ".lock");
    let lockHandle;
    try { lockHandle = await (await import("node:fs/promises")).open(lockPath, "wx"); }
    catch (error) { if (error.code === "EEXIST") throw new Error("This review is already being decided."); throw error; }
    try {
      const filePath = path.join(directory, reviewId + ".json");
      let record;
      try { record = JSON.parse(await readFile(filePath, "utf8")); }
      catch (error) { if (error.code === "ENOENT") return null; throw error; }
      if (record.status !== "awaiting_owner_review") throw new Error("Only reviews awaiting owner review can receive a decision.");
      if (decision === "approved") {
        if (record.testResults?.passed !== true) throw new Error("A review cannot be approved unless its recorded automated tests passed.");
        if (!Array.isArray(record.changes?.fileChanges) || record.changes.fileChanges.length === 0) throw new Error("A review cannot be approved without its complete proposed file contents.");
      }
      const updated = { ...record, status: decision, decision: { status: decision, decidedBy, decidedAt: new Date().toISOString(), ...(reason ? { reason } : {}) }, productionChangesMade: false };
      const temporary = path.join(directory, "." + reviewId + "." + randomUUID().slice(0, 8) + ".tmp");
      await writeFile(temporary, JSON.stringify(updated, null, 2), { encoding: "utf8", flag: "wx" });
      await rename(temporary, filePath);
      return structuredClone(updated);
    } finally {
      await lockHandle.close();
      const { rm } = await import("node:fs/promises");
      await rm(lockPath, { force: true });
    }
  }

  async function approveReview(id, metadata = {}) { return decideReview(id, "approved", metadata); }
  async function rejectReview(id, metadata = {}) { return decideReview(id, "rejected", metadata); }

  return Object.freeze({ createReview, getReview, listReviews, approveReview, rejectReview });
}
