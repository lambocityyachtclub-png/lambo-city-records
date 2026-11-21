import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { normalizePublicCompanionInput, publicCompanionIdentityId, toPublicCompanionView } from "../../server/publicCompanion.js";

test("public Companion identity IDs are stable and account-specific", () => {
  assert.equal(publicCompanionIdentityId("account-a"), publicCompanionIdentityId("account-a"));
  assert.notEqual(publicCompanionIdentityId("account-a"), publicCompanionIdentityId("account-b"));
  assert.throws(() => publicCompanionIdentityId(""), /verified account/);
});

test("public Companion input accepts only the shared supported identity forms", () => {
  assert.throws(() => normalizePublicCompanionInput({ displayName: "A", characterForm: "unknown" }), /digital-human or stylized/);
  assert.throws(() => normalizePublicCompanionInput({ displayName: "", characterForm: "stylized" }), /2–40 characters/);
});

test("public Companion input whitelists appearance and personality values", () => {
  const value = normalizePublicCompanionInput({
    displayName: "Nova", characterForm: "stylized", ownerId: "attacker-controlled",
    appearanceProfile: { skinTone: "deep", hairStyle: "braids", accentColor: "gold", modelRef: "existing:hero-model" },
    personality: { summary: "Warm and curious.", traits: ["curious", "playful", "admin", "curious"] }
  });
  assert.equal(value.displayName, "Nova");
  assert.equal(value.appearanceProfile.skinTone, "deep");
  assert.equal(value.appearanceProfile.hairStyle, "braids");
  assert.equal(value.appearanceProfile.accentColor, "gold");
  assert.equal("modelRef" in value.appearanceProfile, false);
  assert.deepEqual(value.personality.traits, ["curious", "playful"]);
  assert.equal("ownerId" in value, false);
});

test("public Companion view never returns owner IDs, grants, or internal model references", () => {
  const view = toPublicCompanionView({
    ownerId: "private-owner-id", identityId: "private-identity-id", displayName: "Nova",
    character: { form: "stylized", modelRef: "internal:model", appearanceProfile: { hairStyle: "curly" } },
    personality: { summary: "Curious", traits: ["curious"] },
    privacy: { discoverability: "private" }, grants: [{ subjectId: "other" }], createdAt: "now", updatedAt: "now"
  });
  assert.equal(view.displayName, "Nova");
  assert.equal(view.privacy.trainingUse, false);
  assert.equal(view.privacy.visibility, "private");
  assert.equal("ownerId" in view, false);
  assert.equal("identityId" in view, false);
  assert.equal("grants" in view, false);
  assert.equal("modelRef" in view.character, false);
});

test("public Companion API derives account ownership from verified session and protects writes", async () => {
  const api = await fs.readFile(new URL("../../api/alive/public/companion.js", import.meta.url), "utf8");
  assert.match(api, /auth\.api\.getSession/);
  assert.match(api, /user\.emailVerified !== true/);
  assert.match(api, /publicCompanionIdentityId\(user\.id\)/);
  assert.match(api, /method === "PUT" && !isSameOriginRequest\(req\)/);
  assert.match(api, /alive_public_api_rate_limits/);
  assert.doesNotMatch(api, /req\.body\??\.ownerId/);
});

test("public Companion migration links records to real public accounts and preserves private defaults", async () => {
  const migration = await fs.readFile(new URL("../../migrations/002_alive_public_companions.sql", import.meta.url), "utf8");
  assert.match(migration, /REFERENCES public\."user" \(id\) ON DELETE CASCADE/);
  assert.match(migration, /alive_public_identity_private_memory/);
  assert.match(migration, /alive_public_identity_no_training/);
  assert.match(migration, /alive_public_identity_private_sharing/);
});
