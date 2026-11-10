import assert from "node:assert/strict";
import { randomBytes, scryptSync } from "node:crypto";
import test from "node:test";
import {
  aliveOwnerAuthConfigured,
  aliveSessionCookie,
  clearAliveSessionCookie,
  createAliveSessionToken,
  hasAliveOwnerSession,
  readAliveJsonBody,
  requireSameOrigin,
  verifyAlivePassword,
  verifyAliveSessionToken
} from "../../server/alive/security.js";
import { createOwnerVisionTask } from "../../server/alive/visionTask.js";
import sessionHandler from "../../api/alive/session.js";
import visionHandler from "../../api/alive/vision.js";
import statusHandler from "../../api/alive/status.js";
import { verifyPrivateQueue } from "../../server/alive/privateQueue.js";
import { resolvePrivateTaskPointer } from "../../scripts/resolve-alive-private-task.mjs";

const OWNER_PASSWORD = "owner-workspace-test-password";
const SESSION_SECRET = "test-session-secret-that-is-long-enough-for-hmac";
const REPO_TOKEN = "test-only-repository-token";

function makePasswordHash(password = OWNER_PASSWORD) {
  const salt = randomBytes(16);
  const digest = scryptSync(password, salt, 64, {
    N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024
  });
  return "scrypt$32768$8$1$" + salt.toString("base64url") + "$" + digest.toString("base64url");
}

function mockResponse() {
  return {
    headers: {},
    statusCode: 200,
    payload: null,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.payload = value; return this; },
    end(value) { this.raw = value; return this; }
  };
}

function sameOriginRequest(method = "GET", body) {
  return {
    method,
    headers: {
      origin: "https://lambocityrecords.com",
      host: "lambocityrecords.com"
    },
    body
  };
}

async function withEnv(values, callback) {
  const before = {};
  for (const key of Object.keys(values)) before[key] = process.env[key];
  Object.assign(process.env, values);
  try { return await callback(); }
  finally {
    for (const key of Object.keys(values)) {
      if (before[key] === undefined) delete process.env[key];
      else process.env[key] = before[key];
    }
  }
}

test("owner vision task is bounded and carries the project planning guardrails", () => {
  const task = createOwnerVisionTask("Build a polished Studio and waterfront launch.", {
    id: "owner-vision-test-001"
  });
  assert.equal(task.id, "owner-vision-test-001");
  assert.equal(task.workerId, "vision-planning");
  assert.match(task.vision, /polished Studio/);
  assert.ok(task.acceptanceCriteria.some(item => item.includes("launch, foundation, future, and blocked")));
  assert.ok(task.acceptanceCriteria.some(item => item.includes("owned products")));
  assert.ok(task.referenceFiles.includes("development/engine/visionIntakePlanner.js"));
  assert.equal(Object.isFrozen(task), true);
});

test("owner vision task rejects blank, oversized, and malformed IDs", () => {
  assert.throws(() => createOwnerVisionTask(" "), /Owner vision is required/);
  assert.throws(() => createOwnerVisionTask("x".repeat(8001)), /8,000/);
  assert.throws(() => createOwnerVisionTask("A vision", { id: "../unsafe" }), /task ID/i);
});

test("scrypt owner password verification is constant-shape and rejects wrong passwords", async () => {
  const hash = makePasswordHash();
  assert.equal(await verifyAlivePassword(OWNER_PASSWORD, hash), true);
  assert.equal(await verifyAlivePassword("not-the-password", hash), false);
  assert.equal(await verifyAlivePassword(OWNER_PASSWORD, "invalid"), false);
  assert.equal(aliveOwnerAuthConfigured({
    ALIVE_OWNER_PASSWORD_HASH: hash,
    ALIVE_SESSION_SECRET: SESSION_SECRET
  }), true);
  assert.equal(aliveOwnerAuthConfigured({
    ALIVE_OWNER_PASSWORD_HASH: "scrypt$bad",
    ALIVE_SESSION_SECRET: SESSION_SECRET
  }), false);
});

test("signed owner sessions expire, reject tampering, and remain HttpOnly", () => {
  const now = 1_800_000_000_000;
  const token = createAliveSessionToken(SESSION_SECRET, now);
  assert.equal(verifyAliveSessionToken(token, SESSION_SECRET, now), true);
  assert.equal(verifyAliveSessionToken(token, SESSION_SECRET + "x", now), false);
  assert.equal(verifyAliveSessionToken(token, SESSION_SECRET, now + 8 * 60 * 60 * 1000 + 1000), false);
  const [payload, signature] = token.split(".");
  const changed = signature[0] === "A" ? "B" : "A";
  assert.equal(verifyAliveSessionToken(payload + "." + changed + signature.slice(1), SESSION_SECRET, now), false);
  assert.match(aliveSessionCookie(token), /HttpOnly; Secure; SameSite=Strict/);
  assert.match(clearAliveSessionCookie(), /Max-Age=0/);
});

