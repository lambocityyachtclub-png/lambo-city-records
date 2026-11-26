import test from "node:test";
import assert from "node:assert/strict";
import statusHandler from "../../api/alive/status.js";
import tasksHandler from "../../api/alive/tasks.js";
import reviewsHandler from "../../api/alive/reviews.js";
import authHandler from "../../api/alive/auth/[...all].js";
import { getHostedAliveOwnerApiHandler } from "../runtime/hostedAliveApiRuntime.js";

test("Hosted ALIVE Vercel routes load as server-side handlers", () => {
  assert.equal(typeof statusHandler, "function");
  assert.equal(typeof tasksHandler, "function");
  assert.equal(typeof reviewsHandler, "function");
  assert.equal(typeof authHandler, "function");
});

test("Hosted ALIVE API runtime fails closed without a database URL", () => {
  const previous = process.env.DATABASE_URL;
  try {
    process.env.DATABASE_URL = "";
    assert.throws(() => getHostedAliveOwnerApiHandler(), /DATABASE_URL is not configured/);
  } finally {
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
  }
});
