import test from "node:test";
import assert from "node:assert/strict";
import { createPostgresCompanionVaultRepository } from "../../alive/companion/postgresCompanionVaultRepository.js";

function fakePool() {
  const calls = [];
  const memories = new Map();
  const preferences = new Map();
  return {
    calls,
    memories,
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql.includes("INSERT INTO alive_memory_entry")) {
        const [memoryId, identityId, ownerId, category, content, tags, share, createdAt] = values;
        const row = { memory_id: memoryId, identity_id: identityId, owner_id: ownerId,
          category, content, tags: JSON.parse(tags), state: "approved", visibility: "owner-only",
          training_use: false, source: "owner-stated", share_with_development: share,
          created_at: new Date(createdAt) };
        memories.set(ownerId + ":" + identityId + ":" + memoryId, row);
        return { rows: [row] };
      }
      if (sql.includes("SELECT memory_id")) {
        const [ownerId, identityId] = values;
        return { rows: [...memories.entries()]
          .filter(([key, row]) => key.startsWith(ownerId + ":" + identityId + ":") && row.state === "approved")
          .map(([, row]) => row) };
      }
      if (sql.includes("UPDATE alive_memory_entry")) {
        const [ownerId, identityId, memoryId] = values;
        const key = ownerId + ":" + identityId + ":" + memoryId;
        const row = memories.get(key);
        if (!row || row.state === "archived") return { rows: [] };
        row.state = "archived";
        return { rows: [{ memory_id: memoryId }] };
      }
      if (sql.includes("INSERT INTO alive_companion_preferences")) {
        const [ownerId, identityId, key, serialized] = values;
        const record = JSON.parse(serialized);
        preferences.set(ownerId + ":" + identityId + ":" + key, record);
        return { rows: [{ record }] };
      }
      if (sql.includes("SELECT record FROM alive_companion_preferences")) {
        const [ownerId, identityId] = values;
        return { rows: [...preferences.entries()]
          .filter(([key]) => key.startsWith(ownerId + ":" + identityId + ":"))
          .map(([, record]) => ({ record })) };
      }
      if (sql.includes("DELETE FROM alive_companion_preferences")) {
        const [ownerId, identityId, key] = values;
        const deleted = preferences.delete(ownerId + ":" + identityId + ":" + key);
        return { rows: deleted ? [{ preference_key: key }] : [] };
      }
      throw new Error("Unexpected SQL: " + sql);
    }
  };
}

const memory = {
  memoryId: "memory-1", identityId: "identity-1", ownerId: "owner-1", createdBy: "owner-1",
  category: "preference", content: "Keep memories private.", tags: ["privacy"],
  createdAt: "2026-11-19T00:00:00.000Z", updatedAt: "2026-11-19T00:00:00.000Z",
  privacy: { visibility: "private", trainingUse: false, crossWorldSharing: false, shareWithDevelopment: true }
};

const preference = {
  identityId: "identity-1", ownerId: "owner-1", key: "tone", value: { style: "concise" },
  updatedAt: "2026-11-19T00:00:00.000Z",
  privacy: { visibility: "private", trainingUse: false, crossWorldSharing: false }
};

test("Companion memory persists under the existing owner/identity scoped memory table", async () => {
  const pool = fakePool();
  const repository = createPostgresCompanionVaultRepository(pool);
  const inserted = await repository.insertMemory(memory);
  const listed = await repository.listMemories({ ownerId: "owner-1", identityId: "identity-1" });
  assert.deepEqual(inserted, memory);
  assert.deepEqual(listed, [memory]);
  const select = pool.calls.find(call => call.sql.includes("SELECT memory_id"));
  assert.match(select.sql, /owner_id = \$1 AND identity_id = \$2/);
  assert.deepEqual(select.values, ["owner-1", "identity-1"]);
});

test("Companion repository does not expose proposed memories before owner approval", async () => {
  const pool = fakePool();
  pool.memories.set("owner-1:identity-1:pending", {
    memory_id: "pending",
    identity_id: "identity-1",
    owner_id: "owner-1",
    category: "fact",
    content: "Awaiting owner approval.",
    tags: [],
    state: "proposed",
    visibility: "owner-only",
    training_use: false,
    source: "companion-suggested",
    share_with_development: true,
    created_at: new Date("2026-11-19T00:00:00.000Z")
  });
  const repository = createPostgresCompanionVaultRepository(pool);

  assert.deepEqual(await repository.listMemories({
    ownerId: "owner-1",
    identityId: "identity-1"
  }), []);
  const select = pool.calls.find(call => call.sql.includes("SELECT memory_id"));
  assert.match(select.sql, /state = 'approved'/);
});

test("Companion memory deletion archives only the requested owner's identity memory", async () => {
  const repository = createPostgresCompanionVaultRepository(fakePool());
  await repository.insertMemory(memory);
  assert.equal(await repository.deleteMemory({ ownerId: "other-owner", identityId: "identity-1", memoryId: "memory-1" }), false);
  assert.equal(await repository.deleteMemory({ ownerId: "owner-1", identityId: "identity-1", memoryId: "memory-1" }), true);
});

test("Companion preferences remain owner-scoped", async () => {
  const repository = createPostgresCompanionVaultRepository(fakePool());
  assert.deepEqual(await repository.upsertPreference(preference), preference);
  assert.deepEqual(await repository.listPreferences({ ownerId: "owner-1", identityId: "identity-1" }), [preference]);
  assert.equal(await repository.deletePreference({ ownerId: "owner-1", identityId: "identity-1", key: "tone" }), true);
});

test("Companion repository rejects mismatched record scope before SQL", async () => {
  const pool = fakePool();
  const repository = createPostgresCompanionVaultRepository(pool);
  await assert.rejects(repository.insertMemory({ ...memory, ownerId: "" }), /Owner ID is required/);
  assert.equal(pool.calls.length, 0);
});

test("ALIVE alignment migration extends the approved tables without creating competing identity or memory tables", async () => {
  const fs = await import("node:fs/promises");
  const migration = await fs.readFile(new URL("../storage/migrations/003_alive_identity_companion.sql", import.meta.url), "utf8");
  assert.match(migration, /ALTER TABLE public\.alive_personal_identity/);
  assert.match(migration, /ALTER TABLE public\.alive_memory_entry/);
  assert.match(migration, /alive_companion_preferences/);
  assert.match(migration, /FOREIGN KEY \(identity_id, owner_id\)/);
  assert.match(migration, /share_with_development/);
  assert.match(migration, /ON DELETE CASCADE/);
  assert.doesNotMatch(migration, /CREATE TABLE IF NOT EXISTS public\.alive_personal_identities/);
});
