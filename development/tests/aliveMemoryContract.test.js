import test from "node:test";
import assert from "node:assert/strict";
import {
  createMemoryEntry,
  validateMemoryEntry,
  canReadMemoryEntry,
  approveMemoryEntry,
  archiveMemoryEntry
} from "../../alive/memory/memoryContract.js";

const proposedMemory = () => createMemoryEntry({
  memoryId: "memory-001",
  identityId: "identity-001",
  ownerId: "owner-001",
  category: "preference",
  content: "Prefers concise project updates.",
  tags: ["communication", "work", "communication"],
  source: "companion-suggested",
  createdAt: "2026-11-19T19:00:00-08:00"
});

test("new memories are proposals, not permanent approved memories", () => {
  const entry = proposedMemory();
  assert.equal(entry.state, "proposed");
  assert.equal(entry.visibility, "owner-only");
  assert.equal(entry.trainingUse, false);
  assert.equal(entry.approvedBy, null);
  assert.equal(entry.approvedAt, null);
  assert.deepEqual(entry.tags, ["communication", "work"]);
  assert.deepEqual(validateMemoryEntry(entry), []);
});

test("requires identity, owner, stable ID, content, and a supported category", () => {
  assert.throws(() => createMemoryEntry({}), /identity/);
  assert.throws(() => createMemoryEntry({ identityId: "id" }), /owner/);
  assert.throws(() => createMemoryEntry({ identityId: "id", ownerId: "owner" }), /memory ID/);
  assert.throws(() => createMemoryEntry({
    identityId: "id", ownerId: "owner", memoryId: "m", content: "x", category: "secret"
  }), /category/);
});

test("only the owner can read private memory", () => {
  const entry = proposedMemory();
  assert.equal(canReadMemoryEntry(entry, "owner-001"), true);
  assert.equal(canReadMemoryEntry(entry, "editor-001"), false);
  assert.equal(canReadMemoryEntry(entry, "world-service"), false);
  assert.equal(canReadMemoryEntry(entry, ""), false);
});

test("owner approval is explicit, recorded, and immutable", () => {
  const entry = proposedMemory();
  const approved = approveMemoryEntry(entry, "owner-001", "2026-11-19T19:10:00-08:00");
  assert.equal(approved.state, "approved");
  assert.equal(approved.approvedBy, "owner-001");
  assert.equal(approved.approvedAt, "2026-11-19T19:10:00-08:00");
  assert.equal(entry.state, "proposed");
  assert.equal(Object.isFrozen(approved), true);
  assert.deepEqual(validateMemoryEntry(approved), []);
});

test("a companion, collaborator, or world cannot approve owner memory", () => {
  assert.throws(
    () => approveMemoryEntry(proposedMemory(), "companion-service", "2026-11-19T19:10:00Z"),
    error => error.code === "ALIVE_MEMORY_OWNER_REQUIRED"
  );
});

test("approval cannot be repeated or applied to an archived memory", () => {
  const approved = approveMemoryEntry(proposedMemory(), "owner-001", "2026-11-19T19:10:00Z");
  assert.throws(
    () => approveMemoryEntry(approved, "owner-001", "2026-11-19T19:11:00Z"),
    error => error.code === "ALIVE_MEMORY_INVALID_STATE"
  );
  const archived = archiveMemoryEntry(proposedMemory(), "owner-001", "2026-11-19T19:12:00Z");
  assert.throws(
    () => approveMemoryEntry(archived, "owner-001", "2026-11-19T19:13:00Z"),
    error => error.code === "ALIVE_MEMORY_INVALID_STATE"
  );
});

test("owner can archive a memory and the archive is auditable", () => {
  const approved = approveMemoryEntry(proposedMemory(), "owner-001", "2026-11-19T19:10:00Z");
  const archived = archiveMemoryEntry(approved, "owner-001", "2026-11-19T19:20:00Z");
  assert.equal(archived.state, "archived");
  assert.equal(archived.archivedAt, "2026-11-19T19:20:00Z");
  assert.equal(archived.approvedBy, "owner-001");
  assert.deepEqual(validateMemoryEntry(archived), []);
});

test("validator rejects public memory and model-training use", () => {
  const invalid = {
    ...proposedMemory(),
    visibility: "public",
    trainingUse: true
  };
  const errors = validateMemoryEntry(invalid);
  assert.ok(errors.some(error => /owner-only/.test(error)));
  assert.ok(errors.some(error => /training/.test(error)));
});

test("validator rejects approval metadata that has no matching approval", () => {
  const invalid = { ...proposedMemory(), approvedBy: "owner-001" };
  assert.ok(validateMemoryEntry(invalid).some(error => /approval metadata/.test(error)));
});
