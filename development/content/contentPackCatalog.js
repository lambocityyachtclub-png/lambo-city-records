/**
 * LAMBO CITY ALIVE — shared, runtime-independent content pack catalog.
 *
 * Metadata and dependency resolution only: no eager downloads, Three.js,
 * IndexedDB access, filesystem access, or production side effects.
 * Actual storage/loading is supplied by a trusted host adapter on demand.
 */

const CATEGORIES = new Set([
  "audio", "instrument", "effect", "preset", "building", "environment",
  "vehicle", "yacht", "water", "material", "animation", "npc", "venue",
  "recipe", "other"
]);
const LOAD_STRATEGIES = new Set(["on-demand", "proximity", "startup"]);
const SOURCE_KINDS = new Set(["url", "studio-audio-store", "world-recipe", "host"]);
const ID_PATTERN = /^[a-z0-9][a-z0-9._:-]{1,127}$/i;

function fail(message) {
  throw new Error("Content catalog: " + message);
}

function requireText(value, label) {
  if (typeof value !== "string" || !value.trim()) fail(label + " is required.");
  return value.trim();
}

function parseVersion(value, label = "version") {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/.exec(String(value || ""));
  if (!match) fail(label + " must use semantic version format (for example 1.2.3).");
  return match.slice(1, 4).map(Number);
}

function compareVersions(left, right) {
  const a = parseVersion(left);
  const b = parseVersion(right);
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return 0;
}

function versionSatisfies(version, range = "*") {
  if (range === "*" || range === undefined || range === null) return true;
  const value = String(range).trim();
  if (!value) fail("version range cannot be empty.");
  if (value.startsWith("^")) {
    const base = value.slice(1);
    const parts = parseVersion(base, "dependency version");
    const upper = parts[0] > 0 ? (parts[0] + 1) + ".0.0"
      : parts[1] > 0 ? "0." + (parts[1] + 1) + ".0"
      : "0.0." + (parts[2] + 1);
    return compareVersions(version, base) >= 0 && compareVersions(version, upper) < 0;
  }
  if (value.startsWith("~")) {
    const base = value.slice(1);
    const parts = parseVersion(base, "dependency version");
    return compareVersions(version, base) >= 0 &&
      compareVersions(version, parts[0] + "." + (parts[1] + 1) + ".0") < 0;
  }
  const clauses = value.split(/\s+/).filter(Boolean);
  return clauses.every(clause => {
    const match = /^(>=|<=|>|<|=)?(.+)$/.exec(clause);
    if (!match) return false;
    const comparison = compareVersions(version, match[2]);
    switch (match[1] || "=") {
      case ">=": return comparison >= 0;
      case "<=": return comparison <= 0;
      case ">": return comparison > 0;
      case "<": return comparison < 0;
      default: return comparison === 0;
    }
  });
}

function validateCompatibility(compatibility = {}) {
  if (!compatibility || typeof compatibility !== "object" || Array.isArray(compatibility)) {
    fail("compatibility must be an object.");
  }
  const result = {};
  if (compatibility.minAppVersion !== undefined) {
    parseVersion(compatibility.minAppVersion, "minAppVersion");
    result.minAppVersion = compatibility.minAppVersion;
  }
  if (compatibility.maxAppVersion !== undefined) {
    parseVersion(compatibility.maxAppVersion, "maxAppVersion");
    result.maxAppVersion = compatibility.maxAppVersion;
  }
  if (result.minAppVersion && result.maxAppVersion &&
      compareVersions(result.minAppVersion, result.maxAppVersion) > 0) {
    fail("minAppVersion cannot exceed maxAppVersion.");
  }
  return Object.freeze(result);
}

