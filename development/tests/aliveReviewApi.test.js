import test from "node:test";
import assert from "node:assert/strict";
import { createAliveReviewHandler } from "../runtime/aliveReviewApi.js";

function response() {
  return {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    end(value) { this.body = JSON.parse(value); }
  };
}

function store() {
  return {
    async listReviews(filters) { return [{ id: "review-1", status: filters.status }]; },
    async decideReview(input) { return { id: input.reviewId, status: input.decision, productionChangesMade: false }; }
  };
}

test("ALIVE review API rejects missing or incorrect owner credentials", async () => {
  const handler = createAliveReviewHandler({ reviewStore: store(), token: "x".repeat(40) });
  const res = response();
  await handler({ method: "GET", headers: {}, url: "/" }, res);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, "Owner authentication required.");
});

test("ALIVE review API lists only the requested review status", async () => {
  const handler = createAliveReviewHandler({ reviewStore: store(), token: "x".repeat(40) });
  const res = response();
  await handler({ method: "GET", headers: { authorization: "Bearer " + "x".repeat(40) }, url: "/?status=approved&limit=10&offset=0" }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.reviews[0].status, "approved");
  assert.equal(res.headers["Cache-Control"], "no-store");
});

test("ALIVE review API records an owner decision without production changes", async () => {
  const handler = createAliveReviewHandler({ reviewStore: store(), token: "x".repeat(40) });
  const res = response();
  await handler({ method: "POST", headers: { authorization: "Bearer " + "x".repeat(40) }, body: { reviewId: "review-1", decision: "approved" } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.review.productionChangesMade, false);
});

test("ALIVE review API rejects unsupported methods", async () => {
  const handler = createAliveReviewHandler({ reviewStore: store(), token: "x".repeat(40) });
  const res = response();
  await handler({ method: "DELETE", headers: { authorization: "Bearer " + "x".repeat(40) } }, res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.Allow, "GET, POST");
});

test("ALIVE review API requires a strong owner token", () => {
  assert.throws(() => createAliveReviewHandler({ reviewStore: store(), token: "short" }), /at least 32 characters/);
});
