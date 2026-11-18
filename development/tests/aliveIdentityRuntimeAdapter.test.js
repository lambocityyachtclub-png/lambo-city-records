import test from "node:test";
import assert from "node:assert/strict";
import { createIdentityService } from "../..//alive/identity/identityService.js";
import { createCompanionPolicy } from "../../alive/identity/identityContract.js";
import { createIdentityRuntimeAdapter } from "../../alive/runtime/identityRuntimeAdapter.js";

function makeRepository() {
  const records = new Map();
  return {
    async insert(record) {
      records.set(record.identityId, record);
      return record;
    },
    async getById(id) {
      return records.get(id) || null;
    },
    async update(id, mutate) {
      const current = records.get(id);
      if (!current) throw new Error("Identity not found.");
      const next = mutate(current);
      records.set(id, next);
      return next;
    }
  };
}

async function setupIdentity({ characterForm = "digital-human", modelRef = "existing:hero-model" } = {}) {
  const service = createIdentityService({ repository: makeRepository() });
  await service.create({
    actorId: "owner-1",
    identity: {
      identityId: "identity-hero-001",
      displayName: "HERO",
      characterForm,
      modelRef
    }
  });
  return service;
}

test("owner binding returns the exact existing HERO model object without cloning", async () => {
  const identityService = await setupIdentity();
  const existingHero = { name: "HERO_visual", existingSceneObject: true };
  const calls = [];
  const adapter = createIdentityRuntimeAdapter({
    identityService,
    resolveExistingModel: async (modelRef, context) => {
      calls.push({ modelRef, context });
      return existingHero;
    }
  });

  const binding = await adapter.resolve({
    actorId: "owner-1",
    identityId: "identity-hero-001"
  });

  assert.equal(binding.ownerId, "owner-1");
  assert.equal(binding.role, "owner");
  assert.equal(binding.character.form, "digital-human");
  assert.equal(binding.character.modelRef, "existing:hero-model");
  assert.strictEqual(binding.character.visual, existingHero);
  assert.deepEqual(calls, [{
    modelRef: "existing:hero-model",
    context: {
      identityId: "identity-hero-001",
      characterForm: "digital-human",
      ownerId: "owner-1"
    }
  }]);
  assert.equal(binding.companionPolicy.mode, "owner-directed");
  assert.equal(binding.permissions.canManageIdentity, true);
});

test("runtime binding supports a stylized character through the same resolver boundary", async () => {
  const identityService = await setupIdentity({
    characterForm: "stylized",
    modelRef: "existing:stylized-artist"
  });
  const stylizedVisual = { name: "existing-stylized-artist" };
  let receivedForm = null;
  const adapter = createIdentityRuntimeAdapter({
    identityService,
    resolveExistingModel: async (_modelRef, context) => {
      receivedForm = context.characterForm;
      return stylizedVisual;
    }
  });

  const binding = await adapter.resolve({
    actorId: "owner-1",
    identityId: "identity-hero-001"
  });

  assert.equal(receivedForm, "stylized");
  assert.strictEqual(binding.character.visual, stylizedVisual);
});

test("uninvited accounts cannot resolve a private character", async () => {
  const identityService = await setupIdentity();
  let resolverCalls = 0;
  const adapter = createIdentityRuntimeAdapter({
    identityService,
    resolveExistingModel: async () => {
      resolverCalls++;
      return { name: "should-not-load" };
    }
  });

  await assert.rejects(
    adapter.resolve({ actorId: "visitor-2", identityId: "identity-hero-001" }),
    error => error.code === "ALIVE_IDENTITY_ACCESS_DENIED"
  );
  assert.equal(resolverCalls, 0);
});

test("an invited viewer resolves the existing character without receiving owner controls", async () => {
  const identityService = await setupIdentity();
  await identityService.grantAccess({
    actorId: "owner-1",
    identityId: "identity-hero-001",
    subjectId: "invited-visitor",
    role: "viewer"
  });
  const existingHero = { name: "HERO_visual" };
  const adapter = createIdentityRuntimeAdapter({
    identityService,
    resolveExistingModel: async () => existingHero
  });

  const binding = await adapter.resolve({
    actorId: "invited-visitor",
    identityId: "identity-hero-001"
  });

  assert.equal(binding.ownerId, "owner-1");
  assert.equal(binding.role, "viewer");
  assert.strictEqual(binding.character.visual, existingHero);
  assert.equal(binding.permissions.canManageIdentity, false);
  assert.equal(binding.permissions.canManagePermissions, false);
  assert.equal(binding.permissions.canSelectCompanionPolicy, false);
});

