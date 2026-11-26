import { getHostedAliveOwnerApiHandler } from "../../../development/runtime/hostedAliveApiRuntime.js";

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  try {
    return await getHostedAliveOwnerApiHandler()(req, res);
  } catch {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.end(JSON.stringify({ error: "ALIVE hosted control plane is unavailable." }));
  }
}
