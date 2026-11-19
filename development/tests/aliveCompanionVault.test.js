import test from "node:test";
import assert from "node:assert/strict";
import { createIdentityService } from "../../alive/identity/identityService.js";
import { createCompanionVault } from "../../alive/companion/companionVault.js";

const IDENTITY_ID = "identity-hero-001";
const OWNER_ID = "person-owner-001";

function makeIdentityRepository() {
  const records = new Map();
  return {
    async insert(record) {
      if (records.has(record.identityId)) throw new Error("Duplicate identity.");
      records.set(record.identityId, record);
      return record;
    },
    async getById(id) {
      return records.get(id) || null;
    },
    async update(id, mutate) {
      const current = records.get(id);
      if (!current) throw new Error("Identity not found.");
      const next = await mutate(current);
      records.set(id, next);
      return next;
    }
  };
}

function makeVaultRepository() {
  const memories = new Map();
  const preferences = new Map();
  const scope = (ownerId, identityId) => ownerId + ":" + identityId;
  return {
    async insertMemory(record) {
      const key = scope(record.ownerId, record.identityId);
      const bucket = memories.get(key) || [];
      if (bucket.some(item => item.memoryId === record.memoryId)) {
        throw new Error("Duplicate memory.");
      }
      bucket.push(record);
      memories.set(key, bucket);
      return record;
    },
    async listMemories({ ownerId, identityId }) {
      return [...(memories.get(scope(ownerId, identityId)) || [])];
    },
    async deleteMemory({ ownerId, identityId, memoryId }) {
      const key = scope(ownerId, identityId);
      const bucket = memories.get(key) || [];
      const next = bucket.filter(item => item.memoryId !== memoryId);
      memories.set(key, next);
      return next.length !== bucket.length;
    },
    async upsertPreference(record) {
      preferences.set(scope(record.ownerId, record.identityId) + ":" + record.key, record);
      return record;
    },
    async listPreferences({ ownerId, identityId }) {
      const prefix = scope(ownerId, identityId) + ":";
      return [...preferences.entries()]
        .filter(([key]) => key.startsWith(prefix))
        .map(([, value]) => value);
    },
    async deletePreference({ ownerId, identityId, key }) {
      return preferences.delete(scope(ownerId, identityId) + ":" + key);
    }
  };
}

async function setup() {
  let tick = 0;
  let id = 0;
  const identityService = createIdentityService({
    repository: makeIdentityRepository(),
    now: () => "2026-11-19T00:00:" + String(tick++).padStart(2, "0") + ".000Z"
  });
  await identityService.create({
    actorId: OWNER_ID,
    identity: {
      identityId: IDENTITY_ID,
      displayName: "HERO",
      characterForm: "digital-human",
      modelRef: "existing:hero-model"
    }
  });
  await identityService.grantAccess({
    actorId: OWNER_ID,
    identityId: IDENTITY_ID,
    subjectId: "person-editor-001",
    role: "editor",
    permissions: ["edit-appearance"]
  });
  await identityService.grantAccess({
    actorId: OWNER_ID,
    identityId: IDENTITY_ID,
    subjectId: "person-viewer-001",
    role: "viewer",
    permissions: ["view-character"]
  });
  const repository = makeVaultRepository();
  const vault = createCompanionVault({
    identityService,
    repository,
    now: () => "2026-11-19T00:01:00.000Z",
    createId: () => "memory-" + String(++id).padStart(3, "0")
  });
  return { vault, repository, identityService };
}

test("owner can create and retrieve private Companion memories for the existing HERO identity", async () => {
  const { vault } = await setup();
  const created = await vault.createMemory({
    actorId: OWNER_ID,
    identityId: IDENTITY_ID,
    memory: {
      category: "milestone",
      content: "The owner approved the first Studio session.",
      tags: ["studio", "approved", "studio"]
    }
  });

  assert.equal(created.memoryId, "memory-001");
  assert.equal(created.ownerId, OWNER_ID);
  assert.equal(created.identityId, IDENTITY_ID);
  assert.equal(created.createdBy, OWNER_ID);
  assert.deepEqual(created.tags, ["studio", "approved"]);
  assert.deepEqual(created.privacy, {
    visibility: "private",
    trainingUse: false,
    crossWorldSharing: false
  });
  assert.equal(Object.isFrozen(created), true);

  const memories = await vault.listMemories({ actorId: OWNER_ID, identityId: IDENTITY_ID });
  assert.equal(memories.length, 1);
  assert.equal(memories[0].content, "The owner approved the first Studio session.");
});

