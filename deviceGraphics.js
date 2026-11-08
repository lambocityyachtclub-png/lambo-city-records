// deviceGraphics.js
// LAMBO CITY — conservative device-aware graphics profiles.
// This module does not change gameplay, controls, world geometry, or input handling.

const QUALITY_LEVELS = Object.freeze(["low", "balanced", "high", "ultra"]);

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
  const width = typeof window !== "undefined" ? window.innerWidth : 1024;
  const dpr = Math.max(1, Number(window?.devicePixelRatio) || 1);
  const memory = Number(nav.deviceMemory) || null;
  const cores = Number(nav.hardwareConcurrency) || null;
  const ua = String(nav.userAgent || "");
  const touchMac = /Macintosh/i.test(ua) && Number(nav.maxTouchPoints) > 1;
  const mobile = /Android|iPhone|iPod|iPad/i.test(ua) || touchMac || width <= 768;
  return { width, dpr, memory, cores, mobile };
}

function chooseTier(facts) {
  if (facts.mobile && ((facts.memory && facts.memory <= 4) || (facts.cores && facts.cores <= 4))) {
    return "low";
  }
  if (facts.mobile) return "balanced";
  if ((facts.memory && facts.memory >= 12) && (facts.cores && facts.cores >= 8)) return "ultra";
  if ((facts.memory && facts.memory >= 8) && (facts.cores && facts.cores >= 6)) return "high";
  if (facts.cores && facts.cores <= 4) return "low";
  return "balanced";
}

const PROFILES = Object.freeze({
  low: Object.freeze({ maxPixelRatio: 1.0, antialias: false, label: "Performance" }),
  balanced: Object.freeze({ maxPixelRatio: 1.25, antialias: false, label: "Balanced" }),
  high: Object.freeze({ maxPixelRatio: 1.5, antialias: true, label: "High detail" }),
  ultra: Object.freeze({ maxPixelRatio: 2.0, antialias: true, label: "Maximum detail" })
});

let activeProfile = null;
let activeFacts = null;

function getProfile() {
  if (activeProfile) return activeProfile;
  activeFacts = readDeviceFacts();
  const requested = readRequestedQuality();
  const tier = requested === "auto" ? chooseTier(activeFacts) : requested;
  activeProfile = Object.freeze({
    tier,
    requested,
    ...PROFILES[tier],
    mobile: activeFacts.mobile,
    deviceMemoryGB: activeFacts.memory,
    hardwareThreads: activeFacts.cores
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
