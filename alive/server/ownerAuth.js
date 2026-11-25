import { betterAuth } from "better-auth";
import { passkey } from "@better-auth/passkey";
import { twoFactor } from "better-auth/plugins";
import { Pool } from "pg";

let pool;
let auth;

function required(name, minimum = 1) {
  const value = process.env[name];
  if (typeof value !== "string" || value.length < minimum) {
    throw new Error(name + " must be configured before ALIVE owner authentication is available.");
  }
  return value;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

async function sendOwnerEmail({ to, subject, heading, url }) {
  const apiKey = required("RESEND_API_KEY", 1);
  const from = required("EMAIL_FROM", 1);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html: '<div style="background:#090b0a;color:#f5f0e6;padding:32px;font-family:Arial,sans-serif"><div style="color:#d8b66a;letter-spacing:3px;font-size:12px">LAMBO CITY RECORDS</div><h1 style="font-size:23px;margin:24px 0 12px">' + escapeHtml(heading) + '</h1><p style="color:#c9c2b4;line-height:1.6">Use the secure link below to continue. If you did not request this, you can ignore this email.</p><p style="margin:28px 0"><a href="' + escapeHtml(url) + '" style="display:inline-block;background:#d8b66a;color:#090b0a;padding:13px 20px;border-radius:8px;text-decoration:none;font-weight:bold">CONTINUE SECURELY</a></p><p style="color:#8f887d;font-size:11px">This link is private and expires. Never forward it.</p></div>'
    })
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error("Owner email delivery failed (" + response.status + "): " + detail.slice(0, 200));
  }
}

export function getAliveOwnerAuth() {
  if (auth) return auth;
  const databaseUrl = required("DATABASE_URL");
  const secret = required("ALIVE_OWNER_AUTH_SECRET", 32);
  const ownerEmail = required("ALIVE_OWNER_EMAIL").trim().toLowerCase();
  const baseURL = new URL(
    process.env.ALIVE_OWNER_AUTH_URL ||
    (process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "https://lambocityrecords.com")
  ).origin;
  const rpID = new URL(baseURL).hostname;

  pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    max: 2,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000
  });

  auth = betterAuth({
    appName: "LAMBO CITY ALIVE Owner",
    baseURL,
    basePath: "/api/alive/auth",
    secret,
    trustedOrigins: [
      baseURL,
      "https://lambocityrecords.com",
      "https://www.lambocityrecords.com"
    ],
    database: pool,
    user: { modelName: "alive_owner_user" },
    account: { modelName: "alive_owner_account" },
    verification: { modelName: "alive_owner_verification" },
    emailAndPassword: {
      enabled: true,
      disableSignUp: false,
      requireEmailVerification: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        if (String(user.email || "").trim().toLowerCase() !== ownerEmail) {
          throw new Error("This email is not authorized for ALIVE owner access.");
        }
        await sendOwnerEmail({
          to: ownerEmail,
          subject: "Reset your ALIVE owner password",
          heading: "Reset your ALIVE owner password",
          url
        });
      }
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: false,
      sendVerificationEmail: async ({ user, url }) => {
        if (String(user.email || "").trim().toLowerCase() !== ownerEmail) {
          throw new Error("This email is not authorized for ALIVE owner access.");
        }
        await sendOwnerEmail({
          to: ownerEmail,
          subject: "Verify your ALIVE owner email",
          heading: "Verify your ALIVE owner email",
          url
        });
      }
    },
    databaseHooks: {
      user: {
        create: {
          before: async user => {
            if (String(user.email || "").trim().toLowerCase() !== ownerEmail) return false;
            return { data: { ...user, email: ownerEmail } };
          }
        }
      }
    },
    plugins: [
      passkey({
        rpID,
        rpName: "LAMBO CITY ALIVE Owner",
        origin: [baseURL],
        schema: {
          passkey: { modelName: "alive_owner_passkey" }
        },
        authenticatorSelection: {
          userVerification: "required"
        }
      }),
      twoFactor({
        twoFactorTable: "alive_owner_two_factor",
        issuer: "LAMBO CITY ALIVE",
        backupCodeOptions: { amount: 10, length: 10 }
      })
    ],
    session: {
      modelName: "alive_owner_session",
      expiresIn: 60 * 60 * 24 * 14,
      updateAge: 60 * 60 * 12
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 8
    }
  });
  return auth;
}

export async function authenticateAliveOwner(req) {
  const ownerEmail = required("ALIVE_OWNER_EMAIL").trim().toLowerCase();
  const instance = getAliveOwnerAuth();
  const cookie = req.headers?.cookie || req.headers?.Cookie || "";
  const headers = new Headers();
  if (cookie) headers.set("cookie", Array.isArray(cookie) ? cookie.join("; ") : String(cookie));
  const session = await instance.api.getSession({ headers });
  const user = session?.user;
  if (!user || user.emailVerified !== true ||
      String(user.email || "").trim().toLowerCase() !== ownerEmail) {
    return null;
  }
  return user;
}
