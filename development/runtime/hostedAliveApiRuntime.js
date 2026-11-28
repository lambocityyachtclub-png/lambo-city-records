import { Pool } from "pg";
import { authenticateAliveOwner } from "../../alive/server/ownerAuth.js";
import { isSameOriginRequest } from "../../alive/server/originPolicy.js";
import { createHostedAliveControlPlane } from "./hostedAliveControlPlane.js";
import { createAliveOwnerApiHandler } from "./aliveOwnerApi.js";
import { getAliveDatabaseUrl } from "../../server/databaseTargets.js";

let handler;

export function getHostedAliveOwnerApiHandler() {
  if (handler) return handler;
  const databaseUrl = getAliveDatabaseUrl();
  if (!databaseUrl) throw new Error("ALIVE_DATABASE_URL is not configured.");
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000
  });
  const controlPlane = createHostedAliveControlPlane({ pool });
  handler = createAliveOwnerApiHandler({
    env: process.env,
    authenticateOwner: authenticateAliveOwner,
    isSameOrigin: isSameOriginRequest,
    withSystem: (options, callback) => controlPlane.withSystem(options, callback)
  });
  return handler;
}
