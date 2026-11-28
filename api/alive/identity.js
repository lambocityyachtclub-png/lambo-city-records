import { auth, pool } from "../../server/auth.js";
import { isSameOriginRequest } from "../../server/origin.js";
import { toWebHeaders } from "../../server/http.js";
import { createPersonalIdentity, validatePersonalIdentity } from "../../alive/identity/identityContract.js";

function send(res, status, payload) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  return res.status(status).json(payload);
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "PUT") {
    res.setHeader("Allow", "GET, PUT");
    return send(res, 405, { error: "Method not allowed." });
  }
  if (req.method === "PUT" && !isSameOriginRequest(req)) {
    return send(res, 403, { error: "A same-origin identity request is required." });
  }
  try {
    const session = await auth.api.getSession({ headers: toWebHeaders(req.headers) });
    const ownerId = session?.user?.id;
    if (!ownerId) return send(res, 401, { error: "Sign in to sync your ALIVE Companion." });

    if (req.method === "GET") {
      const result = await pool.query(
        "SELECT identity_id, record, version, updated_at FROM alive_personal_identities WHERE owner_id = $1 ORDER BY updated_at DESC LIMIT 1",
        [ownerId]
      );
      const row = result.rows[0];
      return send(res, 200, {
        identity: row ? { identityId: row.identity_id, record: row.record, version: Number(row.version), updatedAt: row.updated_at } : null
      });
    }

    const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
    const identityId = typeof body.identityId === "string" ? body.identityId.trim().slice(0, 128) : "";
    if (!identityId) return send(res, 400, { error: "A stable Companion identity ID is required." });
    const identity = createPersonalIdentity({
      identityId,
      ownerId,
      displayName: body.displayName,
      characterForm: body.characterForm,
      appearanceProfile: body.appearanceProfile,
      personality: body.personality,
      privacy: { discoverability: "private" },
      memoryPolicy: { allowCrossWorldSharing: false },
      grants: [],
      updatedAt: new Date().toISOString()
    });
    const errors = validatePersonalIdentity(identity);
    if (errors.length) return send(res, 400, { error: errors[0] });
    const result = await pool.query(
      `INSERT INTO alive_personal_identities (identity_id, owner_id, record, version)
       VALUES ($1, $2, $3::jsonb, 1)
       ON CONFLICT (identity_id) DO UPDATE SET
         record = EXCLUDED.record,
         version = alive_personal_identities.version + 1,
         updated_at = now()
       WHERE alive_personal_identities.owner_id = EXCLUDED.owner_id
       RETURNING identity_id, record, version, updated_at`,
      [identityId, ownerId, JSON.stringify(identity)]
    );
    if (!result.rowCount) return send(res, 409, { error: "That identity ID is already owned by another account." });
    const row = result.rows[0];
    return send(res, 200, {
      identity: { identityId: row.identity_id, record: row.record, version: Number(row.version), updatedAt: row.updated_at },
      synced: true
    });
  } catch (error) {
    console.error("ALIVE personal identity error:", error);
    return send(res, 500, { error: "Your ALIVE Companion identity could not be synced right now." });
  }
}
