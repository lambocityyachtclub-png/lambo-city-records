/**
 * ALIVE — existing character runtime binding
 *
 * Bridges an owner-authorized personal identity to an existing host-owned
 * character object. The host supplies the resolver; this module never
 * constructs, clones, replaces, or visually modifies a model.
 *
 * The adapter is read-only. Companion policy is returned as a validated
 * capability contract; this module does not execute companion actions.
 */
import {
  COMPANION_MODES,
  CHARACTER_FORMS,
  createCompanionPolicy,
  validateCompanionPolicy
} from "../identity/identityContract.js";

const ACCESS_ROLES = new Set(["owner", "editor", "viewer"]);

function cleanId(value, name) {
  if (typeof value !== "string" || !value.trim()) {
    const error = new Error(name + " is required.");
    error.code = "ALIVE_RUNTIME_ID_REQUIRED";
    throw error;
  }
  return value.trim().slice(0, 128);
}

function runtimeError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function requireService(service) {
  if (!service || typeof service.get !== "function") {
    throw new TypeError("An owner-scoped identity service with get() is required.");
  }
  return service;
}

export function createIdentityRuntimeAdapter(options = {}) {
  const identityService = requireService(options.identityService);
  const resolveExistingModel = options.resolveExistingModel;

  if (typeof resolveExistingModel !== "function") {
    throw new TypeError("An explicit resolveExistingModel() host adapter is required.");
  }

  async function resolve(input = {}) {
    const actorId = cleanId(input.actorId, "An authenticated actor ID");
    const identityId = cleanId(input.identityId, "A personal identity ID");
    const requiredRole = input.requiredRole || "viewer";

    if (!ACCESS_ROLES.has(requiredRole)) {
      throw runtimeError("The requested identity access role is invalid.", "ALIVE_RUNTIME_ROLE_INVALID");
    }

    // Authorization is always delegated to the owner-scoped service. The
    // caller cannot provide an owner ID or bypass the identity's grants.
    const identity = await identityService.get({
      actorId,
      identityId,
      requiredRole
    });

    if (!identity || identity.identityId !== identityId) {
      throw runtimeError("The authorized identity record did not match the request.", "ALIVE_RUNTIME_IDENTITY_MISMATCH");
    }

    const characterForm = identity.character?.form;
    if (!CHARACTER_FORMS.includes(characterForm)) {
      throw runtimeError("The identity uses an unsupported character form.", "ALIVE_RUNTIME_CHARACTER_FORM_INVALID");
    }

    const modelRef = typeof identity.character?.modelRef === "string"
      ? identity.character.modelRef.trim()
      : "";
    if (!modelRef) {
      throw runtimeError("The personal identity has no existing model reference.", "ALIVE_RUNTIME_MODEL_REFERENCE_REQUIRED");
    }

    // The host resolves its existing visual object. No Three.js dependency,
    // cloning, scene insertion, or fallback model is created here.
    const visual = await resolveExistingModel(modelRef, Object.freeze({
      identityId,
      characterForm,
      ownerId: identity.ownerId
    }));

    if (!visual || typeof visual !== "object") {
      throw runtimeError("The referenced existing character model could not be resolved.", "ALIVE_RUNTIME_MODEL_NOT_FOUND");
    }

    let companionPolicy;
    if (input.companionPolicy !== undefined) {
      // Changing Companion operating mode is an owner-only choice, even if
      // the caller has a delegated editor grant for character presentation.
      if (identity.ownerId !== actorId) {
        throw runtimeError("Only the personal identity owner can select a Companion policy.", "ALIVE_RUNTIME_OWNER_REQUIRED");
      }
      companionPolicy = input.companionPolicy;
    } else {
      companionPolicy = createCompanionPolicy({
        identityId,
        mode: "owner-directed"
      });
    }

    if (companionPolicy?.identityId !== identityId) {
      throw runtimeError("The Companion policy must reference the same personal identity.", "ALIVE_RUNTIME_COMPANION_ID_MISMATCH");
    }

    const policyErrors = validateCompanionPolicy(companionPolicy);
    if (policyErrors.length) {
      const error = runtimeError(
        "The Companion policy failed validation: " + policyErrors.join(" "),
        "ALIVE_RUNTIME_COMPANION_POLICY_INVALID"
      );
      error.details = policyErrors;
      throw error;
    }

    const grant = (identity.grants || []).find(item => item.subjectId === actorId);
    const role = identity.ownerId === actorId ? "owner" : (grant?.role || requiredRole);

    return Object.freeze({
      identityId,
      ownerId: identity.ownerId,
      actorId,
      role,
      character: Object.freeze({
        form: characterForm,
        modelRef,
        visual
      }),
      companionPolicy,
      permissions: Object.freeze({
        canManageIdentity: identity.ownerId === actorId,
        canManagePermissions: identity.ownerId === actorId,
        canSelectCompanionPolicy: identity.ownerId === actorId
      })
    });
  }

  return Object.freeze({ resolve });
}
