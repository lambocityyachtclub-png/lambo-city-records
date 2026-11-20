function parseJson(value, fallback) {
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return value ?? fallback;
}

function iso(value) {
  return value instanceof Date ? value.toISOString() : new Date(value || Date.now()).toISOString();
}

function scope(value, label) {
  if (typeof value !== "string" || !value.trim() || value.length > 128) {
    throw new TypeError(label + " is required.");
  }
  return value.trim();
}

function fromRow(row) {
  return {
    memoryId: row.memory_id,
    ownerId: row.owner_id,
    identityId: row.identity_id,
    category: row.category,
    content: row.content,
    tags: parseJson(row.tags, []),
    state: row.state,
    source: row.source,
    visibility: row.visibility,
    trainingUse: row.training_use === true,
    crossWorldSharing: false,
    createdAt: iso(row.created_at),
    approvedAt: row.approved_at ? iso(row.approved_at) : null,
    approvedBy: row.approved_by || null
  };
}

/** Owner/identity-scoped SQL operations for pending Companion memory proposals. */
export function createPostgresCompanionMemoryReviewRepository(pool) {
  if (!pool || typeof pool.query !== "function") {
    throw new TypeError("A PostgreSQL pool with query() is required.");
  }

  return Object.freeze({
    async listPendingMemoryProposals({ ownerId: ownerValue, identityId: identityValue } = {}) {
      const ownerId = scope(ownerValue, "Owner ID");
      const identityId = scope(identityValue, "Identity ID");
      const result = await pool.query(
        `SELECT memory_id, owner_id, identity_id, category, content, tags, state,
                source, visibility, training_use, created_at, approved_at, approved_by
           FROM alive_memory_entry
          WHERE owner_id = $1 AND identity_id = $2
            AND state = 'proposed' AND source = 'companion-suggested'
          ORDER BY created_at ASC, memory_id ASC
          LIMIT 100`,
        [ownerId, identityId]
      );
      return (result.rows || []).map(fromRow);
    },

    async approveMemoryProposal({ ownerId: ownerValue, identityId: identityValue, memoryId: memoryValue } = {}) {
      const ownerId = scope(ownerValue, "Owner ID");
      const identityId = scope(identityValue, "Identity ID");
      const memoryId = scope(memoryValue, "Memory ID");
      const result = await pool.query(
        `UPDATE alive_memory_entry
            SET state = 'approved', approved_at = now(), approved_by = $1
          WHERE owner_id = $1 AND identity_id = $2 AND memory_id = $3
            AND state = 'proposed' AND source = 'companion-suggested'
          RETURNING memory_id, owner_id, identity_id, category, content, tags, state,
                    source, visibility, training_use, created_at, approved_at, approved_by`,
        [ownerId, identityId, memoryId]
      );
      return result.rows?.[0] ? fromRow(result.rows[0]) : null;
    },

    async archiveMemoryProposal({ ownerId: ownerValue, identityId: identityValue, memoryId: memoryValue } = {}) {
      const ownerId = scope(ownerValue, "Owner ID");
      const identityId = scope(identityValue, "Identity ID");
      const memoryId = scope(memoryValue, "Memory ID");
      const result = await pool.query(
        `UPDATE alive_memory_entry
            SET state = 'archived', archived_at = now()
          WHERE owner_id = $1 AND identity_id = $2 AND memory_id = $3
            AND state = 'proposed' AND source = 'companion-suggested'
          RETURNING memory_id`,
        [ownerId, identityId, memoryId]
      );
      return (result.rows || []).length === 1;
    }
  });
}