function validateAsset(asset, packId, maxAssetBytes) {
  if (!asset || typeof asset !== "object" || Array.isArray(asset)) fail("each asset must be an object.");
  const id = requireText(asset.id, "asset id");
  if (!ID_PATTERN.test(id)) fail("asset id has unsupported characters: " + id);
  const category = requireText(asset.category, "asset category");
  if (!CATEGORIES.has(category)) fail("unsupported asset category: " + category);
  const sizeBytes = asset.sizeBytes;
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes < 0) fail("asset " + id + " needs a non-negative integer sizeBytes.");
  if (maxAssetBytes !== undefined && sizeBytes > maxAssetBytes) {
    fail("asset " + id + " exceeds its pack maxAssetBytes budget.");
  }
  const strategy = asset.loadStrategy || "on-demand";
  if (!LOAD_STRATEGIES.has(strategy)) fail("asset " + id + " has an unsupported loadStrategy.");
  const source = asset.source;
  if (!source || typeof source !== "object" || Array.isArray(source)) fail("asset " + id + " needs source metadata.");
  const kind = requireText(source.kind, "asset source kind");
  if (!SOURCE_KINDS.has(kind)) fail("asset " + id + " has an unsupported source kind.");
  const locator = requireText(source.locator, "asset source locator");
  const license = requireText(source.license, "asset source license");
  let integrity = null;
  if (asset.integrity !== undefined && asset.integrity !== null) {
    if (asset.integrity.algorithm !== "sha256" ||
        typeof asset.integrity.digest !== "string" || !/^[a-f0-9]{64}$/i.test(asset.integrity.digest)) {
      fail("asset " + id + " integrity must contain a SHA-256 hex digest.");
    }
    integrity = Object.freeze({ algorithm: "sha256", digest: asset.integrity.digest.toLowerCase() });
  }
  if (kind === "url" && !integrity) fail("remote URL asset " + id + " must declare SHA-256 integrity.");
  let fallback = null;
  if (asset.fallback !== undefined && asset.fallback !== null) {
    if (!asset.fallback || typeof asset.fallback !== "object") fail("asset " + id + " fallback must identify another asset.");
    fallback = Object.freeze({
      packId: requireText(asset.fallback.packId, "fallback packId"),
      assetId: requireText(asset.fallback.assetId, "fallback assetId")
    });
  }
  return Object.freeze({
    id, packId, category, sizeBytes, loadStrategy: strategy,
    cacheKey: requireText(asset.cacheKey || (packId + ":" + id), "asset cacheKey"),
    source: Object.freeze({ kind, locator, license, attribution: asset.source.attribution || null }),
    integrity,
    fallback
  });
}

export function validateContentPackManifest(manifest) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    fail("manifest must be an object.");
  }
  const id = requireText(manifest.id, "pack id");
  if (!ID_PATTERN.test(id)) fail("pack id has unsupported characters.");
  const version = requireText(manifest.version, "pack version");
  parseVersion(version, "pack version");
  const category = requireText(manifest.category, "pack category");
  if (!CATEGORIES.has(category)) fail("unsupported pack category: " + category);
  const loadStrategy = manifest.loadStrategy || "on-demand";
  if (!LOAD_STRATEGIES.has(loadStrategy)) fail("unsupported pack loadStrategy.");
  const compatibility = validateCompatibility(manifest.compatibility || {});
  const dependencies = (manifest.dependencies || []).map(item => {
    if (!item || typeof item !== "object") fail("pack dependencies must declare id and versionRange.");
    return Object.freeze({
      id: requireText(item.id, "dependency pack id"),
      versionRange: item.versionRange || "*"
    });
  });
  if (new Set(dependencies.map(item => item.id)).size !== dependencies.length) {
    fail("pack dependencies cannot contain duplicate ids.");
  }
  const assetsInput = manifest.assets;
  if (!Array.isArray(assetsInput) || assetsInput.length === 0) fail("pack must contain at least one asset.");
  const performanceBudget = manifest.performanceBudget || {};
  const maxAssetBytes = performanceBudget.maxAssetBytes;
  const maxTotalBytes = performanceBudget.maxTotalBytes;
  if (maxAssetBytes !== undefined && (!Number.isSafeInteger(maxAssetBytes) || maxAssetBytes < 0)) {
    fail("performanceBudget.maxAssetBytes must be a non-negative integer.");
  }
  if (maxTotalBytes !== undefined && (!Number.isSafeInteger(maxTotalBytes) || maxTotalBytes < 0)) {
    fail("performanceBudget.maxTotalBytes must be a non-negative integer.");
  }
  const assets = assetsInput.map(asset => validateAsset(asset, id, maxAssetBytes));
  if (new Set(assets.map(asset => asset.id)).size !== assets.length) fail("asset ids must be unique within a pack.");
  const totalBytes = assets.reduce((sum, asset) => sum + asset.sizeBytes, 0);
  if (maxTotalBytes !== undefined && totalBytes > maxTotalBytes) fail("pack exceeds performanceBudget.maxTotalBytes.");
  return Object.freeze({
    id, version, category, loadStrategy, compatibility, dependencies: Object.freeze(dependencies),
    performanceBudget: Object.freeze({ maxAssetBytes, maxTotalBytes }),
    assets: Object.freeze(assets),
    source: Object.freeze({
      publisher: manifest.source?.publisher || null,
      license: requireText(manifest.source?.license, "pack source license"),
      attribution: manifest.source?.attribution || null
    })
  });
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

