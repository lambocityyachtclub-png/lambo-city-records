// characterSystem.js
// LAMBO CITY — reusable character identity and visible, lightweight crowd behavior.
// Existing crowd positions and stage geography are preserved.

const CROWD_PERSONAS = [
  { id: "crowd-01", name: "Maya", role: "dancer", personality: "joyful, expressive", traits: ["welcoming", "music-loving"], energy: 1.0 },
  { id: "crowd-02", name: "Jordan", role: "phone", personality: "social, curious", traits: ["observant", "connected"], energy: 0.9 },
  { id: "crowd-03", name: "Kai", role: "cheerer", personality: "outgoing, encouraging", traits: ["supportive", "high-energy"], energy: 1.1 },
  { id: "crowd-04", name: "Amara", role: "dancer", personality: "confident, upbeat", traits: ["rhythmic", "friendly"], energy: 1.05 },
  { id: "crowd-05", name: "Leo", role: "spectator", personality: "calm, observant", traits: ["thoughtful", "attentive"], energy: 0.72 },
  { id: "crowd-06", name: "Nia", role: "dancer", personality: "playful, spontaneous", traits: ["expressive", "warm"], energy: 1.08 },
  { id: "crowd-07", name: "Miles", role: "phone", personality: "enthusiastic, social", traits: ["documentarian", "curious"], energy: 0.95 },
  { id: "crowd-08", name: "Zara", role: "cheerer", personality: "bold, uplifting", traits: ["encouraging", "spirited"], energy: 1.12 },
  { id: "crowd-09", name: "Eli", role: "spectator", personality: "laid-back, attentive", traits: ["relaxed", "observant"], energy: 0.68 },
  { id: "crowd-10", name: "Sienna", role: "dancer", personality: "vibrant, confident", traits: ["rhythmic", "outgoing"], energy: 1.12 },
  { id: "crowd-11", name: "Noah", role: "phone", personality: "friendly, curious", traits: ["social", "observant"], energy: 0.88 },
  { id: "crowd-12", name: "Imani", role: "cheerer", personality: "spirited, generous", traits: ["supportive", "expressive"], energy: 1.08 },
  { id: "crowd-13", name: "Luca", role: "spectator", personality: "easygoing, thoughtful", traits: ["patient", "attentive"], energy: 0.7 },
  { id: "crowd-14", name: "Avery", role: "dancer", personality: "warm, energetic", traits: ["playful", "music-loving"], energy: 0.98 },
  { id: "crowd-15", name: "Jalen", role: "phone", personality: "outgoing, upbeat", traits: ["connected", "enthusiastic"], energy: 0.92 },
  { id: "crowd-16", name: "Skye", role: "cheerer", personality: "expressive, positive", traits: ["welcoming", "spirited"], energy: 1.05 }
];

let characters = [];
let elapsed = 0;

function wave(time, phase, speed = 1) {
  return Math.sin(time * speed + phase);
}

export default {
  init(scene, context) {
    const crowd = context?.systems?.npc?.getCrowdCharacters?.() || [];
    characters = crowd.map((character, index) => {
      const profile = CROWD_PERSONAS[index % CROWD_PERSONAS.length];
      character.profile = profile;
      character.mesh.userData.lamboCityCharacter = {
        id: profile.id,
        name: profile.name,
        role: profile.role,
        personality: profile.personality,
        traits: [...profile.traits]
      };
      if (character.phone) character.phone.visible = profile.role === "phone";
      return { ...character, profile, phase: index * 0.83 };
    });
    console.info("[LAMBO CITY] Character system initialized:", characters.length, "stage characters");
  },

  update(delta, context) {
    elapsed += Math.min(delta || 0, 0.05);
    const musicPlaying = !!context?.systems?.stageMusic?.isPlaying?.();
    const musicBoost = musicPlaying ? 1.18 : 1;

    characters.forEach(character => {
      const { profile, phase, leftArm, rightArm, headPivot, body, mesh, baseRotationY } = character;
      const beat = wave(elapsed, phase, musicPlaying ? 3.4 : 1.65);
      const sway = wave(elapsed, phase + 0.7, 1.25);
      const energy = profile.energy * musicBoost;

      if (profile.role === "dancer") {
        leftArm.rotation.z = -0.12 - beat * 0.78 * energy;
        rightArm.rotation.z = 0.12 + wave(elapsed, phase + 1.4, 2.5) * 0.72 * energy;
        body.rotation.z = sway * 0.15 * energy;
        body.rotation.y = wave(elapsed, phase, 1.1) * 0.10;
        headPivot.rotation.x = wave(elapsed, phase, 2.0) * 0.12;
      } else if (profile.role === "cheerer") {
        const lift = (0.5 + 0.5 * beat) * energy;
        leftArm.rotation.z = -0.10 - lift * 1.55;
        rightArm.rotation.z = 0.10 + lift * 1.55;
        body.rotation.z = sway * 0.09;
        headPivot.rotation.x = -0.12 - lift * 0.18;
      } else if (profile.role === "phone") {
        leftArm.rotation.z = -0.08 + sway * 0.12;
        rightArm.rotation.z = 0.95 + wave(elapsed, phase, 1.8) * 0.18;
        headPivot.rotation.x = 0.16 + wave(elapsed, phase, 1.35) * 0.07;
        headPivot.rotation.y = wave(elapsed, phase + 1, 0.8) * 0.09;
        body.rotation.z = sway * 0.055;
      } else {
        leftArm.rotation.z = -0.06 + sway * 0.06;
        rightArm.rotation.z = 0.06 - sway * 0.06;
        headPivot.rotation.x = wave(elapsed, phase, 1.45) * 0.16;
        headPivot.rotation.y = wave(elapsed, phase + 1, 0.75) * 0.16;
        body.rotation.z = sway * 0.035;
      }

      // Larger, clearly readable body motion while keeping every character's
      // original X/Z location fixed. Music adds energy but is not required.
      const bounce = profile.role === "spectator" ? 0.018 : 0.065;
      mesh.position.y = 1.3 + Math.abs(beat) * bounce * energy;
      mesh.rotation.y = baseRotationY + sway * (profile.role === "spectator" ? 0.045 : 0.12);
    });
  },

  getCharacters() {
    return characters.map(character => ({
      id: character.profile.id,
      name: character.profile.name,
      role: character.profile.role,
      personality: character.profile.personality,
      traits: [...character.profile.traits]
    }));
  }
};

export { CROWD_PERSONAS };
