import { Pool } from "pg";
import { authenticateAliveOwner } from "../../alive/server/ownerAuth.js";
import { isSameOriginRequest } from "../../alive/server/originPolicy.js";
import { createHostedAliveControlPlane } from "../../development/runtime/hostedAliveControlPlane.js";

let pool;
let controlPlane;

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(JSON.stringify(payload));
}

function getControlPlane() {
  if (controlPlane) return controlPlane;
  if (typeof process.env.DATABASE_URL !== "string" || !process.env.DATABASE_URL.trim()) {
    throw new Error("DATABASE_URL is not configured.");
  }
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000
  });
  controlPlane = createHostedAliveControlPlane({ pool });
  return controlPlane;
}

function getAction(req) {
  if (typeof req.query?.action === "string") return req.query.action;
  const pathname = new URL(req.url || "/", "https://alive.internal").pathname;
  return pathname.split("/").filter(Boolean).pop() || "";
}

function readBody(req) {
  const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
  const serialized = JSON.stringify(body);
  if (serialized.length > 16 * 1024) throw new Error("Request body exceeds the 16 KB limit.");
  return body;
}

function validationStatus(error) {
  const message = String(error?.message || "");
  if (/not found/i.test(message)) return 404;
  if (/already received|only.*pending/i.test(message)) return 409;
  if (/schema|database|postgres|connection|configured/i.test(message)) return 503;
  return 400;
}

export const config = { maxDuration: 30 };

export default async function aliveAction(req, res) {
  const method = String(req.method || "GET").toUpperCase();
  if (method !== "GET" && method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return send(res, 405, { error: "Method not allowed." });
  }

  let owner;
  try {
    owner = await authenticateAliveOwner(req);
  } catch {
    return send(res, 503, { error: "ALIVE owner authentication is unavailable." });
  }
  if (!owner) return send(res, 401, { error: "A verified ALIVE owner session is required." });

  if (method !== "GET" && !isSameOriginRequest(req, process.env)) {
    return send(res, 403, { error: "A same-origin owner request is required." });
  }

  const action = getAction(req);
  if (action === "status" && method === "GET") {
    return send(res, 200, {
      service: "lambo-city-alive",
      owner: { email: owner.email },
      databaseConfigured: Boolean(process.env.DATABASE_URL),
      persistentTaskStorage: true,
      aiProposalProviderConfigured: Boolean(process.env.AI_GATEWAY_MODEL && (process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN)),
      aiProposalGenerationEnabled: process.env.ALIVE_AI_ENABLED === "true" && process.env.ALIVE_AI_SPEND_APPROVED === "true",
      aiExecutionEnabled: false,
      isolatedSandboxEnabled: false,
      autonomousProductionDeployment: false,
      nextMilestone: "Connect the approved AI proposal provider and isolated sandbox after API budget approval."
    });
  }

  let control;
  try {
    control = getControlPlane();
  } catch {
    return send(res, 503, { error: "ALIVE hosted storage is not configured." });
  }

  if (action === "tasks" && method === "GET") {
    try {
      const result = await control.withSystem({}, async ({ system }) => ({
        tasks: system.director.listTasks()
      }));
      return send(res, 200, result);
    } catch {
      return send(res, 503, { error: "ALIVE task storage is unavailable or its schema is incomplete." });
    }
  }

  if (action === "tasks" && method === "POST") {
    let body;
    try { body = readBody(req); }
    catch (error) { return send(res, 413, { error: error.message }); }
    if (typeof body.intent !== "string" || !body.intent.trim()) {
      return send(res, 400, { error: "A clear development intent is required." });
    }
    try {
      const result = await control.withSystem({}, async ({ system }) => {
        const plan = system.planIntent(body.intent);
        if (plan.status !== "planned") return plan;
        return system.submitIntent(body.intent);
      });
      return send(res, result.status === "submitted" ? 201 : 200, { result });
    } catch (error) {
      return send(res, validationStatus(error), { error: error.message || "Unable to submit ALIVE intent." });
    }
  }

  if (action === "reviews" && method === "GET") {
    try {
      const result = await control.withSystem({}, async ({ storage }) => ({
        reviews: await storage.listReviews({ status: "awaiting_owner_review", limit: 50, offset: 0 })
      }));
      return send(res, 200, result);
    } catch {
      return send(res, 503, { error: "ALIVE review storage is unavailable." });
    }
  }

  if (action === "reviews" && method === "POST") {
    let body;
    try { body = readBody(req); }
    catch (error) { return send(res, 413, { error: error.message }); }
    if (!["approved", "rejected"].includes(body.decision)) {
      return send(res, 400, { error: "Decision must be approved or rejected." });
    }
    try {
      const result = await control.withSystem({}, async ({ storage }) =>
        storage.decideReview({
          reviewId: body.reviewId,
          decision: body.decision,
          ownerNote: body.ownerNote || null
        })
      );
      return send(res, 200, { review: result, productionChangesMade: false });
    } catch (error) {
      return send(res, validationStatus(error), { error: error.message || "Unable to record review decision." });
    }
  }

  return send(res, 404, { error: "Unknown ALIVE action." });
}