function measureJsonByteSize(value, maxBytes) {
  const encoder = new TextEncoder();
  const seen = new Set();

  function measure(item, depth = 0) {
    if (depth > 64) throw new Error("JSON asset nesting exceeds the size-measurement limit.");
    if (item === null) return 4;
    if (typeof item === "string") {
      if (item.length > maxBytes) return maxBytes + 1;
      return encoder.encode(JSON.stringify(item)).byteLength;
    }
    if (typeof item === "boolean") return item ? 4 : 5;
    if (typeof item === "number") return encoder.encode(JSON.stringify(item)).byteLength;
    if (typeof item === "bigint") throw new Error("BigInt values are not valid JSON content assets.");
    if (typeof item === "undefined" || typeof item === "function" || typeof item === "symbol") return 0;

    if (Array.isArray(item)) {
      if (seen.has(item)) throw new Error("Circular JSON content assets cannot be size-validated.");
      seen.add(item);
      let total = 2;
      for (let index = 0; index < item.length; index += 1) {
        if (index > 0) total += 1;
        const entry = item[index];
        const entrySize = entry === undefined || typeof entry === "function" || typeof entry === "symbol"
          ? 4
          : measure(entry, depth + 1);
        if (entrySize === null) { seen.delete(item); return null; }
        total += entrySize;
        if (total > maxBytes) return maxBytes + 1;
      }
      seen.delete(item);
      return total;
    }

    if (item && typeof item === "object" &&
        (Object.getPrototypeOf(item) === Object.prototype || Object.getPrototypeOf(item) === null)) {
      if (typeof item.toJSON === "function") {
        throw new Error("Custom toJSON assets must provide an explicit measured sizeBytes value.");
      }
      if (seen.has(item)) throw new Error("Circular JSON content assets cannot be size-validated.");
      seen.add(item);
      let total = 2;
      let first = true;
      for (const key of Object.keys(item)) {
        const entry = item[key];
        if (entry === undefined || typeof entry === "function" || typeof entry === "symbol") continue;
        if (!first) total += 1;
        first = false;
        if (key.length > maxBytes) return maxBytes + 1;
        const entrySize = measure(entry, depth + 1);
        if (entrySize === null) { seen.delete(item); return null; }
        total += encoder.encode(JSON.stringify(key)).byteLength + 1 + entrySize;
        if (total > maxBytes) return maxBytes + 1;
      }
      seen.delete(item);
      return total;
    }

    return null;
  }

  return measure(value);
}

const MAX_JSON_SIZE_MEASUREMENT_BYTES = 16 * 1024 * 1024;

