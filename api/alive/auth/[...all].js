import { toNodeHandler } from "better-auth/node";
import { getAliveOwnerAuth } from "../../../alive/server/ownerAuth.js";

export const config = {
  api: { bodyParser: false }
};

export default async function handler(req, res) {
  try {
    return await toNodeHandler(getAliveOwnerAuth().handler)(req, res);
  } catch (error) {
    const message = String(error?.message || "").replace(/(?:postgres(?:ql)?:\\/\\/)[^\\s\"']+/gi, "[redacted]").replace(/Bearer\\s+\\S+/gi, "Bearer [redacted]").slice(0, 240);
    console.error("ALIVE_OWNER_AUTH_INIT_FAILED", {
      name: error?.name || "Error",
      code: error?.code || null,
      message
    });
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.end(JSON.stringify({
      error: "ALIVE owner authentication is temporarily unavailable. The server recorded a safe diagnostic code."
    }));
  }
}
