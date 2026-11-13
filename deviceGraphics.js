// deviceGraphics.js
// LAMBO CITY — conservative device-aware renderer quality profiles.
// Profiles affect renderer cost only; gameplay, world geometry, controls, and Studio are untouched.

export const QUALITY_LEVELS = Object.freeze(["low", "balanced", "high", "ultra"]);

export const PROFILES = Object.freeze({
  low: Object.freeze({ maxPixelRatio: 1.0, antialias: false, label: "Performance" }),
  balanced: Object.freeze({ maxPixelRatio: 1.25, antialias: false, label: "Balanced" }),
  high: Object.freeze({ maxPixelRatio: 1.5, antialias: true, label: "High detail" }),
  ultra: Object.freeze({ maxPixelRatio: 2.0, antialias: true, label: "Maximum detail" })
});

export function chooseTier(facts) {
  if (facts.mobile && ((facts.memory && facts.memory <= 4) || (facts.cores && facts.cores <= 4))) return "low";
  if (facts.mobile) return "balanced";
  if ((facts.memory && facts.memory >= 12) && (facts.cores && facts.cores >= 8)) return "ultra";
  if ((facts.memory && facts.memory >= 8) && (facts.cores && facts.cores >= 6)) return "high";
  if (facts.cores && facts.cores <= 4) return "low";
  return "balanced";
}

function readRequestedQuality() {
  try {
    const requested = new URLSearchParams(window.location.search).get("quality");
    return QUALITY_LEVELS.includes(requested) ? requested : "auto";
  } catch {
    return "auto";
  }
}

function readDeviceFacts() {
  const nav = typeof navigator !== "undefined" ? navigator : {};
  const hasWindow = typeof window !== "undefined";
  const width = hasWindow ? window.innerWidth : 1024;
  const ua = String(nav.userAgent || "");
  const touchMac = /Macintosh/i.test(ua) && Number(nav.maxTouchPoints) > 1;
  const mobile = /Android|iPhone|iPod|iPad/i.test(ua) || touchMac || width <= 768;
  return {
    mobile,
    memory: Number(nav.deviceMemory) || null,
    cores: Number(nav.hardwareConcurrency) || null
  };
}

let activeProfile = null;

function getProfile() {
  if (activeProfile) return activeProfile;
  const facts = readDeviceFacts();
  const requested = readRequestedQuality();
  const tier = requested === "auto" ? chooseTier(facts) : requested;
  activeProfile = Object.freeze({
    tier,
    requested,
    ...PROFILES[tier],
    mobile: facts.mobile,
    deviceMemoryGB: facts.memory,
    hardwareThreads: facts.cores
  });
  if (typeof window !== "undefined") window.__lamboCityGraphics = activeProfile;
  return activeProfile;
}

function applyRendererProfile(renderer) {
  const profile = getProfile();
  const dpr = Math.max(1, Number(window.devicePixelRatio) || 1);
  renderer.setPixelRatio(Math.min(dpr, profile.maxPixelRatio));
  renderer.setSize(window.innerWidth, window.innerHeight);
  return profile;
}

export default { getProfile, applyRendererProfile };
