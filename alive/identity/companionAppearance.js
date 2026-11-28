const SKIN_TONES = Object.freeze({ porcelain: 0xf0d6c2, light: 0xd8a27e, medium: 0xb87952, tan: 0x99613f, deep: 0x5a3528 });
const OUTFITS = Object.freeze({ streetwear: 0x1b1b1f, classic: 0x34302a, minimal: 0x50545a, creative: 0x253b55 });
const ACCENTS = Object.freeze({ gold: 0xffd700, blue: 0x4d91d8, violet: 0x9565c9, silver: 0xb9c2cc });

export function resolveCompanionMaterials(companion) {
  if (!companion || typeof companion !== "object") return null;
  const appearance = companion.appearanceProfile && typeof companion.appearanceProfile === "object"
    ? companion.appearanceProfile
    : {};
  return Object.freeze({
    skinTone: SKIN_TONES[appearance.skinTone] ?? SKIN_TONES.medium,
    outfit: OUTFITS[appearance.outfit] ?? OUTFITS.streetwear,
    accent: ACCENTS[appearance.accentColor] ?? ACCENTS.gold
  });
}
