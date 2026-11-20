import { validatePersonalIdentity } from "./identityContract.js";

function parseJson(value, fallback) {
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return value ?? fallback;
}

function iso(value) {
  return value instanceof Date ? value.toISOString() : new Date(value || Date.now()).toISOString();
}

function identityError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function assertRecord(record) {
  const errors = validatePersonalIdentity(record);
  if (errors.length) {
    const error = identityError("The identity record failed validation.", "ALIVE_IDENTITY_INVALID");
    error.details = errors;
    throw error;
  }
  return record;
}

function fromRow(row) {
  if (!row) return null;
  return assertRecord({
    schema: "alive-personal-identity",
    schemaVersion: 1,
    identityId: row.identity_id,
    ownerId: row.owner_id,
    displayName: row.display_name,
    character: {
      form: row.character_form,
      modelRef: row.model_ref || null,
      appearanceProfile: parseJson(row.appearance_profile, {})
    },
    personality: {
      summary: row.personality_summary || "",
      traits: parseJson(row.personality_traits, [])
    },
    privacy: {
      discoverability: row.discoverability || "private",
      memoryAccess: row.memory_access || "owner-only",
      trainingUse: row.training_use === true
    },
    memoryPolicy: {
      ownerControlled: true,
      sharing: "private",
      retention: "owner-controlled",
      allowCrossWorldSharing: parseJson(row.memory_policy, {}).allowCrossWorldSharing === true
    },
    grants: parseJson(row.grants, []),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  });
}

/**
 * PostgreSQL adapter for the approved alive_personal_identity table.
 * The authenticated owner ID is always supplied by the verified server session.
 */
export function createPostgresIdentityRepository(pool) {
  if (!pool || typeof pool.query !== "function" || typeof pool.connect !== "function") {
    throw new TypeError("A PostgreSQL pool with query() and connect() is required.");
  }

  return Object.freeze({
    async insert(record) {
      assertRecord(record);
      const result = await pool.query(
        `INSERT INTO alive_personal_identity
          (identity_id, owner_id, display_name, character_form, model_ref,
           appearance_profile, personality_summary, personality_traits,
           discoverability, memory_access, training_use, memory_policy, grants,
           created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8::jsonb,
                 $9, $10, $11, $12::jsonb, $13::jsonb, $14::timestamptz, $15::timestamptz)
         RETURNING *`,
        [
          record.identityId, record.ownerId, record.displayName, record.character.form,
          record.character.modelRef, JSON.stringify(record.character.appearanceProfile),
          record.personality.summary, JSON.stringify(record.personality.traits),
          record.privacy.discoverability, record.privacy.memoryAccess, record.privacy.trainingUse,
          JSON.stringify(record.memoryPolicy), JSON.stringify(record.grants),
          record.createdAt, record.updatedAt
        ]
      );
      if (!result.rows?.[0]) throw identityError("The identity could not be stored.", "ALIVE_IDENTITY_PERSIST_FAILED");
      return fromRow(result.rows[0]);
    },

    async getById(identityId) {
      const id = typeof identityId === "string" ? identityId.trim() : "";
      if (!id) return null;
      const result = await pool.query(
        "SELECT * FROM alive_personal_identity WHERE identity_id = $1 LIMIT 1",
        [id]
      );
      return result.rows?.[0] ? fromRow(result.rows[0]) : null;
    },

    async update(identityId, mutate) {
      const id = typeof identityId === "string" ? identityId.trim() : "";
      if (!id) throw identityError("A stable identity ID is required.", "ALIVE_IDENTITY_ID_REQUIRED");
      if (typeof mutate !== "function") throw new TypeError("An atomic identity mutation callback is required.");

      const client = await pool.connect();
      let transactionOpen = false;
      try {
        await client.query("BEGIN");
        transactionOpen = true;
        const selected = await client.query(
          "SELECT * FROM alive_personal_identity WHERE identity_id = $1 FOR UPDATE",
          [id]
        );
        if (!selected.rows?.[0]) throw identityError("The requested identity was not found.", "ALIVE_IDENTITY_NOT_FOUND");

        const current = fromRow(selected.rows[0]);
        const next = assertRecord(await mutate(current));
        if (next.identityId !== current.identityId || next.ownerId !== current.ownerId ||
            selected.rows[0].owner_id !== current.ownerId) {
          throw identityError("Identity ID and personal owner ID are immutable.", "ALIVE_IDENTITY_IMMUTABLE_OWNER");
        }

        const saved = await client.query(
          `UPDATE alive_personal_identity
              SET display_name = $2, character_form = $3, model_ref = $4,
                  appearance_profile = $5::jsonb, personality_summary = $6,
                  personality_traits = $7::jsonb, discoverability = $8,
                  memory_access = $9, training_use = $10, memory_policy = $11::jsonb,
                  grants = $12::jsonb, updated_at = $13::timestamptz
            WHERE identity_id = $1 AND owner_id = $14
            RETURNING *`,
          [
            id, next.displayName, next.character.form, next.character.modelRef,
            JSON.stringify(next.character.appearanceProfile), next.personality.summary,
            JSON.stringify(next.personality.traits), next.privacy.discoverability,
            next.privacy.memoryAccess, next.privacy.trainingUse, JSON.stringify(next.memoryPolicy),
            JSON.stringify(next.grants), next.updatedAt, current.ownerId
          ]
        );
        if (!saved.rows?.[0]) throw identityError("The identity update could not be committed.", "ALIVE_IDENTITY_PERSIST_FAILED");
        await client.query("COMMIT");
        transactionOpen = false;
        return fromRow(saved.rows[0]);
      } catch (error) {
        if (transactionOpen) await client.query("ROLLBACK").catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    }
  });
}
