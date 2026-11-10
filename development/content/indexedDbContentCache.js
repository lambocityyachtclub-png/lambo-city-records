/**
 * LAMBO CITY ALIVE — browser IndexedDB adapter for verified remote content.
 *
 * This is a separate cache database. It never opens or modifies Studio's
 * recording database. Database access is lazy: first get/set/delete only.
 */

function makeError(message, cause) {
  const error = new Error(message);
  if (cause) error.cause = cause;
  return error;
}

function isQuotaError(error) {
  return error?.name === "QuotaExceededError" || error?.code === 22 || error?.code === 1014;
}

export function createIndexedDbContentCache(options = {}) {
  const indexedDB = options.indexedDB;
  const databaseName = options.databaseName || "lambo-city-content-cache";
  const storeName = options.storeName || "assets";
  const version = options.version ?? 1;
  const maxEntryBytes = options.maxEntryBytes ?? 64 * 1024 * 1024;
  const onError = typeof options.onError === "function" ? options.onError : null;

  if (!indexedDB || typeof indexedDB.open !== "function") {
    throw new Error("IndexedDB content cache requires an IndexedDB factory.");
  }
  if (!Number.isSafeInteger(version) || version < 1) throw new Error("IndexedDB cache version must be a positive integer.");
  if (!Number.isSafeInteger(maxEntryBytes) || maxEntryBytes < 0) {
    throw new Error("IndexedDB cache maxEntryBytes must be a non-negative safe integer.");
  }

  let databasePromise = null;
  let closed = false;

  function report(operation, error) {
    if (onError) {
      try { onError({ operation, error, quotaExceeded: isQuotaError(error) }); } catch {}
    }
  }

  function openDatabase() {
    if (closed) return Promise.reject(new Error("IndexedDB content cache is closed."));
    if (databasePromise) return databasePromise;

    databasePromise = new Promise((resolve, reject) => {
      let request;
      let settled = false;
      try { request = indexedDB.open(databaseName, version); }
      catch (error) { reject(makeError("Unable to open IndexedDB content cache.", error)); return; }

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: "key" });
        }
      };
      request.onblocked = () => {
        if (settled) return;
        settled = true;
        const error = new Error("IndexedDB content cache upgrade is blocked by another open tab.");
        report("open", error);
        reject(error);
      };
      request.onerror = () => {
        if (settled) return;
        settled = true;
        const error = request.error || new Error("IndexedDB content cache failed to open.");
        report("open", error);
        reject(error);
      };
      request.onsuccess = () => {
        const db = request.result;
        if (settled) { db.close(); return; }
        settled = true;
        db.onversionchange = () => {
          try { db.close(); } finally { databasePromise = null; }
        };
        db.onclose = () => { databasePromise = null; };
        resolve(db);
      };
    }).catch(error => {
      databasePromise = null;
      throw error;
    });

    return databasePromise;
  }

  async function run(operation, action) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      let transaction;
      let result;
      let request;
      let settled = false;
      const finishError = error => {
        if (settled) return;
        settled = true;
        report(operation, error);
        reject(error);
      };
      try {
        transaction = db.transaction(storeName, operation === "get" ? "readonly" : "readwrite");
        const store = transaction.objectStore(storeName);
        request = action(store);
        if (request) {
          request.onsuccess = () => { result = request.result; };
          request.onerror = () => finishError(request.error || new Error("IndexedDB " + operation + " request failed."));
        }
        transaction.oncomplete = () => {
          if (settled) return;
          settled = true;
          resolve(result);
        };
        transaction.onerror = () => finishError(transaction.error || request?.error || new Error("IndexedDB " + operation + " transaction failed."));
        transaction.onabort = () => finishError(transaction.error || request?.error || new Error("IndexedDB " + operation + " transaction was aborted."));
      } catch (error) {
        finishError(error);
      }
    });
  }

  return Object.freeze({
    async get(key) {
      if (typeof key !== "string" || !key) throw new Error("IndexedDB content cache key is required.");
      const record = await run("get", store => store.get(key));
      if (!record) return null;
      const value = record.bytes;
      if (!(value instanceof ArrayBuffer) && !ArrayBuffer.isView(value)) {
        await this.delete(key);
        return null;
      }
      const bytes = value instanceof ArrayBuffer
        ? new Uint8Array(value)
        : new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
      if (bytes.byteLength > maxEntryBytes) {
        await this.delete(key);
        return null;
      }
      return bytes.slice();
    },

    async set(key, value) {
      if (typeof key !== "string" || !key) throw new Error("IndexedDB content cache key is required.");
      let bytes;
      if (value instanceof Uint8Array) bytes = value;
      else if (value instanceof ArrayBuffer) bytes = new Uint8Array(value);
      else if (ArrayBuffer.isView(value)) bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
      else throw new Error("IndexedDB content cache only stores binary asset data.");
      if (bytes.byteLength > maxEntryBytes) throw new Error("Content asset exceeds IndexedDB cache entry limit.");
      const copy = bytes.slice();
      try {
        await run("set", store => store.put({
          key,
          bytes: copy.buffer,
          byteLength: copy.byteLength,
          updatedAt: Date.now()
        }));
      } catch (error) {
        if (isQuotaError(error)) {
          const quotaError = makeError("IndexedDB content cache is full; the verified asset can still be used without caching.", error);
          quotaError.name = "QuotaExceededError";
          quotaError.code = "CONTENT_CACHE_QUOTA";
          report("quota", quotaError);
          throw quotaError;
        }
        throw error;
      }
    },

    async delete(key) {
      if (typeof key !== "string" || !key) throw new Error("IndexedDB content cache key is required.");
      await run("delete", store => store.delete(key));
    },

    async close() {
      closed = true;
      if (!databasePromise) return;
      try { (await databasePromise).close(); } finally { databasePromise = null; }
    }
  });
}
