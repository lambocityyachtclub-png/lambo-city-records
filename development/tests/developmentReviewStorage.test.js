
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  createDevelopmentReviewStorage
} from "../storage/developmentReviewStorage.js";

async function createTemporaryStorage() {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), "lambocity-review-test-")
  );

  return {
    directory,
    storage: createDevelopmentReviewStorage({
      storageDirectory: directory
    }),
    async cleanup() {
      await fs.rm(directory, {
        recursive: true,
        force: true
      });
    }
  };
}

function validReview(overrides = {}) {
  return {
    taskId: "task-001",
    taskTitle: "Test development task",
    area: "studio",
    runner: "studio-runner",
    workspaceId: "workspace-001",
    changedFiles: [
      "development/example.js"
    ],
    changes: {
      summary: "A safe test proposal"
    },
    testResults: {
      passed: true,
      total: 5,
      failed: 0
    },
    ...overrides
  };
}

test("creates and retrieves a pending review", async () => {
  const temporary = await createTemporaryStorage();

  try {
    const review = await temporary.storage.createReview(
      validReview()
    );

    assert.ok(review.id.startsWith("review-"));
    assert.equal(review.taskId, "task-001");
    assert.equal(
      review.status,
      "awaiting_owner_review"
    );
    assert.equal(review.productionChangesMade, false);

    const retrieved = await temporary.storage.getReview(
      review.id
    );

    assert.deepEqual(retrieved, review);
  } finally {
    await temporary.cleanup();
  }
});

test("persists reviews when storage is reopened", async () => {
  const temporary = await createTemporaryStorage();

  try {
    const created = await temporary.storage.createReview(
      validReview()
    );

    const reopenedStorage = createDevelopmentReviewStorage({
      storageDirectory: temporary.directory
    });

    const retrieved = await reopenedStorage.getReview(
      created.id
    );

    assert.deepEqual(retrieved, created);
  } finally {
    await temporary.cleanup();
  }
});

test("lists reviews and filters by status", async () => {
  const temporary = await createTemporaryStorage();

  try {
    const first = await temporary.storage.createReview(
      validReview({ taskId: "task-001" })
    );

    await temporary.storage.createReview(
      validReview({ taskId: "task-002" })
    );

    await temporary.storage.decideReview({
      reviewId: first.id,
      decision: "approved"
    });

    const allReviews = await temporary.storage.listReviews();
    const pendingReviews = await temporary.storage.listReviews({
      status: "awaiting_owner_review"
    });

    assert.equal(allReviews.length, 2);
    assert.equal(pendingReviews.length, 1);
    assert.equal(
      pendingReviews[0].status,
      "awaiting_owner_review"
    );
  } finally {
    await temporary.cleanup();
  }
});

test("approves a review without changing production code", async () => {
  const temporary = await createTemporaryStorage();

  try {
    const review = await temporary.storage.createReview(
      validReview()
    );

    const approved = await temporary.storage.decideReview({
      reviewId: review.id,
      decision: "approved",
      ownerNote: "Approved for the next controlled step."
    });

    assert.equal(approved.status, "approved");
    assert.equal(approved.decision.status, "approved");
    assert.equal(
      approved.decision.ownerNote,
      "Approved for the next controlled step."
    );
    assert.equal(approved.productionChangesMade, false);
  } finally {
    await temporary.cleanup();
  }
});

test("rejects a review and records the owner note", async () => {
  const temporary = await createTemporaryStorage();

  try {
    const review = await temporary.storage.createReview(
      validReview()
    );

    const rejected = await temporary.storage.decideReview({
      reviewId: review.id,
      decision: "rejected",
      ownerNote: "Changes need more work."
    });

    assert.equal(rejected.status, "rejected");
    assert.equal(
      rejected.decision.ownerNote,
      "Changes need more work."
    );
    assert.equal(rejected.productionChangesMade, false);
  } finally {
    await temporary.cleanup();
  }
});

test("does not allow a review to receive a second decision", async () => {
  const temporary = await createTemporaryStorage();

  try {
    const review = await temporary.storage.createReview(
      validReview()
    );

    await temporary.storage.decideReview({
      reviewId: review.id,
      decision: "approved"
    });

    await assert.rejects(
      temporary.storage.decideReview({
        reviewId: review.id,
        decision: "rejected"
      }),
      /already received a decision/
    );
  } finally {
    await temporary.cleanup();
  }
});

test("rejects proposals whose tests did not pass", async () => {
  const temporary = await createTemporaryStorage();

  try {
    await assert.rejects(
      temporary.storage.createReview(
        validReview({
          testResults: {
            passed: false,
            total: 5,
            failed: 1
          }
        })
      ),
      /Only proposals with passing tests/
    );
  } finally {
    await temporary.cleanup();
  }
});

test("rejects invalid review decisions", async () => {
  const temporary = await createTemporaryStorage();

  try {
    const review = await temporary.storage.createReview(
      validReview()
    );

    await assert.rejects(
      temporary.storage.decideReview({
        reviewId: review.id,
        decision: "deployed"
      }),
      /Decision must be approved or rejected/
    );
  } finally {
    await temporary.cleanup();
  }
});

test("returns null when a review does not exist", async () => {
  const temporary = await createTemporaryStorage();

  try {
    const result = await temporary.storage.getReview(
      "review-does-not-exist"
    );

    assert.equal(result, null);
  } finally {
    await temporary.cleanup();
  }
});

test("rejects decisions for missing reviews", async () => {
  const temporary = await createTemporaryStorage();

  try {
    await assert.rejects(
      temporary.storage.decideReview({
        reviewId: "review-does-not-exist",
        decision: "approved"
      }),
      /Review not found/
    );
  } finally {
    await temporary.cleanup();
  }
});

test("removes duplicate changed file entries", async () => {
  const temporary = await createTemporaryStorage();

  try {
    const review = await temporary.storage.createReview(
      validReview({
        changedFiles: [
          "development/example.js",
          "development/example.js",
          "development/another.js"
        ]
      })
    );

    assert.deepEqual(
      review.changedFiles,
      [
        "development/example.js",
        "development/another.js"
      ]
    );
  } finally {
    await temporary.cleanup();
  }
});

test("requires a storage directory", () => {
  assert.throws(
    () => createDevelopmentReviewStorage(),
    /storageDirectory is required/
  );
});
