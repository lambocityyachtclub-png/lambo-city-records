import { timingSafeEqual } from "node:crypto";

function safeTokenMatch(expected, supplied) {
  if (typeof expected !== "string" || !expected || typeof supplied !== "string") return false;
  const left = Buffer.from(expected, "utf8");
  const right = Buffer.from(supplied, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

function readBearer(req) {
  const value = req.headers?.authorization || req.headers?.Authorization || "";
  const match = /^Bearer\s+(.+)$/i.exec(value);
  return match ? match[1] : "";
}

export function createAliveReviewHandler(options = {}) {
  const reviewStore = options.reviewStore;
  const token = options.token;

  if (!reviewStore || typeof reviewStore.listReviews !== "function" ||
      typeof reviewStore.decideReview !== "function") {
    throw new Error("A reviewStore with listReviews() and decideReview() is required.");
  }
  if (typeof token !== "string" || token.length < 32) {
    throw new Error("ALIVE_REVIEW_TOKEN must contain at least 32 characters.");
  }

  return async function aliveReviewHandler(req, res) {
    if (!safeTokenMatch(token, readBearer(req))) {
      return send(res, 401, { error: "Owner authentication required." });
    }

    const method = String(req.method || "GET").toUpperCase();
    if (method === "GET") {
      try {
        const url = new URL(req.url || "/", "https://alive.internal");
        const status = url.searchParams.get("status") || "awaiting_owner_review";
        const limit = Number(url.searchParams.get("limit") || 50);
        const offset = Number(url.searchParams.get("offset") || 0);
        const reviews = await reviewStore.listReviews({ status, limit, offset });
        return send(res, 200, { reviews, limit, offset, status });
      } catch (error) {
        return send(res, 400, { error: error.message || "Invalid review query." });
      }
    }

    if (method === "POST") {
      const body = req.body && typeof req.body === "object" ? req.body : {};
      try {
        const review = await reviewStore.decideReview({
          reviewId: body.reviewId,
          decision: body.decision,
          ownerNote: body.ownerNote
        });
        return send(res, 200, { review });
      } catch (error) {
        const message = error.message || "Unable to record review decision.";
        const status = /not found/i.test(message) ? 404
          : /already received a decision/i.test(message) ? 409 : 400;
        return send(res, status, { error: message });
      }
    }

    res.setHeader("Allow", "GET, POST");
    return send(res, 405, { error: "Method not allowed." });
  };
}
