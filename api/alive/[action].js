import { createAliveApiHandler } from "../../development/runtime/aliveApi.js";
import { createHostedAliveControlPlane } from "../../development/runtime/hostedAliveControlPlane.js";

let controlPlanePromise;
let handler;

async function getControlPlane() {
  if (!controlPlanePromise) {
    controlPlanePromise = (async () => {
      if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
      const { Pool } = await import("pg");
      const pool = await new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 3,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000
      });
      return createHostedAliveControlPlane({ pool, env: process.env });
    })().catch(error => {
      controlPlanePromise = null;
      throw error;
    });
  }
  return controlPlanePromise;
}

function getHandler() {
  if (!handler) {
    handler = createAliveApiHandler({
      env: process.env,
      withSystem: async (options, callback) => {
        const controlPlane = await getControlPlane();
        return controlPlane.withSystem(options, callback);
      }
    });
  }
  return handler;
}

export const config = { maxDuration: 60 };

export default async function aliveAction(req, res) {
  try {
    return await getHandler()(req, res);
  } catch {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.end(JSON.stringify({ error: "ALIVE hosted control plane is unavailable." }));
  }
}