function getLoadedByteSize(value, maxBytes, seen = new Set()) {
  const trackObject = value !== null && typeof value === "object";
  if (trackObject) {
    if (seen.has(value)) {
      throw new Error("Cyclic content wrappers cannot be size-validated.");
    }
    seen.add(value);
  }

  try {
    if (typeof value === "boolean" || typeof value === "number") {
      return new TextEncoder().encode(JSON.stringify(value)).byteLength;
    }
    if (typeof value === "function" || typeof value === "symbol" || typeof value === "bigint") {
      throw new Error("Non-serializable content assets must expose a supported byte representation or measured sizeBytes.");
    }
    if (typeof value === "string") {
      if (value.length > maxBytes) return maxBytes + 1;
      return new TextEncoder().encode(value).byteLength;
    }
    if (value instanceof ArrayBuffer) return value.byteLength;
    if (ArrayBuffer.isView(value)) return value.byteLength;
    if (value && typeof Blob === "function") {
      const sizeGetter = Object.getOwnPropertyDescriptor(Blob.prototype, "size")?.get;
      if (typeof sizeGetter === "function") {
        try {
          const nativeBlobSize = sizeGetter.call(value);
          if (Number.isSafeInteger(nativeBlobSize) && nativeBlobSize >= 0) return nativeBlobSize;
        } catch {}
      }
    }
    if (value && typeof value.arrayBuffer === "function") {
      if (Number.isSafeInteger(value.sizeBytes) && value.sizeBytes >= 0) return value.sizeBytes;
      throw new Error("Custom file-like host assets must expose an explicit measured sizeBytes value.");
    }
    if (value && value.blob) {
      const blobSize = getLoadedByteSize(value.blob, maxBytes, seen);
      if (blobSize !== null) return blobSize;
    }
    if (value && value.bytes) {
      const byteSize = getLoadedByteSize(value.bytes, maxBytes, seen);
      if (byteSize !== null) return byteSize;
    }
    if (value && typeof value === "object" &&
        (Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)) {
      const measurementLimit = Math.min(maxBytes, MAX_JSON_SIZE_MEASUREMENT_BYTES);
      const measured = measureJsonByteSize(value, measurementLimit);
      if (measured !== null && measured > measurementLimit && measurementLimit < maxBytes) {
        throw new Error("JSON content assets exceed the 16 MiB measurement cap; use byte-backed content or a trusted host object with measured sizeBytes.");
      }
      if (measured !== null) return measured;
      throw new Error("JSON content assets contain an unsupported value and cannot be size-validated.");
    }
    if (value && Number.isSafeInteger(value.sizeBytes) && value.sizeBytes >= 0) return value.sizeBytes;
    if (value && typeof value === "object") {
      throw new Error("Non-JSON host assets must expose an explicit measured sizeBytes value.");
    }
    return null;
  } finally {
    if (trackObject) seen.delete(value);
  }
}

