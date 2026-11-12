import { readAliveJsonBody, sendAliveJson } from "../../server/alive/security.js";
import {
  resolveAuthorizedPrivateTask,
  verifyGitHubActionsIdentity
} from "../../server/alive/githubActionsOidc.js";

function bearerToken(req) {
  const trustedValue = req?.headers?.["x-vercel-trusted-oidc-idp-token"];
  const value = trustedValue || req?.headers?.authorization;
  const header = Array.isArray(value) ? String(value[0] || "") : String(value || "");
  const normalized = /^Bearer ([A-Za-z0-9._~-]+)$/.exec(header);
  return normalized ? normalized[1] : header.trim();
}

export default async function handler(req, res) {
  if (String(req.method || "").toUpperCase() !== "POST") {
    res.setHeader("Allow", "POST");
    return sendAliveJson(res, 405, { error: "Method not allowed." });
  }

  const token = bearerToken(req);
  if (!token) return sendAliveJson(res, 401, { error: "GitHub Actions identity is required." });

  let body;
  try { body = await readAliveJsonBody(req, 1024); }
  catch (error) { return sendAliveJson(res, 400, { error: error.message }); }
  if (Object.keys(body).length !== 1 || typeof body.taskId !== "string") {
    return sendAliveJson(res, 400, { error: "Only a valid ALIVE task ID is accepted." });
  }

  try {
    const claims = await verifyGitHubActionsIdentity(token);
    const task = await resolveAuthorizedPrivateTask(
      body.taskId,
      claims,
      process.env.ALIVE_PRIVATE_QUEUE_GITHUB_TOKEN
    );
    return sendAliveJson(res, 200, { task });
  } catch (error) {
    const message = String(error?.message || "");
    const status = /not authorized|identity|signature|claims|task ID|pointer/i.test(message) ? 403 : 503;
    return sendAliveJson(res, status, {
      error: status === 403
        ? "This workflow is not authorized to retrieve that ALIVE task."
        : "ALIVE could not securely retrieve the private task."
    });
  }
}
