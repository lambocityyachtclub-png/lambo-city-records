import test from "node:test";
import assert from "node:assert/strict";
import {
  CHARACTER_FORMS,
  createPersonalIdentity,
  validatePersonalIdentity,
  isIdentityOwner,
  canAccessIdentity,
  assertIdentityOwner,
  createCompanionPolicy,
  validateCompanionPolicy
} from "../../alive/identity/identityContract.js";

const baseIdentity = () => createPersonalIdentity({
  identityId: "identity-founder-001",
  ownerId: "account-owner-001",
  displayName: "HERO",
  characterForm: "digital-human",
  modelRef: "existing:hero-model",
  personality: { summary: "Owner-directed personal identity", traits: ["creative", "welcoming"] },
  createdAt: "2026-11-17T00:00:00.000Z"
});

test("supports both realistic digital humans and stylized characters", () => {
  assert.deepEqual(CHARACTER_FORMS, ["digital-human", "stylized"]);
  assert.equal(baseIdentity().character.form, "digital-human");
  const stylized = createPersonalIdentity({
    identityId: "identity-stylized-001",
    ownerId: "account-002",
    displayName: "My Character",
    characterForm: "stylized"
  });
  assert.equal(stylized.character.form, "stylized");
  assert.deepEqual(validatePersonalIdentity(stylized), []);
});

test("requires a personal owner, stable identity ID, display name, and supported form", () => {
  assert.throws(() => createPersonalIdentity({}), /owner ID/);
  assert.throws(() => createPersonalIdentity({ ownerId: "owner" }), /identity ID/);
  assert.throws(() => createPersonalIdentity({ ownerId: "owner", identityId: "id" }), /display name/);
  assert.throws(() => createPersonalIdentity({
    ownerId: "owner", identityId: "id", displayName: "Name", characterForm: "company-mascot"
  }), /digital-human or stylized/);
});

test("keeps HERO linked to the existing model reference without creating a replacement", () => {
  const identity = baseIdentity();
  assert.equal(identity.character.modelRef, "existing:hero-model");
  assert.equal(identity.identityId, "identity-founder-001");
  assert.equal(identity.ownerId, "account-owner-001");
});

test("defaults identity discovery and memory to private and owner-controlled", () => {
  const identity = baseIdentity();
  assert.equal(identity.privacy.discoverability, "private");
  assert.equal(identity.privacy.memoryAccess, "owner-only");
  assert.equal(identity.privacy.trainingUse, false);
  assert.equal(identity.memoryPolicy.ownerControlled, true);
  assert.equal(identity.memoryPolicy.sharing, "private");
  assert.equal(identity.memoryPolicy.retention, "owner-controlled");
});

test("only the owner receives implicit access and owner status cannot be delegated", () => {
  const identity = baseIdentity();
  assert.equal(isIdentityOwner(identity, "account-owner-001"), true);
  assert.equal(canAccessIdentity(identity, "account-owner-001", "owner"), true);
  assert.equal(canAccessIdentity(identity, "company-service", "owner"), false);
  assert.equal(canAccessIdentity(identity, "stranger", "viewer"), false);
  assert.throws(() => assertIdentityOwner(identity, "company-service"), error => {
    assert.equal(error.code, "ALIVE_IDENTITY_OWNER_REQUIRED");
    return true;
  });
});

test("delegated editor and viewer grants cannot replace personal ownership", () => {
  const identity = createPersonalIdentity({
    identityId: "identity-shared-001",
    ownerId: "owner",
    displayName: "Shared Character",
    characterForm: "stylized",
    grants: [
      { subjectId: "editor", role: "editor", permissions: ["view", "edit-appearance"] },
      { subjectId: "viewer", role: "viewer", permissions: ["view"] },
      { subjectId: "owner", role: "owner", permissions: ["*"] }
    ]
  });
  assert.equal(canAccessIdentity(identity, "editor", "editor"), true);
  assert.equal(canAccessIdentity(identity, "viewer", "viewer"), true);
  assert.equal(canAccessIdentity(identity, "viewer", "editor"), false);
  assert.equal(canAccessIdentity(identity, "editor", "owner"), false);
  assert.equal(identity.grants.some(grant => grant.subjectId === "owner"), false);
  assert.equal(validatePersonalIdentity(identity).length, 0);
});

test("invalid records cannot weaken owner-only memory or training restrictions", () => {
  const identity = { ...baseIdentity(), privacy: { memoryAccess: "public", trainingUse: true } };
  assert.ok(validatePersonalIdentity(identity).some(error => /owner-only/.test(error)));
  assert.ok(validatePersonalIdentity(identity).some(error => /training/.test(error)));
});

test("identity records and grant collections are immutable at the contract boundary", () => {
  const identity = baseIdentity();
  assert.equal(Object.isFrozen(identity), true);
  assert.equal(Object.isFrozen(identity.character), true);
  assert.equal(Object.isFrozen(identity.personality.traits), true);
  assert.throws(() => { identity.ownerId = "different-owner"; }, TypeError);
});

test("companion defaults to owner-directed behavior and non-punitive wellbeing", () => {
  const policy = createCompanionPolicy({ identityId: "identity-founder-001" });
  assert.equal(policy.mode, "owner-directed");
  assert.equal(policy.mayActWhenOwnerAway, false);
  assert.equal(policy.mayChangeIdentity, false);
  assert.equal(policy.mayChangePermissions, false);
  assert.equal(policy.mayShareMemories, false);
  assert.equal(policy.requireOwnerApprovalForExternalActions, true);
  assert.equal(policy.wellbeing.punitiveDecay, false);
  assert.equal(policy.wellbeing.irreversibleLoss, false);
  assert.deepEqual(validateCompanionPolicy(policy), []);
});

test("assisted and autonomous modes remain explicit and do not gain owner authority", () => {
  const assisted = createCompanionPolicy({
    identityId: "identity-1",
    mode: "assisted",
    capabilities: ["conversation", "remember-owner-approved-facts"]
  });
  const autonomous = createCompanionPolicy({
    identityId: "identity-1",
    mode: "autonomous",
    mayActWhenOwnerAway: true,
    capabilities: ["conversation"]
  });
  assert.equal(assisted.mayActWhenOwnerAway, false);
  assert.equal(autonomous.mayActWhenOwnerAway, true);
  for (const policy of [assisted, autonomous]) {
    assert.equal(policy.mayChangeIdentity, false);
    assert.equal(policy.mayChangePermissions, false);
    assert.equal(policy.requireOwnerApprovalForExternalActions, true);
    assert.deepEqual(validateCompanionPolicy(policy), []);
  }
});

test("companion policy validator rejects permission escalation and punitive care", () => {
  const invalid = {
    ...createCompanionPolicy({ identityId: "identity-1" }),
    mayChangePermissions: true,
    mayShareMemories: true,
    wellbeing: { careModel: "punitive", punitiveDecay: true, irreversibleLoss: true }
  };
  const errors = validateCompanionPolicy(invalid);
  assert.ok(errors.some(error => /permissions/.test(error)));
  assert.ok(errors.some(error => /share private memories/.test(error)));
  assert.ok(errors.some(error => /non-punitive/.test(error)));
});
