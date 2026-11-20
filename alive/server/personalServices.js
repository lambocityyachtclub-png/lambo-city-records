import { createHash } from "node:crypto";
import { Pool } from "pg";
import { createIdentityService } from "../identity/identityService.js";
import { createPostgresIdentityRepository } from "../identity/postgresIdentityRepository.js";
import { createCompanionVault } from "../companion/companionVault.js";
import { createPostgresCompanionVaultRepository } from "../companion/postgresCompanionVaultRepository.js";

let services;

function requiredDatabaseUrl(env = process.env) {
  const value = env.DATABASE_URL;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("DATABASE_URL is required for ALIVE personal storage.");
  }
  return value.trim();
}

export function getAlivePersonalServices(options = {}) {
  if (services) return services;
  const pool = options.pool || new Pool({
    connectionString: requiredDatabaseUrl(options.env),
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

export async function getOrCreateOwnerIdentity(ownerId, options = {}) {
  if (typeof ownerId !== "string" || !ownerId.trim()) {
    throw new TypeError("An authenticated ALIVE owner ID is required.");
  }
  const actorId = ownerId.trim();
  const identityId = "owner-" + createHash("sha256").update(actorId).digest("hex").slice(0, 32);
  const { identityService } = getAlivePersonalServices(options);

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

export function selectDevelopmentMemories(memories) {
  if (!Array.isArray(memories)) return [];
  return memories
    .filter(memory => memory?.privacy?.shareWithDevelopment === true)
    .slice(0, 20)
    .map(memory => ({
      category: String(memory.category || "note").slice(0, 32),
      content: String(memory.content || "").slice(0, 2000),
      tags: Array.isArray(memory.tags)
        ? memory.tags.filter(tag => typeof tag === "string").slice(0, 12)
        : []
    }))
    .filter(memory => memory.content.length > 0);
}

export async function getOwnerDevelopmentContext(ownerId, options = {}) {
  const identity = await getOrCreateOwnerIdentity(ownerId, options);
  const { companionVault } = getAlivePersonalServices(options);
  const memories = await companionVault.listMemories({
    actorId: ownerId,
    identityId: identity.identityId,
    requiredRole: "owner"
  });
  const sharedMemories = selectDevelopmentMemories(memories);
  return Object.freeze({
    status: sharedMemories.length ? "owner-shared" : "no-shared-memories",
    memories: Object.freeze(sharedMemories)
  });
}
