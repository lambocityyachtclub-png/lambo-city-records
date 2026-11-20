import { randomUUID } from "node:crypto";

const MEMORY_CONTENT_LIMIT = 4000;
const MEMORY_TAG_LIMIT = 12;
const MEMORY_COLLECTION_LIMIT = 500;
const PREFERENCE_COLLECTION_LIMIT = 200;
const PREFERENCE_VALUE_LIMIT = 4096;
const ID_LIMIT = 128;

function vaultError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function cleanText(value, name, maxLength) {
  if (typeof value !== "string") {
    throw vaultError(name + " is required.", "ALIVE_VAULT_INPUT_INVALID");
  }
  const text = value.trim();
  if (!text || text.length > maxLength) {
    throw vaultError(name + " must contain between 1 and " + maxLength + " characters.", "ALIVE_VAULT_INPUT_INVALID");
  }
  return text;
}

function requireActor(value) {
  return cleanText(value, "An authenticated actor ID", ID_LIMIT);
}

function requireIdentity(value) {
  return cleanText(value, "A personal identity ID", ID_LIMIT);
}

function cleanTags(value) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MEMORY_TAG_LIMIT) {
    throw vaultError("Memory tags must be an array of at most " + MEMORY_TAG_LIMIT + " items.", "ALIVE_VAULT_INPUT_INVALID");
  }
  const tags = value.map(tag => cleanText(tag, "Memory tag", 48));
  return [...new Set(tags)];
}

