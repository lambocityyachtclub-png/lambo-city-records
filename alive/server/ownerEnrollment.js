import { timingSafeEqual } from "node:crypto";

export function isOwnerSignupRequest(req) {
  if (String(req?.method || "").toUpperCase() !== "POST") return false;
  try {
    const pathname = new URL(req.url || "/", "https://alive.invalid").pathname;
    return pathname.startsWith("/api/alive/auth/sign-up/");
  } catch {
    return false;
  }
}

export function isValidOwnerEnrollmentToken(req, env = process.env, now = Date.now()) {
  if (env.VERCEL_ENV !== "preview") return false;
  const expected = env.ALIVE_OWNER_ENROLLMENT_SECRET;
  const expiresAt = Number(env.ALIVE_OWNER_ENROLLMENT_EXPIRES_AT);
  if (typeof expected !== "string" || expected.length < 48) return false;
  if (!Number.isSafeInteger(expiresAt) || now >= expiresAt) return false;
  const headers = req?.headers || {};
  const supplied = headers["x-alive-owner-enrollment-token"] || headers["X-ALIVE-OWNER-ENROLLMENT-TOKEN"];
  if (typeof supplied !== "string") return false;
  const left = Buffer.from(expected, "utf8");
  const right = Buffer.from(supplied, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
