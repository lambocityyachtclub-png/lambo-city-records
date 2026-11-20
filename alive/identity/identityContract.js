// ALIVE personal identity contract
// Domain-only foundation shared by the ALIVE Engine and Companion.
// This module does not create accounts, persist private data, call AI providers,
// or connect an avatar to the visitor runtime. Those integrations remain explicit.

export const CHARACTER_FORMS = Object.freeze(["digital-human", "stylized"]);
export const IDENTITY_ROLES = Object.freeze(["owner", "editor", "viewer"]);
export const COMPANION_MODES = Object.freeze(["owner-directed", "assisted", "autonomous"]);

const text = (value, maxLength) => typeof value === "string"
  ? value.trim().slice(0, maxLength)
  : "";

const listOfText = (value, limit, maxLength) => Array.isArray(value)
  ? [...new Set(value.map(item => text(item, maxLength)).filter(Boolean))].slice(0, limit)
  : [];

function fail(message) {
  throw new TypeError(message);
}

export function createPersonalIdentity(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    fail("An identity input object is required.");
  }

  const ownerId = text(input.ownerId, 128);
  const identityId = text(input.identityId, 128);
  const displayName = text(input.displayName, 40);
  const characterForm = text(input.characterForm, 32);

  if (!ownerId) fail("A personal identity must have an authenticated owner ID.");
  if (!identityId) fail("A stable identity ID is required.");
  if (!displayName) fail("A display name is required.");
  if (!CHARACTER_FORMS.includes(characterForm)) {
    fail("Character form must be digital-human or stylized.");
  }

  const grants = Array.isArray(input.grants) ? input.grants : [];
  const safeGrants = grants
    .filter(grant => grant && typeof grant === "object")
    .map(grant => ({
      subjectId: text(grant.subjectId, 128),
      role: IDENTITY_ROLES.includes(grant.role) && grant.role !== "owner" ? grant.role : "viewer",
      permissions: listOfText(grant.permissions, 12, 48)
    }))
    .filter(grant => grant.subjectId && grant.subjectId !== ownerId);

  const identity = {
    schema: "alive-personal-identity",
    schemaVersion: 1,
    identityId,
    ownerId,
    displayName,
    character: {
      form: characterForm,
      // References an existing avatar/model. It never clones or replaces it.
      modelRef: text(input.modelRef, 160) || null,
      appearanceProfile: input.appearanceProfile && typeof input.appearanceProfile === "object"
        && !Array.isArray(input.appearanceProfile)
        ? { ...input.appearanceProfile }
        : {}
    },
    personality: {
      summary: text(input.personality?.summary, 500),
      traits: listOfText(input.personality?.traits, 12, 40)
    },
    privacy: {
      discoverability: input.privacy?.discoverability === "public" ? "public" : "private",
      memoryAccess: "owner-only",
      trainingUse: false
    },
    memoryPolicy: {
      ownerControlled: true,
      sharing: "private",
      retention: "owner-controlled",
      allowCrossWorldSharing: input.memoryPolicy?.allowCrossWorldSharing === true
    },
    grants: safeGrants,
    createdAt: text(input.createdAt, 40) || null,
    updatedAt: text(input.updatedAt, 40) || null
  };

  return Object.freeze({
    ...identity,
    character: Object.freeze({ ...identity.character, appearanceProfile: Object.freeze({ ...identity.character.appearanceProfile }) }),
    personality: Object.freeze({ ...identity.personality, traits: Object.freeze([...identity.personality.traits]) }),
    privacy: Object.freeze({ ...identity.privacy }),
    memoryPolicy: Object.freeze({ ...identity.memoryPolicy }),
    grants: Object.freeze(identity.grants.map(grant => Object.freeze({ ...grant, permissions: Object.freeze([...grant.permissions]) })))
  });
}

