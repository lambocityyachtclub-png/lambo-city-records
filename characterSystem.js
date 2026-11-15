// characterSystem.js
// LAMBO CITY — reusable character identity and lightweight crowd behavior.
// Phase 1 connects the existing 16 stage crowd members to persistent persona
// profiles and low-cost gestures. It does not add autonomous pathfinding,
// dialogue, network calls, or extra lights.

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

function smoothBeat(time, phase) {
  return Math.sin(time * 2.6 + phase);
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
  },

  update(delta, context) {
    elapsed += delta;
    const musicPlaying = !!context?.systems?.stageMusic?.isPlaying?.();
    const energyScale = musicPlaying ? 1 : 0.34;

    characters.forEach(character => {
      const { profile, phase, leftArm, rightArm, headPivot, body, mesh } = character;
      const beat = smoothBeat(elapsed, phase);
      const gentle = Math.sin(elapsed * 1.15 + phase);
      const energy = profile.energy * energyScale;

      if (profile.role === "dancer") {
        leftArm.rotation.z = -0.18 - beat * 0.38 * energy;
        rightArm.rotation.z = 0.18 + Math.sin(elapsed * 2.6 + phase + 1.4) * 0.38 * energy;
        body.rotation.z = gentle * 0.075 * energy;
        headPivot.rotation.x = Math.sin(elapsed * 2.1 + phase) * 0.055 * energy;
      } else if (profile.role === "cheerer") {
        const lift = (0.5 + 0.5 * beat) * energy;
        leftArm.rotation.z = -0.12 - lift * 0.95;
        rightArm.rotation.z = 0.12 + lift * 0.95;
        body.rotation.z = gentle * 0.035 * energy;
        headPivot.rotation.x = -0.08 - lift * 0.12;
      } else if (profile.role === "phone") {
        leftArm.rotation.z = -0.08 + gentle * 0.08;
        rightArm.rotation.z = 0.78 + Math.sin(elapsed * 1.7 + phase) * 0.055;
        headPivot.rotation.x = 0.1 + Math.sin(elapsed * 1.4 + phase) * 0.035;
        body.rotation.z = gentle * 0.025;
      } else {
        leftArm.rotation.z = -0.06 + gentle * 0.035;
        rightArm.rotation.z = 0.06 - gentle * 0.035;
        headPivot.rotation.x = Math.sin(elapsed * 1.55 + phase) * 0.09;
        headPivot.rotation.y = Math.sin(elapsed * 0.7 + phase) * 0.06;
        body.rotation.z = gentle * 0.018;
      }

      // A subtle shared beat response makes the crowd feel connected without
      // moving anyone from their approved stage-front positions.
      if (musicPlaying && profile.role !== "phone") {
        mesh.position.y += Math.max(0, beat) * 0.0025 * profile.energy;
      }
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
