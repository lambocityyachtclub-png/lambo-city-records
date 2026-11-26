/**
 * ALIVE — authenticated owner API handler.
 *
 * This API accepts owner directions and records task/review state only.
 * It does not generate code, execute code, publish changes, or deploy.
 */

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
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

export function createAliveOwnerApiHandler(options = {}) {
  const env = options.env || process.env;
  const authenticateOwner = options.authenticateOwner;
  const withSystem = options.withSystem;
  const isSameOrigin = options.isSameOrigin;
  const getStatus = typeof options.getStatus === "function" ? options.getStatus : () => ({});
  if (typeof authenticateOwner !== "function") throw new Error("authenticateOwner callback is required.");
  if (typeof withSystem !== "function") throw new Error("withSystem callback is required.");
  if (typeof isSameOrigin !== "function") throw new Error("isSameOrigin callback is required.");

  return async function aliveOwnerApiHandler(req, res) {
    const method = String(req.method || "GET").toUpperCase();
    if (method !== "GET" && method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return send(res, 405, { error: "Method not allowed." });
    }

    let owner;
    try { owner = await authenticateOwner(req); }
    catch { return send(res, 503, { error: "ALIVE owner authentication is unavailable." }); }
    if (!owner) return send(res, 401, { error: "A verified ALIVE owner session is required." });

    if (method !== "GET" && !isSameOrigin(req, env)) {
      return send(res, 403, { error: "A same-origin owner request is required." });
    }

    const action = readAction(req);
    if (action === "status" && method === "GET") {
      let runtimeStatus = {};
      try { runtimeStatus = getStatus() || {}; } catch {}
      return send(res, 200, {
        service: "lambo-city-alive",
        owner: { email: owner.email },
        databaseConfigured: Boolean(env.DATABASE_URL),
        persistentTaskStorage: true,
        aiProposalProviderConfigured: runtimeStatus.aiProposalProviderConfigured ?? Boolean(env.AI_GATEWAY_MODEL && (env.AI_GATEWAY_API_KEY || env.VERCEL_OIDC_TOKEN)),
        aiProposalGenerationEnabled: runtimeStatus.aiProposalGenerationEnabled ?? (env.ALIVE_AI_ENABLED === "true" && env.ALIVE_AI_SPEND_APPROVED === "true"),
        aiExecutionEnabled: false,
        isolatedWorkspaceConfigured: runtimeStatus.isolatedWorkspaceConfigured === true,
        isolatedSandboxEnabled: runtimeStatus.sandboxExecution === true,
        resourceProfilerConfigured: runtimeStatus.resourceProfilerConfigured === true,
        autonomousProductionDeployment: false
      });
    }

    if (action === "discovery" && method === "GET") {
    try {
      const result = await control.withSystem({}, async ({ system }) => ({
        report: await system.discoverProject()
      }));
      return send(res, 200, result);
    } catch {
      return send(res, 503, { error: "ALIVE read-only project discovery is unavailable." });
    }
  }

  if (action === "tasks" && method === "GET") {
      try {
        const result = await withSystem({}, async ({ system }) => ({
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
        const result = await withSystem({}, async ({ system }) => {
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
        const result = await withSystem({}, async ({ storage }) => ({
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
        const review = await withSystem({}, async ({ storage }) =>
          storage.decideReview({
            reviewId: body.reviewId,
            decision: body.decision,
            ownerNote: body.ownerNote || null
          })
        );
        return send(res, 200, { review, productionChangesMade: false });
      } catch (error) {
        return send(res, validationStatus(error), { error: error.message || "Unable to record review decision." });
      }
    }

    return send(res, 404, { error: "Unknown ALIVE action." });
  };
}
