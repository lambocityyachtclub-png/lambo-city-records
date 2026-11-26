import test from "node:test";
import assert from "node:assert/strict";
import { createAliveOwnerApiHandler } from "../runtime/aliveOwnerApi.js";

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) { this.headers[name] = value; },
    end(value) { this.body = JSON.parse(value); }
  };
}

function createHarness(options = {}) {
  const calls = { authenticate: 0, withSystem: 0, submitted: 0, decided: 0 };
  const system = {
    getSnapshot: () => ({ ready: true }),
    director: { listTasks: () => [{ id: "task-1", title: "Review glass", status: "queued" }] },
    planIntent: intent => intent.includes("HERO")
      ? { status: "owner_approval_required", reason: "Protected system." }
      : { status: "planned", tasks: [{ contractId: "world-material-quality" }] },
    discoverProject: async () => ({ status: "discovery-only", summary: { departmentCount: 10 }, departments: [] }),
    submitIntent: async intent => {
      calls.submitted += 1;
      return { status: "submitted", total: 1, intent };
    }
  };
  const storage = {
    async listReviews() { return [{ id: "review-1", status: "awaiting_owner_review" }]; },
    async decideReview(input) {
      calls.decided += 1;
      return { id: input.reviewId, status: input.decision, productionChangesMade: false };
    }
  };
  const handler = createAliveOwnerApiHandler({
    env: { DATABASE_URL: "configured", AI_GATEWAY_MODEL: "", AI_GATEWAY_API_KEY: "", ...options.env },
    authenticateOwner: async () => {
      calls.authenticate += 1;
      return options.owner === false ? null : { email: "owner@example.test" };
    },
    isSameOrigin: () => options.sameOrigin !== false,
    withSystem: async (systemOptions, callback) => {
      calls.withSystem += 1;
      return callback({ system, storage });
    }
  });
  return { handler, calls };
}

async function invoke(handler, { action, method = "GET", body = {}, headers = {} }) {
  const req = {
    method,
    query: { action },
    url: "/api/alive/" + action,
    headers,
    body
  };
  const res = createResponse();
  await handler(req, res);
  return res;
}

test("ALIVE owner API rejects unauthenticated requests before touching task storage", async () => {
  const { handler, calls } = createHarness({ owner: false });
  const response = await invoke(handler, { action: "tasks" });
  assert.equal(response.statusCode, 401);
  assert.equal(calls.withSystem, 0);
});

test("ALIVE owner API requires same-origin POST requests", async () => {
  const { handler, calls } = createHarness({ sameOrigin: false });
  const response = await invoke(handler, { action: "tasks", method: "POST", body: { intent: "Improve Convention Center glass realism" } });
  assert.equal(response.statusCode, 403);
  assert.equal(calls.withSystem, 0);
});

test("ALIVE owner API exposes only configuration status, not secrets", async () => {
  const { handler } = createHarness();
  const response = await invoke(handler, { action: "status" });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.owner.email, "owner@example.test");
  assert.equal(response.body.databaseConfigured, true);
  assert.equal(response.body.aiProposalProviderConfigured, false);
  assert.equal(response.body.aiProposalGenerationEnabled, false);
  assert.equal(response.body.isolatedWorkspaceConfigured, false);
  assert.equal(response.body.aiExecutionEnabled, false);
  assert.equal(response.body.autonomousProductionDeployment, false);
  assert.equal(Object.hasOwn(response.body, "DATABASE_URL"), false);
});

test("ALIVE owner API exposes a read-only project discovery report", async () => {
  const { handler, calls } = createHarness();
  const response = await invoke(handler, { action: "discovery" });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.report.status, "discovery-only");
  assert.equal(response.body.report.summary.departmentCount, 10);
  assert.equal(calls.withSystem, 1);
});

test("ALIVE owner API lists durable tasks and pending reviews", async () => {
  const { handler } = createHarness();
  const tasks = await invoke(handler, { action: "tasks" });
  const reviews = await invoke(handler, { action: "reviews" });
  assert.equal(tasks.statusCode, 200);
  assert.equal(tasks.body.tasks[0].id, "task-1");
  assert.equal(reviews.statusCode, 200);
  assert.equal(reviews.body.reviews[0].id, "review-1");
});

test("ALIVE owner API submits contract-matched directions and stops protected intents", async () => {
  const { handler, calls } = createHarness();
  const accepted = await invoke(handler, {
    action: "tasks",
    method: "POST",
    body: { intent: "Improve Convention Center glass realism" }
  });
  assert.equal(accepted.statusCode, 201);
  assert.equal(accepted.body.result.status, "submitted");
  assert.equal(calls.submitted, 1);

  const protectedResult = await invoke(handler, {
    action: "tasks",
    method: "POST",
    body: { intent: "Change HERO performance choreography" }
  });
  assert.equal(protectedResult.statusCode, 200);
  assert.equal(protectedResult.body.result.status, "owner_approval_required");
  assert.equal(calls.submitted, 1);
});

test("ALIVE owner API records review decisions without publishing code", async () => {
  const { handler, calls } = createHarness();
  const response = await invoke(handler, {
    action: "reviews",
    method: "POST",
    body: { reviewId: "review-1", decision: "approved", ownerNote: "Reviewed." }
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.review.status, "approved");
  assert.equal(response.body.productionChangesMade, false);
  assert.equal(calls.decided, 1);
});

test("ALIVE owner API rejects oversized requests and unknown actions", async () => {
  const { handler } = createHarness();
  const oversized = await invoke(handler, {
    action: "tasks",
    method: "POST",
    body: { intent: "x".repeat(17000) }
  });
  assert.equal(oversized.statusCode, 413);
  const unknown = await invoke(handler, { action: "unknown" });
  assert.equal(unknown.statusCode, 404);
});
