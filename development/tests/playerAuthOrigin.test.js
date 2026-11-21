import test from "node:test";
import assert from "node:assert/strict";
import { getPlayerAuthOriginConfig, isSameOriginRequest } from "../../server/origin.js";

test("Preview prefers the stable branch alias for Better Auth and passkeys", () => {
  const config = getPlayerAuthOriginConfig({ VERCEL_ENV: "preview", VERCEL_BRANCH_URL: "player-accounts-clean.example.vercel.app", VERCEL_URL: "one-off-deployment.example.vercel.app" });
  assert.equal(config.baseURL, "https://player-accounts-clean.example.vercel.app");
  assert.equal(config.rpID, "player-accounts-clean.example.vercel.app");
  assert.deepEqual(config.trustedOrigins, ["https://player-accounts-clean.example.vercel.app", "https://one-off-deployment.example.vercel.app"]);
  assert.deepEqual(config.passkeyOrigins, ["https://player-accounts-clean.example.vercel.app"]);
});

test("Production defaults to the canonical LAMBO CITY domain", () => {
  const config = getPlayerAuthOriginConfig({ VERCEL_ENV: "production", VERCEL_URL: "production-deployment.example.vercel.app" });
  assert.equal(config.baseURL, "https://lambocityrecords.com");
  assert.equal(config.rpID, "lambocityrecords.com");
  assert.deepEqual(config.trustedOrigins, ["https://lambocityrecords.com", "https://www.lambocityrecords.com"]);
  assert.deepEqual(config.passkeyOrigins, ["https://lambocityrecords.com", "https://www.lambocityrecords.com"]);
});

test("An explicit configured origin is respected", () => {
  const config = getPlayerAuthOriginConfig({ VERCEL_ENV: "preview", BETTER_AUTH_URL: "https://accounts.example.com/path" });
  assert.equal(config.baseURL, "https://accounts.example.com");
  assert.equal(config.rpID, "accounts.example.com");
  assert.equal(config.trustedOrigins[0], "https://accounts.example.com");
});

test("Local development keeps its localhost fallback", () => {
  const config = getPlayerAuthOriginConfig({});
  assert.equal(config.baseURL, "http://localhost:3000");
  assert.equal(config.rpID, "localhost");
});


test("Preview branch alias takes precedence over a stale deployment-specific auth URL", () => {
  const config = getPlayerAuthOriginConfig({
    VERCEL_ENV: "preview",
    BETTER_AUTH_URL: "https://old-deployment.example.vercel.app",
    VERCEL_BRANCH_URL: "stable-branch.example.vercel.app",
    VERCEL_URL: "one-off-deployment.example.vercel.app"
  });
  assert.equal(config.baseURL, "https://stable-branch.example.vercel.app");
  assert.deepEqual(config.passkeyOrigins, ["https://stable-branch.example.vercel.app"]);
});

test("state-changing player requests require an exact trusted same-origin request", () => {
  const env = {
    VERCEL_ENV: "preview",
    VERCEL_BRANCH_URL: "player-accounts-clean.example.vercel.app",
    VERCEL_URL: "one-off-deployment.example.vercel.app"
  };
  assert.equal(isSameOriginRequest({ headers: { origin: "https://player-accounts-clean.example.vercel.app", "sec-fetch-site": "same-origin" } }, env), true);
  assert.equal(isSameOriginRequest({ headers: { origin: "https://attacker.example", "sec-fetch-site": "cross-site" } }, env), false);
  assert.equal(isSameOriginRequest({ headers: { origin: "https://player-accounts-clean.example.vercel.app", "sec-fetch-site": "cross-site" } }, env), false);
});
