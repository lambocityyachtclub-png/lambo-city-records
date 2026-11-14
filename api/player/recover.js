import { pool } from "../../server/auth.js";
import { createRecoveryContext, hashRecoveryCode, hashRecoveryIdentity } from "../../server/recovery.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const code = String(req.body?.code || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^[a-fA-F0-9]{12}$/.test(code)) {
      return res.status(400).json({ error: "The email or backup code is invalid." });
    }

    const forwarded = req.headers["x-forwarded-for"];
    const ip = String(Array.isArray(forwarded) ? forwarded[0] : forwarded || req.socket?.remoteAddress || "unknown")
      .split(",")[0].trim();
    const emailHash = hashRecoveryIdentity(email);
    const ipHash = hashRecoveryIdentity(ip);
    const attempts = await pool.query(
      `INSERT INTO player_recovery_attempts (email_hash, ip_hash, attempts, window_started_at)
       VALUES ($1, $2, 1, now())
       ON CONFLICT (email_hash, ip_hash) DO UPDATE SET
         attempts = CASE
           WHEN player_recovery_attempts.window_started_at < now() - interval '15 minutes' THEN 1
           ELSE player_recovery_attempts.attempts + 1
         END,
         window_started_at = CASE
           WHEN player_recovery_attempts.window_started_at < now() - interval '15 minutes' THEN now()
           ELSE player_recovery_attempts.window_started_at
         END,
         locked_until = CASE
           WHEN player_recovery_attempts.locked_until > now() THEN player_recovery_attempts.locked_until
           WHEN (CASE
             WHEN player_recovery_attempts.window_started_at < now() - interval '15 minutes' THEN 1
             ELSE player_recovery_attempts.attempts + 1
           END) >= 8 THEN now() + interval '15 minutes'
           ELSE NULL
         END
       RETURNING attempts, locked_until`,
      [emailHash, ipHash]
    );
    if (attempts.rows[0]?.locked_until && new Date(attempts.rows[0].locked_until).getTime() > Date.now()) {
      return res.status(429).json({ error: "Too many recovery attempts. Try again in 15 minutes." });
    }

    const userResult = await pool.query(
      'SELECT id FROM "user" WHERE lower(email) = $1 LIMIT 1',
      [email]
    );
    const user = userResult.rows[0];
    if (!user) {
      return res.status(400).json({ error: "The email or backup code is invalid." });
    }

    const consumed = await pool.query(
      `UPDATE player_recovery_codes
       SET used_at = now()
       WHERE user_id = $1 AND code_hash = $2 AND used_at IS NULL
       RETURNING user_id`,
      [user.id, hashRecoveryCode(code)]
    );
    if (!consumed.rowCount) {
      return res.status(400).json({ error: "The email or backup code is invalid, expired, or already used." });
    }

    await pool.query(
      "DELETE FROM player_recovery_attempts WHERE email_hash = $1 AND ip_hash = $2",
      [emailHash, ipHash]
    );
    return res.status(200).json({
      context: createRecoveryContext(user.id),
      expiresInSeconds: 300
    });
  } catch (error) {
    console.error("LAMBO CITY account recovery error:", error);
    return res.status(500).json({ error: "Account recovery could not be started right now." });
  }
}
