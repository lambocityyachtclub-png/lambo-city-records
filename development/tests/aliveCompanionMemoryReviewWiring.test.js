import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const api = await fs.readFile(new URL("../../api/alive/personal/[action].js", import.meta.url), "utf8");
const services = await fs.readFile(new URL("../../alive/server/personalServices.js", import.meta.url), "utf8");
const html = await fs.readFile(new URL("../../alive/index.html", import.meta.url), "utf8");
const script = await fs.readFile(new URL("../../alive/owner.js", import.meta.url), "utf8");

test("Companion memory review is connected to the authenticated personal API", () => {
  assert.match(api, /authenticateAliveOwner\\(req\\)/);
  assert.match(api, /method !== "GET" && !isSameOrigin\\(req\\)/);
  assert.match(api, /action === "memory-proposals" && method === "GET"/);
  assert.match(api, /action === "memory-proposals" && method === "POST"/);
  assert.match(api, /companionMemoryReview\\.listPending/);
  assert.match(api, /companionMemoryReview\\.approve/);
  assert.match(api, /companionMemoryReview\\.archive/);
  assert.match(api, /owner\\.id/);
  assert.match(services, /createCompanionMemoryReviewService/);
  assert.match(services, /createPostgresCompanionMemoryReviewRepository/);
});

test("owner console exposes explicit approve and archive actions for pending Companion suggestions", () => {
  assert.match(html, /memory-proposal-list/);
  assert.match(html, /Memories awaiting your approval/);
  assert.match(script, /personal\\/memory-proposals/);
  assert.match(script, /memory-proposal-approve/);
  assert.match(script, /memory-proposal-archive/);
  assert.match(script, /window\\.confirm\\(prompt\\)/);
  assert.match(script, /escapeHTML\\(proposal\\.content/);
  assert.match(script, /Companion memory approved and kept private/);
});

test("Companion suggestions are not automatically created, approved, or shared by the review UI", () => {
  assert.match(script, /No Companion suggestions are waiting for approval/);
  assert.match(script, /It will remain private and will not be shared with ALIVE development/);
  assert.match(api, /body\\.action === "approve"/);
  assert.match(api, /body\\.action === "archive"/);
});
