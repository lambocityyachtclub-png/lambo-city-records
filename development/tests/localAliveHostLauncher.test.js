import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OWNER_TOKEN = "integration-test-token-with-at-least-thirty-two-characters";
const OWNER_ID = "integration-test-owner";
const STARTER = fileURLToPath(new URL("../host/startLocalAliveHost.js", import.meta.url));

test("Ready-to-run local host launcher boots the complete system and accepts authenticated intent", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "alive-host-launcher-test-"));
  const repositoryRoot = path.join(root, "repo");
  const reviewDirectory = path.join(root, "reviews");
  const proposalDirectory = path.join(root, "proposals");
  await Promise.all([mkdir(repositoryRoot), mkdir(reviewDirectory), mkdir(proposalDirectory)]);

  const child = spawn(process.execPath, ["--experimental-default-type=module", STARTER], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ALIVE_REPOSITORY_ROOT: repositoryRoot,
      ALIVE_REVIEW_DIRECTORY: reviewDirectory,
      ALIVE_PROPOSAL_DIRECTORY: proposalDirectory,
      ALIVE_OWNER_TOKEN: OWNER_TOKEN,
      ALIVE_OWNER_ID: OWNER_ID,
      ALIVE_ALLOWED_PATHS: "development",
      ALIVE_PORT: "0"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  let output = "";
  let errors = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", chunk => { output += chunk; });
  child.stderr.on("data", chunk => { errors += chunk; });

  try {
    const baseUrl = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Local host launcher did not become ready. " + errors)), 10000);
      const onData = chunk => {
        const text = String(chunk);
        const match = text.match(/http:\/\/127\.0\.0\.1:(\d+)/);
        if (match) {
          clearTimeout(timeout);
          resolve(`http://127.0.0.1:${match[1]}`);
        }
      };
      child.stdout.on("data", onData);
      child.once("error", error => { clearTimeout(timeout); reject(error); });
      child.once("exit", code => {
        clearTimeout(timeout);
        reject(new Error(`Local host exited before ready (code ${code}). ${errors}`));
      });
    });

    const health = await fetch(`${baseUrl}/health`);
    assert.equal(health.status, 200);

    const unauthorized = await fetch(`${baseUrl}/v1/status`);
    assert.equal(unauthorized.status, 401);

    const headers = {
      authorization: `Bearer ${OWNER_TOKEN}`,
      "content-type": "application/json"
    };
    const status = await fetch(`${baseUrl}/v1/status`, { headers });
    assert.equal(status.status, 200);
    const snapshot = await status.json();
    assert.equal(snapshot.status, "ready");
    assert.equal(snapshot.contractEngine.mode, "deterministic_no_paid_ai");
    assert.equal(snapshot.approvedReviewPublisher.pushes, false);

    const intent = await fetch(`${baseUrl}/v1/intents`, {
      method: "POST",
      headers,
      body: JSON.stringify({ intent: "Improve waterfront realism" })
    });
    assert.equal(intent.status, 200);
    const submitted = await intent.json();
    assert.equal(submitted.status, "submitted");
    assert.equal(submitted.codeChangesMade, false);
    assert.equal(submitted.productionChangesMade, false);
  } finally {
    child.kill("SIGTERM");
    await new Promise(resolve => {
      if (child.exitCode !== null) return resolve();
      child.once("exit", resolve);
    });
    await rm(root, { recursive: true, force: true });
  }
});
