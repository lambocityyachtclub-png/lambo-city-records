import { createHash } from "node:crypto";
import { Pool } from "pg";
import { createIdentityService } from "../identity/identityService.js";
import { createPostgresIdentityRepository } from "../identity/postgresIdentityRepository.js";
import { createCompanionVault } from "../companion/companionVault.js";
import { createPostgresCompanionVaultRepository } from "../companion/postgresCompanionVaultRepository.js";

let services;

function requiredDatabaseUrl() {
  const value = process.env.DATABASE_URL;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("DATABASE_URL is required for ALIVE personal storage.");
  }
  return value.trim();
}

export function getAlivePersonalServices() {
  if (services) return services;
  const pool = new Pool({
    connectionString: requiredDatabaseUrl(),
    max: 2,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000
  });
  const identityService = createIdentityService({
    repository: createPostgresIdentityRepository(pool)
  });
  const companionVault = createCompanionVault({
    identityService,
    repository: createPostgresCompanionVaultRepository(pool)
  });
  services = Object.freeze({ pool, identityService, companionVault });
  return services;
}

export async function getOrCreateOwnerIdentity(ownerId) {
  if (typeof ownerId !== "string" || !ownerId.trim()) {
    throw new TypeError("An authenticated ALIVE owner ID is required.");
  }
  const actorId = ownerId.trim();
  const identityId = "owner-" + createHash("sha256").update(actorId).digest("hex").slice(0, 32);
  const { identityService } = getAlivePersonalServices();

  try {
    return await identityService.get({
      actorId,
      identityId,
      requiredRole: "owner"
    });
  } catch (error) {
    if (error?.code !== "ALIVE_IDENTITY_NOT_FOUND") throw error;
  }

  try {
    return await identityService.create({
      actorId,
      identity: {
        identityId,
        displayName: "ALIVE Owner",
        characterForm: "digital-human",
        personality: {
          summary: "A personal ALIVE identity controlled by its owner.",
          traits: []
        }
      }
    });
  } catch (error) {
    // A simultaneous first request may have created the same deterministic ID.
    if (error?.code !== "ALIVE_IDENTITY_DUPLICATE" && error?.code !== "23505") throw error;
    return identityService.get({ actorId, identityId, requiredRole: "owner" });
  }
}
