import test from "node:test";
import assert from "node:assert/strict";
import { createAliveApiHandler } from "../runtime/aliveApi.js";

function makeResponse() {
  return {
    headers: {},
    statusCode: 200,
    setHeader(name, value) { this.headers[name] = value; },
    end(value) { this.body = JSON.parse(value); }
  };
}

function makeRequest({ method = "GET", action = "status", body = {}, url, origin = "https://lambocityrecords.com" } = {}) {
  return {
    method,
    url: url || "/api/alive/" + action,
    query: { action },
    headers: { cookie: "alive_owner_session=test", origin, "sec-fetch-site": "same-origin" },
    body
  };
}

test("ALIVE hosted API rejects missing or incorrect owner authentication", async () => {
  let calls = 0;
  const handler = createAliveApiHandler({
    authenticateOwner: async () => null,
    withSystem: async () => { calls += 1; }
  });
  const response = makeResponse();
  await handler(makeRequest(), response);
  assert.equal(response.statusCode, 401);
  assert.equal(response.body.error, "A verified ALIVE owner session is required.");
  assert.equal(calls, 0);
});

test("ALIVE status exposes configuration state but never secrets", async () => {
  const secret = "private-openai-key-value";
  const handler = createAliveApiHandler({
    env: {
      DATABASE_URL: "postgres://not-returned",
      OPENAI_API_KEY: secret,
      ALIVE_AI_ENABLED: "true",
      ALIVE_SANDBOX_ENABLED: "false",
      ALIVE_ALLOWED_PATHS: '["water.js"]'
    },
    authenticateOwner: async () => ({ email: "owner@example.com", emailVerified: true }),
    withSystem: async () => { throw new Error("must not run"); }
  });
  const response = makeResponse();
  await handler(makeRequest(), response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.openAIConfigured, true);
  assert.equal(response.body.executionConfigured, false);
  assert.doesNotMatch(JSON.stringify(response.body), /private-openai-key-value|postgres:\/\/|owner-secret/);
});

test("ALIVE task intake creates a queued world task without executing it", async () => {
  let submitted = null;
  const handler = createAliveApiHandler({
    env: {},
    authenticateOwner: async () => ({ email: "owner@example.com", emailVerified: true }),
    withSystem: async (options, callback) => callback({
      system: {
        async submitWorldFinding(input) {
          submitted = input;
          return { task: { id: "task-1", status: "queued" }, policyDecision: { requiresApproval: false } };
        }
      }
    })
  });
  const response = makeResponse();
  await handler(makeRequest({
    method: "POST",
    action: "tasks",
    body: { title: "Improve marina water", description: "Improve reflections.", area: "water", severity: "normal" }
  }), response);
  assert.equal(response.statusCode, 201);
  assert.equal(response.body.task.id, "task-1");
  assert.equal(submitted.area, "water");
});

test("ALIVE task intake refuses non-world executor requests", async () => {
  let calls = 0;
  const handler = createAliveApiHandler({
    env: {},
    authenticateOwner: async () => ({ email: "owner@example.com", emailVerified: true }),
    withSystem: async () => { calls += 1; }
  });
  const response = makeResponse();
  await handler(makeRequest({
    method: "POST",
    action: "tasks",
    body: { runner: "studio", title: "Record vocals", description: "Test", area: "vocal_booth" }
  }), response);
  assert.equal(response.statusCode, 400);
  assert.equal(calls, 0);
});

test("ALIVE run endpoint does not start paid execution unless both switches and a key are present", async () => {
  let calls = 0;
  const handler = createAliveApiHandler({
    env: { ALIVE_AI_ENABLED: "true", ALIVE_SANDBOX_ENABLED: "false", OPENAI_API_KEY: "key" },
    authenticateOwner: async () => ({ email: "owner@example.com", emailVerified: true }),
    withSystem: async () => { calls += 1; }
  });
  const response = makeResponse();
  await handler(makeRequest({ method: "POST", action: "run" }), response);
  assert.equal(response.statusCode, 503);
  assert.equal(calls, 0);
});

test("ALIVE review endpoint records PERFECT or CHANGE through the owner feedback service", async () => {
  const tasks = [{
    id: "task-1",
    status: "review",
    result: { reviewId: "review-1" }
  }];
  const decisions = [];
  const review = { id: "review-1", taskId: "task-1", status: "awaiting_owner_review" };
  const storage = {
    async getReview() { return review; },
    async decideReview(input) {
      decisions.push({ type: "perfect", ...input });
      review.status = "approved";
      review.decision = { status: "approved", decidedAt: "now" };
      return review;
    },
    async requestRevision(input) {
      decisions.push({ type: "change", ...input });
      review.status = "revision_requested";
      review.decision = { status: "revision_requested", decidedAt: "now" };
      return review;
    }
  };
  const handler = createAliveApiHandler({
    env: {},
    authenticateOwner: async () => ({ email: "owner@example.com", emailVerified: true }),
    withSystem: async (options, callback) => callback({
      system: {
        director: {
          getTask() { return tasks[0]; },
          async updateTask(id, updates) {
            Object.assign(tasks[0], updates);
            return tasks[0];
          }
        }
      },
      storage
    })
  });

  const perfect = makeResponse();
  await handler(makeRequest({
    method: "POST", action: "reviews",
    body: { taskId: "task-1", reviewId: "review-1", decision: "perfect", ownerNote: "PERFECT" }
  }), perfect);
  assert.equal(perfect.statusCode, 200);
  assert.equal(perfect.body.result.feedback, "perfect");

  tasks[0].status = "review";
  tasks[0].result = { reviewId: "review-1" };
  review.status = "awaiting_owner_review";
  const change = makeResponse();
  await handler(makeRequest({
    method: "POST", action: "reviews",
    body: { taskId: "task-1", reviewId: "review-1", decision: "change", ownerNote: "Reduce the intensity." }
  }), change);
  assert.equal(change.statusCode, 200);
  assert.equal(change.body.result.feedback, "change");
  assert.deepEqual(decisions.map(item => item.type), ["perfect", "change"]);
});


test("ALIVE owner can approve a protected task before the one-shot worker claims it", async () => {
  let approved = null;
  const handler = createAliveApiHandler({
    env: {},
    authenticateOwner: async () => ({ email: "owner@example.com", emailVerified: true }),
    withSystem: async (options, callback) => callback({
      system: {
        director: {
          async approveTask(taskId, approvedBy) {
            approved = { taskId, approvedBy };
            return { id: taskId, status: "queued" };
          }
        }
      }
    })
  });
  const response = makeResponse();
  await handler(makeRequest({
    method: "POST",
    action: "tasks",
    body: { action: "approve", taskId: "protected-task-1" }
  }), response);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(approved, { taskId: "protected-task-1", approvedBy: "owner" });
  assert.equal(response.body.task.status, "queued");
});

test("ALIVE hosted API rejects cross-origin state changes", async () => {
  let calls = 0;
  const handler = createAliveApiHandler({
    env: {},
    authenticateOwner: async () => ({ email: "owner@example.com", emailVerified: true }),
    withSystem: async () => { calls += 1; }
  });
  const response = makeResponse();
  await handler(makeRequest({
    method: "POST",
    action: "tasks",
    origin: "https://attacker.example",
    body: { title: "Cross-site request", description: "Must be blocked.", area: "water" }
  }), response);
  assert.equal(response.statusCode, 403);
  assert.equal(calls, 0);
});