test("same-origin validation rejects missing, hostile, and mismatched origins", () => {
  assert.equal(requireSameOrigin(sameOriginRequest("POST")), true);
  assert.equal(requireSameOrigin({ headers: { host: "lambocityrecords.com" } }), false);
  assert.equal(requireSameOrigin({
    headers: { origin: "https://evil.example", host: "lambocityrecords.com" }
  }), false);
  assert.equal(requireSameOrigin({
    headers: { origin: "https://lambocityrecords.com", host: "lambocityrecords.com", "x-forwarded-proto": "http" }
  }), false);
});

test("JSON body reader rejects arrays, malformed JSON, and oversized requests", async () => {
  await assert.rejects(readAliveJsonBody({ body: "{" }), /valid JSON/);
  await assert.rejects(readAliveJsonBody({ body: [] }), /object/);
  await assert.rejects(readAliveJsonBody({ body: { vision: "x".repeat(100) } }, 20), /size limit/);
  assert.deepEqual(await readAliveJsonBody({ body: { vision: "ok" } }), { vision: "ok" });
});

test("owner session endpoint authenticates and issues an HttpOnly same-site cookie", async () => {
  const hash = makePasswordHash();
  await withEnv({
    ALIVE_OWNER_PASSWORD_HASH: hash,
    ALIVE_SESSION_SECRET: SESSION_SECRET
  }, async () => {
    const loginResponse = mockResponse();
    await sessionHandler(sameOriginRequest("POST", { password: OWNER_PASSWORD }), loginResponse);
    assert.equal(loginResponse.statusCode, 200);
    assert.equal(loginResponse.payload.authenticated, true);
    const cookie = loginResponse.headers["set-cookie"];
    assert.match(cookie, /HttpOnly/);

    const sessionResponse = mockResponse();
    await sessionHandler({
      method: "GET",
      headers: { cookie, host: "lambocityrecords.com" }
    }, sessionResponse);
    assert.deepEqual(sessionResponse.payload, { configured: true, authenticated: true });

    const logoutResponse = mockResponse();
    await sessionHandler(sameOriginRequest("DELETE"), logoutResponse);
    assert.match(logoutResponse.headers["set-cookie"], /Max-Age=0/);
  });
});

test("owner session endpoint fails closed when owner setup is absent or origin is foreign", async () => {
  await withEnv({
    ALIVE_OWNER_PASSWORD_HASH: "",
    ALIVE_SESSION_SECRET: ""
  }, async () => {
    const response = mockResponse();
    await sessionHandler(sameOriginRequest("POST", { password: OWNER_PASSWORD }), response);
    assert.equal(response.statusCode, 503);
  });
  const response = mockResponse();
  await sessionHandler({
    method: "POST",
    headers: { origin: "https://attacker.example", host: "lambocityrecords.com" },
    body: { password: OWNER_PASSWORD }
  }, response);
  assert.equal(response.statusCode, 403);
});

test("private queue verifier rejects a public repository and requires the private repo token", async () => {
  const missing = await verifyPrivateQueue({}, async () => {
    throw new Error("No network call should occur without the server token.");
  });
  assert.equal(missing.ok, false);
  assert.equal(missing.reason, "setup_required");

  const token = await verifyPrivateQueue({ ALIVE_PRIVATE_QUEUE_GITHUB_TOKEN: REPO_TOKEN }, async url => ({
    ok: true,
    json: async () => String(url).includes("/repos/lambocityyachtclub-png/lambo-city-alive-control")
      ? { private: false, archived: false, disabled: false }
      : {}
  }));
  assert.equal(token.ok, false);
  assert.equal(token.reason, "repository_must_be_private");
});

