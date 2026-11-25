import test from "node:test";
import assert from "node:assert/strict";
import { createIdentityService } from "../../alive/identity/identityService.js";

function makeRepository() {
  const records = new Map();
  return {
    async insert(record) {
      if (records.has(record.identityId)) {
        const error = new Error("Identity already exists.");
        error.code = "ALIVE_IDENTITY_DUPLICATE";
        throw error;
      }
      records.set(record.identityId, record);
      return record;
    },
    async getById(id) {
      return records.get(id) || null;
    },
    async update(id, mutate) {
      const current = records.get(id);
      if (!current) {
        const error = new Error("Identity not found.");
        error.code = "ALIVE_IDENTITY_NOT_FOUND";
        throw error;
      }
      const next = mutate(current);
      records.set(id, next);
      return next;
    }
  };
}

function setup() {
  let tick = 0;
  const repository = makeRepository();
  const service = createIdentityService({
    repository,
    now: () => `2026-11-17T00:00:0${tick++}.000Z`
  });
  return { service, repository };
}

const identityInput = {
  identityId: "identity-hero-001",
  displayName: "HERO",
  characterForm: "digital-human",
  modelRef: "existing:hero-model",
  personality: { summary: "Owner-directed personal identity", traits: ["creative", "mentor"] }
};

test("identity creation binds ownership to the authenticated actor", async () => {
  const { service } = setup();
  const record = await service.create({ actorId: "person-001", identity: identityInput });
  assert.equal(record.ownerId, "person-001");
  assert.equal(record.identityId, identityInput.identityId);
  assert.equal(record.character.modelRef, "existing:hero-model");
  assert.equal(record.privacy.memoryAccess, "owner-only");
  assert.equal(record.privacy.trainingUse, false);
});

test("identity creation rejects missing or mismatched authenticated ownership", async () => {
  const { service } = setup();
  await assert.rejects(
    service.create({ identity: identityInput }),
    error => error.code === "ALIVE_AUTHENTICATION_REQUIRED"
  );
  await assert.rejects(
    service.create({ actorId: "person-002", identity: { ...identityInput, ownerId: "person-001" } }),
    error => error.code === "ALIVE_IDENTITY_OWNER_MISMATCH"
  );
});

test("private identity is visible to its owner but not an unrelated account", async () => {
  const { service } = setup();
  await service.create({ actorId: "owner-1", identity: identityInput });
  const own = await service.get({ actorId: "owner-1", identityId: identityInput.identityId });
  assert.equal(own.ownerId, "owner-1");
  await assert.rejects(
    service.get({ actorId: "stranger", identityId: identityInput.identityId }),
    error => error.code === "ALIVE_IDENTITY_ACCESS_DENIED"
  );
});

test("owner can grant editor and viewer access without transferring ownership", async () => {
  const { service } = setup();
  await service.create({ actorId: "owner-1", identity: identityInput });
  await service.grantAccess({
    actorId: "owner-1", identityId: identityInput.identityId, subjectId: "editor-1", role: "editor",
    permissions: ["edit-appearance"]
  });
  await service.grantAccess({
    actorId: "owner-1", identityId: identityInput.identityId, subjectId: "viewer-1", role: "viewer"
  });
  const editorView = await service.get({
    actorId: "editor-1", identityId: identityInput.identityId, requiredRole: "editor"
  });
  const viewerView = await service.get({ actorId: "viewer-1", identityId: identityInput.identityId });
  assert.equal(editorView.ownerId, "owner-1");
  assert.equal(viewerView.ownerId, "owner-1");
  assert.equal((await service.get({ actorId: "owner-1", identityId: identityInput.identityId })).ownerId, "owner-1");
});

test("delegated viewers cannot edit and editors cannot change owner-controlled identity fields", async () => {
  const { service } = setup();
  await service.create({ actorId: "owner-1", identity: identityInput });
  await service.grantAccess({ actorId: "owner-1", identityId: identityInput.identityId, subjectId: "editor-1", role: "editor" });
  await service.grantAccess({ actorId: "owner-1", identityId: identityInput.identityId, subjectId: "viewer-1", role: "viewer" });
  await assert.rejects(
    service.update({ actorId: "editor-1", identityId: identityInput.identityId, changes: { displayName: "Changed" } }),
    error => error.code === "ALIVE_IDENTITY_OWNER_REQUIRED"
  );
  await assert.rejects(
    service.update({ actorId: "viewer-1", identityId: identityInput.identityId, changes: { displayName: "Changed" } }),
    error => error.code === "ALIVE_IDENTITY_OWNER_REQUIRED"
  );
});

test("owner updates cannot change owner ID and preserve privacy and memory policy", async () => {
  const { service } = setup();
  await service.create({ actorId: "owner-1", identity: identityInput });
  const updated = await service.update({
    actorId: "owner-1",
    identityId: identityInput.identityId,
    changes: { displayName: "HERO Prime", ownerId: "attacker", privacy: { discoverability: "public" } }
  });
  assert.equal(updated.ownerId, "owner-1");
  assert.equal(updated.displayName, "HERO Prime");
  assert.equal(updated.privacy.discoverability, "private");
  assert.equal(updated.privacy.memoryAccess, "owner-only");
  assert.equal(updated.privacy.trainingUse, false);
});

test("only the owner can grant or revoke delegated access", async () => {
  const { service } = setup();
  await service.create({ actorId: "owner-1", identity: identityInput });
  await assert.rejects(
    service.grantAccess({ actorId: "stranger", identityId: identityInput.identityId, subjectId: "friend", role: "viewer" }),
    error => error.code === "ALIVE_IDENTITY_OWNER_REQUIRED"
  );
  await service.grantAccess({ actorId: "owner-1", identityId: identityInput.identityId, subjectId: "friend", role: "viewer" });
  await assert.rejects(
    service.revokeAccess({ actorId: "stranger", identityId: identityInput.identityId, subjectId: "friend" }),
    error => error.code === "ALIVE_IDENTITY_OWNER_REQUIRED"
  );
  const result = await service.revokeAccess({ actorId: "owner-1", identityId: identityInput.identityId, subjectId: "friend" });
  assert.deepEqual(result.grants, []);
});

test("service rejects owner elevation and malformed identity IDs", async () => {
  const { service } = setup();
  await service.create({ actorId: "owner-1", identity: identityInput });
  await assert.rejects(
    service.grantAccess({ actorId: "owner-1", identityId: identityInput.identityId, subjectId: "friend", role: "owner" }),
    error => error.code === "ALIVE_IDENTITY_ROLE_INVALID"
  );
  await assert.rejects(
    service.get({ actorId: "owner-1", identityId: "" }),
    error => error.code === "ALIVE_IDENTITY_ID_REQUIRED"
  );
});

test("service requires an atomic repository adapter", () => {
  assert.throws(
    () => createIdentityService({ repository: { insert() {}, getById() {} } }),
    /must implement update/
  );
});
