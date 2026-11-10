import test from "node:test";
import assert from "node:assert/strict";
import { createDevelopmentSystem } from "../engine/developmentSystem.js";
import { TASK_STATUS } from "../engine/developmentDirector.js";
import { createHostedSpecialistQueueAdapter } from "../execution/hostedSpecialistQueueAdapter.js";
import { createGitHubTaskQueueClient } from "../execution/githubTaskQueueClient.js";

const BRANCH = "integration/lc-alive-agentic-worker-2026-11-10";

function memoryQueueClient(options = {}) {
  const writes = [];
  return {
    writes,
    async createTaskFile(input) {
      if (options.fail) throw new Error("simulated GitHub write failure");
      writes.push(input);
      return { commitSha: "abc123456789", contentSha: "def123456789", path: input.path };
    }
  };
}

test("Development System dispatches an eligible Director task to the isolated hosted queue", async () => {
  const queueClient = memoryQueueClient();
  const system = await createDevelopmentSystem({
    hostedQueue: { queueClient, branch: BRANCH }
  });
  const submitted = await system.submitWorkerFinding("studio", {
    title: "Improve Studio session workflow",
    description: "Make the session workflow clearer while preserving the approved Studio interface.",
    area: "studio_interface",
    acceptanceCriteria: ["The workflow remains compatible with the current Studio session."],
    priority: "high"
  });

  const result = await system.dispatchHostedTask("studio");
  assert.equal(result.submitted, true);
  assert.equal(result.workerId, "studio");
  assert.equal(result.task.status, TASK_STATUS.IN_PROGRESS);
  assert.equal(result.queue.branch, BRANCH);
  assert.equal(result.queue.commitSha, "abc123456789");
  assert.equal(queueClient.writes.length, 1);
  assert.match(queueClient.writes[0].path, /^development\/queue\/incoming\/director-task-/);

  const payload = JSON.parse(queueClient.writes[0].content);
  assert.equal(payload.workerId, "studio");
  assert.match(payload.vision, new RegExp(submitted.task.id));
  assert.equal(payload.acceptanceCriteria.length, 1);
  assert.equal(system.director.getTask(submitted.task.id).result.hostedQueue.state, "submitted");
  assert.equal(system.getSnapshot().hostedQueueConfigured, true);
});

test("protected tasks are not dispatched until owner approval is recorded", async () => {
  const queueClient = memoryQueueClient();
  const system = await createDevelopmentSystem({
    hostedQueue: { queueClient, branch: BRANCH }
  });
  const submitted = await system.submitWorkerFinding("security-release", {
    title: "Prepare a production release",
    description: "Review the protected production release plan.",
    area: "release_readiness",
    acceptanceCriteria: ["The release checklist is complete."],
    protectedActions: ["production_release"]
  });

  assert.equal(submitted.task.status, TASK_STATUS.PENDING_APPROVAL);
  assert.equal(await system.dispatchHostedTask("security-release"), null);
  assert.equal(queueClient.writes.length, 0);

  await system.director.approveTask(submitted.task.id, "owner");
  const result = await system.dispatchHostedTask("security-release");
  assert.equal(result.submitted, true);
  assert.equal(queueClient.writes.length, 1);
  assert.ok(system.director.getTask(submitted.task.id).history.some(entry => entry.event === "task_approved"));
});

test("hosted dispatch blocks tasks without acceptance criteria and records the reason", async () => {
  const queueClient = memoryQueueClient();
  const system = await createDevelopmentSystem({
    hostedQueue: { queueClient, branch: BRANCH }
  });
  const submitted = await system.submitWorkerFinding("studio", {
    title: "Incomplete Studio task",
    description: "This task intentionally has no acceptance criteria.",
    area: "studio_interface",
    acceptanceCriteria: []
  });

  await assert.rejects(
    system.dispatchHostedTask("studio"),
    /moved to blocked/
  );
  assert.equal(system.director.getTask(submitted.task.id).status, TASK_STATUS.BLOCKED);
  assert.equal(queueClient.writes.length, 0);
});

