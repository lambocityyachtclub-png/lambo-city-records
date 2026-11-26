import test from "node:test";
import assert from "node:assert/strict";
import {
  isOwnerSignupRequest,
  isValidOwnerEnrollmentToken
} from "../../alive/server/ownerEnrollment.js";
import {
  getAliveOwnerOriginConfig,
  isSameOriginRequest
} from "../../alive/server/originPolicy.js";

test("Founder enrollment is accepted only on a valid unexpired Preview invitation", () => {
  const env = {
    VERCEL_ENV: "preview",
    ALIVE_OWNER_ENROLLMENT_SECRET: "a".repeat(64),
    ALIVE_OWNER_ENROLLMENT_EXPIRES_AT: String(2000000000000)
  };
  const req = {
    method: "POST",
    url: "/api/alive/auth/sign-up/email",
    headers: { "x-alive-owner-enrollment-token": "a".repeat(64) }
  };
  assert.equal(isOwnerSignupRequest(req), true);
  assert.equal(isValidOwnerEnrollmentToken(req, env, 1900000000000), true);
  assert.equal(isValidOwnerEnrollmentToken(req, { ...env, VERCEL_ENV: "production" }, 1900000000000), false);
  assert.equal(isValidOwnerEnrollmentToken(req, { ...env, ALIVE_OWNER_ENROLLMENT_EXPIRES_AT: "1899999999999" }, 1900000000000), false);
  assert.equal(isValidOwnerEnrollmentToken({ ...req, headers: {} }, env, 1900000000000), false);
});

test("Owner enrollment is restricted to sign-up POST routes", () => {
  assert.equal(isOwnerSignupRequest({ method: "GET", url: "/api/alive/auth/sign-up/email" }), false);
  assert.equal(isOwnerSignupRequest({ method: "POST", url: "/api/alive/auth/sign-in/email" }), false);
  assert.equal(isOwnerSignupRequest({ method: "POST", url: "/api/alive/auth/sign-up/email" }), true);
});

test("Owner auth origin is pinned to the Preview deployment or canonical production domain", () => {
  const preview = getAliveOwnerOriginConfig({
    VERCEL_ENV: "preview",
    VERCEL_BRANCH_URL: "alive-example.vercel.app",
    VERCEL_URL: "alive-deployment.vercel.app"
  });
  assert.equal(preview.baseURL, "https://alive-example.vercel.app");
  assert.ok(preview.trustedOrigins.includes("https://alive-deployment.vercel.app"));

  const production = getAliveOwnerOriginConfig({ VERCEL_ENV: "production" });
  assert.equal(production.baseURL, "https://lambocityrecords.com");
  assert.ok(production.trustedOrigins.includes("https://www.lambocityrecords.com"));
});

test("Owner state-changing requests must match a trusted origin", () => {
  const env = {
    VERCEL_ENV: "preview",
    VERCEL_BRANCH_URL: "alive-example.vercel.app"
  };
  assert.equal(isSameOriginRequest({
    headers: { origin: "https://alive-example.vercel.app", "sec-fetch-site": "same-origin" }
  }, env), true);
  assert.equal(isSameOriginRequest({
    headers: { origin: "https://attacker.example", "sec-fetch-site": "cross-site" }
  }, env), false);
});
