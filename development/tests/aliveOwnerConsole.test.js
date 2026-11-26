import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

test("ALIVE owner console is private, no-index, and uses the owner-authenticated API", async () => {
  const html = await fs.readFile(new URL("../../alive/index.html", import.meta.url), "utf8");
  const script = await fs.readFile(new URL("../../alive/owner.js", import.meta.url), "utf8");
  const css = await fs.readFile(new URL("../../alive/owner.css", import.meta.url), "utf8");

  assert.match(html, /name="robots" content="noindex,nofollow"/);
  assert.match(html, /\/api\/alive\/auth/);
  assert.match(html, /owner-auth-form/);
  assert.match(html, /owner-enrollment-token/);
  assert.match(html, /register-passkey-button/);
  assert.match(html, /id="intent-form"/);
  assert.match(html, /id="reviews-list"/);
  assert.match(html, /id="scan-project-button"/);
  assert.match(script, /credentials:\s*"same-origin"/);
  assert.match(script, /signUp\.email/);
  assert.match(script, /signIn\.passkey/);
  assert.match(script, /request\("tasks"/);
  assert.match(script, /request\("reviews"/);
  assert.match(script, /request\("discovery"/);
  assert.match(script, /function renderDiscovery/);
  assert.doesNotMatch(script, /localStorage|sessionStorage/);
  assert.doesNotMatch(script, /api\/alive\/personal/);
  assert.match(css, /@media \(max-width: 680px\)/);
});

test("ALIVE owner console clearly reports that execution and production deployment are not enabled", async () => {
  const html = await fs.readFile(new URL("../../alive/index.html", import.meta.url), "utf8");
  const script = await fs.readFile(new URL("../../alive/owner.js", import.meta.url), "utf8");
  assert.match(html, /production release adapter is not enabled/);
  assert.match(script, /aiExecutionEnabled/);
  assert.match(script, /autonomousProductionDeployment/);
});
