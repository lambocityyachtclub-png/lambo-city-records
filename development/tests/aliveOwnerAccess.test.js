import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryEntry } from "../../alive/memory/memoryContract.js";
import {
  createAliveOwnerContext,
  assertAliveOwnerContext,
  assertIdentityOwnerContext,
  canReadMemoryEntryWithContext,
  canUseMemoryAsCompanionContextWithContext,
  approveMemoryEntryWithContext,
  archiveMemoryEntryWithContext
} from "../../alive/memory/ownerAccess.js";

const verifiedSession = (ownerId = "owner-001") => ({
  user: { id: ownerId },
  session: {
    id: "session-001",
    expiresAt: "2099-01-01T00:00:00.000Z"
  }
});

const memory = () => createMemoryEntry({
  memoryId: "memory-001",
  identityId: "identity-001",
  ownerId: "owner-001",
  category: "preference",
  content: "Prefers concise updates."
});

test("owner context is derived from a verified auth session and branded", () => {
  const context = createAliveOwnerContext(verifiedSession(), new Date("2026-11-19T00:00:00Z"));
  assert.equal(context.ownerId, "owner-001");
  assert.equal(Object.isFrozen(context), true);
  assert.equal(assertAliveOwnerContext(context), context);
});

test("rejects missing, incomplete, or expired authentication sessions", () => {
  assert.throws(
    () => createAliveOwnerContext(null),
    error => error.code === "ALIVE_AUTH_REQUIRED"
  );
  assert.throws(
    () => createAliveOwnerContext({ user: { id: "owner-001" }, session: { id: "s" } }),
    error => error.code === "ALIVE_AUTH_INVALID"
  );
  assert.throws(
    () => createAliveOwnerContext({
      user: { id: "owner-001" },
      session: { id: "s", expiresAt: "2020-01-01T00:00:00Z" }
    }),
    error => error.code === "ALIVE_SESSION_EXPIRED"
  );
});

test("a browser-shaped object cannot forge a trusted owner context", () => {
  assert.throws(
    () => assertAliveOwnerContext({ ownerId: "owner-001", sessionExpiresAt: "2099-01-01T00:00:00Z" }),
    error => error.code === "ALIVE_AUTH_REQUIRED"
  );
});

test("identity ownership is checked against the authenticated session owner", () => {
  const context = createAliveOwnerContext(verifiedSession());
  assert.equal(assertIdentityOwnerContext({ ownerId: "owner-001" }, context), true);
  assert.throws(
    () => assertIdentityOwnerContext({ ownerId: "someone-else" }, context),
    error => error.code === "ALIVE_IDENTITY_OWNER_REQUIRED"
  );
});

test("memory reads and companion context require the matching authenticated owner", () => {
  const ownerContext = createAliveOwnerContext(verifiedSession());
  const otherContext = createAliveOwnerContext(verifiedSession("owner-002"));
  const entry = memory();
  assert.equal(canReadMemoryEntryWithContext(entry, ownerContext), true);
  assert.equal(canReadMemoryEntryWithContext(entry, otherContext), false);
  assert.equal(canUseMemoryAsCompanionContextWithContext(entry, ownerContext), false);
  const approved = approveMemoryEntryWithContext(entry, ownerContext, "2026-11-19T19:10:00Z");
  assert.equal(canUseMemoryAsCompanionContextWithContext(approved, ownerContext), true);
  assert.equal(canUseMemoryAsCompanionContextWithContext(approved, otherContext), false);
});

test("only the authenticated owner can approve or archive memory", () => {
  const ownerContext = createAliveOwnerContext(verifiedSession());
  const otherContext = createAliveOwnerContext(verifiedSession("owner-002"));
  const entry = memory();
  assert.throws(
    () => approveMemoryEntryWithContext(entry, otherContext, "2026-11-19T19:10:00Z"),
    error => error.code === "ALIVE_MEMORY_OWNER_REQUIRED"
  );
  const archived = archiveMemoryEntryWithContext(entry, ownerContext, "2026-11-19T19:20:00Z");
  assert.equal(archived.state, "archived");
  assert.equal(canUseMemoryAsCompanionContextWithContext(archived, ownerContext), false);
});
