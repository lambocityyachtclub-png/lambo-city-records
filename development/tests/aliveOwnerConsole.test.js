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

test("owner authentication uses saved email/password sessions without browser bearer-token storage", () => {
  assert.match(script, /credentials:"same-origin"/);
  assert.match(script, /signIn\.email/);
  assert.match(script, /signIn\.passkey/);
  assert.match(script, /passkeyClient\(\)/);
  assert.match(script, /signUp\.email/);
  assert.match(script, /createFounderCredential/);
  assert.match(html, /Sign in to ALIVE/);
  assert.match(html, /autocomplete="current-password"/);
  assert.match(html, /<form class="auth-form" id="owner-auth-form">/);
  assert.match(script, /owner-auth-form.*addEventListener\("submit"/s);
  assert.doesNotMatch(script, /localStorage|sessionStorage|document\.cookie|Authorization/);
  assert.match(script, /pagehide/);
  assert.match(script, /getSession/);
  assert.doesNotThrow(() => new vm.Script(script));
});


test("founder invitation is scrubbed from browser history immediately and its header is isolated to signup", () => {
  const tokenRead = script.indexOf("let enrollmentToken=");
  const scrub = script.indexOf('if(enrollmentToken)history.replaceState(null,"",window.location.pathname+window.location.search);');
  assert.ok(tokenRead >= 0 && scrub > tokenRead, "founder invitation should be read and then removed from browser history");
  const bootstrapEnd = script.indexOf("\nconst createOwnerButton", tokenRead);
  assert.ok(bootstrapEnd > scrub, "founder invitation bootstrap should finish before owner UI setup");
  const bootstrap = script.slice(tokenRead, bootstrapEnd);
  let replacedUrl = null;
  vm.runInNewContext(bootstrap, {
    window: { location: { hash: "#enroll=private-invitation", pathname: "/alive/", search: "?mode=preview" } },
    history: { replaceState(_state, _title, url) { replacedUrl = url; } },
    URLSearchParams
  });
  assert.equal(replacedUrl, "/alive/?mode=preview");
  assert.ok(script.includes("function getAuthClient(){if(!authClientPromise)authClientPromise=createAuthClient();return authClientPromise;}"));
  assert.ok(script.includes('function getEnrollmentAuthClient(){if(!enrollmentToken)throw new Error("Founder setup requires the private one-time invitation.");if(!enrollmentAuthClientPromise)enrollmentAuthClientPromise=createAuthClient(true);return enrollmentAuthClientPromise;}'));
  assert.match(script, /const enrolling=!!enrollmentToken;[\s\S]*const auth=enrolling\?await getEnrollmentAuthClient\(\):await getAuthClient\(\);\s*const result=enrolling\?await auth\.signUp\.email/);
  assert.doesNotMatch(script, /fetchOptions:\{headers:enrollmentToken\?/);
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
  assert.match(auth, /requireEmailVerification:\s*false/);
  assert.match(auth, /sendOnSignUp:\s*false/);
  assert.match(auth, /sendOnSignIn:\s*false/);
  assert.match(auth, /emailVerified:\s*true/);
  assert.match(auth, /isAliveOwnerEnrollmentOpen/);
  assert.match(auth, /minPasswordLength:\s*12/);
  assert.match(auth, /sendResetPassword:/);
  assert.match(auth, /emailVerification:\s*\{/);
  assert.match(auth, /twoFactor\(/);
  assert.match(auth, /twoFactorTable:\s*"alive_owner_two_factor"/);
  assert.match(auth, /backupCodeOptions:\s*\{\s*amount:\s*10,\s*length:\s*10\s*\}/);
  assert.match(auth, /userVerification:\s*"required"/);
  assert.doesNotMatch(auth, /magicLink\(/);
});


test("founder setup creates an automatic random credential during the one-time invitation", () => {
  assert.ok(script.includes('auth.signUp.email({email,password,name:"ALIVE Owner"})'));
  assert.ok(script.includes("crypto.getRandomValues"));
  assert.ok(script.includes("password=enrolling?createFounderCredential():$(\"owner-password\").value"));
  assert.ok(script.includes("if(passwordInput)passwordInput.hidden=!!enrollmentToken"));
  assert.match(html, /Activate my owner account/);
  assert.doesNotMatch(script, /owner-password-confirm/);
  assert.doesNotMatch(script, /localStorage|sessionStorage/);
});
