import test from "node:test";
import assert from "node:assert/strict";
import { isOwnerSignupRequest, isValidOwnerEnrollmentToken } from "../../alive/server/ownerEnrollment.js";

const future = Date.now() + 60_000;

test("ALIVE owner enrollment accepts the dedicated Preview-only token", () => {
  const env = { VERCEL_ENV: "preview", ALIVE_OWNER_ENROLLMENT_TOKEN: "a".repeat(64), ALIVE_OWNER_ENROLLMENT_EXPIRES_AT: String(future) };
  assert.equal(isValidOwnerEnrollmentToken({ headers: { "x-alive-owner-enrollment-token": "a".repeat(64) } }, env), true);
});

test("ALIVE owner enrollment rejects a wrong token", () => {
  const env = { VERCEL_ENV: "preview", ALIVE_OWNER_ENROLLMENT_TOKEN: "a".repeat(64), ALIVE_OWNER_ENROLLMENT_EXPIRES_AT: String(future) };
  assert.equal(isValidOwnerEnrollmentToken({ headers: { "x-alive-owner-enrollment-token": "b".repeat(64) } }, env), false);
});

test("ALIVE owner enrollment rejects expired invitations", () => {
  const env = { VERCEL_ENV: "preview", ALIVE_OWNER_ENROLLMENT_TOKEN: "a".repeat(64), ALIVE_OWNER_ENROLLMENT_EXPIRES_AT: "1" };
  assert.equal(isValidOwnerEnrollmentToken({ headers: { "x-alive-owner-enrollment-token": "a".repeat(64) } }, env), false);
});

test("ALIVE owner enrollment cannot be used in production", () => {
  const env = { VERCEL_ENV: "production", ALIVE_OWNER_ENROLLMENT_TOKEN: "a".repeat(64), ALIVE_OWNER_ENROLLMENT_EXPIRES_AT: String(future) };
  assert.equal(isValidOwnerEnrollmentToken({ headers: { "x-alive-owner-enrollment-token": "a".repeat(64) } }, env), false);
});

test("legacy enrollment secret remains a fallback", () => {
  const env = { VERCEL_ENV: "preview", ALIVE_OWNER_ENROLLMENT_SECRET: "c".repeat(64), ALIVE_OWNER_ENROLLMENT_EXPIRES_AT: String(future) };
  assert.equal(isValidOwnerEnrollmentToken({ headers: { "x-alive-owner-enrollment-token": "c".repeat(64) } }, env), true);
});

test("signup gate only matches owner signup requests", () => {
  assert.equal(isOwnerSignupRequest({ method: "POST", url: "/api/alive/auth/sign-up/email" }), true);
  assert.equal(isOwnerSignupRequest({ method: "POST", url: "/api/alive/auth/sign-in/passkey" }), false);
  assert.equal(isOwnerSignupRequest({ method: "GET", url: "/api/alive/auth/sign-up/email" }), false);
});
