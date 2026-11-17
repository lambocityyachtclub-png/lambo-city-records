import {
  canAccessIdentity,
  createPersonalIdentity,
  validatePersonalIdentity
} from "./identityContract.js";

const cleanId = value => typeof value === "string" ? value.trim().slice(0, 128) : "";

function requireActor(actorId) {
  const id = cleanId(actorId);
  if (!id) {
    const error = new Error("An authenticated person is required.");
    error.code = "ALIVE_AUTHENTICATION_REQUIRED";
    throw error;
  }
  return id;
}

function requireValid(record) {
  const errors = validatePersonalIdentity(record);
  if (errors.length) {
    const error = new Error("The stored identity is invalid.");
    error.code = "ALIVE_IDENTITY_INVALID";
    error.details = errors;
    throw error;
  }
  return record;
}

function requireOwner(record, actorId) {
  if (record.ownerId !== actorId) {
    const error = new Error("Only the personal identity owner can change this identity.");
    error.code = "ALIVE_IDENTITY_OWNER_REQUIRED";
    throw error;
  }
}

function requireRepository(repository) {
  for (const method of ["insert", "getById", "update"]) {
    if (typeof repository?.[method] !== "function") {
      throw new TypeError(`Identity repository must implement ${method}().`);
    }
  }
  return repository;
}

/**
 * Creates an owner-scoped service around a persistence adapter.
 *
 * Adapter contract:
 * - insert(record): persist a new record and return it.
 * - getById(identityId): return a record or null.
 * - update(identityId, mutate): atomically load, mutate, and persist one record.
 *
 * The update method MUST execute mutate atomically (for example, in a DB
 * transaction/row lock). This service deliberately does not provide storage,
 * authentication, or an API route by itself.
 */
export function createIdentityService({ repository, now = () => new Date().toISOString() } = {}) {
  const store = requireRepository(repository);

  async function load(identityId) {
    const id = cleanId(identityId);
    if (!id) {
      const error = new Error("A stable identity ID is required.");
      error.code = "ALIVE_IDENTITY_ID_REQUIRED";
      throw error;
    }
    const record = await store.getById(id);
    if (!record) {
      const error = new Error("The requested identity was not found.");
      error.code = "ALIVE_IDENTITY_NOT_FOUND";
      throw error;
    }
    return requireValid(record);
  }

  return Object.freeze({
    async create({ actorId, identity = {} } = {}) {
      const ownerId = requireActor(actorId);
      if (identity?.ownerId && cleanId(identity.ownerId) !== ownerId) {
        const error = new Error("An identity can only be created for the authenticated owner.");
        error.code = "ALIVE_IDENTITY_OWNER_MISMATCH";
        throw error;
      }
      const timestamp = now();
      const record = createPersonalIdentity({
        ...identity,
        ownerId,
        createdAt: timestamp,
        updatedAt: timestamp
      });
      return requireValid(await store.insert(record));
    },

    async get({ actorId, identityId, requiredRole = "viewer" } = {}) {
      const subjectId = requireActor(actorId);
      const record = await load(identityId);
      if (!canAccessIdentity(record, subjectId, requiredRole)) {
        const error = new Error("You do not have permission to access this identity.");
        error.code = "ALIVE_IDENTITY_ACCESS_DENIED";
        throw error;
      }
      return record;
    },

    async update({ actorId, identityId, changes = {} } = {}) {
      const subjectId = requireActor(actorId);
      const id = cleanId(identityId);
      if (!changes || typeof changes !== "object" || Array.isArray(changes)) {
        throw new TypeError("Identity changes must be an object.");
      }
      return requireValid(await store.update(id, current => {
        requireValid(current);
        requireOwner(current, subjectId);
        const next = createPersonalIdentity({
          ...current,
          displayName: changes.displayName ?? current.displayName,
          characterForm: changes.characterForm ?? current.character.form,
          modelRef: changes.modelRef ?? current.character.modelRef,
          appearanceProfile: changes.appearanceProfile ?? current.character.appearanceProfile,
          personality: changes.personality ?? current.personality,
          grants: current.grants,
          createdAt: current.createdAt,
          updatedAt: now()
        });
        return next;
      }));
    },

    async grantAccess({ actorId, identityId, subjectId, role = "viewer", permissions = [] } = {}) {
      const ownerId = requireActor(actorId);
      const granteeId = cleanId(subjectId);
      if (!granteeId || granteeId === ownerId) {
        const error = new Error("A delegated grant requires a different personal account.");
        error.code = "ALIVE_IDENTITY_GRANT_INVALID";
        throw error;
      }
      if (!["editor", "viewer"].includes(role)) {
        const error = new Error("Delegated roles may only be editor or viewer.");
        error.code = "ALIVE_IDENTITY_ROLE_INVALID";
        throw error;
      }
      return requireValid(await store.update(cleanId(identityId), current => {
        requireValid(current);
        requireOwner(current, ownerId);
        const grants = current.grants.filter(grant => grant.subjectId !== granteeId);
        grants.push({ subjectId: granteeId, role, permissions });
        return createPersonalIdentity({
          ...current,
          characterForm: current.character.form,
          modelRef: current.character.modelRef,
          appearanceProfile: current.character.appearanceProfile,
          grants,
          createdAt: current.createdAt,
          updatedAt: now()
        });
      }));
    },

    async revokeAccess({ actorId, identityId, subjectId } = {}) {
      const ownerId = requireActor(actorId);
      const granteeId = cleanId(subjectId);
      return requireValid(await store.update(cleanId(identityId), current => {
        requireValid(current);
        requireOwner(current, ownerId);
        return createPersonalIdentity({
          ...current,
          characterForm: current.character.form,
          modelRef: current.character.modelRef,
          appearanceProfile: current.character.appearanceProfile,
          grants: current.grants.filter(grant => grant.subjectId !== granteeId),
          createdAt: current.createdAt,
          updatedAt: now()
        });
      }));
    }
  });
}
