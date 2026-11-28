import { createHash } from "node:crypto";
const TRAITS = new Set(["curious", "creative", "thoughtful", "playful", "calm", "confident", "supportive", "adventurous", "witty", "focused"]);
const ENUMS = Object.freeze({ skinTone: new Set(["porcelain", "light", "medium", "tan", "deep"]), hairStyle: new Set(["short", "curly", "long", "braids", "buzz", "none"]), hairColor: new Set(["black", "brown", "blonde", "auburn", "silver"]), eyeColor: new Set(["brown", "blue", "green", "hazel", "gray"]), outfit: new Set(["streetwear", "classic", "minimal", "creative"]), accentColor: new Set(["gold", "blue", "violet", "silver"]) });
function invalid(message) { const error = new Error(message); error.code = "ALIVE_PUBLIC_INPUT_INVALID"; return error; }
export function publicCompanionIdentityId(ownerId) { if (typeof ownerId !== "string" || !ownerId.trim() || ownerId.length > 128) throw invalid("A verified account is required."); return "public-" + createHash("sha256").update(ownerId.trim()).digest("hex").slice(0, 32); }
export function normalizePublicCompanionInput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw invalid("Companion details are required.");
  const displayName = typeof value.displayName === "string" ? value.displayName.trim() : "";
  if (displayName.length < 2 || displayName.length > 40) throw invalid("Companion name must be 2–40 characters.");
  const characterForm = value.characterForm;
  if (!["digital-human", "stylized"].includes(characterForm)) throw invalid("Choose digital-human or stylized form.");
  const sourceAppearance = value.appearanceProfile && typeof value.appearanceProfile === "object" && !Array.isArray(value.appearanceProfile) ? value.appearanceProfile : {};
  const appearanceProfile = {};
  for (const [key, allowed] of Object.entries(ENUMS)) appearanceProfile[key] = allowed.has(sourceAppearance[key]) ? sourceAppearance[key] : [...allowed][0];
  const sourcePersonality = value.personality && typeof value.personality === "object" && !Array.isArray(value.personality) ? value.personality : {};
  const summary = typeof sourcePersonality.summary === "string" ? sourcePersonality.summary.trim().slice(0, 240) : "";
  const traits = Array.isArray(sourcePersonality.traits) ? [...new Set(sourcePersonality.traits.filter(item => typeof item === "string" && TRAITS.has(item)))].slice(0, 5) : [];
  return Object.freeze({ displayName, characterForm, appearanceProfile: Object.freeze(appearanceProfile), personality: Object.freeze({ summary, traits: Object.freeze(traits) }) });
}
export function toPublicCompanionView(identity) {
  if (!identity) return null;
  return Object.freeze({ displayName: identity.displayName, characterForm: identity.character?.form || "digital-human", appearanceProfile: identity.character?.appearanceProfile || {}, personality: identity.personality || { summary: "", traits: [] }, privacy: Object.freeze({ visibility: "private", memoryAccess: "owner-only", trainingUse: false, sharing: "private" }), createdAt: identity.createdAt, updatedAt: identity.updatedAt });
}
