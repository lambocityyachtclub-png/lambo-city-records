import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const main = await fs.readFile(new URL("../../main.js", import.meta.url), "utf8");
const api = await fs.readFile(new URL("../../api/alive/personal/[action].js", import.meta.url), "utf8");
const html = await fs.readFile(new URL("../../alive/index.html", import.meta.url), "utf8");

test("existing HERO binding is opt-in and lazy, with no ALIVE request during normal game startup", () => {
  assert.match(main, /get\("alive"\) === "connect"/);
  assert.match(main, /await import\("\.\/alive\/runtime\/lamboCityHeroHostAdapter\.js"\)/);
  assert.match(main, /npcSystem: NPC/);
  assert.match(main, /window\.__lamboCityAliveIdentityBinding = binding/);
  assert.match(main, /ALIVE IDENTITY CONNECTED — EXISTING HERO INSTANCE PRESERVED/);
});

test("owner identity API accepts only the approved existing HERO reference under the verified session", () => {
  assert.match(api, /authenticateAliveOwner\(req\)/);
  assert.match(api, /body\.modelRef !== "existing:hero-model"/);
  assert.match(api, /modelRef: body\.modelRef/);
});

test("owner console offers an explicit connection action and preserves the existing HERO visual", () => {
  assert.match(html, /href="\/\?alive=connect"/);
  assert.match(html, /Connect existing HERO in LAMBO CITY/);
  assert.match(html, /without creating, cloning, or visually changing the model/);
});
