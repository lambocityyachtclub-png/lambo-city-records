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
  const activeLoadControllers = new Set();

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

  function assertActive() {
    if (disposed) throw new Error("Content pack runtime has been disposed.");
  }

  async function loadAsset(packId, assetId, loadOptions = {}) {
    assertActive();
    if (typeof AbortController !== "function") {
      throw new Error("Content runtime requires AbortController support for safe asset disposal.");
    }
    const optionsForLoad = loadOptions && typeof loadOptions === "object" ? loadOptions : {};
    const controller = new AbortController();
    const externalSignal = optionsForLoad.signal || null;
    const abortFromExternal = () => controller.abort(externalSignal?.reason);
    if (externalSignal?.aborted) controller.abort(externalSignal.reason);
    else externalSignal?.addEventListener?.("abort", abortFromExternal, { once: true });
    activeLoadControllers.add(controller);

    try {
      const value = await catalog.loadAsset(packId, assetId, {
        ...optionsForLoad,
        signal: controller.signal
      });
      if (disposed) {
        catalog.clearCache();
        throw new Error("Content pack runtime was disposed while an asset was loading.");
      }
      if (controller.signal.aborted) throw new Error("Content asset load was aborted.");
      return value;
    } catch (error) {
      if (disposed) {
        catalog.clearCache();
        throw new Error("Content pack runtime was disposed while an asset was loading.");
      }
      if (controller.signal.aborted) throw new Error("Content asset load was aborted.");
      throw error;
    } finally {
      activeLoadControllers.delete(controller);
      externalSignal?.removeEventListener?.("abort", abortFromExternal);
    }
  }

  async function dispose() {
    if (disposed) return;
    disposed = true;
    for (const controller of activeLoadControllers) controller.abort("Content pack runtime disposed.");
    activeLoadControllers.clear();
    catalog.abortAllLoads("Content pack runtime disposed.");
    catalog.clearCache();
    if (ownsRemoteCache && typeof remoteCache?.close === "function") {
      await remoteCache.close();
    }
  }

  const catalogView = Object.freeze({
    register: (...args) => { assertActive(); return catalog.register(...args); },
    getPack: catalog.getPack,
    listPacks: catalog.listPacks,
    resolvePackOrder: catalog.resolvePackOrder,
    getAsset: catalog.getAsset,
    loadAsset,
    clearCache: () => { assertActive(); return catalog.clearCache(); },
    getSnapshot: catalog.getSnapshot
  });

  return Object.freeze({
    catalog: catalogView,
    register: (...args) => { assertActive(); return catalog.register(...args); },
    loadAsset,
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
