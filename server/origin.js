function normalizeOrigin(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  const raw = value.trim();
  const lower = raw.toLowerCase();
  const candidate = lower.startsWith("https://") || lower.startsWith("http://") ? raw : "https://" + raw;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") return "";
    return parsed.origin;
  } catch { return ""; }
}

export function getPlayerAuthOriginConfig(env = process.env) {
  const configured = normalizeOrigin(env.BETTER_AUTH_URL);
  const branch = normalizeOrigin(env.VERCEL_BRANCH_URL);
  const deployment = normalizeOrigin(env.VERCEL_URL);
  const production = env.VERCEL_ENV === "production";
  const canonical = "https://lambocityrecords.com";
  const www = "https://www.lambocityrecords.com";
  const baseURL = production ? (configured || canonical) : (branch || configured || deployment || "http://localhost:3000");
  const trustedOrigins = production
    ? [...new Set([baseURL, configured, canonical, www].filter(Boolean))]
    : [...new Set([baseURL, branch, deployment].filter(Boolean))];
  const passkeyOrigins = production
    ? [...new Set([baseURL, configured, canonical, www].filter(Boolean))]
    : [baseURL];
  return Object.freeze({
    baseURL,
    rpID: new URL(baseURL).hostname,
    trustedOrigins: Object.freeze(trustedOrigins),
    passkeyOrigins: Object.freeze(passkeyOrigins)
  });
}

export function isSameOriginRequest(req, env = process.env) {
  const origin = req?.headers?.origin || req?.headers?.Origin || "";
  const fetchSite = req?.headers?.["sec-fetch-site"] || req?.headers?.["Sec-Fetch-Site"];
  const { trustedOrigins } = getPlayerAuthOriginConfig(env);
  return trustedOrigins.includes(origin) && (!fetchSite || fetchSite === "same-origin");
}
