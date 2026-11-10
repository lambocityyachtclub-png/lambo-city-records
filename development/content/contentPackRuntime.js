/**
 * LAMBO CITY ALIVE — explicit composition root for content-pack services.
 *
 * The caller owns all concrete storage/network/crypto services. Constructing
 * this runtime performs no downloads, database opens, or scene initialization.
 */

import { createContentPackCatalog } from "./contentPackCatalog.js";
import { createContentPackHostLoader } from "./contentPackHostAdapters.js";
import { createVerifiedRemoteContentLoader } from "./verifiedRemoteContentLoader.js";
import { createIndexedDbContentCache } from "./indexedDbContentCache.js";

export function createContentPackRuntime(options = {}) {
  const sha256 = options.sha256 || null;
  const resolveRemote = options.resolveRemote || null;
  if (options.remoteCache && options.indexedDBCache) {
    throw new Error("Choose either remoteCache or indexedDBCache, not both.");
  }
  const ownsRemoteCache = !options.remoteCache && Boolean(options.indexedDBCache);
  const remoteCache = options.remoteCache || (options.indexedDBCache
    ? createIndexedDbContentCache(options.indexedDBCache)
    : null);
  let remoteLoader = null;
  let disposed = false;

  if (resolveRemote || sha256 || remoteCache || options.allowedUrlOrigins) {
    if (typeof resolveRemote !== "function" || typeof sha256 !== "function") {
      throw new Error("Content runtime remote delivery requires both resolveRemote and sha256 host services.");
    }
    remoteLoader = createVerifiedRemoteContentLoader({
      allowedOrigins: options.allowedUrlOrigins || [],
      resolve: resolveRemote,
      sha256,
      cache: remoteCache,
      maxAssetBytes: options.maxRemoteAssetBytes
    });
  }

  const hostLoader = createContentPackHostLoader({
    studioAudioAssetStore: options.studioAudioAssetStore || null,
    resolveWorldRecipe: options.resolveWorldRecipe || null,
    validateDistrict: options.validateDistrict || null,
    allowedUrlOrigins: options.allowedUrlOrigins || [],
    resolveUrlAsset: remoteLoader,
    verifyUrlIntegrity: remoteLoader
      ? async ({ integrity, value }) => {
          if (!(value instanceof Uint8Array)) return false;
          const actual = await sha256(value);
          return typeof actual === "string" && actual.toLowerCase() === integrity.digest.toLowerCase();
        }
      : null,
    resolveHostAsset: options.resolveHostAsset || null
  });

  const catalog = createContentPackCatalog({
    appVersion: options.appVersion || null,
    loader: hostLoader
  });

  async function dispose() {
    if (disposed) return;
    disposed = true;
    catalog.clearCache();
    if (ownsRemoteCache && typeof remoteCache?.close === "function") {
      await remoteCache.close();
    }
  }

  function assertActive() {
    if (disposed) throw new Error("Content pack runtime has been disposed.");
  }

  return Object.freeze({
    catalog,
    register: (...args) => { assertActive(); return catalog.register(...args); },
    loadAsset: (...args) => { assertActive(); return catalog.loadAsset(...args); },
    getPack: catalog.getPack,
    listPacks: catalog.listPacks,
    resolvePackOrder: catalog.resolvePackOrder,
    clearCache: () => { assertActive(); return catalog.clearCache(); },
    dispose,
    close: dispose,
    getSnapshot: catalog.getSnapshot,
    getServiceStatus: () => Object.freeze({
      studioAudioStore: Boolean(options.studioAudioAssetStore),
      worldRecipeResolver: Boolean(options.resolveWorldRecipe && options.validateDistrict),
      remoteDelivery: Boolean(remoteLoader),
      persistentRemoteCache: Boolean(remoteCache),
      genericHostResolver: Boolean(options.resolveHostAsset)
    })
  });
}
