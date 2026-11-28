import { Pool } from "pg";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const databaseUrl = process.env.PLAYER_DATABASE_URL || process.env.DATABASE_URL;
  const checks = {
    databaseConfigured: Boolean(databaseUrl),
    authSecretConfigured: Boolean(process.env.BETTER_AUTH_SECRET),
    emailDeliveryConfigured: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
    databaseReachable: false,
    schemaReady: false
  };

  if (databaseUrl) {
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 1,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 1000
    });
    try {
      const result = await pool.query(`
        SELECT
          to_regclass('public."user"') IS NOT NULL AS users_table,
          to_regclass('public.session') IS NOT NULL AS sessions_table,
          to_regclass('public.player_profiles') IS NOT NULL AS player_profiles_table,
          to_regclass('public.alive_personal_identities') IS NOT NULL AS companion_table,
          to_regclass('public.alive_public_api_rate_limits') IS NOT NULL AS rate_limits_table
      `);
      checks.databaseReachable = true;
      checks.schemaReady = Object.values(result.rows?.[0] || {}).every(Boolean);
    } catch {
      checks.databaseReachable = false;
      checks.schemaReady = false;
    } finally {
      await pool.end().catch(() => {});
    }
  }

  const ready = Object.values(checks).every(Boolean);
  return res.status(ready ? 200 : 503).json({ ready, checks });
}
