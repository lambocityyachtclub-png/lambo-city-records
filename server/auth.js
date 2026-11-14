import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { Pool } from "pg";
import { verifyRecoveryContext } from "./recovery.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for LAMBO CITY player accounts.");
}

const appUrl = process.env.BETTER_AUTH_URL
  ? new URL(process.env.BETTER_AUTH_URL).origin
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

const appHost = new URL(appUrl).hostname;

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
    throw new Error("LAMBO CITY email delivery is not configured yet. Add RESEND_API_KEY and EMAIL_FROM to the account preview environment.");
  }

  const purpose = type === "email-verification"
    ? "Verify your LAMBO CITY account"
    : type === "forget-password"
      ? "Recover your LAMBO CITY account"
      : "Your LAMBO CITY sign-in code";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: purpose,
      html: `<div style="background:#080611;color:#f7f1e6;padding:32px;font-family:Arial,sans-serif"><div style="color:#d8b66a;letter-spacing:4px;font-size:12px">LAMBO CITY RECORDS</div><h1 style="font-size:24px;margin:24px 0 8px">${purpose}</h1><p style="color:#c9c2b4">Use this one-time code to continue. It expires shortly.</p><div style="font-size:32px;letter-spacing:8px;font-weight:700;color:#e8c879;padding:20px 0">${otp}</div><p style="color:#8f887d;font-size:12px">If you did not request this code, you can ignore this message.</p></div>`
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Email delivery failed (${response.status}): ${detail.slice(0, 300)}`);
  }
}

export const auth = betterAuth({
  appName: "LAMBO CITY",
  baseURL: appUrl,
  trustedOrigins: [
    appUrl,
    "https://lambocityrecords.com",
    "https://www.lambocityrecords.com"
  ],
  database: pool,
  emailAndPassword: {
    enabled: false
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 5,
      sendVerificationOTP: sendPlayerCode
    }),
    passkey({
      rpID: appHost,
      rpName: "LAMBO CITY",
      origin: [appUrl],
      registration: {
        requireSession: false,
        resolveUser: async ({ context }) => {
          const recovery = verifyRecoveryContext(context);
          const result = await pool.query(
            'SELECT id, name, email FROM "user" WHERE id = $1 LIMIT 1',
            [recovery.sub]
          );
          const user = result.rows[0];
          if (!user) throw new Error("The account for this recovery request could not be found.");
          return { id: user.id, name: user.name, email: user.email };
        }
      }
    })
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10
  }
});
