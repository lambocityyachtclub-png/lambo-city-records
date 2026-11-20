// ALIVE authenticated owner boundary
// Server-side adapter only. Pass the result of the trusted auth server's
// session lookup (for example, Better Auth auth.api.getSession({ headers })).
// Never construct this input from request-body fields or browser-supplied IDs.
//
// This module does not validate cookies, tokens, signatures, or credentials.
// The authentication provider must verify the session before this boundary is called.

import {
  approveMemoryEntry,
  archiveMemoryEntry,
  canReadMemoryEntry,
  canUseMemoryAsCompanionContext
} from "./memoryContract.js";

const trustedContexts = new WeakSet();

function fail(message, code) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function requiredString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function timestamp(value) {
  const parsed = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

/**
 * Convert a verified auth-provider session result into an unforgeable,
 * request-scoped ALIVE owner context.
 *
 * Expected Better Auth-style shape: { user: { id }, session: { id, expiresAt } }.
 * The caller is responsible for obtaining this object from the server auth API.
 */
export function createAliveOwnerContext(authResult, now = new Date()) {
  if (!authResult || typeof authResult !== "object" || Array.isArray(authResult)) {
    fail("A verified authentication session is required.", "ALIVE_AUTH_REQUIRED");
  }

  const ownerId = requiredString(authResult.user?.id);
  const sessionId = requiredString(authResult.session?.id);
  const expiresAt = timestamp(authResult.session?.expiresAt);
  const currentTime = timestamp(now);

  if (!ownerId || !sessionId || !Number.isFinite(expiresAt)) {
    fail("The verified authentication session is incomplete.", "ALIVE_AUTH_INVALID");
  }
  if (!Number.isFinite(currentTime) || expiresAt <= currentTime) {
    fail("The authentication session has expired.", "ALIVE_SESSION_EXPIRED");
  }

  const context = Object.freeze({
    ownerId,
    sessionExpiresAt: new Date(expiresAt).toISOString()
  });
  trustedContexts.add(context);
  return context;
}

export function assertAliveOwnerContext(context) {
  if (!context || typeof context !== "object" || !trustedContexts.has(context)) {
    fail("A trusted ALIVE owner context is required.", "ALIVE_AUTH_REQUIRED");
  }
  if (Date.parse(context.sessionExpiresAt) <= Date.now()) {
    fail("The authentication session has expired.", "ALIVE_SESSION_EXPIRED");
  }
  return context;
}

export function assertIdentityOwnerContext(identity, context) {
  const trusted = assertAliveOwnerContext(context);
  if (!identity || identity.ownerId !== trusted.ownerId) {
    fail("Only the authenticated personal identity owner can perform this action.", "ALIVE_IDENTITY_OWNER_REQUIRED");
  }
  return true;
}

export function canReadMemoryEntryWithContext(entry, context) {
  const trusted = assertAliveOwnerContext(context);
  return canReadMemoryEntry(entry, trusted.ownerId);
}

export function canUseMemoryAsCompanionContextWithContext(entry, context) {
  const trusted = assertAliveOwnerContext(context);
  return !!entry && entry.ownerId === trusted.ownerId
    && canUseMemoryAsCompanionContext(entry, entry.identityId);
}

export function approveMemoryEntryWithContext(entry, context, approvedAt) {
  const trusted = assertAliveOwnerContext(context);
  return approveMemoryEntry(entry, trusted.ownerId, approvedAt);
}

export function archiveMemoryEntryWithContext(entry, context, archivedAt) {
  const trusted = assertAliveOwnerContext(context);
  return archiveMemoryEntry(entry, trusted.ownerId, archivedAt);
}