test("delegated editors, viewers, and unrelated people cannot read or write Companion memories", async () => {
  const { vault } = await setup();
  await vault.createMemory({
    actorId: OWNER_ID,
    identityId: IDENTITY_ID,
    memory: { category: "note", content: "Private owner memory." }
  });

  for (const actorId of ["person-editor-001", "person-viewer-001", "stranger-001"]) {
    await assert.rejects(
      vault.listMemories({ actorId, identityId: IDENTITY_ID }),
      error => error.code === "ALIVE_IDENTITY_ACCESS_DENIED"
    );
    await assert.rejects(
      vault.createMemory({
        actorId,
        identityId: IDENTITY_ID,
        memory: { category: "note", content: "Unauthorized write." }
      }),
      error => error.code === "ALIVE_IDENTITY_ACCESS_DENIED"
    );
    await assert.rejects(
      vault.deleteMemory({ actorId, identityId: IDENTITY_ID, memoryId: "memory-001" }),
      error => error.code === "ALIVE_IDENTITY_ACCESS_DENIED"
    );
  }

  assert.equal((await vault.listMemories({ actorId: OWNER_ID, identityId: IDENTITY_ID })).length, 1);
});

test("only the owner can store and retrieve private personal preferences", async () => {
  const { vault } = await setup();
  const preference = await vault.setPreference({
    actorId: OWNER_ID,
    identityId: IDENTITY_ID,
    key: "studio.defaultWorkspace",
    value: { workspace: "vocal-booth", countIn: true }
  });

  assert.equal(preference.ownerId, OWNER_ID);
  assert.equal(preference.identityId, IDENTITY_ID);
  assert.deepEqual(preference.value, { workspace: "vocal-booth", countIn: true });
  assert.deepEqual(preference.privacy, {
    visibility: "private",
    trainingUse: false,
    crossWorldSharing: false
  });

  const preferences = await vault.getPreferences({ actorId: OWNER_ID, identityId: IDENTITY_ID });
  assert.equal(preferences.length, 1);
  assert.equal(preferences[0].key, "studio.defaultWorkspace");

  for (const actorId of ["person-editor-001", "person-viewer-001", "stranger-001"]) {
    await assert.rejects(
      vault.getPreferences({ actorId, identityId: IDENTITY_ID }),
      error => error.code === "ALIVE_IDENTITY_ACCESS_DENIED"
    );
    await assert.rejects(
      vault.setPreference({ actorId, identityId: IDENTITY_ID, key: "theme", value: "dark" }),
      error => error.code === "ALIVE_IDENTITY_ACCESS_DENIED"
    );
    await assert.rejects(
      vault.deletePreference({ actorId, identityId: IDENTITY_ID, key: "studio.defaultWorkspace" }),
      error => error.code === "ALIVE_IDENTITY_ACCESS_DENIED"
    );
  }
});

test("preference values are detached JSON snapshots and immutable to callers", async () => {
  const { vault } = await setup();
  const input = { theme: { accent: "gold" }, shortcuts: ["play", "stop"] };
  const stored = await vault.setPreference({
    actorId: OWNER_ID,
    identityId: IDENTITY_ID,
    key: "interface",
    value: input
  });
  input.theme.accent = "changed";
  input.shortcuts.push("delete");

  assert.deepEqual(stored.value, { theme: { accent: "gold" }, shortcuts: ["play", "stop"] });
  assert.equal(Object.isFrozen(stored.value), true);
  assert.equal(Object.isFrozen(stored.value.theme), true);
  assert.throws(() => { stored.value.theme.accent = "mutated"; }, TypeError);
});

test("owner can delete individual memories and preferences without affecting identity ownership", async () => {
  const { vault, identityService } = await setup();
  await vault.createMemory({
    actorId: OWNER_ID,
    identityId: IDENTITY_ID,
    memory: { category: "note", content: "Delete me." }
  });
  await vault.setPreference({
    actorId: OWNER_ID,
    identityId: IDENTITY_ID,
    key: "theme",
    value: "dark"
  });

  assert.equal(await vault.deleteMemory({
    actorId: OWNER_ID,
    identityId: IDENTITY_ID,
    memoryId: "memory-001"
  }), true);
  assert.equal(await vault.deleteMemory({
    actorId: OWNER_ID,
    identityId: IDENTITY_ID,
    memoryId: "memory-001"
  }), false);
  assert.equal(await vault.deletePreference({
    actorId: OWNER_ID,
    identityId: IDENTITY_ID,
    key: "theme"
  }), true);
  assert.equal((await vault.listMemories({ actorId: OWNER_ID, identityId: IDENTITY_ID })).length, 0);
  assert.equal((await vault.getPreferences({ actorId: OWNER_ID, identityId: IDENTITY_ID })).length, 0);
  assert.equal((await identityService.get({
    actorId: OWNER_ID,
    identityId: IDENTITY_ID,
    requiredRole: "owner"
  })).ownerId, OWNER_ID);
});