test("hosted dispatch blocks a task when the trusted queue client fails", async () => {
  const queueClient = memoryQueueClient({ fail: true });
  const system = await createDevelopmentSystem({
    hostedQueue: { queueClient, branch: BRANCH }
  });
  const submitted = await system.submitWorkerFinding("studio", {
    title: "Queue failure handling",
    description: "Verify failed hosted dispatch is safely recorded.",
    area: "studio_interface",
    acceptanceCriteria: ["The task moves to blocked if the queue commit fails."]
  });

  await assert.rejects(system.dispatchHostedTask("studio"), /simulated GitHub write failure/);
  assert.equal(system.director.getTask(submitted.task.id).status, TASK_STATUS.BLOCKED);
});

test("hosted queue is optional and disabled when no trusted host client is injected", async () => {
  const system = await createDevelopmentSystem();
  assert.equal(system.getSnapshot().hostedQueueConfigured, false);
  await assert.rejects(system.dispatchHostedTask("studio"), /not been configured/);
});

test("hosted queue refuses production or arbitrary branch targets", async () => {
  const queueClient = memoryQueueClient();
  await assert.rejects(
    createDevelopmentSystem({ hostedQueue: { queueClient, branch: "main" } }),
    /isolated ALIVE worker integration branch/
  );
});

test("GitHub queue client writes validated task JSON only to its configured isolated branch", async () => {
  let request;
  const client = createGitHubTaskQueueClient({
    owner: "lambocityyachtclub-png",
    repo: "lambo-city-records",
    token: "test-token-not-a-real-secret",
    branch: BRANCH,
    fetchImpl: async (url, init) => {
      request = { url, init };
      return {
        ok: true,
        status: 201,
        async json() {
          return {
            content: { path: "development/queue/incoming/sample-task.json", sha: "content-sha" },
            commit: { sha: "commit-sha" }
          };
        }
      };
    }
  });
  const task = {
    id: "sample-task",
    workerId: "studio",
    title: "A sample Studio task",
    vision: "Improve one focused Studio workflow.",
    acceptanceCriteria: ["The workflow remains stable."]
  };
  const result = await client.createTaskFile({
    branch: BRANCH,
    path: "development/queue/incoming/sample-task.json",
    content: JSON.stringify(task),
    commitMessage: "chore(alive): queue sample task"
  });

  assert.equal(result.commitSha, "commit-sha");
  assert.match(request.url, /\/contents\/development\/queue\/incoming\/sample-task\.json$/);
  assert.equal(request.init.method, "PUT");
  assert.equal(request.init.headers.Authorization, "Bearer test-token-not-a-real-secret");
  const body = JSON.parse(request.init.body);
  assert.equal(body.branch, BRANCH);
  assert.deepEqual(JSON.parse(Buffer.from(body.content, "base64").toString("utf8")), task);
  assert.equal(client.getSnapshot().connected, true);
});

test("GitHub queue client rejects untrusted paths, branches, invalid tasks, and failed API responses", async () => {
  const fetchImpl = async () => ({ ok: false, status: 422, async json() { return {}; } });
  const client = createGitHubTaskQueueClient({
    owner: "lambocityyachtclub-png",
    repo: "lambo-city-records",
    token: "test-token",
    branch: BRANCH,
    fetchImpl
  });
  const valid = {
    id: "sample-task",
    workerId: "studio",
    title: "A sample Studio task",
    vision: "Improve one focused Studio workflow.",
    acceptanceCriteria: ["The workflow remains stable."]
  };
  await assert.rejects(
    client.createTaskFile({ branch: "main", path: "development/queue/incoming/sample-task.json", content: JSON.stringify(valid), commitMessage: "queue" }),
    /cannot write outside/
  );
  await assert.rejects(
    client.createTaskFile({ branch: BRANCH, path: "main.js", content: JSON.stringify(valid), commitMessage: "queue" }),
    /restricted to/
  );
  await assert.rejects(
    client.createTaskFile({ branch: BRANCH, path: "development/queue/incoming/sample-task.json", content: JSON.stringify({ ...valid, unexpected: true }), commitMessage: "queue" }),
    /unsupported fields/
  );
  await assert.rejects(
    client.createTaskFile({ branch: BRANCH, path: "development/queue/incoming/sample-task.json", content: JSON.stringify(valid), commitMessage: "queue" }),
    /HTTP 422/
  );
});
