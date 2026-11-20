function parseJson(value, fallback) {
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return value ?? fallback;
}

function iso(value) {
  return value instanceof Date ? value.toISOString() : new Date(value || Date.now()).toISOString();
}

function requireScope(value, name) {
  if (typeof value !== "string" || !value.trim() || value.length > 128) {
    throw new TypeError(name + " is required.");
  }
  return value.trim();
}

function requireRecord(record, expectedOwnerId, expectedIdentityId) {
  if (!record || typeof record !== "object" || Array.isArray(record) ||
      record.ownerId !== expectedOwnerId || record.identityId !== expectedIdentityId) {
    const error = new Error("Companion record scope does not match its owner and identity.");
    error.code = "ALIVE_VAULT_SCOPE_MISMATCH";
    throw error;
  }
  return record;
}

function fromMemoryRow(row) {
  const createdAt = iso(row.created_at);
  return {
    memoryId: row.memory_id,
    identityId: row.identity_id,
    ownerId: row.owner_id,
    createdBy: row.owner_id,
    category: row.category,
    content: row.content,
    tags: parseJson(row.tags, []),
    createdAt,
    updatedAt: createdAt,
    privacy: {
      visibility: "private",
      trainingUse: row.training_use === true,
      crossWorldSharing: false,
      shareWithDevelopment: row.share_with_development === true
    }
  };
}

/**
 * PostgreSQL adapter for the approved alive_memory_entry table and private
 * companion preferences. Memory removal is an owner-scoped archive operation.
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
        `INSERT INTO alive_memory_entry
          (memory_id, identity_id, owner_id, category, content, tags, state,
           visibility, training_use, source, share_with_development, created_at,
           approved_at, approved_by)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, 'approved',
                 'owner-only', false, 'owner-stated', $7, $8::timestamptz,
                 $8::timestamptz, $3)
         RETURNING memory_id, identity_id, owner_id, category, content, tags,
                   state, visibility, training_use, source, share_with_development, created_at`,
        [record.memoryId, identityId, ownerId, record.category, record.content,
          JSON.stringify(record.tags), record.privacy?.shareWithDevelopment === true, record.createdAt]
      );
      if (!result.rows?.[0]) throw new Error("Companion memory could not be stored.");
      return fromMemoryRow(result.rows[0]);
    },

    async listMemories({ ownerId: ownerValue, identityId: identityValue } = {}) {
      const ownerId = requireScope(ownerValue, "Owner ID");
      const identityId = requireScope(identityValue, "Identity ID");
      const result = await pool.query(
        `SELECT memory_id, identity_id, owner_id, category, content, tags, state,
                visibility, training_use, source, share_with_development, created_at
           FROM alive_memory_entry
          WHERE owner_id = $1 AND identity_id = $2 AND state <> 'archived'
          ORDER BY created_at DESC, memory_id ASC
          LIMIT 500`,
        [ownerId, identityId]
      );
      return (result.rows || []).map(fromMemoryRow);
    },

    async deleteMemory({ ownerId: ownerValue, identityId: identityValue, memoryId } = {}) {
      const ownerId = requireScope(ownerValue, "Owner ID");
      const identityId = requireScope(identityValue, "Identity ID");
      const id = requireScope(memoryId, "Memory ID");
      const result = await pool.query(
        `UPDATE alive_memory_entry
            SET state = 'archived', archived_at = now()
          WHERE owner_id = $1 AND identity_id = $2 AND memory_id = $3 AND state <> 'archived'
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
      return parseJson(result.rows[0].record, result.rows[0].record);
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
      return (result.rows || []).map(row => parseJson(row.record, row.record));
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
