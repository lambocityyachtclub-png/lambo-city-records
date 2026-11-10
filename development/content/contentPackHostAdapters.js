/**
 * LAMBO CITY ALIVE — explicit host adapters for existing content stores.
 *
 * These adapters do not open storage or build world geometry themselves.
 * The host injects the existing Studio store and World System recipe services.
 */

function requireFunction(value, name) {
  if (typeof value !== "function") throw new Error("Content host adapter requires " + name + ".");
}

function requireLocator(value, prefix, label) {
  if (typeof value !== "string" || !value.startsWith(prefix) || value.length <= prefix.length) {
    throw new Error(label + " locator must use " + prefix + "<id>.");
  }
  return value.slice(prefix.length);
}

export function createContentPackHostLoader(options = {}) {
  const studioStore = options.studioAudioAssetStore || null;
  const resolveWorldRecipe = options.resolveWorldRecipe || null;
  const validateDistrict = options.validateDistrict || null;
  const resolveUrlAsset = options.resolveUrlAsset || null;
  const allowedUrlOrigins = new Set(options.allowedUrlOrigins || []);
  const verifyUrlIntegrity = options.verifyUrlIntegrity || null;
  const resolveHostAsset = options.resolveHostAsset || null;

  if (studioStore) requireFunction(studioStore.get, "studioAudioAssetStore.get");
  if (resolveWorldRecipe) requireFunction(resolveWorldRecipe, "resolveWorldRecipe");
  if (validateDistrict) requireFunction(validateDistrict, "validateDistrict");
  if (resolveUrlAsset) requireFunction(resolveUrlAsset, "resolveUrlAsset");
  if (verifyUrlIntegrity) requireFunction(verifyUrlIntegrity, "verifyUrlIntegrity");
  if (resolveUrlAsset && allowedUrlOrigins.size === 0) {
    throw new Error("Trusted URL asset resolver requires an explicit allowedUrlOrigins list.");
  }
  if (resolveUrlAsset && !verifyUrlIntegrity) {
    throw new Error("Trusted URL asset resolver requires a SHA-256 integrity verifier.");
  }
  if (resolveHostAsset) requireFunction(resolveHostAsset, "resolveHostAsset");

  return async function loadContentAsset(request) {
    const source = request?.source;
    const asset = request?.asset;
    if (!source || !asset) throw new Error("Content host loader requires a catalog asset request.");

    if (source.kind === "studio-audio-store") {
      if (!studioStore) throw new Error("Studio audio asset store adapter is not configured.");
      const assetId = requireLocator(source.locator, "asset:", "Studio audio");
      const record = await studioStore.get(assetId);
      if (!record || record.id !== assetId || !record.blob || record.blob.size <= 0) {
        throw new Error("Studio audio asset was not found or contains no audio data: " + assetId);
      }
      return record;
    }

    if (source.kind === "world-recipe") {
      if (!resolveWorldRecipe || !validateDistrict) {
        throw new Error("World recipe resolver and district validator must both be configured.");
      }
      const recipeId = requireLocator(source.locator, "recipe:", "World recipe");
      const recipe = await resolveWorldRecipe(recipeId);
      if (!recipe) throw new Error("World recipe was not found: " + recipeId);
      const validation = await validateDistrict(recipe);
      if (!validation || validation.valid !== true) {
        throw new Error("World recipe failed district validation: " + recipeId);
      }
      return recipe;
    }

    if (source.kind === "url") {
      if (!resolveUrlAsset) throw new Error("Trusted URL asset resolver is not configured.");
      let parsed;
      try { parsed = new URL(source.locator); } catch { throw new Error("Remote content URL is invalid."); }
      if (parsed.protocol !== "https:" || !allowedUrlOrigins.has(parsed.origin)) {
        throw new Error("Remote content URL origin is not allowlisted for HTTPS.");
      }
      if (!asset.integrity || asset.integrity.algorithm !== "sha256") {
        throw new Error("Remote content asset is missing required SHA-256 integrity metadata.");
      }
      const value = await resolveUrlAsset({ ...request, url: parsed.href });
      const verified = await verifyUrlIntegrity({ value, integrity: asset.integrity, request });
      if (verified !== true) throw new Error("Remote content asset failed SHA-256 integrity verification.");
      return value;
    }

    if (source.kind === "host") {
      if (!resolveHostAsset) throw new Error("Host asset resolver is not configured.");
      return resolveHostAsset(request);
    }

    throw new Error("Unsupported content source kind: " + source.kind);
  };
}