export function createContentPackCatalog(options = {}) {
  const appVersion = options.appVersion || null;
  if (appVersion) parseVersion(appVersion, "catalog appVersion");
  const packs = new Map();
  const cacheKeyOwners = new Map();
  const cache = new Map();
  const inFlight = new Map();
  const loader = options.loader;
  if (loader !== undefined && typeof loader !== "function") fail("loader must be a function.");

  function register(manifest) {
    const pack = validateContentPackManifest(manifest);
    if (packs.has(pack.id)) fail("pack already registered: " + pack.id);
    if (appVersion && pack.compatibility.minAppVersion &&
        compareVersions(appVersion, pack.compatibility.minAppVersion) < 0) {
      fail("pack " + pack.id + " requires app version " + pack.compatibility.minAppVersion + " or newer.");
    }
    if (appVersion && pack.compatibility.maxAppVersion &&
        compareVersions(appVersion, pack.compatibility.maxAppVersion) > 0) {
      fail("pack " + pack.id + " supports app version " + pack.compatibility.maxAppVersion + " or older.");
    }
    const pendingCacheKeys = new Set();
    for (const asset of pack.assets) {
      if (pendingCacheKeys.has(asset.cacheKey)) {
        fail("duplicate cacheKey " + asset.cacheKey + " within pack " + pack.id + ".");
      }
      const owner = cacheKeyOwners.get(asset.cacheKey);
      if (owner) {
        fail("cacheKey " + asset.cacheKey + " is already assigned to " + owner + ".");
      }
      pendingCacheKeys.add(asset.cacheKey);
    }
    for (const asset of pack.assets) {
      cacheKeyOwners.set(asset.cacheKey, pack.id + "/" + asset.id);
    }
    packs.set(pack.id, pack);
    return getPack(pack.id);
  }

  function getPack(packId) {
    const pack = packs.get(packId);
    if (!pack) return null;
    return {
      id: pack.id, version: pack.version, category: pack.category,
      dependencies: pack.dependencies.map(item => ({ ...item })),
      assetCount: pack.assets.length,
      totalBytes: pack.assets.reduce((sum, asset) => sum + asset.sizeBytes, 0)
    };
  }

  function resolvePackOrder(packId) {
    if (!packs.has(packId)) fail("unknown pack: " + packId);
    const ordered = [];
    const visiting = new Set();
    const visited = new Set();
    function visit(id, trail) {
      const pack = packs.get(id);
      if (!pack) fail("missing pack dependency: " + id);
      if (visiting.has(id)) fail("pack dependency cycle: " + [...trail, id].join(" -> "));
      if (visited.has(id)) return;
      visiting.add(id);
      for (const dependency of pack.dependencies) {
        const required = packs.get(dependency.id);
        if (!required) fail("pack " + id + " requires missing dependency " + dependency.id + ".");
        if (!versionSatisfies(required.version, dependency.versionRange)) {
          fail("pack " + id + " requires " + dependency.id + " " + dependency.versionRange +
            " but " + required.version + " is registered.");
        }
        visit(dependency.id, [...trail, id]);
      }
      visiting.delete(id);
      visited.add(id);
      ordered.push(id);
    }
    visit(packId, []);
    return ordered;
  }

  function findAsset(packId, assetId) {
    const pack = packs.get(packId);
    if (!pack) fail("unknown pack: " + packId);
    const asset = pack.assets.find(item => item.id === assetId);
    if (!asset) fail("unknown asset " + assetId + " in pack " + packId + ".");
    return { pack, asset };
  }

  async function loadAsset(packId, assetId, loadOptions = {}) {
    if (loadOptions.signal?.aborted) throw new Error("Content asset load was aborted.");
    if (typeof loader !== "function") fail("no host loader was supplied; metadata can still be browsed.");
    const { pack, asset } = findAsset(packId, assetId);
    resolvePackOrder(packId);
    const cacheKey = asset.cacheKey;
    if (!loadOptions.forceReload && cache.has(cacheKey)) return cache.get(cacheKey);
    if (!loadOptions.forceReload && inFlight.has(cacheKey)) return inFlight.get(cacheKey);

    const task = (async () => {
      try {
        const value = await loader(Object.freeze({
          pack: getPack(pack.id),
          asset,
          source: asset.source,
          dependencyOrder: resolvePackOrder(packId),
          signal: loadOptions.signal || null
        }));
        if (loadOptions.signal?.aborted) throw new Error("Content asset load was aborted.");
        if (value === undefined || value === null) throw new Error("Host loader returned no asset value.");
        const loadedByteSize = getLoadedByteSize(value, asset.sizeBytes);
        if (loadedByteSize !== null && loadedByteSize > asset.sizeBytes) {
          throw new Error("Asset " + pack.id + "/" + asset.id + " loaded " + loadedByteSize +
            " bytes, exceeding its declared sizeBytes budget of " + asset.sizeBytes + ".");
        }
        if (loadOptions.signal?.aborted) throw new Error("Content asset load was aborted.");
        cache.set(cacheKey, value);
        return value;
      } catch (error) {
        if (loadOptions.signal?.aborted) throw new Error("Content asset load was aborted.");
        if (!asset.fallback || loadOptions.disableFallback === true) throw error;
        return loadAsset(asset.fallback.packId, asset.fallback.assetId, {
          ...loadOptions, forceReload: false, disableFallback: true
        });
      } finally {
        inFlight.delete(cacheKey);
      }
    })();
    inFlight.set(cacheKey, task);
    return task;
  }

  function clearCache(cacheKey) {
    if (cacheKey === undefined) cache.clear();
    else cache.delete(cacheKey);
  }

  return Object.freeze({
    register,
    getPack,
    listPacks: () => [...packs.keys()].map(getPack),
    resolvePackOrder,
    getAsset: (packId, assetId) => findAsset(packId, assetId).asset,
    loadAsset,
    clearCache,
    getSnapshot: () => ({
      packCount: packs.size,
      cachedAssetCount: cache.size,
      loadingAssetCount: inFlight.size,
      packIds: [...packs.keys()]
    })
  });
}
