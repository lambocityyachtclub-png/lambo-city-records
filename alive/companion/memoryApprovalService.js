const ID_LIMIT = 128;
const CONTENT_LIMIT = 2000;

function reviewError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function required(value, label) {
  if (typeof value !== "string" || !value.trim() || value.length > ID_LIMIT) {
    throw reviewError(label + " is required.", "ALIVE_MEMORY_REVIEW_INPUT_INVALID");
  }
  return value.trim();
}

function validateProposal(record, ownerId, identityId) {
  if (!record || record.ownerId !== ownerId || record.identityId !== identityId ||
      typeof record.memoryId !== "string" || !record.memoryId ||
      typeof record.content !== "string" || !record.content.trim() ||
      record.content.length > CONTENT_LIMIT ||
      !["fact", "preference", "goal", "relationship", "project", "experience"].includes(record.category) ||
      record.state !== "proposed" || record.source !== "companion-suggested" ||
      record.visibility !== "owner-only" || record.trainingUse !== false ||
      record.crossWorldSharing !== false) {
    throw reviewError("The pending memory does not satisfy the private proposal contract.", "ALIVE_MEMORY_REVIEW_RECORD_INVALID");
  }
  return Object.freeze({
    memoryId: record.memoryId,
    ownerId,
    identityId,
    category: record.category,
    content: record.content,
    tags: Object.freeze(Array.isArray(record.tags) ? [...record.tags] : []),
    state: "proposed",
    source: "companion-suggested",
    createdAt: record.createdAt,
    privacy: Object.freeze({
      visibility: "private",
      trainingUse: false,
      crossWorldSharing: false,
      shareWithDevelopment: false
    })
  });
}

function requireIdentityService(service) {
  if (typeof service?.get !== "function") throw new TypeError("An owner-scoped identity service is required.");
  return service;
}

function requireRepository(repository) {
  for (const method of ["listPendingMemoryProposals", "approveMemoryProposal", "archiveMemoryProposal"]) {
    if (typeof repository?.[method] !== "function") {
      throw new TypeError("Memory review repository must implement " + method + "().");
    }
  }
  return repository;
}

/**
 * Owner-only review boundary for Companion-suggested memories.
 * This service never creates proposals and never approves them automatically.
 * The proposal producer must use a separately trusted server-side path.
 */
export function createCompanionMemoryReviewService({ identityService, repository } = {}) {
  const identities = requireIdentityService(identityService);
  const store = requireRepository(repository);

  async function authorize(actorValue, identityValue) {
    const actorId = required(actorValue, "Authenticated owner ID");
    const identityId = required(identityValue, "Personal identity ID");
    const identity = await identities.get({ actorId, identityId, requiredRole: "owner" });
    if (!identity || identity.ownerId !== actorId || identity.identityId !== identityId) {
      throw reviewError("The personal identity owner could not be verified.", "ALIVE_MEMORY_REVIEW_OWNER_REQUIRED");
    }
    if (identity.privacy?.memoryAccess !== "owner-only" ||
        identity.privacy?.trainingUse !== false ||
        identity.memoryPolicy?.ownerControlled !== true ||
        identity.memoryPolicy?.sharing !== "private") {
      throw reviewError("The identity's private memory policy is invalid.", "ALIVE_MEMORY_REVIEW_POLICY_INVALID");
    }
    return { actorId, identityId };
  }

  return Object.freeze({
    async listPending({ actorId, identityId } = {}) {
      const scope = await authorize(actorId, identityId);
      const records = await store.listPendingMemoryProposals(scope);
      if (!Array.isArray(records) || records.length > 100) {
        throw reviewError("The proposal repository returned an invalid collection.", "ALIVE_MEMORY_REVIEW_RECORD_INVALID");
      }
      const proposals = records.map(record => validateProposal(record, scope.actorId, scope.identityId));
      const ids = new Set();
      for (const proposal of proposals) {
        if (ids.has(proposal.memoryId)) throw reviewError("Duplicate proposal IDs were returned.", "ALIVE_MEMORY_REVIEW_CONFLICT");
        ids.add(proposal.memoryId);
      }
      return Object.freeze(proposals);
    },

    async approve({ actorId, identityId, memoryId } = {}) {
      const scope = await authorize(actorId, identityId);
      const id = required(memoryId, "Memory ID");
      const result = await store.approveMemoryProposal({ ...scope, memoryId: id });
      if (!result) return null;
      return validateApproved(result, scope.actorId, scope.identityId);
    },

    async archive({ actorId, identityId, memoryId } = {}) {
      const scope = await authorize(actorId, identityId);
      const id = required(memoryId, "Memory ID");
      return (await store.archiveMemoryProposal({ ...scope, memoryId: id })) === true;
    }
  });
}

function validateApproved(record, ownerId, identityId) {
  if (!record || record.ownerId !== ownerId || record.identityId !== identityId ||
      record.state !== "approved" || record.approvedBy !== ownerId ||
      record.source !== "companion-suggested" || record.trainingUse !== false ||
      record.visibility !== "owner-only") {
    throw reviewError("The approved memory did not satisfy the owner approval contract.", "ALIVE_MEMORY_REVIEW_RECORD_INVALID");
  }
  return Object.freeze({
    memoryId: record.memoryId,
    ownerId,
    identityId,
    category: record.category,
    content: record.content,
    state: "approved",
    source: "companion-suggested",
    approvedBy: ownerId,
    approvedAt: record.approvedAt,
    shareWithDevelopment: false
  });
}
