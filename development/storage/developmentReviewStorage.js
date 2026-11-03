
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const REVIEW_STATUSES = Object.freeze({
  PENDING: "awaiting_owner_review",
  APPROVED: "approved",
  REJECTED: "rejected"
});

function requireText(value, name) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} is required.`);
  }

  return value.trim();
}

function createReviewId() {
  return `review-${crypto.randomUUID()}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createDevelopmentReviewStorage(options = {}) {
  const {
    storageDirectory
  } = options;

  if (
    typeof storageDirectory !== "string" ||
    !storageDirectory.trim()
  ) {
    throw new Error(
      "A storageDirectory is required."
    );
  }

  const directory = path.resolve(storageDirectory);
  const storageFile = path.join(
    directory,
    "development-reviews.json"
  );

  let initialized = false;
  let operationQueue = Promise.resolve();

  async function initialize() {
    if (initialized) return;

    await fs.mkdir(directory, {
      recursive: true
    });

    try {
      await fs.access(storageFile);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;

      await fs.writeFile(
        storageFile,
        JSON.stringify({ reviews: [] }, null, 2),
        "utf8"
      );
    }

    initialized = true;
  }

  async function readData() {
    await initialize();

    const content = await fs.readFile(
      storageFile,
      "utf8"
    );

    const data = JSON.parse(content);

    if (!data || !Array.isArray(data.reviews)) {
      throw new Error(
        "Review storage file has an invalid format."
      );
    }

    return data;
  }

  async function writeData(data) {
    const temporaryFile = path.join(
      directory,
      `development-reviews-${crypto.randomUUID()}.tmp`
    );

    try {
      await fs.writeFile(
        temporaryFile,
        JSON.stringify(data, null, 2),
        "utf8"
      );

      await fs.rename(
        temporaryFile,
        storageFile
      );
    } catch (error) {
      await fs.rm(temporaryFile, {
        force: true
      });

      throw error;
    }
  }

  function serialize(operation) {
    const result = operationQueue.then(operation);

    operationQueue = result.catch(() => {});

    return result;
  }

  async function createReview(input = {}) {
    return serialize(async () => {
      const taskId = requireText(
        input.taskId,
        "Task ID"
      );

      const taskTitle = requireText(
        input.taskTitle,
        "Task title"
      );

      if (
        !Array.isArray(input.changedFiles)
      ) {
        throw new Error(
          "changedFiles must be an array."
        );
      }

      if (
        !input.testResults ||
        input.testResults.passed !== true
      ) {
        throw new Error(
          "Only proposals with passing tests can enter review."
        );
      }

      const data = await readData();

      const review = {
        id: createReviewId(),
        taskId,
        taskTitle,
        area: input.area || null,
        runner: input.runner || null,
        workspaceId: input.workspaceId || null,
        changedFiles: [...new Set(
          input.changedFiles.map(file =>
            requireText(file, "Changed file")
          )
        )],
        changes: input.changes || null,
        testResults: clone(input.testResults),
        status: REVIEW_STATUSES.PENDING,
        productionChangesMade: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        decision: null
      };

      data.reviews.push(review);

      await writeData(data);

      return clone(review);
    });
  }

  async function getReview(reviewId) {
    return serialize(async () => {
      const id = requireText(
        reviewId,
        "Review ID"
      );

      const data = await readData();

      const review = data.reviews.find(
        item => item.id === id
      );

      return review ? clone(review) : null;
    });
  }

  async function listReviews(options = {}) {
    return serialize(async () => {
      const data = await readData();

      let reviews = [...data.reviews];

      if (options.status) {
        reviews = reviews.filter(
          review => review.status === options.status
        );
      }

      reviews.sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      );

      return clone(reviews);
    });
  }

  async function decideReview(input = {}) {
    return serialize(async () => {
      const reviewId = requireText(
        input.reviewId,
        "Review ID"
      );

      const decision = requireText(
        input.decision,
        "Decision"
      );

      const ownerNote = input.ownerNote == null
        ? null
        : requireText(input.ownerNote, "Owner note");

      if (
        decision !== REVIEW_STATUSES.APPROVED &&
        decision !== REVIEW_STATUSES.REJECTED
      ) {
        throw new Error(
          "Decision must be approved or rejected."
        );
      }

      const data = await readData();

      const review = data.reviews.find(
        item => item.id === reviewId
      );

      if (!review) {
        throw new Error(
          `Review not found: ${reviewId}`
        );
      }

      if (review.status !== REVIEW_STATUSES.PENDING) {
        throw new Error(
          "This review has already received a decision."
        );
      }

      review.status = decision;
      review.updatedAt = new Date().toISOString();

      review.decision = {
        status: decision,
        ownerNote,
        decidedAt: review.updatedAt
      };

      // Approval records a decision only.
      // It does not modify, merge, or deploy production code.
      review.productionChangesMade = false;

      await writeData(data);

      return clone(review);
    });
  }

  return Object.freeze({
    createReview,
    getReview,
    listReviews,
    decideReview,
    getStorageFile() {
      return storageFile;
    },
    REVIEW_STATUSES
  });
}
