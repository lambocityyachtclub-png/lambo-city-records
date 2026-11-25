import test from "node:test";
import assert from "node:assert/strict";
import { createPersonalIdentity } from "../../alive/identity/identityContract.js";
import { createPostgresIdentityRepository } from "../../alive/identity/postgresIdentityRepository.js";

function fakePool() {
  const records = new Map();
  const calls = [];
  const pool = {
    calls,
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql.includes("INSERT INTO alive_personal_identities")) {
        const [identityId, ownerId, serialized, createdAt, updatedAt] = values;
        if (records.has(identityId)) {
          const error = new Error("duplicate key");
          error.code = "23505";
          throw error;
        }
        const record = JSON.parse(serialized);
        records.set(identityId, { identity_id: identityId, owner_id: ownerId, record, version: 1, created_at: createdAt, updated_at: updatedAt });
        return { rows: [{ record }] };
      }
      if (sql.includes("SELECT record FROM alive_personal_identities")) {
        const row = records.get(values[0]);
        return { rows: row ? [{ record: row.record }] : [] };
      }
      throw new Error("Unexpected pool query.");
    },
    async connect() {
      return {
        async query(sql, values = []) {
          calls.push({ sql, values });
          if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") return { rows: [] };
          if (sql.includes("SELECT record, owner_id, version")) {
            const row = records.get(values[0]);
            return { rows: row ? [{ record: row.record, owner_id: row.owner_id, version: row.version }] : [] };
          }
          if (sql.includes("UPDATE alive_personal_identities")) {
            const [identityId, serialized, ownerId] = values;
            const row = records.get(identityId);
            if (!row || row.owner_id !== ownerId) return { rows: [] };
            row.record = JSON.parse(serialized);
            row.version += 1;
            return { rows: [{ record: row.record }] };
          }
          throw new Error("Unexpected client query.");
        },
        release() { calls.push({ sql: "RELEASE", values: [] }); }
      };
    }
  };
  return pool;
}

function makeIdentity(ownerId = "owner-1") {
  return createPersonalIdentity({
    ownerId,
    identityId: "identity-001",
    displayName: "HERO",
    characterForm: "digital-human",
    modelRef: "existing:hero-model"
  });
}

test("PostgreSQL repository requires a pool with query and connect", () => {
  assert.throws(() => createPostgresIdentityRepository({ query() {} }), /query\(\) and connect\(\)/);
});

test("insert and getById round-trip a validated personal identity", async () => {
  const pool = fakePool();
  const repository = createPostgresIdentityRepository(pool);
  const identity = makeIdentity();
  const inserted = await repository.insert(identity);
  const loaded = await repository.getById(identity.identityId);
  assert.equal(inserted.ownerId, "owner-1");
  assert.equal(loaded.identityId, identity.identityId);
  assert.equal(loaded.privacy.memoryAccess, "owner-only");
  assert.equal(await repository.getById("missing"), null);
});

test("update locks the row and commits a valid owner-preserving change", async () => {
  const pool = fakePool();
  const repository = createPostgresIdentityRepository(pool);
  const identity = makeIdentity();
  await repository.insert(identity);
  const updated = await repository.update(identity.identityId, current => createPersonalIdentity({
    ...current,
    displayName: "HERO Prime",
    characterForm: current.character.form,
    modelRef: current.character.modelRef,
    appearanceProfile: current.character.appearanceProfile,
    privacy: current.privacy,
    memoryPolicy: current.memoryPolicy,
    grants: current.grants,
    createdAt: current.createdAt,
    updatedAt: "2026-11-17T00:00:00.000Z"
  }));
  assert.equal(updated.displayName, "HERO Prime");
  const sql = pool.calls.map(call => call.sql);
  assert.ok(sql.indexOf("BEGIN") < sql.findIndex(value => value.includes("FOR UPDATE")));
  assert.ok(sql.findIndex(value => value.includes("FOR UPDATE")) < sql.findIndex(value => value.includes("UPDATE alive_personal_identities")));
  assert.ok(sql.includes("COMMIT"));
  assert.ok(sql.includes("RELEASE"));
});

test("update rejects owner transfer and rolls back the transaction", async () => {
  const pool = fakePool();
  const repository = createPostgresIdentityRepository(pool);
  const identity = makeIdentity();
  await repository.insert(identity);
  await assert.rejects(
    repository.update(identity.identityId, current => ({ ...current, ownerId: "attacker" })),
    error => error.code === "ALIVE_IDENTITY_IMMUTABLE_OWNER"
  );
  assert.ok(pool.calls.some(call => call.sql === "ROLLBACK"));
  assert.equal((await repository.getById(identity.identityId)).ownerId, "owner-1");
});

test("update of an unknown identity rolls back and fails closed", async () => {
  const pool = fakePool();
  const repository = createPostgresIdentityRepository(pool);
  await assert.rejects(
    repository.update("missing", current => current),
    error => error.code === "ALIVE_IDENTITY_NOT_FOUND"
  );
  assert.ok(pool.calls.some(call => call.sql === "ROLLBACK"));
  assert.ok(pool.calls.some(call => call.sql === "RELEASE"));
});
