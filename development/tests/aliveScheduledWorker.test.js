import test from "node:test";
import assert from "node:assert/strict";
import { createAliveScheduledWorkerHandler } from "../runtime/aliveScheduledWorker.js";

const SECRET = "alive-cron-secret-".padEnd(48, "x");
const baseEnv = () => ({
  CRON_SECRET: SECRET,
  ALIVE_SCHEDULER_ENABLED: "true",
  ALIVE_AI_ENABLED: "true",
  ALIVE_SANDBOX_ENABLED: "true",
  OPENAI_API_KEY: "server-only-key",
  DATABASE_URL: "postgres://private"
});

function response() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(name, value) { this.headers[name] = value; },
    end(value) { this.body = JSON.parse(value); }
  };
}

function request(authorization = "Bearer " + SECRET, method = "GET") {
  return { method, headers: { authorization } };
}

test("scheduled worker rejects requests without the exact cron secret", async () => {
  let calls = 0;
  const handler = createAliveScheduledWorkerHandler({
    env: baseEnv(),
    withSystem: async () => { calls++; }
  });
  const res = response();
  await handler(request("Bearer wrong"), res);
  assert.equal(res.statusCode, 401);
  assert.equal(calls, 0);
});

test("scheduled worker stays dormant until its explicit scheduler switch is enabled", async () => {
  let calls = 0;
  const env = { ...baseEnv(), ALIVE_SCHEDULER_ENABLED: "false" };
  const handler = createAliveScheduledWorkerHandler({
    env,
    withSystem: async () => { calls++; }
  });
  const res = response();
  await handler(request(), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.scheduled, false);
  assert.equal(calls, 0);
});

test("scheduled worker never invokes paid execution unless both AI and sandbox switches are enabled", async () => {
  let calls = 0;
  const env = { ...baseEnv(), ALIVE_SANDBOX_ENABLED: "false" };
  const handler = createAliveScheduledWorkerHandler({
    env,
    withSystem: async () => { calls++; }
  });
  const res = response();
  await handler(request(), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.reason, "paid_execution_not_enabled");
  assert.equal(calls, 0);
});

test("scheduled worker processes only through the hosted one-shot world executor", async () => {
  let optionsSeen;
  let workerIdSeen;
  const handler = createAliveScheduledWorkerHandler({
    env: baseEnv(),
    withSystem: async (options, callback) => {
      optionsSeen = options;
      return callback({
        system: {
          async executeNextWorldTask(input) {
            workerIdSeen = input.workerId;
            return { executed: true, status: "review", productionChangesMade: false };
          }
        }
      });
    }
  });
  const res = response();
  await handler(request(), res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(optionsSeen, { execution: true });
  assert.equal(workerIdSeen, "alive-scheduled-worker");
  assert.equal(res.body.productionChangesMade, false);
  assert.equal(res.body.result.status, "review");
});

test("scheduled worker rejects unsupported methods", async () => {
  let calls = 0;
  const handler = createAliveScheduledWorkerHandler({
    env: baseEnv(),
    withSystem: async () => { calls++; }
  });
  const res = response();
  await handler(request("Bearer " + SECRET, "POST"), res);
  assert.equal(res.statusCode, 405);
  assert.equal(calls, 0);
});

test("scheduled worker does not reveal internal execution errors", async () => {
  const handler = createAliveScheduledWorkerHandler({
    env: baseEnv(),
    withSystem: async () => { throw new Error("private database credential details"); }
  });
  const res = response();
  await handler(request(), res);
  assert.equal(res.statusCode, 503);
  assert.doesNotMatch(JSON.stringify(res.body), /private database credential details/);
});

test("scheduled worker is a harmless no-op when disabled, even before owner secrets exist", async () => {
  let calls = 0;
  const handler = createAliveScheduledWorkerHandler({
    env: { ALIVE_SCHEDULER_ENABLED: "false" },
    withSystem: async () => { calls++; }
  });
  const res = response();
  await handler(request(""), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.reason, "scheduler_disabled");
  assert.equal(calls, 0);
});
