import test from "node:test";
import assert from "node:assert/strict";
import { createDevelopmentDirector, TASK_STATUS } from "../engine/developmentDirector.js";
import { createSpecialistWorkerRoster } from "../engine/specialistWorkerRoster.js";
import { createDevelopmentSystem } from "../engine/developmentSystem.js";

async function makeRoster() {
  const director = createDevelopmentDirector();
  await director.initialize();
  return { director, roster: createSpecialistWorkerRoster({ developmentDirector: director }) };
}

test("roster exposes the complete temporary specialist workforce", async () => {
  const { roster } = await makeRoster();
  const workers = roster.listWorkers();
  assert.equal(workers.length, 8);
  assert.deepEqual(
    workers.map(worker => worker.id).sort(),
    ["audio-assets", "convention-center", "environment-water", "performance-qa", "security-release", "studio", "world-architecture", "yachts-vehicles"].sort()
  );
  assert.ok(workers.every(worker => worker.enabled));
  assert.ok(workers.every(worker => worker.restrictions.some(item => item.includes("No direct repository writes"))));
});

test("specialist submits only within its assigned domain", async () => {
  const { director, roster } = await makeRoster();
  const result = await roster.submitFinding("world-architecture", {
    title: "Audit district boundaries",
    description: "Check district adjacency and navigation constraints.",
    area: "districts",
    acceptanceCriteria: ["No existing district is altered."]
  });
  assert.equal(result.task.runner, "world-architecture");
  assert.equal(result.task.area, "districts");
  assert.equal(result.task.status, TASK_STATUS.QUEUED);
  assert.equal(director.getTask(result.task.id).title, "Audit district boundaries");
});

test("specialist cannot submit outside its assigned domain", async () => {
  const { roster } = await makeRoster();
  await assert.rejects(
    roster.submitFinding("yachts-vehicles", {
      title: "Change payment provider",
      description: "Not in the vehicle remit.",
      area: "billing"
    }),
    /not authorized/
  );
});

test("protected release actions remain pending owner approval", async () => {
  const { roster } = await makeRoster();
  const result = await roster.submitFinding("security-release", {
    title: "Publish production release",
    description: "A release candidate is ready for owner review.",
    area: "release_readiness",
    protectedActions: ["production_release"]
  });
  assert.equal(result.policyDecision.requiresApproval, true);
  assert.equal(result.task.status, TASK_STATUS.PENDING_APPROVAL);
});

test("disabled worker cannot accept new tasks", async () => {
  const { roster } = await makeRoster();
  roster.setWorkerEnabled("environment-water", false);
  await assert.rejects(
    roster.submitFinding("environment-water", {
      title: "Improve shoreline",
      description: "Review waterline materials.",
      area: "shoreline"
    }),
    /disabled/
  );
});

test("development system registers workers and routes their findings", async () => {
  const system = await createDevelopmentSystem();
  const snapshot = system.getSnapshot();
  assert.equal(snapshot.workers.length, 8);
  assert.equal(snapshot.registry.totalModules, 10);
  const result = await system.submitWorkerFinding("convention-center", {
    title: "Review convention visitor flow",
    description: "Audit entry and exit routing.",
    area: "visitor_flow"
  });
  assert.equal(result.task.runner, "convention-center");
  assert.equal(result.task.status, TASK_STATUS.QUEUED);
});

test("disabled development system blocks all specialist workers", async () => {
  const system = await createDevelopmentSystem();
  system.disable();
  await assert.rejects(
    () => system.submitWorkerFinding("performance-qa", {
      title: "Run browser audit",
      description: "Check iPad and desktop behavior.",
      area: "browser_compatibility"
    }),
    /development system is disabled/
  );
});
