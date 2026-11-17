import { randomBytes } from "node:crypto";
import { auth, pool } from "../../server/auth.js";
import { toWebHeaders } from "../../server/http.js";
import { hashRecoveryCode } from "../../server/recovery.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  let connection;
  try {
    const session = await auth.api.getSession({ headers: toWebHeaders(req.headers) });
    if (!session?.user?.id) {
      return res.status(401).json({ error: "Sign in before creating backup codes." });
    }

    const createdAt = new Date(session.session.createdAt).getTime();
    if (!Number.isFinite(createdAt) || Date.now() - createdAt > 10 * 60 * 1000) {
      return res.status(403).json({ error: "For your security, sign in again before generating backup codes." });
    }

    const codes = Array.from({ length: 10 }, () => randomBytes(6).toString("hex").toUpperCase());
    connection = await pool.connect();
    await connection.query("BEGIN");
    await connection.query("DELETE FROM player_recovery_codes WHERE user_id = $1", [session.user.id]);
    for (const code of codes) {
      await connection.query(
        "INSERT INTO player_recovery_codes (user_id, code_hash) VALUES ($1, $2)",
        [session.user.id, hashRecoveryCode(code)]
      );
    }
    await connection.query("COMMIT");
    return res.status(200).json({
      codes,
      warning: "These codes are shown only once. Generating a new set invalidates every previous code."
    });
  } catch (error) {
    if (connection) await connection.query("ROLLBACK").catch(() => {});
    console.error("LAMBO CITY recovery-code error:", error);
    return res.status(500).json({ error: "Backup codes could not be created right now." });
  } finally {
    connection?.release();
  }
}
