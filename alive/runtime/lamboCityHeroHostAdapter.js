import { createIdentityRuntimeAdapter } from "./identityRuntimeAdapter.js";

function fail(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

/**
 * Binds the authenticated owner's ALIVE identity to the already-live HERO
 * object supplied by LAMBO CITY's NPC system. This adapter never creates,
 * clones, replaces, moves, or visually modifies a character.
 */
export async function connectLamboCityHeroIdentity({ identity, npcSystem } = {}) {
  if (!identity || typeof identity !== "object" || !identity.ownerId || !identity.identityId) {
    throw fail("A verified owner identity is required.", "ALIVE_HERO_IDENTITY_REQUIRED");
  }
  if (identity.character?.modelRef !== "existing:hero-model") {
    throw fail("The owner identity is not connected to the existing HERO model reference.", "ALIVE_HERO_MODEL_REF_INVALID");
  }
  if (typeof npcSystem?.getHero !== "function") {
    throw fail("The existing LAMBO CITY NPC system is unavailable.", "ALIVE_HERO_HOST_UNAVAILABLE");
  }

  const identityService = Object.freeze({
    async get({ actorId, identityId, requiredRole } = {}) {
      if (actorId !== identity.ownerId || identityId !== identity.identityId || requiredRole !== "owner") {
        throw fail("Only the authenticated personal identity owner can bind HERO.", "ALIVE_HERO_OWNER_REQUIRED");
      }
      return identity;
    }
  });

  const adapter = createIdentityRuntimeAdapter({
    identityService,
    resolveExistingModel: async modelRef => {
      if (modelRef !== "existing:hero-model") return null;
      return npcSystem.getHero() || null;
    }
  });

  const binding = await adapter.resolve({
    actorId: identity.ownerId,
    identityId: identity.identityId,
    requiredRole: "owner"
  });

  return Object.freeze({
    ...binding,
    host: "lambo-city",
    characterReference: "existing:hero-model",
    connectionMode: "existing-instance-reference"
  });
}
