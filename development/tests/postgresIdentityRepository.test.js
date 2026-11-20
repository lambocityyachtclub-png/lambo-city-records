import test from "node:test";
import assert from "node:assert/strict";
import { createPersonalIdentity } from "../../alive/identity/identityContract.js";
import { createPostgresIdentityRepository } from "../../alive/identity/postgresIdentityRepository.js";

function fakePool() {
  const records = new Map();
  const calls = [];
  function makeRow(values) {
    const [identity_id, owner_id, display_name, character_form, model_ref, appearance_profile,
      personality_summary, personality_traits, discoverability, memory_access, training_use,
      memory_policy, grants, created_at, updated_at] = values;
    return {
      identity_id, owner_id, display_name, character_form, model_ref,
      appearance_profile: JSON.parse(appearance_profile),
      personality_summary, personality_traits: JSON.parse(personality_traits),
      discoverability, memory_access, training_use,
      memory_policy: JSON.parse(memory_policy), grants: JSON.parse(grants),
      created_at: new Date(created_at), updated_at: new Date(updated_at)
    };
  }
  const pool = {
    calls,
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql.includes("INSERT INTO alive_personal_identity")) {
        const row = makeRow(values);
        if (records.has(row.identity_id)) { const error = new Error("duplicate key"); error.code = "23505"; throw error; }
        records.set(row.identity_id, row);
        return { rows: [row] };
      }
      if (sql.includes("SELECT * FROM alive_personal_identity")) {
        const row = records.get(values[0]);
        return { rows: row ? [row] : [] };
      }
      throw new Error("Unexpected pool query: " + sql);
    },
    async connect() {
      return {
        async query(sql, values = []) {
          calls.push({ sql, values });
          if (["BEGIN", "COMMIT", "ROLLBACK"].includes(sql)) return { rows: [] };
          if (sql.includes("SELECT * FROM alive_personal_identity")) {
            const row = records.get(values[0]);
            return { rows: row ? [row] : [] };
          }
          if (sql.includes("UPDATE alive_personal_identity")) {
            const [id, display_name, character_form, model_ref, appearance_profile,
              personality_summary, personality_traits, discoverability, memory_access,
              training_use, memory_policy, grants, updated_at, owner_id] = values;
            const row = records.get(id);
            if (!row || row.owner_id !== owner_id) return { rows: [] };
            Object.assign(row, {
              display_name, character_form, model_ref,
              appearance_profile: JSON.parse(appearance_profile),
              personality_summary, personality_traits: JSON.parse(personality_traits),
              discoverability, memory_access, training_use,
              memory_policy: JSON.parse(memory_policy), grants: JSON.parse(grants),
              updated_at: new Date(updated_at)
            });
            return { rows: [row] };
          }
          throw new Error("Unexpected client query: " + sql);
        },
        release() { calls.push({ sql: "RELEASE", values: [] }); }
      };
    }
  };
  return pool;
}

function makeIdentity(ownerId = "owner-1") {
  return createPersonalIdentity({
    ownerId, identityId: "identity-001", displayName: "HERO",
    characterForm: "digital-human", modelRef: "existing:hero-model",
    appearanceProfile: { outfit: "black-and-gold" }
  });
}

test("PostgreSQL repository requires a pool with query and connect", () => {
  assert.throws(() => createPostgresIdentityRepository({ query() {} }), /query\(\) and connect\(\)/);
});

test("insert and getById round-trip an identity through the approved relational table", async () => {
  const repository = createPostgresIdentityRepository(fakePool());
  const identity = makeIdentity();
  const inserted = await repository.insert(identity);
  const loaded = await repository.getById(identity.identityId);
  assert.equal(inserted.ownerId, "owner-1");
  assert.equal(loaded.identityId, identity.identityId);
  assert.equal(loaded.privacy.memoryAccess, "owner-only");
  assert.deepEqual(loaded.character.appearanceProfile, { outfit: "black-and-gold" });
  assert.equal(await repository.getById("missing"), null);
});

test("update locks the row and commits a valid owner-preserving change", async () => {
  const pool = fakePool();
  const repository = createPostgresIdentityRepository(pool);
  const identity = makeIdentity();
  await repository.insert(identity);
  const updated = await repository.update(identity.identityId, current => createPersonalIdentity({
    ...current, displayName: "HERO Prime", characterForm: current.character.form,
    modelRef: current.character.modelRef, appearanceProfile: current.character.appearanceProfile,
    privacy: current.privacy, memoryPolicy: current.memoryPolicy, grants: current.grants,
    createdAt: current.createdAt, updatedAt: "2026-11-17T00:00:00.000Z"
  }));
  assert.equal(updated.displayName, "HERO Prime");
  const sql = pool.calls.map(call => call.sql);
  assert.ok(sql.indexOf("BEGIN") < sql.findIndex(value => value.includes("FOR UPDATE")));
  assert.ok(sql.findIndex(value => value.includes("FOR UPDATE")) < sql.findIndex(value => value.includes("UPDATE alive_personal_identity")));
  assert.ok(sql.includes("COMMIT"));
  assert.ok(sql.includes("RELEASE"));
});

test("update rejects owner transfer and rolls back the transaction", async () => {
  const pool = fakePool();
  const repository = createPostgresIdentityRepository(pool);
  const identity = makeIdentity();
  await repository.insert(identity);
  await assert.rejects(repository.update(identity.identityId, current => ({ ...current, ownerId: "attacker" })),
    error => error.code === "ALIVE_IDENTITY_IMMUTABLE_OWNER");
  assert.ok(pool.calls.some(call => call.sql === "ROLLBACK"));
  assert.equal((await repository.getById(identity.identityId)).ownerId, "owner-1");
});

test("update of an unknown identity rolls back and fails closed", async () => {
  const pool = fakePool();
  const repository = createPostgresIdentityRepository(pool);
  await assert.rejects(repository.update("missing", current => current), error => error.code === "ALIVE_IDENTITY_NOT_FOUND");
  assert.ok(pool.calls.some(call => call.sql === "ROLLBACK"));
  assert.ok(pool.calls.some(call => call.sql === "RELEASE"));
});
