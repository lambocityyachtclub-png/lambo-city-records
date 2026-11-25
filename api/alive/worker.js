import { createAliveScheduledWorkerHandler } from "../../development/runtime/aliveScheduledWorker.js";
import { createHostedAliveControlPlane } from "../../development/runtime/hostedAliveControlPlane.js";

let controlPlanePromise;
let handler;

async function getControlPlane() {
  if (!controlPlanePromise) {
    controlPlanePromise = (async () => {
      if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
      const { Pool } = await import("pg");
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 2,
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
    handler = createAliveScheduledWorkerHandler({
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

export default async function aliveWorker(req, res) {
  return getHandler()(req, res);
}
