import test from "node:test";
import assert from "node:assert/strict";
import {
  createHostedAliveControlPlane,
  withPostgresAdvisoryLock
} from "../runtime/hostedAliveControlPlane.js";

function createFakePool() {
  const state = { tasks: [], statements: [], releases: 0 };
  const query = async (sql, params = []) => {
    const normalized = sql.replace(/\s+/g, " ").trim();
    state.statements.push(normalized);
    if (normalized.startsWith("SELECT to_regclass")) {
      return { rows: [{
        task_table_ready: true,
        review_table_ready: true,
        review_status_constraint: "CHECK (status IN ('awaiting_owner_review', 'approved', 'rejected'))"
      }] };
    }
    if (normalized.startsWith("SELECT tasks FROM")) return { rows: [{ tasks: state.tasks }] };
    if (normalized.startsWith("INSERT INTO public.lambo_alive_task_state")) {
      state.tasks = JSON.parse(params[1]);
      return { rows: [] };
    }
    throw new Error("Unexpected SQL: " + normalized);
  };
  return {
    state,
    query,
    async connect() {
      return {
        async query(sql) {
          const normalized = sql.replace(/\s+/g, " ").trim();
          state.statements.push(normalized);
          if (["BEGIN", "COMMIT", "ROLLBACK"].includes(normalized)) return { rows: [] };
          if (normalized.startsWith("SELECT pg_advisory_xact_lock")) return { rows: [] };
          throw new Error("Unexpected transaction SQL: " + normalized);
        },
        release() { state.releases += 1; }
      };
    }
  };
}

test("Hosted ALIVE control plane restores and persists tasks through Neon", async () => {
  const pool = createFakePool();
  const controlPlane = createHostedAliveControlPlane({ pool });

  const first = await controlPlane.withSystem({}, async ({ system }) => {
    assert.equal(system.director.listTasks().length, 0);
    return system.submitWorldFinding({
      title: "Review Convention Center glass realism",
      description: "Inspect material response while preserving the approved building footprint.",
      area: "world_materials",
      type: "improvement",
      severity: "normal",
      filePaths: ["conferenceCenterDistrict.js"],
      acceptanceCriteria: ["Preserve the approved building footprint."]
    });
  });

  assert.equal(first.task.status, "queued");
  assert.equal(pool.state.tasks.length, 1);

  const restored = await controlPlane.withSystem({}, async ({ system }) => ({
    tasks: system.director.listTasks()
  }));
  assert.equal(restored.tasks.length, 1);
  assert.equal(restored.tasks[0].title, "Review Convention Center glass realism");
  assert.equal(pool.state.releases, 2);
  assert.equal(controlPlane.getSnapshot().persistentTaskStorage, true);
});

test("Hosted ALIVE control plane fails closed when execution is requested", async () => {
  const pool = createFakePool();
  const controlPlane = createHostedAliveControlPlane({ pool });
  await assert.rejects(
    () => controlPlane.withSystem({ execution: true }, async () => true),
    /code execution is not configured/
  );
  assert.equal(pool.state.releases, 0);
});

test("Postgres advisory lock commits successful operations and always releases", async () => {
  const pool = createFakePool();
  const result = await withPostgresAdvisoryLock(pool, async () => "completed", 1234);
  assert.equal(result, "completed");
  assert.ok(pool.state.statements.includes("COMMIT"));
  assert.equal(pool.state.releases, 1);
});

test("Postgres advisory lock rolls back failed operations and always releases", async () => {
  const pool = createFakePool();
  await assert.rejects(
    () => withPostgresAdvisoryLock(pool, async () => { throw new Error("expected failure"); }, 1234),
    /expected failure/
  );
  assert.ok(pool.state.statements.includes("ROLLBACK"));
  assert.equal(pool.state.releases, 1);
});
