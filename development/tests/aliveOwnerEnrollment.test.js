import test from "node:test";
import assert from "node:assert/strict";
import { isOwnerSignupRequest, isValidOwnerEnrollmentToken } from "../../alive/server/ownerEnrollment.js";

const token = "a".repeat(64);
const env = { VERCEL_ENV: "preview", ALIVE_OWNER_ENROLLMENT_TOKEN: token, ALIVE_OWNER_ENROLLMENT_EXPIRES_AT: "2000000000000" };

test("only POST signup endpoints are treated as owner enrollment", () => {
  assert.equal(isOwnerSignupRequest({ method: "POST", url: "/api/alive/auth/sign-up/email" }), true);
  assert.equal(isOwnerSignupRequest({ method: "GET", url: "/api/alive/auth/sign-up/email" }), false);
  assert.equal(isOwnerSignupRequest({ method: "POST", url: "/api/alive/auth/sign-in/email" }), false);
});

test("a valid unexpired Preview invitation is accepted", () => {
  assert.equal(isValidOwnerEnrollmentToken({ headers: { "x-alive-owner-enrollment-token": token } }, env, 1900000000000), true);
});

test("wrong, missing, expired, and production invitations are rejected", () => {
  assert.equal(isValidOwnerEnrollmentToken({ headers: { "x-alive-owner-enrollment-token": "wrong" } }, env, 1900000000000), false);
  assert.equal(isValidOwnerEnrollmentToken({ headers: {} }, env, 1900000000000), false);
  assert.equal(isValidOwnerEnrollmentToken({ headers: { "x-alive-owner-enrollment-token": token } }, env, 2000000000000), false);
  assert.equal(isValidOwnerEnrollmentToken({ headers: { "x-alive-owner-enrollment-token": token } }, { ...env, VERCEL_ENV: "production" }, 1900000000000), false);
});
