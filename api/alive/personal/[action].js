import { authenticateAliveOwner } from "../../../alive/server/ownerAuth.js";
import {
  getAlivePersonalServices,
  getOrCreateOwnerIdentity
} from "../../../alive/server/personalServices.js";

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

function readAction(req) {
  if (typeof req.query?.action === "string") return req.query.action;
  return new URL(req.url || "/", "https://alive.internal").pathname.split("/").filter(Boolean).pop() || "";
}

function readBody(req) {
  const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
  if (JSON.stringify(body).length > 16 * 1024) throw new Error("Request body exceeds the 16 KB limit.");
  return body;
}

function statusFor(error) {
  if (error?.code === "ALIVE_AUTHENTICATION_REQUIRED") return 401;
  if (["ALIVE_IDENTITY_ACCESS_DENIED", "ALIVE_IDENTITY_OWNER_REQUIRED", "ALIVE_VAULT_OWNER_REQUIRED", "ALIVE_MEMORY_REVIEW_OWNER_REQUIRED", "ALIVE_MEMORY_REVIEW_POLICY_INVALID"].includes(error?.code)) return 403;
  if (error?.code === "ALIVE_MEMORY_REVIEW_INPUT_INVALID") return 400;
  if (["ALIVE_IDENTITY_NOT_FOUND"].includes(error?.code)) return 404;
  if (String(error?.message || "").includes("required") || error?.code?.includes("INVALID")) return 400;
  return 503;
}

function isSameOrigin(req) {
  const expected = new URL(
    process.env.ALIVE_OWNER_AUTH_URL ||
    (process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "https://lambocityrecords.com")
  ).origin;
  const origin = req.headers?.origin || req.headers?.Origin || "";
  const fetchSite = req.headers?.["sec-fetch-site"] || req.headers?.["Sec-Fetch-Site"];
  return origin === expected && (!fetchSite || fetchSite === "same-origin");
}

export default async function alivePersonalAction(req, res) {
  const method = String(req.method || "GET").toUpperCase();
  if (!["GET", "POST", "DELETE"].includes(method)) {
    res.setHeader("Allow", "GET, POST, DELETE");
    return send(res, 405, { error: "Method not allowed." });
  }

  let owner;
  try {
    owner = await authenticateAliveOwner(req);
  } catch {
    return send(res, 503, { error: "ALIVE owner authentication is unavailable." });
  }
  if (!owner) return send(res, 401, { error: "A verified ALIVE owner session is required." });
  if (method !== "GET" && !isSameOrigin(req)) {
    return send(res, 403, { error: "A same-origin owner request is required." });
  }

  const action = readAction(req);
  try {
    const { identityService, companionVault, companionMemoryReview } = await getAlivePersonalServices();
    const identity = await getOrCreateOwnerIdentity(owner.id);

    if (action === "identity" && method === "GET") {
      return send(res, 200, { identity });
    }

    if (action === "identity" && method === "POST") {
      const body = readBody(req);
      const updated = await identityService.update({
        actorId: owner.id,
        identityId: identity.identityId,
        changes: {
          displayName: body.displayName,
          characterForm: body.characterForm,
          appearanceProfile: body.appearanceProfile,
          personality: body.personality
        }
      });
      return send(res, 200, { identity: updated });
    }

    if (action === "memories" && method === "GET") {
      const memories = await companionVault.listMemories({
        actorId: owner.id,
        identityId: identity.identityId
      });
      return send(res, 200, { identityId: identity.identityId, memories });
    }

    if (action === "memories" && method === "POST") {
      const body = readBody(req);
      const memory = await companionVault.createMemory({
        actorId: owner.id,
        identityId: identity.identityId,
        memory: {
          category: body.category,
          content: body.content,
          tags: body.tags,
          privacy: { shareWithDevelopment: body.shareWithDevelopment === true }
        }
      });
      return send(res, 201, { memory });
    }

    if (action === "memories" && method === "DELETE") {
      const body = readBody(req);
      const deleted = await companionVault.deleteMemory({
        actorId: owner.id,
        identityId: identity.identityId,
        memoryId: body.memoryId
      });
      return send(res, 200, { deleted });
    }

    if (action === "memory-proposals" && method === "GET") {
      const proposals = await companionMemoryReview.listPending({ actorId: owner.id, identityId: identity.identityId });
      return send(res, 200, { identityId: identity.identityId, proposals });
    }

    if (action === "memory-proposals" && method === "POST") {
      const body = readBody(req);
      if (body.action === "approve") {
        const proposal = await companionMemoryReview.approve({ actorId: owner.id, identityId: identity.identityId, memoryId: body.memoryId });
        if (!proposal) return send(res, 409, { error: "This Companion suggestion is no longer pending." });
        return send(res, 200, { proposal });
      }
      if (body.action === "archive") {
        const archived = await companionMemoryReview.archive({ actorId: owner.id, identityId: identity.identityId, memoryId: body.memoryId });
        if (!archived) return send(res, 409, { error: "This Companion suggestion is no longer pending." });
        return send(res, 200, { archived: true });
      }
      return send(res, 400, { error: "Choose approve or archive for a pending Companion suggestion." });
    }

    if (action === "preferences" && method === "GET") {
      const preferences = await companionVault.getPreferences({
        actorId: owner.id,
        identityId: identity.identityId
      });
      return send(res, 200, { identityId: identity.identityId, preferences });
    }

    if (action === "preferences" && method === "POST") {
      const body = readBody(req);
      const preference = await companionVault.setPreference({
        actorId: owner.id,
        identityId: identity.identityId,
        key: body.key,
        value: body.value
      });
      return send(res, 200, { preference });
    }

    if (action === "preferences" && method === "DELETE") {
      const body = readBody(req);
      const deleted = await companionVault.deletePreference({
        actorId: owner.id,
        identityId: identity.identityId,
        key: body.key
      });
      return send(res, 200, { deleted });
    }

    res.setHeader("Allow", "GET, POST, DELETE");
    return send(res, 404, { error: "Unknown ALIVE personal action or unsupported method." });
  } catch (error) {
    const status = statusFor(error);
    return send(res, status, {
      error: status >= 500
        ? "ALIVE personal storage is unavailable. Check the private migration and server configuration."
        : error?.message || "ALIVE personal request is invalid."
    });
  }
}
