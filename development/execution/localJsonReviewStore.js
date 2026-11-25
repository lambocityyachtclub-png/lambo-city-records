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

  return Object.freeze({ createReview, getReview, listReviews });
}
