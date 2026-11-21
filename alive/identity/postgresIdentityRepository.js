import { validatePersonalIdentity } from "./identityContract.js";

function parseRecord(value) {
  if (typeof value === "string") return JSON.parse(value);
  return value;
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

/**
 * PostgreSQL repository adapter for ALIVE personal identities.
 *
 * The caller supplies an existing pg Pool. The adapter does not create a
 * connection, read credentials, apply migrations, or expose an HTTP route.
 */
export function createPostgresIdentityRepository(pool) {
  if (!pool || typeof pool.query !== "function" || typeof pool.connect !== "function") {
    throw new TypeError("A PostgreSQL pool with query() and connect() is required.");
  }

  return Object.freeze({
    async insert(record) {
      assertRecord(record);
      const result = await pool.query(
        `INSERT INTO alive_personal_identities
          (identity_id, owner_id, record, created_at, updated_at)
         VALUES ($1, $2, $3::jsonb, COALESCE($4::timestamptz, now()), COALESCE($5::timestamptz, now()))
         RETURNING record`,
        [
          record.identityId,
          record.ownerId,
          JSON.stringify(record),
          record.createdAt,
          record.updatedAt
        ]
      );
      if (!result.rows?.[0]) {
        throw identityError("The identity could not be stored.", "ALIVE_IDENTITY_PERSIST_FAILED");
      }
      return assertRecord(parseRecord(result.rows[0].record));
    },

    async getById(identityId) {
      const id = typeof identityId === "string" ? identityId.trim() : "";
      if (!id) return null;
      const result = await pool.query(
        "SELECT record FROM alive_personal_identities WHERE identity_id = $1 LIMIT 1",
        [id]
      );
      return result.rows?.[0] ? assertRecord(parseRecord(result.rows[0].record)) : null;
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
          `SELECT record, owner_id, version
             FROM alive_personal_identities
            WHERE identity_id = $1
            FOR UPDATE`,
          [id]
        );
        if (!selected.rows?.[0]) {
          throw identityError("The requested identity was not found.", "ALIVE_IDENTITY_NOT_FOUND");
        }

        const row = selected.rows[0];
        const current = assertRecord(parseRecord(row.record));
        const next = assertRecord(await mutate(current));
        if (next.identityId !== current.identityId || next.ownerId !== current.ownerId || row.owner_id !== current.ownerId) {
          throw identityError("Identity ID and personal owner ID are immutable.", "ALIVE_IDENTITY_IMMUTABLE_OWNER");
        }

        const saved = await client.query(
          `UPDATE alive_personal_identities
              SET record = $2::jsonb, updated_at = now(), version = version + 1
            WHERE identity_id = $1 AND owner_id = $3
            RETURNING record`,
          [id, JSON.stringify(next), current.ownerId]
        );
        if (!saved.rows?.[0]) {
          throw identityError("The identity update could not be committed.", "ALIVE_IDENTITY_PERSIST_FAILED");
        }

        await client.query("COMMIT");
        transactionOpen = false;
        return assertRecord(parseRecord(saved.rows[0].record));
      } catch (error) {
        if (transactionOpen) {
          await client.query("ROLLBACK").catch(() => {});
        }
        throw error;
      } finally {
        client.release();
      }
    }
  });
}
