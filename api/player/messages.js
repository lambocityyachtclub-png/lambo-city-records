import { auth, pool } from "../../server/auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return res.status(401).json({ error: "Sign in to access your messages." });
    }

    if (req.method === "GET") {
      await pool.query(
        "UPDATE player_messages SET read_at = now() WHERE user_id = $1 AND read_at IS NULL",
        [session.user.id]
      );
      const result = await pool.query(
        `SELECT id, sender, subject, body, message_type, read_at, created_at
         FROM player_messages
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 100`,
        [session.user.id]
      );
      return res.status(200).json({ messages: result.rows });
    }

    const sender = String(req.body?.sender || "LAMBO CITY").trim().slice(0, 80);
    const subject = String(req.body?.subject || "").trim().slice(0, 160);
    const body = String(req.body?.body || "").trim().slice(0, 4000);
    const messageType = String(req.body?.messageType || "system").trim().slice(0, 40);
    const externalId = req.body?.externalId
      ? String(req.body.externalId).slice(0, 160)
      : null;

    if (!subject || !body) {
      return res.status(400).json({ error: "A message subject and body are required." });
    }

    const result = await pool.query(
      `INSERT INTO player_messages (user_id, sender, subject, body, message_type, external_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, external_id) DO NOTHING
       RETURNING id, sender, subject, body, message_type, read_at, created_at`,
      [session.user.id, sender, subject, body, messageType, externalId]
    );

    return res.status(201).json({ message: result.rows[0] || null, duplicate: result.rowCount === 0 });
  } catch (error) {
    console.error("LAMBO CITY messages error:", error);
    return res.status(500).json({ error: "Your messages could not be loaded right now." });
  }
}
