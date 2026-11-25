/**
 * ALIVE — OWNER REVIEW FEEDBACK
 *
 * PERFECT preserves an owner-approved result as a completed reference.
 * CHANGE records a revision request and returns the task to the queue.
 *
 * Neither decision merges, publishes, or deploys production code.
 */
function requireText(value, name) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} is required.`);
  }
  return value.trim();
}

export function createOwnerReviewFeedback(options = {}) {
  const { developmentDirector, reviewStore } = options;

  if (!developmentDirector ||
      typeof developmentDirector.getTask !== "function" ||
      typeof developmentDirector.updateTask !== "function") {
    throw new Error("A valid Development Director is required.");
  }

  if (!reviewStore ||
      typeof reviewStore.getReview !== "function" ||
      typeof reviewStore.decideReview !== "function" ||
      typeof reviewStore.requestRevision !== "function") {
    throw new Error("A review store with decision and revision support is required.");
  }

  async function getPendingReview(input = {}) {
    const taskId = requireText(input.taskId, "Task ID");
    const reviewId = requireText(input.reviewId, "Review ID");
    const task = developmentDirector.getTask(taskId);

    if (task.status !== "review") {
      throw new Error("Only tasks awaiting owner review can receive feedback.");
    }

    if (task.result?.reviewId !== reviewId) {
      throw new Error("The review does not belong to this task.");
    }

    const review = await reviewStore.getReview(reviewId);
    if (!review || review.taskId !== taskId) {
      throw new Error("Review not found for this task.");
    }
    if (review.status !== "awaiting_owner_review") {
      throw new Error("This review has already received feedback.");
    }

    return { task, review, taskId, reviewId };
  }

  async function markPerfect(input = {}) {
    const { task, review, taskId, reviewId } = await getPendingReview(input);
    const ownerNote = input.ownerNote == null
      ? "Owner marked this result PERFECT."
      : requireText(input.ownerNote, "Owner note");

    const decision = await reviewStore.decideReview({
      reviewId,
      decision: "approved",
      ownerNote
    });

    const updatedTask = await developmentDirector.updateTask(taskId, {
      status: "completed",
      result: {
        ...task.result,
        ownerFeedback: {
          type: "perfect",
          ownerNote,
          reviewId,
          recordedAt: decision.decision?.decidedAt || new Date().toISOString()
        },
        productionChangesMade: false
      }
    });

    return {
      feedback: "perfect",
      review: decision,
      task: updatedTask,
      productionChangesMade: false
    };
  }

  async function requestChange(input = {}) {
    const { task, review, taskId, reviewId } = await getPendingReview(input);
    const ownerNote = requireText(input.ownerNote, "Change request");

    const decision = await reviewStore.requestRevision({
      reviewId,
      ownerNote
    });

    const updatedTask = await developmentDirector.updateTask(taskId, {
      status: "queued",
      result: {
        ...task.result,
        ownerFeedback: {
          type: "change",
          ownerNote,
          reviewId,
          recordedAt: decision.decision?.decidedAt || new Date().toISOString()
        },
        previousReviewId: reviewId,
        productionChangesMade: false
      }
    });

    return {
      feedback: "change",
      review: decision,
      task: updatedTask,
      productionChangesMade: false
    };
  }

  return Object.freeze({ markPerfect, requestChange });
}
