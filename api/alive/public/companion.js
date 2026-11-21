import { auth, pool } from "../../../server/auth.js";
import { toWebHeaders } from "../../../server/http.js";
import { isSameOriginRequest } from "../../../server/origin.js";
import { getAlivePublicIdentityService } from "../../../server/alivePublicServices.js";
import { normalizePublicCompanionInput, publicCompanionIdentityId, toPublicCompanionView } from "../../../server/publicCompanion.js";
function respond(res, status, payload) { res.setHeader("Cache-Control", "no-store"); return res.status(status).json(payload); }
function readBody(req) {
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { throw Object.assign(new Error("Request body must be valid JSON."), { code: "ALIVE_PUBLIC_INPUT_INVALID" }); } }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw Object.assign(new Error("Companion details are required."), { code: "ALIVE_PUBLIC_INPUT_INVALID" });
  if (JSON.stringify(body).length > 12000) throw Object.assign(new Error("Request body exceeds the 12 KB limit."), { code: "ALIVE_PUBLIC_INPUT_INVALID" });
  return body;
}
async function allowRequest(ownerId) {
  const result = await pool.query(`INSERT INTO alive_public_api_rate_limits (owner_id, window_started_at, request_count) VALUES ($1, now(), 1) ON CONFLICT (owner_id) DO UPDATE SET request_count = CASE WHEN alive_public_api_rate_limits.window_started_at < now() - make_interval(secs => 60) THEN 1 ELSE alive_public_api_rate_limits.request_count + 1 END, window_started_at = CASE WHEN alive_public_api_rate_limits.window_started_at < now() - make_interval(secs => 60) THEN now() ELSE alive_public_api_rate_limits.window_started_at END RETURNING request_count`, [ownerId]);
  return Number(result.rows?.[0]?.request_count || 0) <= 60;
}
export default async function alivePublicCompanion(req, res) {
  const method = String(req.method || "GET").toUpperCase();
  if (!["GET", "PUT"].includes(method)) { res.setHeader("Allow", "GET, PUT"); return respond(res, 405, { error: "Method not allowed." }); }
  if (method === "PUT" && !isSameOriginRequest(req)) return respond(res, 403, { error: "A same-origin account request is required." });
  try {
    const session = await auth.api.getSession({ headers: toWebHeaders(req.headers) });
    const user = session?.user;
    if (!user?.id) return respond(res, 401, { error: "Sign in to create your ALIVE Companion." });
    if (user.emailVerified !== true) return respond(res, 403, { error: "Verify your email before saving an ALIVE Companion." });
    if (!(await allowRequest(user.id))) return respond(res, 429, { error: "Too many Companion requests. Try again in a minute." });
    const identityId = publicCompanionIdentityId(user.id);
    const service = getAlivePublicIdentityService();
    if (method === "GET") {
      try { const identity = await service.get({ actorId: user.id, identityId, requiredRole: "owner" }); return respond(res, 200, { companion: toPublicCompanionView(identity) }); }
      catch (error) { if (error?.code === "ALIVE_IDENTITY_NOT_FOUND") return respond(res, 200, { companion: null }); throw error; }
    }
    const input = normalizePublicCompanionInput(readBody(req));
    let current = null;
    try { current = await service.get({ actorId: user.id, identityId, requiredRole: "owner" }); } catch (error) { if (error?.code !== "ALIVE_IDENTITY_NOT_FOUND") throw error; }
    let saved;
    if (current) saved = await service.update({ actorId: user.id, identityId, changes: input });
    else { try { saved = await service.create({ actorId: user.id, identity: { identityId, ...input } }); } catch (error) { if (error?.code !== "23505") throw error; saved = await service.update({ actorId: user.id, identityId, changes: input }); } }
    return respond(res, 200, { companion: toPublicCompanionView(saved) });
  } catch (error) {
    if (error?.code === "ALIVE_PUBLIC_INPUT_INVALID") return respond(res, 400, { error: error.message });
    if (error?.code === "ALIVE_IDENTITY_ACCESS_DENIED" || error?.code === "ALIVE_IDENTITY_OWNER_REQUIRED") return respond(res, 403, { error: "This Companion belongs to another account." });
    console.error("ALIVE public Companion API error:", error);
    return respond(res, 503, { error: "ALIVE Companion storage is not ready yet. Please try again later." });
  }
}
