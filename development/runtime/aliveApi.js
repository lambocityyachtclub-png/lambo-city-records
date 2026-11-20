import { createOwnerReviewFeedback } from "../../development/engine/ownerReviewFeedback.js";

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

function readAction(req) {
  if (typeof req.query?.action === "string") return req.query.action;
  const pathname = new URL(req.url || "/", "https://alive.internal").pathname;
  return pathname.split("/").filter(Boolean).pop() || "";
}

function readBody(req) {
  const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
  const serialized = JSON.stringify(body);
  if (serialized.length > 32 * 1024) throw new Error("Request body exceeds the 32 KB limit.");
  return body;
}

function isSameOrigin(req, env) {
  const expected = new URL(
    env.ALIVE_OWNER_AUTH_URL ||
    (env.VERCEL_URL ? "https://" + env.VERCEL_URL : "https://lambocityrecords.com")
  ).origin;
  const origin = req.headers?.origin || req.headers?.Origin || "";
  const fetchSite = req.headers?.["sec-fetch-site"] || req.headers?.["Sec-Fetch-Site"];
  return origin === expected && (!fetchSite || fetchSite === "same-origin");
}

function validationStatus(error) {
  const message = String(error?.message || "");
  if (/not found/i.test(message)) return 404;
  if (/already received|only tasks awaiting/i.test(message)) return 409;
  if (/schema|database|postgres|connection|OPENAI_API_KEY|ALIVE_ALLOWED_PATHS|disabled|configured/i.test(message)) return 503;
  return 400;
}

