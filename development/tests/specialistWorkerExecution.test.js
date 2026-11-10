import test from "node:test";
import assert from "node:assert/strict";
import { createDevelopmentSystem } from "../engine/developmentSystem.js";
import { TASK_STATUS } from "../engine/developmentDirector.js";

function memoryWorkspaceAdapter() {
  const workspaces = new Map();
  let nextId = 0;
  return {
    async createWorkspace({ taskId }) {
      const workspaceId = "memory-workspace-" + (++nextId);
      workspaces.set(workspaceId, { taskId, files: new Map([["development/studio/sample.js", "export const value = 1;"]]) });
      return { workspaceId, taskId, isolated: true };
    },
    async readFile({ workspaceId, filePath }) {
      const value = workspaces.get(workspaceId)?.files.get(filePath);
      if (value === undefined) throw new Error("File not found.");
      return value;
    },
    async writeFile({ workspaceId, filePath, content }) {
      workspaces.get(workspaceId).files.set(filePath, content);
      return { written: true, filePath };
    },
    async listChangedFiles({ workspaceId }) {
      const files = workspaces.get(workspaceId)?.files;
      return files && files.get("development/studio/sample.js") !== "export const value = 1;"
        ? ["development/studio/sample.js"] : [];
    },
    async destroyWorkspace(workspaceId) {
      workspaces.delete(workspaceId);
      return { destroyed: true, workspaceId };
    }
  };
}

function studioExecutionConfig() {
  return {
    workspaceAdapters: { studio: memoryWorkspaceAdapter() },
    changePlanners: {
      studio: async ({ files }) => {
        const original = await files.read("development/studio/sample.js");
        await files.write("development/studio/sample.js", original.replace("1", "2"));
        return { summary: "Updated Studio sample in isolated workspace." };
      }
    },
    testRunners: {
      studio: async ({ changedFiles }) => ({
        passed: changedFiles.length === 1,
        total: 1,
        failed: 0
      })
    },
    allowedPathsByWorker: { studio: ["development/studio"] },
    reviewStore: {
      async createReview(review) {
        return { id: "review-specialist-001", ...review };
      }
    }
  };
}

test("specialist execution bridge moves a scoped task through isolated tests to owner review", async () => {
  const system = await createDevelopmentSystem({
    specialistExecution: studioExecutionConfig()
  });
  const submitted = await system.submitWorkerFinding("studio", {
    title: "Verify Studio isolated task execution",
    description: "Change and test a sample file without touching the project tree.",
    area: "beat_lab",
    acceptanceCriteria: ["The proposal stays in its isolated workspace."]
  });

  const result = await system.executeWorkerTask("studio");
  assert.equal(result.executed, true);
  assert.equal(result.status, TASK_STATUS.REVIEW);
  assert.equal(result.productionChangesMade, false);
  assert.deepEqual(result.changedFiles, ["development/studio/sample.js"]);
  assert.equal(result.review.status, "awaiting_owner_review");
  assert.equal(system.director.getTask(submitted.task.id).status, TASK_STATUS.REVIEW);
});

test("specialist execution is unavailable until trusted host adapters are injected", async () => {
  const system = await createDevelopmentSystem();
  await assert.rejects(
    system.executeWorkerTask("studio"),
    /adapters have not been configured/
  );
  assert.deepEqual(system.getSnapshot().configuredExecutionWorkers, []);
});

test("specialist execution rejects incomplete worker configuration", async () => {
  await assert.rejects(
    createDevelopmentSystem({
      specialistExecution: {
        workspaceAdapters: { studio: memoryWorkspaceAdapter() },
        changePlanners: {},
        testRunners: {},
        allowedPathsByWorker: {},
        reviewStore: { createReview: async review => review }
      }
    }),
    /Incomplete isolated execution configuration/
  );
});

test("a worker cannot execute a protected task before owner approval", async () => {
  const system = await createDevelopmentSystem({
    specialistExecution: studioExecutionConfig()
  });
  const submitted = await system.submitWorkerFinding("security-release", {
    title: "Publish production",
    description: "Protected release must wait for owner approval.",
    area: "production_release",
    protectedActions: ["production_release"]
  }).catch(error => error);

  assert.ok(submitted instanceof Error);
});
