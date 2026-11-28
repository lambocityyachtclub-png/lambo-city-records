import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { Pool } from "pg";
import { getPlayerAuthOriginConfig } from "./origin.js";

const databaseUrl = process.env.DATABASE_URL;
const authSecret = process.env.BETTER_AUTH_SECRET;
if (!databaseUrl) throw new Error("DATABASE_URL is required for LAMBO CITY player accounts.");
if (typeof authSecret !== "string" || authSecret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must be configured for LAMBO CITY player accounts.");
}

const authOrigin = getPlayerAuthOriginConfig();
export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000
});

async function sendPlayerCode({ email, otp, type }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error("LAMBO CITY email delivery is not configured yet. Email verification will become available when the verified sender's API key is configured.");
  }
  const purpose = type === "email-verification"
    ? "Verify your LAMBO CITY account"
    : type === "forget-password"
      ? "Recover your LAMBO CITY account"
      : "Your LAMBO CITY sign-in code";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject: purpose,
      html: '<div style="background:#080611;color:#f7f1e6;padding:32px;font-family:Arial,sans-serif"><div style="color:#d8b66a;letter-spacing:4px;font-size:12px">LAMBO CITY RECORDS</div><h1 style="font-size:24px;margin:24px 0 8px">' + purpose + '</h1><p style="color:#c9c2b4">Use this one-time code to continue. It expires in five minutes.</p><div style="font-size:32px;letter-spacing:8px;font-weight:700;color:#e8c879;padding:20px 0">' + otp + '</div><p style="color:#8f887d;font-size:12px">If you did not request this code, you can ignore this message.</p></div>'
    })
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error("Email delivery failed (" + response.status + "): " + detail.slice(0, 300));
  }
}

export const auth = betterAuth({
  appName: "LAMBO CITY",
  baseURL: authOrigin.baseURL,
  secret: authSecret,
  trustedOrigins: authOrigin.trustedOrigins,
  database: pool,
  emailAndPassword: { enabled: false },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 5,
      storeOTP: "hashed",
      sendVerificationOTP: sendPlayerCode
    }),
    passkey({
      rpID: authOrigin.rpID,
      rpName: "LAMBO CITY",
      origin: authOrigin.passkeyOrigins
    })
  ],
  session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
  rateLimit: { enabled: true, window: 60, max: 10 }
});
