import test from "node:test";
import assert from "node:assert/strict";
import { createLocalAliveHost } from "../host/localAliveHost.js";

const OWNER_TOKEN = "test-owner-token-with-more-than-thirty-two-characters";
const OWNER_ID = "verified-local-owner";

function createSystemStub() {
  const calls = [];
  return {
    calls,
    getSnapshot: () => ({ status: "ready", mode: "local_branch_only" }),
    listReviews: async () => [{ id: "review_123", status: "awaiting_owner_review" }],
    submitWorldIntent: async intent => ({ status: "submitted", intent, productionChangesMade: false }),
    runWorkerOnce: async () => ({ started: true, processed: 0, productionWrites: false }),
    approveReview: async input => { calls.push(["approve", input]); return { ...input, status: "approved" }; },
    rejectReview: async input => { calls.push(["reject", input]); return { ...input, status: "rejected" }; },
    publishApprovedReview: async input => { calls.push(["publish", input]); return { published: true, branch: input.branchName, pushed: false, merged: false, deployed: false }; }
  };
}

async function withHost(system, run) {
  const host = createLocalAliveHost({ system, ownerToken: OWNER_TOKEN, ownerId: OWNER_ID });
  const address = await host.listen();
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await host.close();
  }
}

test("Local ALIVE host binds to loopback only and requires a strong owner token", () => {
  const system = createSystemStub();
  assert.throws(() => createLocalAliveHost({ system, ownerToken: "short", ownerId: OWNER_ID }), /at least 32 characters/);
  assert.throws(() => createLocalAliveHost({ system, ownerToken: OWNER_TOKEN, ownerId: OWNER_ID, host: "0.0.0.0" }), /loopback/);
});

test("Local ALIVE host exposes only a minimal unauthenticated health response", async () => {
  await withHost(createSystemStub(), async base => {
    const health = await fetch(`${base}/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { ok: true, mode: "local_owner_host" });
    const protectedStatus = await fetch(`${base}/v1/status`);
    assert.equal(protectedStatus.status, 401);
  });
});

test("Local ALIVE host authenticates owner actions and derives owner identity from its session config", async () => {
  const system = createSystemStub();
  await withHost(system, async base => {
    const headers = { authorization: `Bearer ${OWNER_TOKEN}`, "content-type": "application/json" };
    const status = await fetch(`${base}/v1/status`, { headers });
    assert.equal(status.status, 200);
    assert.equal((await status.json()).mode, "local_branch_only");

    const intent = await fetch(`${base}/v1/intents`, {
      method: "POST", headers, body: JSON.stringify({ intent: "Improve waterfront realism" })
    });
    assert.equal(intent.status, 200);
    assert.equal((await intent.json()).status, "submitted");

    const reviews = await fetch(`${base}/v1/reviews`, { headers });
    assert.equal((await reviews.json()).reviews.length, 1);

    const approval = await fetch(`${base}/v1/reviews/review_123/approve`, {
      method: "POST", headers,
      body: JSON.stringify({ decidedBy: "attacker-controlled-identity" })
    });
    assert.equal(approval.status, 200);
    assert.equal(system.calls[0][0], "approve");
    assert.equal(system.calls[0][1].decidedBy, OWNER_ID);
    assert.equal(system.calls[0][1].reviewId, "review_123");

    const rejection = await fetch(`${base}/v1/reviews/review_456/reject`, {
      method: "POST", headers, body: JSON.stringify({ reason: "Does not preserve the approved design." })
    });
    assert.equal(rejection.status, 200);
    assert.equal(system.calls[1][1].decidedBy, OWNER_ID);
    assert.equal(system.calls[1][1].reason, "Does not preserve the approved design.");

    const publish = await fetch(`${base}/v1/reviews/review_123/publish`, {
      method: "POST", headers, body: JSON.stringify({ branchName: "alive/owner-approved-change" })
    });
    const published = await publish.json();
    assert.equal(publish.status, 200);
    assert.equal(published.pushed, false);
    assert.equal(published.merged, false);
    assert.equal(published.deployed, false);
    assert.equal(system.calls[2][1].branchName, "alive/owner-approved-change");
  });
});

test("Local ALIVE host rejects malformed JSON and oversized request bodies", async () => {
  await withHost(createSystemStub(), async base => {
    const headers = { authorization: `Bearer ${OWNER_TOKEN}`, "content-type": "application/json" };
    const malformed = await fetch(`${base}/v1/intents`, { method: "POST", headers, body: "{" });
    assert.equal(malformed.status, 400);
    const oversized = await fetch(`${base}/v1/intents`, { method: "POST", headers, body: JSON.stringify({ intent: "x".repeat(70 * 1024) }) });
    assert.equal(oversized.status, 413);
  });
});