test("private queue verifier requires the private branch and scoped public worker workflow", async () => {
  const calls = [];
  const result = await verifyPrivateQueue({
    ALIVE_PRIVATE_QUEUE_GITHUB_TOKEN: REPO_TOKEN
  }, async (url, options) => {
    calls.push({ url: String(url), auth: options.headers.Authorization });
    if (calls.length === 1) return {
      ok: true,
      json: async () => ({ private: true, archived: false, disabled: false })
    };
    if (calls.length === 2 || calls.length === 3) return {
      ok: true,
      json: async () => ({ name: "integration/lc-alive-agentic-worker-2026-11-10" })
    };
    return {
      ok: true,
      json: async () => ({ type: "file", name: "development-engine-tests.yml", encoding: "base64", content: Buffer.from("resolve-alive-private-task.mjs ALIVE_PRIVATE_QUEUE_READ_TOKEN").toString("base64") })
    };
  });
  assert.equal(result.ok, true);
  assert.equal(result.owner, "lambocityyachtclub-png");
  assert.equal(result.repo, "lambo-city-alive-control");
  assert.equal(result.publicRepo, "lambo-city-records");
  assert.equal(calls.length, 4);
  assert.ok(calls.every(call => call.auth === "Bearer " + REPO_TOKEN));
});

test("vision endpoint refuses requests until private queue access is configured", async () => {
  const hash = makePasswordHash();
  const token = createAliveSessionToken(SESSION_SECRET);
  await withEnv({
    ALIVE_OWNER_PASSWORD_HASH: hash,
    ALIVE_SESSION_SECRET: SESSION_SECRET,
    ALIVE_PRIVATE_QUEUE_GITHUB_TOKEN: ""
  }, async () => {
    const response = mockResponse();
    await visionHandler({
      ...sameOriginRequest("POST", { vision: "Build the next district." }),
      headers: {
        ...sameOriginRequest("POST").headers,
        cookie: aliveSessionCookie(token)
      }
    }, response);
    assert.equal(response.statusCode, 503);
    assert.match(response.payload.error, /public code repository/);
  });
});

