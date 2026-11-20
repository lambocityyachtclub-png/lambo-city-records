import test from "node:test";
import assert from "node:assert/strict";
import { createPostgresCompanionVaultRepository } from "../../alive/companion/postgresCompanionVaultRepository.js";

function fakePool() {
  const calls = [];
  const memories = new Map();
  const preferences = new Map();
  const pool = {
    calls,
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql.includes("INSERT INTO alive_companion_memories")) {
        const [memoryId, identityId, ownerId, serialized] = values;
        const record = JSON.parse(serialized);
        memories.set(ownerId + ":" + identityId + ":" + memoryId, record);
        return { rows: [{ record }] };
      }
      if (sql.includes("SELECT record FROM alive_companion_memories")) {
        const [ownerId, identityId] = values;
        return { rows: [...memories.entries()]
          .filter(([key]) => key.startsWith(ownerId + ":" + identityId + ":"))
          .map(([, record]) => ({ record })) };
      }
      if (sql.includes("DELETE FROM alive_companion_memories")) {
        const [ownerId, identityId, memoryId] = values;
        const key = ownerId + ":" + identityId + ":" + memoryId;
        const existed = memories.delete(key);
        return { rows: existed ? [{ memory_id: memoryId }] : [] };
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
  return pool;
}

const memory = {
  memoryId: "memory-1",
  identityId: "identity-1",
  ownerId: "owner-1",
  createdBy: "owner-1",
  category: "preference",
  content: "Keep memories private.",
  tags: ["privacy"],
  createdAt: "2026-11-19T00:00:00.000Z",
  updatedAt: "2026-11-19T00:00:00.000Z",
  privacy: { visibility: "private", trainingUse: false, crossWorldSharing: false }
};

const preference = {
  identityId: "identity-1",
  ownerId: "owner-1",
  key: "tone",
  value: { style: "concise" },
  updatedAt: "2026-11-19T00:00:00.000Z",
  privacy: { visibility: "private", trainingUse: false, crossWorldSharing: false }
};

test("PostgreSQL Companion repository persists and lists memory under composite owner/identity scope", async () => {
  const pool = fakePool();
  const repository = createPostgresCompanionVaultRepository(pool);
  const inserted = await repository.insertMemory(memory);
  const listed = await repository.listMemories({ ownerId: "owner-1", identityId: "identity-1" });
  assert.deepEqual(inserted, memory);
  assert.deepEqual(listed, [memory]);
  const select = pool.calls.find(call => call.sql.includes("SELECT record FROM alive_companion_memories"));
  assert.match(select.sql, /owner_id = \$1 AND identity_id = \$2/);
  assert.deepEqual(select.values, ["owner-1", "identity-1"]);
});

test("PostgreSQL Companion repository deletes only the requested owner's identity memory", async () => {
  const repository = createPostgresCompanionVaultRepository(fakePool());
  await repository.insertMemory(memory);
  assert.equal(await repository.deleteMemory({
    ownerId: "other-owner",
    identityId: "identity-1",
    memoryId: "memory-1"
  }), false);
  assert.equal(await repository.deleteMemory({
    ownerId: "owner-1",
    identityId: "identity-1",
    memoryId: "memory-1"
  }), true);
});

test("PostgreSQL Companion repository upserts and deletes owner-scoped preferences", async () => {
  const pool = fakePool();
  const repository = createPostgresCompanionVaultRepository(pool);
  assert.deepEqual(await repository.upsertPreference(preference), preference);
  assert.deepEqual(await repository.listPreferences({ ownerId: "owner-1", identityId: "identity-1" }), [preference]);
  assert.equal(await repository.deletePreference({ ownerId: "owner-1", identityId: "identity-1", key: "tone" }), true);
});

test("PostgreSQL Companion repository rejects mismatched record scope before SQL", async () => {
  const pool = fakePool();
  const repository = createPostgresCompanionVaultRepository(pool);
  await assert.rejects(
    repository.insertMemory({ ...memory, ownerId: "" }),
    /Owner ID is required/
  );
  assert.equal(pool.calls.length, 0);
});

test("ALIVE personal migration enforces owner/identity composite scope and private memory defaults", async () => {
  const fs = await import("node:fs/promises");
  const migration = await fs.readFile(new URL("../storage/migrations/003_alive_identity_companion.sql", import.meta.url), "utf8");
  assert.match(migration, /alive_personal_identities/);
  assert.match(migration, /alive_companion_memories/);
  assert.match(migration, /alive_companion_preferences/);
  assert.match(migration, /FOREIGN KEY \(identity_id, owner_id\)/);
  assert.match(migration, /trainingUse/);
  assert.match(migration, /crossWorldSharing/);
  assert.match(migration, /ON DELETE CASCADE/);
});
