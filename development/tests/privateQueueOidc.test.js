import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import {
  resolveAuthorizedPrivateTask,
  verifyGitHubActionsIdentity
} from "../../server/alive/githubActionsOidc.js";

const OWNER = "lambocityyachtclub-png";
const REPOSITORY = "lambo-city-records";
const WORKER_BRANCH = "integration/lc-alive-agentic-worker-2026-11-10";
const WORKFLOW = OWNER + "/" + REPOSITORY +
  "/.github/workflows/development-engine-tests.yml@refs/heads/" + WORKER_BRANCH;
const PRIVATE_BRANCH = WORKER_BRANCH;
const TASK_ID = "oidc-private-task-test";
const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: "jwk" }), kid: "test-key", use: "sig", alg: "RS256" };

function makeToken(overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT", kid: "test-key" })).toString("base64url");
  const claims = {
    iss: "https://token.actions.githubusercontent.com",
    aud: "https://alive-preview.lambocityrecords.com/api/alive/private-task",
    exp: now + 300,
    iat: now,
    repository: OWNER + "/" + REPOSITORY,
    repository_id: "1227528136",
    ref: "refs/heads/" + WORKER_BRANCH,
    workflow_ref: WORKFLOW,
    event_name: "push",
    sha: "a".repeat(40),
    ...overrides
  };
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const input = header + "." + payload;
  return input + "." + sign("RSA-SHA256", Buffer.from(input), privateKey).toString("base64url");
}

function response(value, ok = true) {
  return { ok, json: async () => value };
}

test("verifies a signed GitHub Actions OIDC identity scoped to the exact workflow", async () => {
  const claims = await verifyGitHubActionsIdentity(makeToken(), {
    fetchImpl: async () => response({ keys: [jwk] })
  });
  assert.equal(claims.repository, OWNER + "/" + REPOSITORY);
});

test("rejects a token from another workflow before retrieving signing keys", async () => {
  await assert.rejects(
    verifyGitHubActionsIdentity(makeToken({ workflow_ref: "attacker/other/.github/workflows/x.yml@refs/heads/main" }), {
      fetchImpl: async () => { throw new Error("JWKS must not be requested"); }
    }),
    /not authorized/
  );
});

test("resolves only the private task referenced by the verified push commit", async () => {
  const claims = {
    repository: OWNER + "/" + REPOSITORY,
    ref: "refs/heads/" + WORKER_BRANCH,
    workflow_ref: WORKFLOW,
    sha: "a".repeat(40)
  };
  const pointer = {
    id: TASK_ID,
    privateQueue: {
      owner: OWNER,
      repo: "lambo-city-alive-control",
      branch: PRIVATE_BRANCH,
      path: "development/queue/incoming/" + TASK_ID + ".json"
    }
  };
  const task = { id: TASK_ID, workerId: "vision-planning", title: "Test task" };
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(String(url));
    if (String(url).startsWith("https://raw.githubusercontent.com/")) return response(pointer);
    if (String(url) === "https://api.github.com/repos/" + OWNER + "/lambo-city-alive-control") {
      return response({ private: true, archived: false, disabled: false });
    }
    if (String(url).includes("/branches/")) return response({ name: PRIVATE_BRANCH });
    if (String(url).includes("/contents/")) {
      return response({
        type: "file",
        encoding: "base64",
        content: Buffer.from(JSON.stringify(task)).toString("base64")
      });
    }
    return response({}, false);
  };
  const result = await resolveAuthorizedPrivateTask(TASK_ID, claims, "server-token", fetchImpl);
  assert.deepEqual(result, task);
  assert.equal(calls.length, 4);
  assert.ok(!calls.some(url => url.includes("server-token")));
});

test("rejects a public pointer that tries to redirect to another private path", async () => {
  const claims = {
    repository: OWNER + "/" + REPOSITORY,
    ref: "refs/heads/" + WORKER_BRANCH,
    workflow_ref: WORKFLOW,
    sha: "a".repeat(40)
  };
  const pointer = {
    id: TASK_ID,
    privateQueue: {
      owner: OWNER,
      repo: "attacker-repo",
      branch: PRIVATE_BRANCH,
      path: "development/queue/incoming/" + TASK_ID + ".json"
    }
  };
  await assert.rejects(
    resolveAuthorizedPrivateTask(TASK_ID, claims, "server-token", async () => response(pointer)),
    /outside the approved private queue/
  );
});