export function createAliveApiHandler(options = {}) {
  const env = options.env || process.env;
  const withSystem = options.withSystem;
  const authenticateOwner = options.authenticateOwner;
  if (typeof withSystem !== "function") throw new Error("withSystem callback is required.");

  return async function aliveApiHandler(req, res) {
    const action = readAction(req);
    const method = String(req.method || "GET").toUpperCase();
    if (action === "auth-readiness" && method === "GET") {
      const emailConfigured = typeof env.RESEND_API_KEY === "string" && env.RESEND_API_KEY.length > 0 && typeof env.EMAIL_FROM === "string" && env.EMAIL_FROM.length > 0;
      return send(res, 200, { emailConfigured });
    }
    if (typeof authenticateOwner !== "function") {
      return send(res, 503, { error: "ALIVE owner session authentication is not configured." });
    }
    let owner;
    try {
      owner = await authenticateOwner(req);
    } catch {
      return send(res, 503, { error: "ALIVE owner authentication is unavailable." });
    }
    if (!owner) return send(res, 401, { error: "A verified ALIVE owner session is required." });

    if (method !== "GET" && !isSameOrigin(req, env)) {
      return send(res, 403, { error: "A same-origin owner request is required." });
    }

    if (action === "status" && method === "GET") {
      const aiEnabled = env.ALIVE_AI_ENABLED === "true";
      const sandboxEnabled = env.ALIVE_SANDBOX_ENABLED === "true";
      const openAIConfigured = typeof env.OPENAI_API_KEY === "string" && env.OPENAI_API_KEY.length > 0;
      const emailConfigured = typeof env.RESEND_API_KEY === "string" && env.RESEND_API_KEY.length > 0 && typeof env.EMAIL_FROM === "string" && env.EMAIL_FROM.length > 0;
      return send(res, 200, {
        service: "lambo-city-alive",
        mode: "owner-controlled",
        owner: { email: owner.email },
        databaseConfigured: Boolean(env.DATABASE_URL),
        emailConfigured,
        openAIConfigured,
        aiEnabled,
        sandboxEnabled,
        executionConfigured: Boolean(env.DATABASE_URL && openAIConfigured && aiEnabled && sandboxEnabled && env.ALIVE_ALLOWED_PATHS)
      });
    }

    if (action === "tasks" && method === "GET") {
      try {
        const result = await withSystem({ execution: false }, async ({ system }) => ({
          tasks: system.director.listTasks()
        }));
        return send(res, 200, result);
      } catch {
        return send(res, 503, { error: "ALIVE task storage is unavailable or its migration is incomplete." });
      }
    }

    if (action === "tasks" && method === "POST") {
      let body;
      try { body = readBody(req); }
      catch (error) { return send(res, 413, { error: error.message }); }
      if (!body.action && body.runner && body.runner !== "world") {
        return send(res, 400, { error: "The first hosted executor pilot supports world tasks only." });
      }
      try {
        const result = await withSystem({ execution: false }, async ({ system }) => {
          if (body.action === "approve") {
            return { task: await system.director.approveTask(body.taskId, "owner"), approval: "approved" };
          }
          if (body.action === "reject") {
            return { task: await system.director.rejectTask(body.taskId, body.reason), approval: "rejected" };
          }
          return system.submitWorldFinding({
            title: body.title,
            description: body.description,
            area: body.area,
            type: body.type,
            severity: body.severity,
            acceptanceCriteria: body.acceptanceCriteria,
            protectedActions: body.protectedActions,
            requiresApproval: body.requiresApproval === true
          });
        });
        return send(res, result.approval ? 200 : 201, {
          task: result.task,
          policyDecision: result.policyDecision,
          approval: result.approval || null
        });
      } catch (error) {
        const status = validationStatus(error);
        return send(res, status, { error: status >= 500 ? "ALIVE task storage is unavailable. Check the private migration and server configuration." : error.message || "Unable to create ALIVE task." });
      }
    }

    if (action === "run" && method === "POST") {
      if (env.ALIVE_AI_ENABLED !== "true" || env.ALIVE_SANDBOX_ENABLED !== "true" || !env.OPENAI_API_KEY) {
        return send(res, 503, { error: "OpenAI and isolated sandbox execution are not enabled. No task was run." });
      }
      try {
        const result = await withSystem({ execution: true }, async ({ system }) =>
          system.executeNextWorldTask()
        );
        return send(res, 200, { result, productionChangesMade: false });
      } catch {
        return send(res, 503, { error: "ALIVE could not run the task. Check server configuration, database migration, and execution logs." });
      }
    }

    if (action === "reviews" && method === "GET") {
      try {
        const url = new URL(req.url || "/", "https://alive.internal");
        const status = url.searchParams.get("status") || "awaiting_owner_review";
        const limit = Number(url.searchParams.get("limit") || 50);
        const offset = Number(url.searchParams.get("offset") || 0);
        const result = await withSystem({ execution: false }, async ({ system, storage }) => ({
          reviews: await storage.listReviews({ status, limit, offset }),
          tasks: system.director.listTasks(),
          status,
          limit,
          offset
        }));
        return send(res, 200, result);
      } catch (error) {
        const status = validationStatus(error);
        return send(res, status, { error: status >= 500 ? "ALIVE review storage is unavailable. Check the private migration and server configuration." : error.message || "Unable to list ALIVE reviews." });
      }
    }

    if (action === "reviews" && method === "POST") {
      let body;
      try { body = readBody(req); }
      catch (error) { return send(res, 413, { error: error.message }); }
      try {
        const result = await withSystem({ execution: false }, async ({ system, storage }) => {
          const feedback = createOwnerReviewFeedback({
            developmentDirector: system.director,
            reviewStore: storage
          });
          const input = {
            taskId: body.taskId,
            reviewId: body.reviewId,
            ownerNote: body.ownerNote
          };
          if (body.decision === "perfect") return feedback.markPerfect(input);
          if (body.decision === "change") return feedback.requestChange(input);
          throw new Error("Decision must be perfect or change.");
        });
        return send(res, 200, { result, productionChangesMade: false });
      } catch (error) {
        const status = validationStatus(error);
        return send(res, status, { error: status >= 500 ? "ALIVE review storage is unavailable. Check the private migration and server configuration." : error.message || "Unable to record owner review." });
      }
    }

    res.setHeader("Allow", "GET, POST");
    return send(res, 404, { error: "Unknown ALIVE action or unsupported method." });
  };
}