export function validatePersonalIdentity(identity) {
  const errors = [];
  if (!identity || typeof identity !== "object" || Array.isArray(identity)) {
    return ["A personal identity record is required."];
  }
  if (identity.schema !== "alive-personal-identity") errors.push("Identity schema is invalid.");
  if (identity.schemaVersion !== 1) errors.push("Identity schema version is unsupported.");
  if (!text(identity.identityId, 128)) errors.push("Identity ID is required.");
  if (!text(identity.ownerId, 128)) errors.push("Owner ID is required.");
  if (!text(identity.displayName, 40)) errors.push("Display name is required.");
  if (!CHARACTER_FORMS.includes(identity.character?.form)) errors.push("Character form is unsupported.");
  if (identity.privacy?.memoryAccess !== "owner-only") errors.push("Memory access must remain owner-only.");
  if (identity.privacy?.trainingUse !== false) errors.push("Identity data cannot be used for model training by default.");
  if (identity.memoryPolicy?.ownerControlled !== true) errors.push("Memory must remain owner-controlled.");
  if (identity.memoryPolicy?.sharing !== "private") errors.push("Memory sharing must remain private by default.");
  if (!Array.isArray(identity.grants)) errors.push("Identity grants must be an array.");
  else {
    for (const grant of identity.grants) {
      if (!text(grant?.subjectId, 128)) errors.push("Every access grant needs a subject ID.");
      if (grant?.subjectId === identity.ownerId) errors.push("The owner must not be represented as a delegated grant.");
      if (!["editor", "viewer"].includes(grant?.role)) errors.push("Delegated grants may only be editor or viewer.");
    }
  }
  return errors;
}

export function isIdentityOwner(identity, subjectId) {
  return !!identity && typeof subjectId === "string" && !!subjectId
    && subjectId === identity.ownerId;
}

export function canAccessIdentity(identity, subjectId, requiredRole = "viewer") {
  if (!identity || !subjectId) return false;
  if (!["owner", "editor", "viewer"].includes(requiredRole)) return false;
  if (isIdentityOwner(identity, subjectId)) return true;
  if (requiredRole === "owner") return false;
  const grant = (identity.grants || []).find(item => item.subjectId === subjectId);
  if (!grant) return false;
  if (requiredRole === "editor") return grant.role === "editor";
  return grant.role === "editor" || grant.role === "viewer";
}

export function assertIdentityOwner(identity, subjectId) {
  if (!isIdentityOwner(identity, subjectId)) {
    const error = new Error("Only the personal identity owner can perform this action.");
    error.code = "ALIVE_IDENTITY_OWNER_REQUIRED";
    throw error;
  }
  return true;
}

export function createCompanionPolicy(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) input = {};
  const mode = COMPANION_MODES.includes(input.mode) ? input.mode : "owner-directed";
  const capabilities = listOfText(input.capabilities, 16, 48);
  return Object.freeze({
    schema: "alive-companion-policy",
    schemaVersion: 1,
    identityId: text(input.identityId, 128),
    mode,
    capabilities: Object.freeze(capabilities),
    mayActWhenOwnerAway: input.mayActWhenOwnerAway === true && mode === "autonomous",
    mayChangeIdentity: false,
    mayChangePermissions: false,
    mayShareMemories: false,
    requireOwnerApprovalForExternalActions: true,
    wellbeing: Object.freeze({
      careModel: "supportive",
      punitiveDecay: false,
      irreversibleLoss: false
    })
  });
}

export function validateCompanionPolicy(policy) {
  const errors = [];
  if (!policy || typeof policy !== "object" || Array.isArray(policy)) {
    return ["A companion policy is required."];
  }
  if (policy.schema !== "alive-companion-policy" || policy.schemaVersion !== 1) {
    errors.push("Companion policy schema is unsupported.");
  }
  if (!text(policy.identityId, 128)) errors.push("Companion policy must reference a personal identity.");
  if (!COMPANION_MODES.includes(policy.mode)) errors.push("Companion mode is unsupported.");
  if (policy.mayChangeIdentity !== false) errors.push("A companion cannot change its owner's identity.");
  if (policy.mayChangePermissions !== false) errors.push("A companion cannot change its owner's permissions.");
  if (policy.mayShareMemories !== false) errors.push("A companion cannot share private memories by itself.");
  if (policy.requireOwnerApprovalForExternalActions !== true) errors.push("External actions require owner approval.");
  if (policy.wellbeing?.punitiveDecay !== false || policy.wellbeing?.irreversibleLoss !== false) {
    errors.push("Companion wellbeing must remain non-punitive and reversible.");
  }
  if (policy.mode !== "autonomous" && policy.mayActWhenOwnerAway === true) {
    errors.push("Only autonomous mode can act while the owner is away.");
  }
  return errors;
}
