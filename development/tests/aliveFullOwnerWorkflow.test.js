import test from "node:test";
import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, mkdir, rm, writeFile, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createDevelopmentSystem } from "../engine/developmentSystem.js";
import { createLocalProposalQueueProvider } from "../execution/localProposalQueueProvider.js";
import { createLocalAliveHost } from "../host/localAliveHost.js";

const execFile = promisify(execFileCallback);
const OWNER_TOKEN = "full-flow-test-owner-token-with-at-least-thirty-two-characters";

async function git(repositoryRoot, args) {
  return execFile("git", ["-C", repositoryRoot, ...args]);
}

test("ALIVE completes intent → proposal → tests → owner approval → local branch publication", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "alive-full-flow-test-"));
  const repositoryRoot = path.join(root, "repository");
  const reviewDirectory = path.join(root, "reviews");
  const proposalDirectory = path.join(root, "proposals");
  await Promise.all([mkdir(repositoryRoot), mkdir(reviewDirectory), mkdir(proposalDirectory)]);
  await mkdir(path.join(repositoryRoot, "development"));
  await writeFile(path.join(repositoryRoot, "development", "example.js"), "export const value = 'before';\n");

  let host;
  try {
    await git(repositoryRoot, ["init"]);
    await git(repositoryRoot, ["config", "user.name", "ALIVE Test"]);
    await git(repositoryRoot, ["config", "user.email", "alive-test@example.invalid"]);
    await git(repositoryRoot, ["add", "development/example.js"]);
    await git(repositoryRoot, ["commit", "-m", "test fixture"]);

    const proposalProvider = createLocalProposalQueueProvider({ directory: proposalDirectory, repositoryRoot });
    const testCommands = [{ command: "node", args: ["-e", "process.exit(0)"] }];
    const system = await createDevelopmentSystem({
      workerEnabled: true,
      workerRunnerIds: ["world"],
      maxTasksPerRun: 1,
      localExecutionOptions: {
        repositoryRoot,
        reviewDirectory,
        baseRef: "HEAD",
        allowedPaths: ["development"],
        proposalProvider,
        testCommands
      },
      approvedReviewPublisherOptions: {
        repositoryRoot,
        baseRef: "HEAD",
        allowedPaths: ["development"],
        testCommands
      }
    });
    host = createLocalAliveHost({
      system,
      ownerToken: OWNER_TOKEN,
      ownerId: "verified-e2e-owner",
      host: "127.0.0.1",
      port: 0
    });
    const address = await host.listen();
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const headers = {
      authorization: `Bearer ${OWNER_TOKEN}`,
      "content-type": "application/json"
    };

    const submittedResponse = await fetch(`${baseUrl}/v1/intents`, {
      method: "POST",
      headers,
      body: JSON.stringify({ intent: "Improve waterfront realism" })
    });
    assert.equal(submittedResponse.status, 200);
    const submitted = await submittedResponse.json();
    assert.equal(submitted.status, "submitted");
    assert.ok(submitted.submitted.length > 0);
    const firstTaskId = submitted.submitted[0].taskId;

    await writeFile(path.join(proposalDirectory, `${firstTaskId}.json`), JSON.stringify({
      taskId: firstTaskId,
      summary: "Apply a complete, narrowly scoped test proposal",
      fileChanges: [{
        path: "development/example.js",
        content: "export const value = 'after';\n"
      }]
    }));

    const workerResponse = await fetch(`${baseUrl}/v1/worker/run-once`, {
      method: "POST",
      headers,
      body: "{}"
    });
    assert.equal(workerResponse.status, 200);
    const worker = await workerResponse.json();
    assert.equal(worker.processed, 1);
    assert.equal(worker.results[0].status, "review");
    const reviewId = worker.results[0].review.id;

    const reviewsResponse = await fetch(`${baseUrl}/v1/reviews`, { headers });
    const reviews = await reviewsResponse.json();
    assert.equal(reviews.reviews.length, 1);
    assert.equal(reviews.reviews[0].status, "awaiting_owner_review");
    assert.equal(reviews.reviews[0].productionChangesMade, false);

    const approvalResponse = await fetch(`${baseUrl}/v1/reviews/${reviewId}/approve`, {
      method: "POST",
      headers,
      body: "{}"
    });
    assert.equal(approvalResponse.status, 200);
    const approval = await approvalResponse.json();
    assert.equal(approval.decision.status, "approved");
    assert.equal(approval.decision.decidedBy, "verified-e2e-owner");

    const publishResponse = await fetch(`${baseUrl}/v1/reviews/${reviewId}/publish`, {
      method: "POST",
      headers,
      body: JSON.stringify({ branchName: "alive/e2e-owner-approved" })
    });
    assert.equal(publishResponse.status, 200);
    const published = await publishResponse.json();
    assert.equal(published.published, true);
    assert.equal(published.pushed, false);
    assert.equal(published.merged, false);
    assert.equal(published.deployed, false);
    assert.equal(published.productionChangesMade, false);

    const branch = await git(repositoryRoot, ["branch", "--list", "alive/e2e-owner-approved"]);
    assert.match(branch.stdout, /alive\/e2e-owner-approved/);
    const publishedContent = await git(repositoryRoot, ["show", "alive/e2e-owner-approved:development/example.js"]);
    assert.match(publishedContent.stdout, /value = 'after'/);
    assert.equal(await readFile(path.join(repositoryRoot, "development", "example.js"), "utf8"), "export const value = 'before';\n");
  } finally {
    if (host) await host.close();
    await rm(root, { recursive: true, force: true });
  }
});
