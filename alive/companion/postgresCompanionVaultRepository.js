function parseRecord(value) {
  if (typeof value === "string") return JSON.parse(value);
  return value;
}

function requireScope(value, name) {
  if (typeof value !== "string" || !value.trim() || value.length > 128) {
    throw new TypeError(name + " is required.");
  }
  return value.trim();
}

function requireRecord(record, expectedOwnerId, expectedIdentityId) {
  if (!record || typeof record !== "object" || Array.isArray(record) ||
      record.ownerId !== expectedOwnerId ||
      record.identityId !== expectedIdentityId) {
    const error = new Error("Companion record scope does not match its owner and identity.");
    error.code = "ALIVE_VAULT_SCOPE_MISMATCH";
    throw error;
  }
  return record;
}

/**
 * PostgreSQL adapter for the owner-private Companion vault.
 * Every query scopes both owner_id and identity_id; the schema adds a
 * composite foreign key so records cannot be attached to another owner.
 */
export function createPostgresCompanionVaultRepository(pool) {
  if (!pool || typeof pool.query !== "function") {
    throw new TypeError("A PostgreSQL pool with query() is required.");
  }

  return Object.freeze({
    async insertMemory(record) {
      const ownerId = requireScope(record?.ownerId, "Owner ID");
      const identityId = requireScope(record?.identityId, "Identity ID");
      requireRecord(record, ownerId, identityId);
      const result = await pool.query(
        `INSERT INTO alive_companion_memories
          (memory_id, identity_id, owner_id, record, created_at, updated_at)
         VALUES ($1, $2, $3, $4::jsonb, $5::timestamptz, $6::timestamptz)
         RETURNING record`,
        [record.memoryId, identityId, ownerId, JSON.stringify(record), record.createdAt, record.updatedAt]
      );
      if (!result.rows?.[0]) throw new Error("Companion memory could not be stored.");
      return parseRecord(result.rows[0].record);
    },

    async listMemories({ ownerId: ownerValue, identityId: identityValue } = {}) {
      const ownerId = requireScope(ownerValue, "Owner ID");
      const identityId = requireScope(identityValue, "Identity ID");
      const result = await pool.query(
        `SELECT record FROM alive_companion_memories
          WHERE owner_id = $1 AND identity_id = $2
          ORDER BY created_at DESC, memory_id ASC
          LIMIT 500`,
        [ownerId, identityId]
      );
      return (result.rows || []).map(row => parseRecord(row.record));
    },

    async deleteMemory({ ownerId: ownerValue, identityId: identityValue, memoryId } = {}) {
      const ownerId = requireScope(ownerValue, "Owner ID");
      const identityId = requireScope(identityValue, "Identity ID");
      const id = requireScope(memoryId, "Memory ID");
      const result = await pool.query(
        `DELETE FROM alive_companion_memories
          WHERE owner_id = $1 AND identity_id = $2 AND memory_id = $3
          RETURNING memory_id`,
        [ownerId, identityId, id]
      );
      return (result.rows || []).length === 1;
    },

    async upsertPreference(record) {
      const ownerId = requireScope(record?.ownerId, "Owner ID");
      const identityId = requireScope(record?.identityId, "Identity ID");
      requireRecord(record, ownerId, identityId);
      const key = requireScope(record.key, "Preference key");
      const result = await pool.query(
        `INSERT INTO alive_companion_preferences
          (owner_id, identity_id, preference_key, record, updated_at)
         VALUES ($1, $2, $3, $4::jsonb, $5::timestamptz)
         ON CONFLICT (owner_id, identity_id, preference_key)
         DO UPDATE SET record = EXCLUDED.record, updated_at = EXCLUDED.updated_at
         RETURNING record`,
        [ownerId, identityId, key, JSON.stringify(record), record.updatedAt]
      );
      if (!result.rows?.[0]) throw new Error("Companion preference could not be stored.");
      return parseRecord(result.rows[0].record);
    },

    async listPreferences({ ownerId: ownerValue, identityId: identityValue } = {}) {
      const ownerId = requireScope(ownerValue, "Owner ID");
      const identityId = requireScope(identityValue, "Identity ID");
      const result = await pool.query(
        `SELECT record FROM alive_companion_preferences
          WHERE owner_id = $1 AND identity_id = $2
          ORDER BY preference_key ASC
          LIMIT 200`,
        [ownerId, identityId]
      );
      return (result.rows || []).map(row => parseRecord(row.record));
    },

    async deletePreference({ ownerId: ownerValue, identityId: identityValue, key: keyValue } = {}) {
      const ownerId = requireScope(ownerValue, "Owner ID");
      const identityId = requireScope(identityValue, "Identity ID");
      const key = requireScope(keyValue, "Preference key");
      const result = await pool.query(
        `DELETE FROM alive_companion_preferences
          WHERE owner_id = $1 AND identity_id = $2 AND preference_key = $3
          RETURNING preference_key`,
        [ownerId, identityId, key]
      );
      return (result.rows || []).length === 1;
    }
  });
}
