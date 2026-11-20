import { timingSafeEqual } from "node:crypto";

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

function isAuthorized(req, secret) {
  const raw = req.headers?.authorization || req.headers?.Authorization || "";
  const supplied = Buffer.from(String(raw));
  const expected = Buffer.from("Bearer " + secret);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export function createAliveScheduledWorkerHandler({ env = process.env, withSystem } = {}) {
  if (typeof withSystem !== "function") {
    throw new TypeError("A hosted ALIVE withSystem callback is required.");
  }

  return async function aliveScheduledWorker(req, res) {
    if (String(req.method || "GET").toUpperCase() !== "GET") {
      res.setHeader("Allow", "GET");
      return send(res, 405, { error: "Method not allowed." });
    }

    const cronSecret = typeof env.CRON_SECRET === "string" ? env.CRON_SECRET : "";
    if (cronSecret.length < 32) {
      return send(res, 503, { error: "The scheduled worker is not configured." });
    }
    if (!isAuthorized(req, cronSecret)) {
      return send(res, 401, { error: "Unauthorized scheduled worker request." });
    }

    if (env.ALIVE_SCHEDULER_ENABLED !== "true") {
      return send(res, 200, { scheduled: false, reason: "scheduler_disabled" });
    }

    if (
      env.ALIVE_AI_ENABLED !== "true" ||
      env.ALIVE_SANDBOX_ENABLED !== "true" ||
      typeof env.OPENAI_API_KEY !== "string" ||
      !env.OPENAI_API_KEY ||
      typeof env.DATABASE_URL !== "string" ||
      !env.DATABASE_URL
    ) {
      return send(res, 200, {
        scheduled: false,
        reason: "paid_execution_not_enabled",
        productionChangesMade: false
      });
    }

    try {
      const result = await withSystem(
        { execution: true },
        ({ system }) => system.executeNextWorldTask({
          workerId: "alive-scheduled-worker"
        })
      );
      return send(res, 200, {
        scheduled: true,
        result,
        productionChangesMade: false
      });
    } catch {
      return send(res, 503, {
        scheduled: true,
        error: "The scheduled ALIVE run could not complete. Check the private execution logs.",
        productionChangesMade: false
      });
    }
  };
}
