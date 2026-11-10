import {
  aliveOwnerAuthConfigured,
  aliveSessionCookie,
  clearAliveSessionCookie,
  createAliveSessionToken,
  hasAliveOwnerSession,
  readAliveJsonBody,
  requireSameOrigin,
  sendAliveJson,
  setAliveSecurityHeaders,
  verifyAlivePassword
} from "../../server/alive/security.js";

export default async function handler(req, res) {
  setAliveSecurityHeaders(res);
  const method = String(req.method || "GET").toUpperCase();

  if (method === "GET") {
    const configured = aliveOwnerAuthConfigured();
    return sendAliveJson(res, 200, {
      configured,
      authenticated: configured && hasAliveOwnerSession(req)
    });
  }

  if (method === "POST") {
    if (!requireSameOrigin(req)) {
      return sendAliveJson(res, 403, { error: "This request did not come from the owner workspace." });
    }
    if (!aliveOwnerAuthConfigured()) {
      return sendAliveJson(res, 503, { error: "Private ALIVE owner access has not been configured." });
    }
    let body;
    try { body = await readAliveJsonBody(req, 2048); }
    catch (error) { return sendAliveJson(res, 400, { error: error.message }); }
    if (Object.keys(body).some(key => key !== "password") ||
        typeof body.password !== "string" || body.password.length > 512) {
      return sendAliveJson(res, 400, { error: "A valid owner password is required." });
    }
    const valid = await verifyAlivePassword(body.password, process.env.ALIVE_OWNER_PASSWORD_HASH);
    if (!valid) return sendAliveJson(res, 401, { error: "That owner password was not accepted." });
    const token = createAliveSessionToken(process.env.ALIVE_SESSION_SECRET);
    res.setHeader("Set-Cookie", aliveSessionCookie(token));
    return sendAliveJson(res, 200, { authenticated: true });
  }

  if (method === "DELETE") {
    if (!requireSameOrigin(req)) {
      return sendAliveJson(res, 403, { error: "This request did not come from the owner workspace." });
    }
    res.setHeader("Set-Cookie", clearAliveSessionCookie());
    return sendAliveJson(res, 200, { authenticated: false });
  }

  res.setHeader("Allow", "GET, POST, DELETE");
  return sendAliveJson(res, 405, { error: "Method not allowed." });
}
