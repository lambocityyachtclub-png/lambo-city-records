import { toNodeHandler } from "better-auth/node";
import { getAliveOwnerAuth } from "../../../alive/server/ownerAuth.js";

export const config = {
  api: { bodyParser: false }
};

export default async function handler(req, res) {
  try {
    return toNodeHandler(getAliveOwnerAuth().handler)(req, res);
  } catch (error) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.end(JSON.stringify({
      error: "ALIVE owner authentication is not configured."
    }));
  }
}
