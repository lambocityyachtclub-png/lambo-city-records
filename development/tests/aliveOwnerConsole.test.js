import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

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
