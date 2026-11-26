import { toNodeHandler } from "better-auth/node";
import { getAliveOwnerAuth, isAliveOwnerEnrollmentOpen } from "../../../alive/server/ownerAuth.js";
import { isOwnerSignupRequest, isValidOwnerEnrollmentToken } from "../../../alive/server/ownerEnrollment.js";

export const config = {
  api: { bodyParser: false }
};

export default async function handler(req, res) {
  try {
    const auth = getAliveOwnerAuth();
    if (isOwnerSignupRequest(req)) {
      if (!isValidOwnerEnrollmentToken(req, process.env)) {
        res.statusCode = 403;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        return res.end(JSON.stringify({ error: "Founder enrollment invitation is invalid or expired." }));
      }
      if (!(await isAliveOwnerEnrollmentOpen())) {
        res.statusCode = 409;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        return res.end(JSON.stringify({ error: "Founder enrollment has already been completed." }));
      }
    }
    return await toNodeHandler(auth.handler)(req, res);
  } catch {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.end(JSON.stringify({ error: "ALIVE owner authentication is not configured." }));
  }
}
