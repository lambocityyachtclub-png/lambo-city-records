/**
 * LAMBO CITY ALIVE — explicit composition root for content-pack services.
 *
 * The caller owns all concrete storage/network/crypto services. Constructing
 * this runtime performs no downloads, database opens, or scene initialization.
 */

import { createContentPackCatalog } from "./contentPackCatalog.js";
import { createContentPackHostLoader } from "./contentPackHostAdapters.js";
import { createVerifiedRemoteContentLoader } from "./verifiedRemoteContentLoader.js";

export function createContentPackRuntime(options = {}) {
  const sha256 = options.sha256 || null;
  const resolveRemote = options.resolveRemote || null;
  let remoteLoader = null;

  if (resolveRemote || sha256 || options.remoteCache || options.allowedUrlOrigins) {
    if (typeof resolveRemote !== "function" || typeof sha256 !== "function") {
      throw new Error("Content runtime remote delivery requires both resolveRemote and sha256 host services.");
    }
    remoteLoader = createVerifiedRemoteContentLoader({
      allowedOrigins: options.allowedUrlOrigins || [],
      resolve: resolveRemote,
      sha256,
      cache: options.remoteCache || null,
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

  return Object.freeze({
    catalog,
    register: catalog.register,
    loadAsset: catalog.loadAsset,
    getPack: catalog.getPack,
    listPacks: catalog.listPacks,
    resolvePackOrder: catalog.resolvePackOrder,
    clearCache: catalog.clearCache,
    getSnapshot: catalog.getSnapshot,
    getServiceStatus: () => Object.freeze({
      studioAudioStore: Boolean(options.studioAudioAssetStore),
      worldRecipeResolver: Boolean(options.resolveWorldRecipe && options.validateDistrict),
      remoteDelivery: Boolean(remoteLoader),
      persistentRemoteCache: Boolean(options.remoteCache),
      genericHostResolver: Boolean(options.resolveHostAsset)
    })
  });
}
