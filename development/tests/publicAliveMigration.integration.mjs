import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { Pool } from "pg";
import { createIdentityService } from "../../alive/identity/identityService.js";
import { createPostgresIdentityRepository } from "../../alive/identity/postgresIdentityRepository.js";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) throw new Error("TEST_DATABASE_URL is required for the isolated migration integration test.");
const pool = new Pool({ connectionString, max: 2 });

try {
  await pool.query('CREATE TABLE public."user" (id TEXT PRIMARY KEY)');
  const migration = await fs.readFile(new URL("../../migrations/002_alive_public_companions.sql", import.meta.url), "utf8");
  await pool.query(migration);
  await pool.query('INSERT INTO public."user" (id) VALUES ($1), ($2)', ["account-a", "account-b"]);

  const service = createIdentityService({ repository: createPostgresIdentityRepository(pool) });
  const created = await service.create({ actorId: "account-a", identity: { identityId: "integration-companion-a", displayName: "Nova", characterForm: "stylized" } });
  assert.equal(created.ownerId, "account-a");
  assert.equal(created.privacy.discoverability, "private");
  assert.equal(created.privacy.trainingUse, false);

  const updated = await service.update({ actorId: "account-a", identityId: "integration-companion-a", changes: { displayName: "Nova Prime", appearanceProfile: { hairStyle: "braids" } } });
  assert.equal(updated.displayName, "Nova Prime");
  assert.equal(updated.character.appearanceProfile.hairStyle, "braids");

  const stored = await pool.query("SELECT owner_id, version FROM public.alive_personal_identities WHERE identity_id = $1", ["integration-companion-a"]);
  assert.equal(stored.rows[0].owner_id, "account-a");
  assert.equal(Number(stored.rows[0].version), 2);

  await assert.rejects(service.get({ actorId: "account-b", identityId: "integration-companion-a", requiredRole: "owner" }), error => error.code === "ALIVE_IDENTITY_ACCESS_DENIED");
  await assert.rejects(service.update({ actorId: "account-b", identityId: "integration-companion-a", changes: { displayName: "Stolen" } }), error => error.code === "ALIVE_IDENTITY_OWNER_REQUIRED");

  await assert.rejects(pool.query("INSERT INTO public.alive_personal_identities (identity_id, owner_id, record) VALUES ($1, $2, $3::jsonb)", ["orphan", "missing-account", "{}"]), error => error.code === "23503");

  await pool.query('INSERT INTO public.alive_public_api_rate_limits (owner_id, request_count) VALUES ($1, 1)', ["account-a"]);
  await pool.query('DELETE FROM public."user" WHERE id = $1', ["account-a"]);
  const remaining = await pool.query("SELECT count(*)::int AS identities FROM public.alive_personal_identities WHERE owner_id = $1", ["account-a"]);
  const limits = await pool.query("SELECT count(*)::int AS limits FROM public.alive_public_api_rate_limits WHERE owner_id = $1", ["account-a"]);
  assert.equal(remaining.rows[0].identities, 0);
  assert.equal(limits.rows[0].limits, 0);
  process.stdout.write("Public ALIVE migration and owner-scoped persistence checks passed.\\n");
} finally {
  await pool.end();
}
