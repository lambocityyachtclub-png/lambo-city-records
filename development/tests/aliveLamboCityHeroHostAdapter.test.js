import test from "node:test";
import assert from "node:assert/strict";
import { connectLamboCityHeroIdentity } from "../../alive/runtime/lamboCityHeroHostAdapter.js";

function identity(overrides = {}) {
  return {
    schema: "alive-personal-identity",
    schemaVersion: 1,
    ownerId: "owner-1",
    identityId: "identity-1",
    displayName: "Owner",
    character: { form: "digital-human", modelRef: "existing:hero-model", appearanceProfile: {} },
    personality: { summary: "", traits: [] },
    privacy: { discoverability: "private", memoryAccess: "owner-only", trainingUse: false },
    memoryPolicy: { ownerControlled: true, sharing: "private", retention: "owner-controlled" },
    grants: [],
    ...overrides
  };
}

test("ALIVE host binding returns the exact existing HERO object without cloning or replacing it", async () => {
  const existingHero = { name: "HERO_existing_live_instance" };
  const npcSystem = { getHero: () => existingHero };
  const binding = await connectLamboCityHeroIdentity({ identity: identity(), npcSystem });
  assert.strictEqual(binding.character.visual, existingHero);
  assert.equal(binding.characterReference, "existing:hero-model");
  assert.equal(binding.connectionMode, "existing-instance-reference");
  assert.equal(binding.role, "owner");
  assert.equal(binding.companionPolicy.mode, "owner-directed");
});

test("ALIVE host binding fails closed for missing HERO, wrong model reference, or unauthorized identity actor", async () => {
  await assert.rejects(
    connectLamboCityHeroIdentity({ identity: identity({ character: { form: "digital-human", modelRef: null } }), npcSystem: { getHero: () => ({}) } }),
    error => error.code === "ALIVE_HERO_MODEL_REF_INVALID"
  );
  await assert.rejects(
    connectLamboCityHeroIdentity({ identity: identity(), npcSystem: { getHero: () => null } }),
    error => error.code === "ALIVE_RUNTIME_MODEL_NOT_FOUND"
  );
  await assert.rejects(
    connectLamboCityHeroIdentity({ identity: identity({ ownerId: "" }), npcSystem: { getHero: () => ({}) } }),
    error => error.code === "ALIVE_HERO_IDENTITY_REQUIRED"
  );
});
