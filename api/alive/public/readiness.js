import { Pool } from "pg";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return res.status(405).json({ error: "Method not allowed." }); }
  const databaseConfigured = Boolean(process.env.DATABASE_URL);
  const authSecretConfigured = Boolean(process.env.BETTER_AUTH_SECRET);
  const emailDeliveryConfigured = Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
  if (!databaseConfigured) return res.status(503).json({ ready: false, checks: { databaseConfigured, authSecretConfigured, emailDeliveryConfigured, databaseReachable: false } });
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 1, connectionTimeoutMillis: 5000, idleTimeoutMillis: 1000 });
  let databaseReachable = false;
  try { await pool.query("SELECT 1"); databaseReachable = true; }
  catch { databaseReachable = false; }
  finally { await pool.end().catch(() => {}); }
  const ready = databaseReachable && authSecretConfigured;
  return res.status(ready ? 200 : 503).json({ ready, checks: { databaseConfigured, authSecretConfigured, emailDeliveryConfigured, databaseReachable } });
}
