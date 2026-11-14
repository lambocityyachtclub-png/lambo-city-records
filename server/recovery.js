import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

function secret() {
  const value = process.env.BETTER_AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must be configured before account recovery can be used.");
  }
  return value;
}

export function hashRecoveryCode(code) {
  return createHmac("sha256", secret())
    .update(String(code).replace(/[^a-zA-Z0-9]/g, "").toUpperCase())
    .digest("hex");
}

export function hashRecoveryIdentity(value) {
  return createHmac("sha256", secret())
    .update(String(value || "unknown").trim().toLowerCase())
    .digest("hex");
}

export function createRecoveryContext(userId) {
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    exp: Date.now() + 5 * 60 * 1000,
    nonce: randomUUID()
  })).toString("base64url");
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyRecoveryContext(context) {
  if (typeof context !== "string" || context.length > 2048) {
    throw new Error("Invalid recovery registration context.");
  }
  const [payload, signature] = context.split(".");
  if (!payload || !signature) throw new Error("Invalid recovery registration context.");

  const expected = createHmac("sha256", secret()).update(payload).digest();
  let supplied;
  try {
    supplied = Buffer.from(signature, "base64url");
  } catch {
    throw new Error("Invalid recovery registration context.");
  }
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    throw new Error("Invalid recovery registration context.");
  }

  let data;
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    throw new Error("Invalid recovery registration context.");
  }
  if (!data.sub || !Number.isFinite(data.exp) || data.exp < Date.now()) {
    throw new Error("Your recovery session has expired. Start again with a new backup code.");
  }
  return data;
}
