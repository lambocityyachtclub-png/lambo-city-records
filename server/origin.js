function normalizeOrigin(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  const candidate = /^https?:\/\//i.test(value.trim()) ? value.trim() : "https://" + value.trim();
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") return "";
    return parsed.origin;
  } catch { return ""; }
}

/** Prefer Vercel stable branch aliases on Preview for Better Auth and WebAuthn. */
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
  // WebAuthn RP IDs must be valid suffixes of each browser origin. The
  // one-off deployment hostname is trusted for normal auth requests, but is
  // not a valid origin for a passkey bound to the stable branch alias.
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
