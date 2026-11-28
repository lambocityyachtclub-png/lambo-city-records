import { auth, pool } from "../../server/auth.js";
import { toWebHeaders } from "../../server/http.js";

function respond(res, status, payload) {
  res.setHeader("Cache-Control", "no-store, private");
  res.setHeader("Vary", "Cookie");
  return res.status(status).json(payload);
}

export default async function exportPlayerData(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return respond(res, 405, { error: "Method not allowed." });
  }

  try {
    const session = await auth.api.getSession({ headers: toWebHeaders(req.headers) });
    const user = session?.user;
    if (!user?.id) return respond(res, 401, { error: "Sign in to export your ALIVE data." });
    if (user.emailVerified !== true) {
      return respond(res, 403, { error: "Verify your account before exporting cloud data." });
    }

    const [profileResult, companionResult, messagesResult] = await Promise.all([
      pool.query(
        "SELECT username, avatar_images, bio, created_at, updated_at FROM player_profiles WHERE user_id = $1 LIMIT 1",
        [user.id]
      ),
      pool.query(
        "SELECT record, created_at, updated_at FROM alive_personal_identities WHERE owner_id = $1 ORDER BY created_at ASC",
        [user.id]
      ),
      pool.query(
        "SELECT sender, subject, body, message_type, read_at, created_at FROM player_messages WHERE user_id = $1 ORDER BY created_at ASC",
        [user.id]
      )
    ]);

    const payload = {
      schema: "alive-personal-data-export",
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      account: {
        id: user.id,
        name: user.name || "",
        email: user.email || "",
        emailVerified: user.emailVerified === true,
        createdAt: user.createdAt || null
      },
      profile: profileResult.rows[0] || null,
      companions: companionResult.rows.map(row => row.record),
      messages: messagesResult.rows
    };

    const date = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="alive-data-export-${date}.json"`);
    return res.status(200).send(JSON.stringify(payload, null, 2));
  } catch (error) {
    console.error("ALIVE data export error:", error);
    return respond(res, 503, { error: "Your complete cloud export is not available right now. No partial export was created." });
  }
}
