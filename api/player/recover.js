import { auth, pool } from "../../server/auth.js";
import { createRecoveryContext, hashRecoveryCode } from "../../server/recovery.js";

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

    return res.status(200).json({
      context: createRecoveryContext(user.id),
      expiresInSeconds: 300
    });
  } catch (error) {
    console.error("LAMBO CITY account recovery error:", error);
    return res.status(500).json({ error: "Account recovery could not be started right now." });
  }
}
