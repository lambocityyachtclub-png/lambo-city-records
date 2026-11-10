import { createHmac, timingSafeEqual, randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
export const ALIVE_SESSION_COOKIE = "lc_alive_session";
export const ALIVE_SESSION_TTL_SECONDS = 8 * 60 * 60;
const SCRYPT_N = 32768;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEY_BYTES = 64;

function header(req, name) {
  const value = req?.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? String(value[0] || "") : String(value || "");
}

export function setAliveSecurityHeaders(res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("X-Frame-Options", "DENY");
}

export function sendAliveJson(res, status, payload) {
  setAliveSecurityHeaders(res);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (typeof res.status === "function") return res.status(status).json(payload);
  res.statusCode = status;
  res.end(JSON.stringify(payload));
}

export function requireSameOrigin(req) {
  const origin = header(req, "origin");
  const host = (header(req, "x-forwarded-host") || header(req, "host")).split(",")[0].trim();
  const protocol = (header(req, "x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https"))
    .split(",")[0].trim().toLowerCase();
  if (!origin || !host || !["https", "http"].includes(protocol)) return false;
  try {
    return new URL(origin).origin === new URL(protocol + "://" + host).origin;
  } catch {
    return false;
  }
}

export async function readAliveJsonBody(req, maxBytes = 10000) {
  let value = req?.body;
  if (value === undefined && req && typeof req[Symbol.asyncIterator] === "function") {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.length;
      if (size > maxBytes) throw new Error("Request body exceeds the size limit.");
      chunks.push(buffer);
    }
    value = Buffer.concat(chunks).toString("utf8");
  }
  if (typeof value === "string" || Buffer.isBuffer(value)) {
    const raw = String(value);
    if (Buffer.byteLength(raw, "utf8") > maxBytes) throw new Error("Request body exceeds the size limit.");
    try { value = JSON.parse(raw); } catch { throw new Error("Request body must be valid JSON."); }
  } else if (value !== undefined) {
    const raw = JSON.stringify(value);
    if (Buffer.byteLength(raw || "", "utf8") > maxBytes) throw new Error("Request body exceeds the size limit.");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Request body must be a JSON object.");
  }
  return value;
}

export async function verifyAlivePassword(password, encodedHash) {
  if (typeof password !== "string" || !password || typeof encodedHash !== "string") return false;
  const parts = encodedHash.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const n = Number(parts[1]), r = Number(parts[2]), p = Number(parts[3]);
  if (n !== SCRYPT_N || r !== SCRYPT_R || p !== SCRYPT_P) return false;
  let salt, expected;
  try {
    salt = Buffer.from(parts[4], "base64url");
    expected = Buffer.from(parts[5], "base64url");
  } catch {
    return false;
  }
  if (salt.length !== 16 || expected.length !== SCRYPT_KEY_BYTES) return false;
  try {
    const actual = await scrypt(password, salt, expected.length, {
      N: n, r, p, maxmem: 64 * 1024 * 1024
    });
    return timingSafeEqual(Buffer.from(actual), expected);
  } catch {
    return false;
  }
}

export function createAliveSessionToken(secret, now = Date.now()) {
  if (typeof secret !== "string" || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("ALIVE_SESSION_SECRET must contain at least 32 bytes.");
  }
  const payload = Buffer.from(JSON.stringify({
    sub: "owner",
    iat: Math.floor(now / 1000),
    exp: Math.floor(now / 1000) + ALIVE_SESSION_TTL_SECONDS,
    nonce: randomBytes(12).toString("base64url")
  })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return payload + "." + signature;
}

export function verifyAliveSessionToken(token, secret, now = Date.now()) {
  if (typeof token !== "string" || token.length > 1200 ||
      typeof secret !== "string" || Buffer.byteLength(secret, "utf8") < 32) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  const expected = createHmac("sha256", secret).update(payload).digest();
  let supplied;
  try { supplied = Buffer.from(signature, "base64url"); } catch { return false; }
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const nowSeconds = Math.floor(now / 1000);
    return data?.sub === "owner" &&
      Number.isInteger(data.iat) &&
      Number.isInteger(data.exp) &&
      data.iat <= nowSeconds + 60 &&
      data.exp > nowSeconds &&
      data.exp - data.iat <= ALIVE_SESSION_TTL_SECONDS;
  } catch {
    return false;
  }
}

function readCookie(req, name) {
  const cookieHeader = header(req, "cookie");
  for (const part of cookieHeader.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    if (part.slice(0, index).trim() === name) return part.slice(index + 1).trim();
  }
  return "";
}

export function hasAliveOwnerSession(req, env = process.env) {
  return verifyAliveSessionToken(
    readCookie(req, ALIVE_SESSION_COOKIE),
    env.ALIVE_SESSION_SECRET
  );
}

export function aliveSessionCookie(token) {
  return ALIVE_SESSION_COOKIE + "=" + token +
    "; Path=/api/alive; Max-Age=" + ALIVE_SESSION_TTL_SECONDS +
    "; HttpOnly; Secure; SameSite=Strict";
}

export function clearAliveSessionCookie() {
  return ALIVE_SESSION_COOKIE +
    "=; Path=/api/alive; Max-Age=0; HttpOnly; Secure; SameSite=Strict";
}

export function aliveOwnerAuthConfigured(env = process.env) {
  const parts = typeof env.ALIVE_OWNER_PASSWORD_HASH === "string"
    ? env.ALIVE_OWNER_PASSWORD_HASH.split("$") : [];
  let hashShapeValid = false;
  if (parts.length === 6 && parts[0] === "scrypt" &&
      parts[1] === String(SCRYPT_N) && parts[2] === String(SCRYPT_R) &&
      parts[3] === String(SCRYPT_P)) {
    try {
      hashShapeValid = Buffer.from(parts[4], "base64url").length === 16 &&
        Buffer.from(parts[5], "base64url").length === SCRYPT_KEY_BYTES;
    } catch { hashShapeValid = false; }
  }
  return hashShapeValid &&
    typeof env.ALIVE_SESSION_SECRET === "string" &&
    Buffer.byteLength(env.ALIVE_SESSION_SECRET, "utf8") >= 32;
}
