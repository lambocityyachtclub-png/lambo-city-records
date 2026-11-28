import { createPersonalIdentity, validatePersonalIdentity } from "../alive/identity/identityContract.js";

const APPEARANCE_OPTIONS = Object.freeze({
  skinTone: ["porcelain", "light", "medium", "tan", "deep"],
  hairStyle: ["short", "curly", "long", "braids", "buzz", "none"],
  hairColor: ["black", "brown", "blonde", "auburn", "silver"],
  eyeColor: ["brown", "blue", "green", "hazel", "gray"],
  outfit: ["streetwear", "classic", "minimal", "creative"],
  accentColor: ["gold", "blue", "violet", "silver"]
});
const PERSONALITY_TRAITS = new Set(["curious", "creative", "thoughtful", "playful", "calm", "confident", "supportive", "adventurous", "witty", "focused"]);

function normalizeAppearance(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return Object.fromEntries(Object.entries(APPEARANCE_OPTIONS).map(([key, allowed]) => [
    key,
    allowed.includes(source[key]) ? source[key] : allowed[0]
  ]));
}

function send(res, status, payload) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  return res.status(status).json(payload);
}

export function createAliveIdentityApiHandler({ getSession, query, isSameOrigin } = {}) {
  if (typeof getSession !== "function" || typeof query !== "function" || typeof isSameOrigin !== "function") {
    throw new TypeError("ALIVE identity API dependencies are required.");
  }
  return async function aliveIdentityHandler(req, res) {
    if (req.method !== "GET" && req.method !== "PUT") {
      res.setHeader("Allow", "GET, PUT");
      return send(res, 405, { error: "Method not allowed." });
    }
    if (req.method === "PUT" && !isSameOrigin(req)) {
      return send(res, 403, { error: "A same-origin identity request is required." });
    }
    try {
      const session = await getSession(req);
      const ownerId = session?.user?.id;
      if (!ownerId) return send(res, 401, { error: "Sign in to sync your ALIVE Companion." });

      if (req.method === "GET") {
        const result = await query(
          "SELECT identity_id, record, version, updated_at FROM alive_personal_identities WHERE owner_id = $1 ORDER BY updated_at DESC LIMIT 1",
          [ownerId]
        );
        const row = result.rows?.[0];
        return send(res, 200, {
          identity: row ? { identityId: row.identity_id, record: row.record, version: Number(row.version), updatedAt: row.updated_at } : null
        });
      }

      const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
      if (JSON.stringify(body).length > 16 * 1024) return send(res, 413, { error: "Companion identity data exceeds the 16 KB limit." });
      const identityId = typeof body.identityId === "string" ? body.identityId.trim() : "";
      if (!/^[A-Za-z0-9_-]{1,128}$/.test(identityId)) {
        return send(res, 400, { error: "A valid stable Companion identity ID is required." });
      }
      const personalitySource = body.personality && typeof body.personality === "object" && !Array.isArray(body.personality)
        ? body.personality
        : {};
      const traits = Array.isArray(personalitySource.traits)
        ? [...new Set(personalitySource.traits.filter(trait => typeof trait === "string" && PERSONALITY_TRAITS.has(trait)))].slice(0, 5)
        : [];
      const identity = createPersonalIdentity({
        identityId,
        ownerId,
        displayName: body.displayName,
        characterForm: body.characterForm,
        appearanceProfile: normalizeAppearance(body.appearanceProfile),
        personality: { summary: typeof personalitySource.summary === "string" ? personalitySource.summary.slice(0, 240) : "", traits },
        privacy: { discoverability: "private" },
        memoryPolicy: { allowCrossWorldSharing: false },
        grants: [],
        updatedAt: new Date().toISOString()
      });
      const errors = validatePersonalIdentity(identity);
      if (errors.length) return send(res, 400, { error: errors[0] });
      const result = await query(
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
      if (error instanceof TypeError) return send(res, 400, { error: error.message });
      return send(res, 500, { error: "Your ALIVE Companion identity could not be synced right now." });
    }
  };
}