test("only the owner may opt the Companion into assisted or autonomous mode", async () => {
  const identityService = await setupIdentity();
  await identityService.grantAccess({
    actorId: "owner-1",
    identityId: "identity-hero-001",
    subjectId: "invited-editor",
    role: "editor"
  });
  const adapter = createIdentityRuntimeAdapter({
    identityService,
    resolveExistingModel: async () => ({ name: "HERO_visual" })
  });
  const autonomous = createCompanionPolicy({
    identityId: "identity-hero-001",
    mode: "autonomous",
    mayActWhenOwnerAway: true,
    capabilities: ["prepare-owner-approved-work"]
  });

  await assert.rejects(
    adapter.resolve({
      actorId: "invited-editor",
      identityId: "identity-hero-001",
      requiredRole: "editor",
      companionPolicy: autonomous
    }),
    error => error.code === "ALIVE_RUNTIME_OWNER_REQUIRED"
  );

  const ownerBinding = await adapter.resolve({
    actorId: "owner-1",
    identityId: "identity-hero-001",
    companionPolicy: autonomous
  });
  assert.equal(ownerBinding.companionPolicy.mode, "autonomous");
  assert.equal(ownerBinding.companionPolicy.mayActWhenOwnerAway, true);
  assert.equal(ownerBinding.companionPolicy.requireOwnerApprovalForExternalActions, true);
  assert.equal(ownerBinding.companionPolicy.mayShareMemories, false);
});

test("a Companion policy cannot be attached to another identity or bypass policy validation", async () => {
  const identityService = await setupIdentity();
  const adapter = createIdentityRuntimeAdapter({
    identityService,
    resolveExistingModel: async () => ({ name: "HERO_visual" })
  });

  await assert.rejects(
    adapter.resolve({
      actorId: "owner-1",
      identityId: "identity-hero-001",
      companionPolicy: createCompanionPolicy({ identityId: "different-identity", mode: "assisted" })
    }),
    error => error.code === "ALIVE_RUNTIME_COMPANION_ID_MISMATCH"
  );

  await assert.rejects(
    adapter.resolve({
      actorId: "owner-1",
      identityId: "identity-hero-001",
      companionPolicy: {
        schema: "alive-companion-policy",
        schemaVersion: 1,
        identityId: "identity-hero-001",
        mode: "autonomous",
        mayActWhenOwnerAway: true,
        mayChangeIdentity: true,
        mayChangePermissions: false,
        mayShareMemories: false,
        requireOwnerApprovalForExternalActions: true,
        wellbeing: { punitiveDecay: false, irreversibleLoss: false }
      }
    }),
    error => error.code === "ALIVE_RUNTIME_COMPANION_POLICY_INVALID"
  );
});

test("runtime binding fails closed when the model reference is absent or unresolved", async () => {
  const noReference = await setupIdentity({ modelRef: null });
  const missingAdapter = createIdentityRuntimeAdapter({
    identityService: noReference,
    resolveExistingModel: async () => ({ name: "unused" })
  });
  await assert.rejects(
    missingAdapter.resolve({ actorId: "owner-1", identityId: "identity-hero-001" }),
    error => error.code === "ALIVE_RUNTIME_MODEL_REFERENCE_REQUIRED"
  );

  const unresolved = await setupIdentity();
  const missingModel = createIdentityRuntimeAdapter({
    identityService: unresolved,
    resolveExistingModel: async () => null
  });
  await assert.rejects(
    missingModel.resolve({ actorId: "owner-1", identityId: "identity-hero-001" }),
    error => error.code === "ALIVE_RUNTIME_MODEL_NOT_FOUND"
  );
});

test("runtime adapter requires explicit identity and model resolver boundaries", () => {
  assert.throws(
    () => createIdentityRuntimeAdapter({ resolveExistingModel() {} }),
    /owner-scoped identity service/
  );
  assert.throws(
    () => createIdentityRuntimeAdapter({ identityService: { get() {} } }),
    /resolveExistingModel/
  );
});
