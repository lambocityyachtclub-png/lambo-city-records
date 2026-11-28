import test from "node:test";
import assert from "node:assert/strict";
import { getPlayerAuthOriginConfig, isSameOriginRequest } from "../../server/origin.js";

test("Preview prefers the stable branch alias for Better Auth and passkeys", () => {
  const config = getPlayerAuthOriginConfig({ VERCEL_ENV: "preview", VERCEL_BRANCH_URL: "player-accounts.example.vercel.app", VERCEL_URL: "deployment.example.vercel.app" });
  assert.equal(config.baseURL, "https://player-accounts.example.vercel.app");
  assert.equal(config.rpID, "player-accounts.example.vercel.app");
  assert.deepEqual(config.trustedOrigins, ["https://player-accounts.example.vercel.app", "https://deployment.example.vercel.app"]);
  assert.deepEqual(config.passkeyOrigins, ["https://player-accounts.example.vercel.app"]);
});

test("Production uses the canonical LAMBO CITY domain", () => {
  const config = getPlayerAuthOriginConfig({ VERCEL_ENV: "production", VERCEL_URL: "production.example.vercel.app" });
  assert.equal(config.baseURL, "https://lambocityrecords.com");
  assert.equal(config.rpID, "lambocityrecords.com");
  assert.deepEqual(config.trustedOrigins, ["https://lambocityrecords.com", "https://www.lambocityrecords.com"]);
});

test("Explicit configured origin is respected when no stable Preview alias exists", () => {
  const config = getPlayerAuthOriginConfig({ VERCEL_ENV: "preview", BETTER_AUTH_URL: "https://accounts.example.com/path" });
  assert.equal(config.baseURL, "https://accounts.example.com");
  assert.equal(config.rpID, "accounts.example.com");
});

test("Local development keeps its localhost fallback", () => {
  const config = getPlayerAuthOriginConfig({});
  assert.equal(config.baseURL, "http://localhost:3000");
  assert.equal(config.rpID, "localhost");
});

test("state-changing requests require an exact trusted same-origin request", () => {
  const env = { VERCEL_ENV: "preview", VERCEL_BRANCH_URL: "player-accounts.example.vercel.app" };
  assert.equal(isSameOriginRequest({ headers: { origin: "https://player-accounts.example.vercel.app", "sec-fetch-site": "same-origin" } }, env), true);
  assert.equal(isSameOriginRequest({ headers: { origin: "https://attacker.example", "sec-fetch-site": "cross-site" } }, env), false);
  assert.equal(isSameOriginRequest({ headers: { origin: "https://player-accounts.example.vercel.app", "sec-fetch-site": "cross-site" } }, env), false);
});