function cloneJson(value, maxBytes, name) {
  let serialized;
  try {
    serialized = JSON.stringify(value);
  } catch {
    throw vaultError(name + " must be JSON-compatible.", "ALIVE_VAULT_INPUT_INVALID");
  }
  if (typeof serialized !== "string" || Buffer.byteLength(serialized, "utf8") > maxBytes) {
    throw vaultError(name + " exceeds the allowed JSON size.", "ALIVE_VAULT_INPUT_INVALID");
  }
  try {
    return JSON.parse(serialized);
  } catch {
    throw vaultError(name + " must be JSON-compatible.", "ALIVE_VAULT_INPUT_INVALID");
  }
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function requireIdentityService(service) {
  if (!service || typeof service.get !== "function") {
    throw new TypeError("An owner-scoped identity service with get() is required.");
  }
  return service;
}

function requireRepository(repository) {
  const methods = [
    "insertMemory",
    "listMemories",
    "deleteMemory",
    "upsertPreference",
    "listPreferences",
    "deletePreference"
  ];
  for (const method of methods) {
    if (typeof repository?.[method] !== "function") {
      throw new TypeError("Companion vault repository must implement " + method + "().");
    }
  }
  return repository;
}

async function requireOwner(identityService, actorId, identityId) {
  const identity = await identityService.get({
    actorId,
    identityId,
    requiredRole: "owner"
  });

  if (!identity || identity.identityId !== identityId || identity.ownerId !== actorId) {
    throw vaultError("The personal identity owner could not be verified.", "ALIVE_VAULT_OWNER_REQUIRED");
  }
  if (identity.privacy?.memoryAccess !== "owner-only" ||
      identity.privacy?.trainingUse !== false ||
      identity.memoryPolicy?.ownerControlled !== true ||
      identity.memoryPolicy?.sharing !== "private") {
    throw vaultError("The identity's private memory policy is not valid for this vault.", "ALIVE_VAULT_POLICY_INVALID");
  }
  return identity;
}

function validateMemoryRecord(record, ownerId, identityId) {
  if (!record || typeof record !== "object" || Array.isArray(record) ||
      typeof record.memoryId !== "string" || !record.memoryId.trim() ||
      record.ownerId !== ownerId || record.identityId !== identityId ||
      record.createdBy !== ownerId ||
      typeof record.category !== "string" || !/^[a-z][a-z0-9-]{0,31}$/.test(record.category) ||
      typeof record.content !== "string" || !record.content.trim() ||
      record.content.length > MEMORY_CONTENT_LIMIT ||
      !Array.isArray(record.tags) || record.tags.length > MEMORY_TAG_LIMIT ||
      record.tags.some(tag => typeof tag !== "string" || !tag.trim() || tag.length > 48) ||
      typeof record.createdAt !== "string" || !record.createdAt ||
      typeof record.updatedAt !== "string" || !record.updatedAt ||
      record.privacy?.visibility !== "private" ||
      record.privacy?.trainingUse !== false ||
      record.privacy?.crossWorldSharing !== false) {
    throw vaultError("The stored memory did not satisfy the owner-private record contract.", "ALIVE_VAULT_RECORD_INVALID");
  }
  return deepFreeze({
    memoryId: record.memoryId,
    identityId: record.identityId,
    ownerId: record.ownerId,
    createdBy: record.createdBy,
    category: record.category,
    content: record.content,
    tags: [...record.tags],
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    privacy: {
      visibility: "private",
      trainingUse: false,
      crossWorldSharing: false
    }
  });
}

function validatePreferenceRecord(record, ownerId, identityId) {
  if (!record || typeof record !== "object" || Array.isArray(record) ||
      record.ownerId !== ownerId || record.identityId !== identityId ||
      typeof record.key !== "string" || !/^[a-z][a-z0-9._-]{0,63}$/i.test(record.key) ||
      typeof record.updatedAt !== "string" || !record.updatedAt ||
      record.privacy?.visibility !== "private" ||
      record.privacy?.trainingUse !== false ||
      record.privacy?.crossWorldSharing !== false) {
    throw vaultError("The stored preference did not satisfy the owner-private record contract.", "ALIVE_VAULT_RECORD_INVALID");
  }
  const value = cloneJson(record.value, PREFERENCE_VALUE_LIMIT, "Preference value");
  return deepFreeze({
    identityId: record.identityId,
    ownerId: record.ownerId,
    key: record.key,
    value,
    updatedAt: record.updatedAt,
    privacy: {
      visibility: "private",
      trainingUse: false,
      crossWorldSharing: false
    }
  });
}

/**
 * Owner-only Companion memory and preference service.
 *
 * The caller supplies:
 * - identityService.get({ actorId, identityId, requiredRole: "owner" })
 * - repository methods for memory and preference persistence.
 *
 * Every operation rechecks the authenticated owner. Delegated character
 * editors/viewers cannot read or mutate Companion memory or preferences.
 * Records remain private and are never shared across worlds or used for
 * model training by this service. No AI ingestion, external action, API route,
 * database connection, or background process is created here.
 *
 * Repository contract:
 * - insertMemory(record): persist and return one memory record.
 * - listMemories({ identityId, ownerId }): return memory records.
 * - deleteMemory({ identityId, ownerId, memoryId }): return true when deleted.
 * - upsertPreference(record): persist and return one preference record.
 * - listPreferences({ identityId, ownerId }): return preference records.
 * - deletePreference({ identityId, ownerId, key }): return true when deleted.
 */
export function createCompanionVault({
  identityService,
  repository,
  now = () => new Date().toISOString(),
  createId = randomUUID
} = {}) {
  const identities = requireIdentityService(identityService);
  const store = requireRepository(repository);
  if (typeof now !== "function" || typeof createId !== "function") {
    throw new TypeError("Companion vault now() and createId() must be functions.");
  }

  async function authorize(actorValue, identityValue) {
    const actorId = requireActor(actorValue);
    const identityId = requireIdentity(identityValue);
    await requireOwner(identities, actorId, identityId);
    return { actorId, identityId };
  }

  return Object.freeze({
    async createMemory({ actorId, identityId, memory = {} } = {}) {
      const owner = await authorize(actorId, identityId);
      if (!memory || typeof memory !== "object" || Array.isArray(memory)) {
        throw vaultError("Memory input must be an object.", "ALIVE_VAULT_INPUT_INVALID");
      }
      const category = cleanText(memory.category, "Memory category", 32);
      if (!/^[a-z][a-z0-9-]{0,31}$/.test(category)) {
        throw vaultError("Memory category must use lowercase letters, numbers, and hyphens.", "ALIVE_VAULT_INPUT_INVALID");
      }
      const content = cleanText(memory.content, "Memory content", MEMORY_CONTENT_LIMIT);
      const timestamp = cleanText(now(), "Memory timestamp", 40);
      const memoryId = cleanText(createId(), "Memory ID", ID_LIMIT);
      const record = {
        memoryId,
        identityId: owner.identityId,
        ownerId: owner.actorId,
        createdBy: owner.actorId,
        category,
        content,
        tags: cleanTags(memory.tags),
        createdAt: timestamp,
        updatedAt: timestamp,
        privacy: {
          visibility: "private",
          trainingUse: false,
          crossWorldSharing: false
        }
      };
      return validateMemoryRecord(await store.insertMemory(record), owner.actorId, owner.identityId);
    },

    async listMemories({ actorId, identityId } = {}) {
      const owner = await authorize(actorId, identityId);
      const records = await store.listMemories({
        identityId: owner.identityId,
        ownerId: owner.actorId
      });
      if (!Array.isArray(records) || records.length > MEMORY_COLLECTION_LIMIT) {
        throw vaultError("The memory repository returned an invalid or oversized collection.", "ALIVE_VAULT_RECORD_INVALID");
      }
      const memories = records.map(record => validateMemoryRecord(record, owner.actorId, owner.identityId));
      const ids = new Set();
      for (const memory of memories) {
        if (ids.has(memory.memoryId)) {
          throw vaultError("The memory repository returned duplicate memory IDs.", "ALIVE_VAULT_REPOSITORY_CONFLICT");
        }
        ids.add(memory.memoryId);
      }
      return Object.freeze(memories);
    },

    async deleteMemory({ actorId, identityId, memoryId } = {}) {
      const owner = await authorize(actorId, identityId);
      const id = cleanText(memoryId, "Memory ID", ID_LIMIT);
      return (await store.deleteMemory({
        identityId: owner.identityId,
        ownerId: owner.actorId,
        memoryId: id
      })) === true;
    },

    async setPreference({ actorId, identityId, key, value } = {}) {
      const owner = await authorize(actorId, identityId);
      const preferenceKey = cleanText(key, "Preference key", 64);
      if (!/^[a-z][a-z0-9._-]{0,63}$/i.test(preferenceKey)) {
        throw vaultError("Preference keys may only contain letters, numbers, dots, underscores, and hyphens.", "ALIVE_VAULT_INPUT_INVALID");
      }
      const timestamp = cleanText(now(), "Preference timestamp", 40);
      const record = {
        identityId: owner.identityId,
        ownerId: owner.actorId,
        key: preferenceKey,
        value: cloneJson(value, PREFERENCE_VALUE_LIMIT, "Preference value"),
        updatedAt: timestamp,
        privacy: {
          visibility: "private",
          trainingUse: false,
          crossWorldSharing: false
        }
      };
      return validatePreferenceRecord(
        await store.upsertPreference(record),
        owner.actorId,
        owner.identityId
      );
    },

    async getPreferences({ actorId, identityId } = {}) {
      const owner = await authorize(actorId, identityId);
      const records = await store.listPreferences({
        identityId: owner.identityId,
        ownerId: owner.actorId
      });
      if (!Array.isArray(records) || records.length > PREFERENCE_COLLECTION_LIMIT) {
        throw vaultError("The preference repository returned an invalid or oversized collection.", "ALIVE_VAULT_RECORD_INVALID");
      }
      const preferences = records.map(record => validatePreferenceRecord(record, owner.actorId, owner.identityId));
      const keys = new Set();
      for (const preference of preferences) {
        if (keys.has(preference.key)) {
          throw vaultError("The preference repository returned duplicate keys.", "ALIVE_VAULT_REPOSITORY_CONFLICT");
        }
        keys.add(preference.key);
      }
      return Object.freeze(preferences);
    },

    async deletePreference({ actorId, identityId, key } = {}) {
      const owner = await authorize(actorId, identityId);
      const preferenceKey = cleanText(key, "Preference key", 64);
      if (!/^[a-z][a-z0-9._-]{0,63}$/i.test(preferenceKey)) {
        throw vaultError("Preference key is invalid.", "ALIVE_VAULT_INPUT_INVALID");
      }
      return (await store.deletePreference({
        identityId: owner.identityId,
        ownerId: owner.actorId,
        key: preferenceKey
      })) === true;
    }
  });
}
