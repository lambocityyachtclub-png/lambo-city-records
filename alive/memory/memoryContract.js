// ALIVE owner-controlled memory contract
// Domain-only rules. This module does not persist memory or call AI providers.

export const MEMORY_CATEGORIES = Object.freeze([
  "fact", "preference", "goal", "relationship", "project", "experience"
]);
export const MEMORY_STATES = Object.freeze(["proposed", "approved", "archived"]);

const cleanText = (value, maxLength) => typeof value === "string"
  ? value.trim().slice(0, maxLength)
  : "";

function freezeEntry(entry) {
  return Object.freeze({
    ...entry,
    tags: Object.freeze([...entry.tags])
  });
}

function requireOwner(entry, actorId) {
  if (!entry || typeof entry !== "object" || !actorId || actorId !== entry.ownerId) {
    const error = new Error("Only the personal identity owner can manage this memory.");
    error.code = "ALIVE_MEMORY_OWNER_REQUIRED";
    throw error;
  }
}

export function createMemoryEntry(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("A memory entry input object is required.");
  }

  const identityId = cleanText(input.identityId, 128);
  const ownerId = cleanText(input.ownerId, 128);
  const memoryId = cleanText(input.memoryId, 128);
  const content = cleanText(input.content, 2000);
  const category = cleanText(input.category, 32);

  if (!identityId) throw new TypeError("A memory entry must reference an ALIVE identity.");
  if (!ownerId) throw new TypeError("A memory entry must reference its personal owner.");
  if (!memoryId) throw new TypeError("A stable memory ID is required.");
  if (!content) throw new TypeError("A concise memory statement is required.");
  if (!MEMORY_CATEGORIES.includes(category)) {
    throw new TypeError("Memory category is unsupported.");
  }

  const tags = Array.isArray(input.tags)
    ? [...new Set(input.tags.map(tag => cleanText(tag, 32)).filter(Boolean))].slice(0, 8)
    : [];

  // A newly captured or suggested memory is never trusted as permanent by default.
  return freezeEntry({
    schema: "alive-memory-entry",
    schemaVersion: 1,
    memoryId,
    identityId,
    ownerId,
    category,
    content,
    tags,
    state: "proposed",
    visibility: "owner-only",
    trainingUse: false,
    source: input.source === "owner-stated" ? "owner-stated" : "companion-suggested",
    createdAt: cleanText(input.createdAt, 40) || null,
    approvedAt: null,
    approvedBy: null,
    archivedAt: null
  });
}

export function validateMemoryEntry(entry) {
  const errors = [];
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    return ["A memory entry is required."];
  }
  if (entry.schema !== "alive-memory-entry" || entry.schemaVersion !== 1) {
    errors.push("Memory entry schema is unsupported.");
  }
  if (!cleanText(entry.memoryId, 128)) errors.push("Memory ID is required.");
  if (!cleanText(entry.identityId, 128)) errors.push("Identity ID is required.");
  if (!cleanText(entry.ownerId, 128)) errors.push("Memory owner ID is required.");
  if (!cleanText(entry.content, 2000)) errors.push("Memory content is required.");
  if (!MEMORY_CATEGORIES.includes(entry.category)) errors.push("Memory category is unsupported.");
  if (!MEMORY_STATES.includes(entry.state)) errors.push("Memory state is unsupported.");
  if (entry.visibility !== "owner-only") errors.push("Memory must remain owner-only.");
  if (entry.trainingUse !== false) errors.push("Memory cannot be used for model training by default.");
  if (entry.state === "approved" && (!entry.approvedBy || !entry.approvedAt)) {
    errors.push("Approved memory must record the owner's approval.");
  }
  if ((entry.approvedBy && !entry.approvedAt) || (!entry.approvedBy && entry.approvedAt)) {
    errors.push("Memory approval metadata must be complete.");
  }
  if (entry.state === "proposed" && (entry.approvedBy || entry.approvedAt)) {
    errors.push("Proposed memory cannot carry approval metadata.");
  }
  if (entry.state === "archived" && !entry.archivedAt) {
    errors.push("Archived memory must record its archive time.");
  }
  return errors;
}

export function canReadMemoryEntry(entry, subjectId) {
  return !!entry && entry.visibility === "owner-only"
    && entry.ownerId === subjectId;
}

export function approveMemoryEntry(entry, actingOwnerId, approvedAt) {
  requireOwner(entry, actingOwnerId);
  if (entry.state !== "proposed") {
    const error = new Error("Only a proposed memory can be approved.");
    error.code = "ALIVE_MEMORY_INVALID_STATE";
    throw error;
  }
  const timestamp = cleanText(approvedAt, 40);
  if (!timestamp) throw new TypeError("An approval timestamp is required.");
  return freezeEntry({
    ...entry,
    state: "approved",
    approvedBy: actingOwnerId,
    approvedAt
  });
}

export function archiveMemoryEntry(entry, actingOwnerId, archivedAt) {
  requireOwner(entry, actingOwnerId);
  if (entry.state === "archived") return entry;
  const timestamp = cleanText(archivedAt, 40);
  if (!timestamp) throw new TypeError("An archive timestamp is required.");
  return freezeEntry({
    ...entry,
    state: "archived",
    archivedAt: timestamp
  });
}
