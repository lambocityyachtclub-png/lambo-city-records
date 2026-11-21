function originFrom(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  const candidate = /^https?:\\/\\//i.test(value.trim()) ? value.trim() : "https://" + value.trim();
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") return "";
    return parsed.origin;
  } catch {
    return "";
  }
}

export function getPlayerAuthOriginConfig(env = process.env) {
  const configured = originFrom(env.BETTER_AUTH_URL);
  const branch = originFrom(env.VERCEL_BRANCH_URL);
  const deployment = originFrom(env.VERCEL_URL);
  const canonical = "https://lambocityrecords.com";
  const www = "https://www.lambocityrecords.com";
  const production = env.VERCEL_ENV === "production";
  const baseURL = production
    ? (configured || canonical)
    : (branch || configured || deployment || canonical);
  const trustedOrigins = production
    ? [...new Set([baseURL, configured, canonical, www].filter(Boolean))]
    : [...new Set([baseURL, configured, branch, deployment].filter(Boolean))];
  const rpID = new URL(baseURL).hostname;
  const passkeyOrigins = trustedOrigins.filter(origin => {
    const hostname = new URL(origin).hostname;
    return hostname === rpID || hostname.endsWith("." + rpID);
  });
  return Object.freeze({
    baseURL,
    rpID,
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