test("vision endpoint stores raw direction privately and publishes only a non-sensitive task pointer", async () => {
  const hash = makePasswordHash();
  const token = createAliveSessionToken(SESSION_SECRET);
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    const value = String(url);
    calls.push({ url: value, method: options.method || "GET", body: options.body, auth: options.headers.Authorization });
    if (calls.length === 1) return {
      ok: true,
      json: async () => ({ private: true, archived: false, disabled: false })
    };
    if (calls.length === 2 || calls.length === 3) return {
      ok: true,
      json: async () => ({ name: "integration/lc-alive-agentic-worker-2026-11-10" })
    };
    if (calls.length === 4) return {
      ok: true,
      json: async () => ({ type: "file", name: "development-engine-tests.yml" })
    };
    if (calls.length === 5) return {
      ok: true,
      status: 201,
      json: async () => ({
        commit: { sha: "a".repeat(40) },
        content: { sha: "b".repeat(40) }
      })
    };
    return {
      ok: true,
      status: 201,
      json: async () => ({
        commit: { sha: "c".repeat(40) },
        content: { sha: "d".repeat(40) }
      })
    };
  };
  try {
    await withEnv({
      ALIVE_OWNER_PASSWORD_HASH: hash,
      ALIVE_SESSION_SECRET: SESSION_SECRET,
      ALIVE_PRIVATE_QUEUE_GITHUB_TOKEN: REPO_TOKEN
    }, async () => {
      const response = mockResponse();
      await visionHandler({
        ...sameOriginRequest("POST", { vision: "Create a confidential Studio workflow improvement." }),
        headers: {
          ...sameOriginRequest("POST").headers,
          cookie: aliveSessionCookie(token)
        }
      }, response);
      assert.equal(response.statusCode, 202);
      assert.equal(response.payload.accepted, true);
      assert.match(response.payload.taskId, /^owner-vision-/);
      assert.equal(response.payload.queueCommitSha, "c".repeat(40));
      assert.equal(response.payload.branch, "integration/lc-alive-agentic-worker-2026-11-10");
      assert.equal(calls.length, 6);

      const privateBody = JSON.parse(calls[4].body);
      const privateTask = JSON.parse(Buffer.from(privateBody.content, "base64").toString("utf8"));
      assert.equal(privateTask.vision, "Create a confidential Studio workflow improvement.");
      assert.match(calls[4].url, /lambo-city-alive-control\/contents\/development\/queue\/incoming/);

      const publicBody = JSON.parse(calls[5].body);
      const pointer = JSON.parse(Buffer.from(publicBody.content, "base64").toString("utf8"));
      assert.equal(pointer.id, privateTask.id);
      assert.equal(pointer.privateQueue.repo, "lambo-city-alive-control");
      assert.equal(JSON.stringify(pointer).includes("confidential Studio"), false);
      assert.match(calls[5].url, /lambo-city-records\/contents\/development\/queue\/incoming/);
      assert.equal(calls.every(call => call.auth === "Bearer " + REPO_TOKEN), true);
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("private task resolver rejects forged pointers and loads only the approved private task", async () => {
  const task = createOwnerVisionTask("Private planning direction.", { id: "owner-vision-test-002" });
  const pointer = {
    id: task.id,
    privateQueue: {
      owner: "lambocityyachtclub-png",
      repo: "lambo-city-alive-control",
      branch: "integration/lc-alive-agentic-worker-2026-11-10",
      path: "development/queue/incoming/" + task.id + ".json"
    }
  };
  let calls = 0;
  const resolved = await resolvePrivateTaskPointer(pointer, REPO_TOKEN, async (url, options) => {
    calls++;
    assert.equal(options.headers.Authorization, "Bearer " + REPO_TOKEN);
    if (calls === 1) return {
      ok: true,
      json: async () => ({ private: true, archived: false, disabled: false })
    };
    if (calls === 2) return { ok: true, json: async () => ({ name: pointer.privateQueue.branch }) };
    return {
      ok: true,
      json: async () => ({
        type: "file",
        encoding: "base64",
        content: Buffer.from(JSON.stringify(task), "utf8").toString("base64")
      })
    };
  });
  assert.equal(resolved.id, task.id);
  assert.equal(resolved.vision, task.vision);
  assert.equal(calls, 3);
  await assert.rejects(resolvePrivateTaskPointer({
    ...pointer,
    privateQueue: { ...pointer.privateQueue, repo: "lambo-city-records" }
  }, REPO_TOKEN, async () => { throw new Error("Forged pointer must be rejected before fetch."); }), /approved repository scope/);
});

test("status endpoint verifies the private queue and reads only public proposal status", async () => {
  const hash = makePasswordHash();
  const token = createAliveSessionToken(SESSION_SECRET);
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), headers: options.headers });
    if (calls.length === 1) return {
      ok: true,
      json: async () => ({ private: true, archived: false, disabled: false })
    };
    if (calls.length === 2 || calls.length === 3) return {
      ok: true,
      json: async () => ({ name: "integration/lc-alive-agentic-worker-2026-11-10" })
    };
    if (calls.length === 4) return {
      ok: true,
      json: async () => ({ type: "file", name: "development-engine-tests.yml" })
    };
    if (String(url).includes("/pulls?")) {
      return { ok: true, json: async () => [{
        title: "ALIVE vision proposal",
        state: "open",
        draft: true,
        html_url: "https://github.com/lambocityyachtclub-png/lambo-city-records/pull/99",
        head: { ref: "alive-proposal/owner-vision-test-001", sha: "c".repeat(40) }
      }] };
    }
    return {
      ok: true,
      json: async () => ({
        check_runs: [{ name: "Development Engine", status: "completed", conclusion: "success" }]
      })
    };
  };
  try {
    await withEnv({
      ALIVE_OWNER_PASSWORD_HASH: hash,
      ALIVE_SESSION_SECRET: SESSION_SECRET,
      ALIVE_PRIVATE_QUEUE_GITHUB_TOKEN: REPO_TOKEN
    }, async () => {
      const response = mockResponse();
      await statusHandler({
        method: "GET",
        url: "/api/alive/status?taskId=owner-vision-test-001",
        headers: { cookie: aliveSessionCookie(token), host: "lambocityrecords.com" }
      }, response);
      assert.equal(response.statusCode, 200);
      assert.equal(response.payload.connected, true);
      assert.equal(response.payload.queueBranch, "integration/lc-alive-agentic-worker-2026-11-10");
      assert.equal(response.payload.state, "proposal_ready");
      assert.equal(response.payload.task.checks.length, 1);
      assert.equal(calls.length, 6);
      assert.equal(calls.slice(0, 4).every(call => call.headers.Authorization === "Bearer " + REPO_TOKEN), true);
      assert.equal(calls.slice(4).every(call => !call.headers.Authorization), true);
      assert.equal(JSON.stringify(response.payload).includes(REPO_TOKEN), false);
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Vercel owner workspace headers and static page are present", async () => {
  const { readFile } = await import("node:fs/promises");
  const config = JSON.parse(await readFile(new URL("../../vercel.json", import.meta.url), "utf8"));
  const page = await readFile(new URL("../../alive.html", import.meta.url), "utf8");
  assert.ok(config.headers.some(rule => rule.source === "/alive.html"));
  assert.ok(config.headers.some(rule => rule.source === "/api/alive/(.*)"));
  assert.match(page, /Content-Security-Policy/);
  assert.match(page, /src="\.\/alive\.js"/);
  assert.match(page, /href="\.\/alive\.css"/);
});
