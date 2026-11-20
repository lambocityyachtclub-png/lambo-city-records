import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";

const html = await fs.readFile(new URL("../../alive/index.html", import.meta.url), "utf8");
const script = await fs.readFile(new URL("../../alive/owner.js", import.meta.url), "utf8");

test("ALIVE owner console is a separate no-index page and does not enter the game runtime", () => {
  assert.match(html, /noindex,nofollow/);
  assert.match(html, /\.\/owner\.js/);
  assert.doesNotMatch(html, /main\.js|engine\.js/);
});

test("owner authentication uses secure same-origin sessions, not browser bearer-token storage", () => {
  assert.match(script, /credentials:"same-origin"/);
  assert.match(script, /signIn\.email/);
  assert.match(script, /signIn\.passkey/);
  assert.doesNotMatch(script, /localStorage|sessionStorage|document\.cookie|Authorization/);
  assert.match(script, /pagehide/);
  assert.match(script, /getSession/);
});

test("owner console escapes returned task and proposal content before rendering", () => {
  assert.match(script, /const escapeHTML=/);
  assert.match(script, /escapeHTML\(file\.content/);
  assert.match(script, /escapeHTML\(task\.title/);
});

test("one-shot execution requires configured services and a second owner confirmation", () => {
  assert.match(script, /statusSnapshot\?\.executionConfigured/);
  assert.match(script, /window\.confirm/);
  assert.match(script, /request\("run"/);
  assert.match(script, /No production deployment will occur/);
});

test("owner task intake sends acceptance criteria as a list", () => {
  assert.match(script, /split\(\/\\r\?\\n\//);
  assert.match(script, /acceptanceCriteria:criteria/);
});

test("owner recovery uses authenticator verification and one-time backup codes", () => {
  assert.match(script, /twoFactorClient/);
  assert.match(script, /twoFactor\.enable/);
  assert.match(script, /verifyTotp/);
  assert.match(script, /verifyBackupCode/);
  assert.match(script, /copy-recovery-codes/);
  assert.match(script, /qrcode@1\.5\.4/);
  assert.match(script, /copy-totp-uri/);
  assert.match(script, /onTwoFactorRedirect/);
  assert.match(html, /totp-qr/);
  assert.match(html, /One-time backup code/);
  assert.match(html, /Set up authenticator and backup codes/);
});

test("owner recovery schema is isolated from player account tables", async () => {
  const migration = await fs.readFile(new URL("../storage/migrations/002_alive_owner_auth.sql", import.meta.url), "utf8");
  assert.match(migration, /alive_owner_two_factor/);
  assert.match(migration, /alive_owner_user/);
  assert.doesNotMatch(migration, /CREATE TABLE IF NOT EXISTS player_/);
});

test("owner server enables verified password sign-in, password recovery, passkeys, and one-time backup codes", async () => {
  const auth = await fs.readFile(new URL("../../alive/server/ownerAuth.js", import.meta.url), "utf8");
  assert.match(auth, /emailAndPassword:\s*\{/);
  assert.match(auth, /enabled:\s*true/);
  assert.match(auth, /requireEmailVerification:\s*true/);
  assert.match(auth, /minPasswordLength:\s*12/);
  assert.match(auth, /sendResetPassword:/);
  assert.match(auth, /emailVerification:\s*\{/);
  assert.match(auth, /twoFactor\(/);
  assert.match(auth, /twoFactorTable:\s*"alive_owner_two_factor"/);
  assert.match(auth, /backupCodeOptions:\s*\{\s*amount:\s*10,\s*length:\s*10\s*\}/);
  assert.match(auth, /userVerification:\s*"required"/);
  assert.doesNotMatch(auth, /magicLink\(/);
});
