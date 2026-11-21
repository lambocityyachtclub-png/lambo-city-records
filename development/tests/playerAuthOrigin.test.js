import test from "node:test";
import assert from "node:assert/strict";
import { getPlayerAuthOriginConfig } from "../../server/origin.js";

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
  const config = getPlayerAuthOriginConfig({ VERCEL_ENV: "preview", BETTER_AUTH_URL: "https://accounts.example.com/path", VERCEL_BRANCH_URL: "branch.example.vercel.app" });
  assert.equal(config.baseURL, "https://accounts.example.com");
  assert.equal(config.rpID, "accounts.example.com");
  assert.equal(config.trustedOrigins[0], "https://accounts.example.com");
});

test("Local development keeps its localhost fallback", () => {
  const config = getPlayerAuthOriginConfig({});
  assert.equal(config.baseURL, "http://localhost:3000");
  assert.equal(config.rpID, "localhost");
});
