function originFrom(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  const candidate = /^https?:\/\//i.test(value.trim()) ? value.trim() : "https://" + value.trim();
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") return "";
    return parsed.origin;
  } catch {
    return "";
  }
}

export function getAliveOwnerOriginConfig(env = process.env) {
  const configured = originFrom(env.ALIVE_OWNER_AUTH_URL);
  const branch = originFrom(env.VERCEL_BRANCH_URL);
  const deployment = originFrom(env.VERCEL_URL);
  const canonical = "https://lambocityrecords.com";
  const www = "https://www.lambocityrecords.com";
  const production = env.VERCEL_ENV === "production";
  const baseURL = production
    ? (configured || canonical || deployment)
    : (branch || configured || deployment || canonical);
  const trustedOrigins = production
    ? [...new Set([baseURL, configured, canonical, www].filter(Boolean))]
    : [...new Set([baseURL, branch, deployment].filter(Boolean))];
  return Object.freeze({ baseURL, trustedOrigins: Object.freeze(trustedOrigins) });
}

export function isSameOriginRequest(req, env = process.env) {
  const origin = req?.headers?.origin || req?.headers?.Origin || "";
  const fetchSite = req?.headers?.["sec-fetch-site"] || req?.headers?.["Sec-Fetch-Site"];
  const { trustedOrigins } = getAliveOwnerOriginConfig(env);
  return trustedOrigins.includes(origin) && (!fetchSite || fetchSite === "same-origin");
}
