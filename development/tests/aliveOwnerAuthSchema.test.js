import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationUrl = new URL("../storage/migrations/002_alive_owner_auth.sql", import.meta.url);

test("ALIVE owner authentication migration creates isolated Better Auth tables", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  for (const table of [
    "alive_owner_user",
    "alive_owner_session",
    "alive_owner_account",
    "alive_owner_verification",
    "alive_owner_passkey",
    "alive_owner_two_factor"
  ]) {
    assert.match(sql, new RegExp("CREATE TABLE IF NOT EXISTS public\\." + table + "\\b"));
  }
});

test("ALIVE owner authentication migration includes Better Auth field names", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  for (const column of [
    '"emailVerified"',
    '"createdAt"',
    '"updatedAt"',
    '"userId"',
    '"expiresAt"',
    '"credentialID"',
    '"publicKey"',
    '"twoFactorEnabled"',
    '"backupCodes"'
  ]) {
    assert.ok(sql.includes(column), "Missing Better Auth column " + column);
  }
});

test("ALIVE owner authentication migration is repeat-safe and contains no destructive SQL", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.equal((sql.match(/CREATE TABLE IF NOT EXISTS/g) || []).length, 6);
  assert.equal((sql.match(/CREATE INDEX IF NOT EXISTS/g) || []).length, 4);
  assert.match(sql, /ADD COLUMN IF NOT EXISTS "twoFactorEnabled"/);
  assert.doesNotMatch(sql, /\b(DROP|TRUNCATE|DELETE FROM)\b/i);
});
