/**
 * LAMBO CITY ALIVE — verified remote content delivery with injected persistence.
 *
 * No fetch, crypto, IndexedDB, or filesystem dependency is assumed here.
 * A trusted host injects URL resolution, SHA-256, and persistent cache services.
 */

function requireFunction(value, name) {
  if (typeof value !== "function") throw new Error("Verified content loader requires " + name + ".");
}

function awaitWithAbort(value, signal) {
  if (!signal) return Promise.resolve(value);
  if (signal.aborted) return Promise.reject(new Error("Content asset load was aborted."));
  if (typeof signal.addEventListener !== "function" || typeof signal.removeEventListener !== "function") {
    return Promise.reject(new Error("Content asset load signal is invalid."));
  }
  let onAbort;
  const aborted = new Promise((_, reject) => {
    onAbort = () => reject(new Error("Content asset load was aborted."));
    signal.addEventListener("abort", onAbort, { once: true });
    if (signal.aborted) onAbort();
  });
  return Promise.race([Promise.resolve(value), aborted]).finally(() => {
    signal.removeEventListener("abort", onAbort);
  });
}

function toBytes(value) {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  throw new Error("Remote content resolver must return Uint8Array, ArrayBuffer, or an ArrayBuffer view.");
}

export function createVerifiedRemoteContentLoader(options = {}) {
  const allowedOrigins = new Set(options.allowedOrigins || []);
  const resolve = options.resolve;
  const sha256 = options.sha256;
  const cache = options.cache || null;
  const onCacheError = typeof options.onCacheError === "function" ? options.onCacheError : null;
  const maxAssetBytes = options.maxAssetBytes ?? 64 * 1024 * 1024;

  requireFunction(resolve, "resolve");
  requireFunction(sha256, "sha256");
  if (allowedOrigins.size === 0) throw new Error("At least one HTTPS origin must be allowlisted.");
  if (!Number.isSafeInteger(maxAssetBytes) || maxAssetBytes < 0) {
    throw new Error("maxAssetBytes must be a non-negative safe integer.");
  }
  if (cache) {
    requireFunction(cache.get, "cache.get");
    requireFunction(cache.set, "cache.set");
    requireFunction(cache.delete, "cache.delete");
  }

  function reportCacheError(operation, error) {
    if (onCacheError) {
      try { onCacheError({ operation, error, quotaExceeded: error?.name === "QuotaExceededError" || error?.code === "CONTENT_CACHE_QUOTA" }); } catch {}
    }
  }

  async function digestMatches(bytes, expected, signal) {
    const actual = await awaitWithAbort(sha256(bytes, { signal }), signal);
    if (typeof actual !== "string" || !/^[a-f0-9]{64}$/i.test(actual)) {
      throw new Error("SHA-256 provider must return a 64-character hexadecimal digest.");
    }
    return actual.toLowerCase() === expected.toLowerCase();
  }

  return async function loadVerifiedRemoteAsset(request) {
    const source = request?.source;
    const asset = request?.asset;
    const signal = request?.signal || null;
    if (signal?.aborted) throw new Error("Content asset load was aborted.");
    if (!source || source.kind !== "url" || !asset) {
      throw new Error("Verified remote loader only accepts catalog URL assets.");
    }
    let url;
    try { url = new URL(source.locator); } catch { throw new Error("Remote content URL is invalid."); }
    if (url.username || url.password) {
      throw new Error("Remote content URL must not contain embedded credentials.");
    }
    if (url.protocol !== "https:" || !allowedOrigins.has(url.origin)) {
      throw new Error("Remote content URL origin is not allowlisted for HTTPS.");
    }
    const integrity = asset.integrity;
    if (!integrity || integrity.algorithm !== "sha256" ||
        typeof integrity.digest !== "string" || !/^[a-f0-9]{64}$/i.test(integrity.digest)) {
      throw new Error("Remote content asset requires a valid SHA-256 manifest digest.");
    }
    const cacheKey = (asset.cacheKey || (request.pack?.id + ":" + asset.id)) +
      ":sha256:" + integrity.digest.toLowerCase();

    if (cache) {
      let cached = null;
      try { cached = await awaitWithAbort(cache.get(cacheKey, { signal }), signal); }
      catch (error) { if (signal?.aborted) throw new Error("Content asset load was aborted."); reportCacheError("get", error); }
      if (signal?.aborted) throw new Error("Content asset load was aborted.");
      if (cached !== undefined && cached !== null) {
        try {
          const cachedBytes = toBytes(cached);
          if (cachedBytes.byteLength <= maxAssetBytes &&
              await digestMatches(cachedBytes, integrity.digest, signal)) {
            if (signal?.aborted) throw new Error("Content asset load was aborted.");
            return cachedBytes;
          }
        } catch (error) {
          if (signal?.aborted) throw new Error("Content asset load was aborted.");
          // Corrupt or incompatible cache entries are evicted and fetched again.
        }
        try { await awaitWithAbort(cache.delete(cacheKey, { signal }), signal); }
        catch (error) { if (signal?.aborted) throw new Error("Content asset load was aborted."); reportCacheError("delete", error); }
      }
    }

    const resolved = await awaitWithAbort(resolve({ url: url.href, request, signal }), signal);
    if (signal?.aborted) throw new Error("Content asset load was aborted.");
    const bytes = toBytes(resolved);
    if (bytes.byteLength > maxAssetBytes) {
      throw new Error("Remote content exceeds the configured maximum asset size.");
    }
    if (!await digestMatches(bytes, integrity.digest, signal)) {
      throw new Error("Remote content failed SHA-256 integrity verification.");
    }
    if (signal?.aborted) throw new Error("Content asset load was aborted.");
    if (cache) {
      try { await awaitWithAbort(cache.set(cacheKey, bytes.slice(), { signal }), signal); }
      catch (error) { if (signal?.aborted) throw new Error("Content asset load was aborted."); reportCacheError("set", error); }
    }
    return bytes;
  };
}
