import { auth, pool } from "../../server/auth.js";
import { toWebHeaders } from "../../server/http.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "PUT") {
    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await auth.api.getSession({ headers: toWebHeaders(req.headers) });
    if (!session?.user?.id) {
      return res.status(401).json({ error: "Sign in to access your LAMBO CITY profile." });
    }

    if (req.method === "GET") {
      const result = await pool.query(
        'SELECT username, avatar_images, bio, created_at, updated_at FROM player_profiles WHERE user_id = $1 LIMIT 1',
        [session.user.id]
      );
      return res.status(200).json({
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          emailVerified: session.user.emailVerified
        },
        profile: result.rows[0] || null
      });
    }

    const username = String(req.body?.username || "").trim();
    const bio = String(req.body?.bio || "").trim().slice(0, 280);
    const avatarImages = Array.isArray(req.body?.avatarImages)
      ? req.body.avatarImages.slice(0, 3).filter(value => typeof value === "string" && /^https:\/\//i.test(value))
      : [];

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return res.status(400).json({ error: "Choose a username with 3–20 letters, numbers, or underscores." });
    }

    const result = await pool.query(
      `INSERT INTO player_profiles (user_id, username, avatar_images, bio)
       VALUES ($1, $2, $3::jsonb, $4)
       ON CONFLICT (user_id) DO UPDATE SET
         username = EXCLUDED.username,
         avatar_images = EXCLUDED.avatar_images,
         bio = EXCLUDED.bio,
         updated_at = now()
       RETURNING username, avatar_images, bio, created_at, updated_at`,
      [session.user.id, username, JSON.stringify(avatarImages), bio]
    );

    return res.status(200).json({ profile: result.rows[0] });
  } catch (error) {
    if (error?.code === "23505") {
      return res.status(409).json({ error: "That username is already taken. Try another one." });
    }
    console.error("LAMBO CITY profile error:", error);
    return res.status(500).json({ error: "The profile could not be saved right now." });
  }
}