test("vault rejects malformed and oversized memory and preference input", async () => {
  const { vault } = await setup();
  await assert.rejects(
    vault.createMemory({ actorId: OWNER_ID, identityId: IDENTITY_ID, memory: { category: "Bad Category", content: "x" } }),
    error => error.code === "ALIVE_VAULT_INPUT_INVALID"
  );
  await assert.rejects(
    vault.createMemory({ actorId: OWNER_ID, identityId: IDENTITY_ID, memory: { category: "note", content: " " } }),
    error => error.code === "ALIVE_VAULT_INPUT_INVALID"
  );
  await assert.rejects(
    vault.createMemory({ actorId: OWNER_ID, identityId: IDENTITY_ID, memory: { category: "note", content: "x".repeat(4001) } }),
    error => error.code === "ALIVE_VAULT_INPUT_INVALID"
  );
  await assert.rejects(
    vault.createMemory({ actorId: OWNER_ID, identityId: IDENTITY_ID, memory: { category: "note", content: "x", tags: Array(13).fill("tag") } }),
    error => error.code === "ALIVE_VAULT_INPUT_INVALID"
  );

  const circular = {};
  circular.self = circular;
  await assert.rejects(
    vault.setPreference({ actorId: OWNER_ID, identityId: IDENTITY_ID, key: "circular", value: circular }),
    error => error.code === "ALIVE_VAULT_INPUT_INVALID"
  );
  await assert.rejects(
    vault.setPreference({ actorId: OWNER_ID, identityId: IDENTITY_ID, key: "oversized", value: "x".repeat(5000) }),
    error => error.code === "ALIVE_VAULT_INPUT_INVALID"
  );
  await assert.rejects(
    vault.setPreference({ actorId: OWNER_ID, identityId: IDENTITY_ID, key: "../unsafe", value: true }),
    error => error.code === "ALIVE_VAULT_INPUT_INVALID"
  );
});

test("vault fails closed if the identity service returns a mismatched owner or identity", async () => {
  const repository = makeVaultRepository();
  const vault = createCompanionVault({
    identityService: {
      async get() {
        return {
          identityId: IDENTITY_ID,
          ownerId: "another-owner",
          privacy: { memoryAccess: "owner-only", trainingUse: false },
          memoryPolicy: { ownerControlled: true, sharing: "private" }
        };
      }
    },
    repository
  });
  await assert.rejects(
    vault.listMemories({ actorId: OWNER_ID, identityId: IDENTITY_ID }),
    error => error.code === "ALIVE_VAULT_OWNER_REQUIRED"
  );
});

test("vault fails closed if identity memory privacy or training policy is weakened", async () => {
  const vault = createCompanionVault({
    identityService: {
      async get() {
        return {
          identityId: IDENTITY_ID,
          ownerId: OWNER_ID,
          privacy: { memoryAccess: "public", trainingUse: true },
          memoryPolicy: { ownerControlled: true, sharing: "public" }
        };
      }
    },
    repository: makeVaultRepository()
  });
  await assert.rejects(
    vault.getPreferences({ actorId: OWNER_ID, identityId: IDENTITY_ID }),
    error => error.code === "ALIVE_VAULT_POLICY_INVALID"
  );
});

test("vault rejects repository rows belonging to another owner or identity", async () => {
  const { vault, repository } = await setup();
  const original = repository.listMemories;
  repository.listMemories = async () => [{
    memoryId: "foreign-memory",
    identityId: "another-identity",
    ownerId: "another-owner",
    createdBy: "another-owner",
    category: "note",
    content: "Must not leak.",
    tags: [],
    createdAt: "2026-11-19T00:00:00.000Z",
    updatedAt: "2026-11-19T00:00:00.000Z",
    privacy: { visibility: "private", trainingUse: false, crossWorldSharing: false }
  }];
  await assert.rejects(
    vault.listMemories({ actorId: OWNER_ID, identityId: IDENTITY_ID }),
    error => error.code === "ALIVE_VAULT_RECORD_INVALID"
  );
  repository.listMemories = original;
});

test("vault requires a complete persistence adapter", () => {
  assert.throws(
    () => createCompanionVault({
      identityService: { get() {} },
      repository: { insertMemory() {} }
    }),
    /must implement listMemories/
  );
});
