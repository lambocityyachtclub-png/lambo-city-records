// characterSystem.js
// LAMBO CITY — reusable character identity, personality and local crowd behavior.
// The original 16 stage positions and all approved world geometry remain fixed.
// Characters can roam only within small, bounded areas on their original side
// of the audience barrier. Collision checks prevent walking through barriers.

const CROWD_PERSONAS = [
  { id: "crowd-01", name: "Maya", role: "dancer", personality: "joyful, expressive", traits: ["welcoming", "music-loving"], energy: 1.0, speed: 1.55, roam: 2.55, pause: 1.8 },
  { id: "crowd-02", name: "Jordan", role: "phone", personality: "social, curious", traits: ["observant", "connected"], energy: 0.9, speed: 1.35, roam: 2.35, pause: 2.5 },
  { id: "crowd-03", name: "Kai", role: "cheerer", personality: "outgoing, encouraging", traits: ["supportive", "high-energy"], energy: 1.1, speed: 1.45, roam: 2.5, pause: 2.0 },
  { id: "crowd-04", name: "Amara", role: "dancer", personality: "confident, upbeat", traits: ["rhythmic", "friendly"], energy: 1.05, speed: 1.65, roam: 2.65, pause: 1.5 },
  { id: "crowd-05", name: "Leo", role: "spectator", personality: "calm, observant", traits: ["thoughtful", "attentive"], energy: 0.72, speed: 1.15, roam: 2.0, pause: 3.0 },
  { id: "crowd-06", name: "Nia", role: "dancer", personality: "playful, spontaneous", traits: ["expressive", "warm"], energy: 1.08, speed: 1.6, roam: 2.55, pause: 1.7 },
  { id: "crowd-07", name: "Miles", role: "phone", personality: "enthusiastic, social", traits: ["documentarian", "curious"], energy: 0.95, speed: 1.4, roam: 2.4, pause: 2.4 },
  { id: "crowd-08", name: "Zara", role: "cheerer", personality: "bold, uplifting", traits: ["encouraging", "spirited"], energy: 1.12, speed: 1.48, roam: 2.5, pause: 1.9 },
  { id: "crowd-09", name: "Eli", role: "spectator", personality: "laid-back, attentive", traits: ["relaxed", "observant"], energy: 0.68, speed: 1.1, roam: 1.95, pause: 3.2 },
  { id: "crowd-10", name: "Sienna", role: "dancer", personality: "vibrant, confident", traits: ["rhythmic", "outgoing"], energy: 1.12, speed: 1.7, roam: 2.65, pause: 1.4 },
  { id: "crowd-11", name: "Noah", role: "phone", personality: "friendly, curious", traits: ["social", "observant"], energy: 0.88, speed: 1.32, roam: 2.3, pause: 2.6 },
  { id: "crowd-12", name: "Imani", role: "cheerer", personality: "spirited, generous", traits: ["supportive", "expressive"], energy: 1.08, speed: 1.48, roam: 2.45, pause: 2.0 },
  { id: "crowd-13", name: "Luca", role: "spectator", personality: "easygoing, thoughtful", traits: ["patient", "attentive"], energy: 0.7, speed: 1.12, roam: 1.95, pause: 3.1 },
  { id: "crowd-14", name: "Avery", role: "dancer", personality: "warm, energetic", traits: ["playful", "music-loving"], energy: 0.98, speed: 1.5, roam: 2.45, pause: 1.9 },
  { id: "crowd-15", name: "Jalen", role: "phone", personality: "outgoing, upbeat", traits: ["connected", "enthusiastic"], energy: 0.92, speed: 1.38, roam: 2.35, pause: 2.5 },
  { id: "crowd-16", name: "Skye", role: "cheerer", personality: "expressive, positive", traits: ["welcoming", "spirited"], energy: 1.05, speed: 1.45, roam: 2.4, pause: 2.0 }
];

let characters = [];
let elapsed = 0;

function wave(time, phase, speed = 1) {
  return Math.sin(time * speed + phase);
}

function approachAngle(current, target, amount) {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + difference * amount;
}

function isWalkBlocked(x, z, context) {
  return !!context?.systems?.collision?.isBlocked?.(x, z, 0.34, 1.3);
}

function chooseWanderTarget(character, context) {
  const { profile, homeX, homeZ, phase, mesh } = character;
  const angleBase = elapsed * 0.19 + phase * 2.7;
  const sideOfBarrier = homeZ > -57.4 ? "audience" : "stage";
  const minZ = sideOfBarrier === "audience"
    ? Math.max(homeZ - profile.roam, -56.65)
    : Math.max(homeZ - profile.roam, -64.35);
  const maxZ = sideOfBarrier === "stage"
    ? Math.min(homeZ + profile.roam, -58.15)
    : Math.min(homeZ + profile.roam, -46.2);

  for (let attempt = 0; attempt < 12; attempt++) {
    const angle = angleBase + attempt * 2.399963;
    // Longer destinations make walking clearly visible instead of a tiny shuffle.
    const radius = profile.roam * (0.72 + ((attempt % 3) * 0.10));
    const x = Math.max(homeX - profile.roam, Math.min(homeX + profile.roam, homeX + Math.cos(angle) * radius));
    const z = Math.max(minZ, Math.min(maxZ, homeZ + Math.sin(angle) * radius * 0.72));
    if (Math.hypot(x - mesh.position.x, z - mesh.position.z) < 1.0) continue;
    if (character.neighbors.some(other => Math.hypot(other.mesh.position.x - x, other.mesh.position.z - z) < 0.95)) continue;
    if (!isWalkBlocked(x, z, context)) return { x, z };
  }
  return null;
}

function updateWalking(character, delta, context, musicBoost) {
  const { mesh, profile, phase, leftLeg, rightLeg, leftArm, rightArm, body, headPivot } = character;
  character.stateTimer -= delta;

  if (character.state === "idle" && character.stateTimer <= 0) {
    const target = chooseWanderTarget(character, context);
    if (target) {
      character.target = target;
      character.state = "walking";
      character.stateTimer = 8;
    } else {
      character.stateTimer = 1.2 + (phase % 1.4);
    }
  }

  let walking = character.state === "walking";
  if (walking && character.target) {
    const dx = character.target.x - mesh.position.x;
    const dz = character.target.z - mesh.position.z;
    const distance = Math.hypot(dx, dz);
    if (distance < 0.12 || character.stateTimer <= -5) {
      character.state = "idle";
      character.target = null;
      character.stateTimer = profile.pause * (0.72 + (0.28 * (0.5 + 0.5 * wave(elapsed, phase, 0.31))));
      walking = false;
    } else {
      const step = Math.min(distance, profile.speed * musicBoost * delta);
      const nextX = mesh.position.x + (dx / distance) * step;
      const nextZ = mesh.position.z + (dz / distance) * step;
      // Re-check every movement step, not only the destination.
      if (!isWalkBlocked(nextX, nextZ, context)) {
        mesh.position.x = nextX;
        mesh.position.z = nextZ;
        const desiredYaw = Math.atan2(dx, dz);
        mesh.rotation.y = approachAngle(mesh.rotation.y, desiredYaw, Math.min(1, delta * 5.5));
      } else {
        character.state = "idle";
        character.target = null;
        character.stateTimer = 1.0 + phase % 1.1;
        walking = false;
      }
    }
  }

  const gait = elapsed * (walking ? 8.6 : 1.25) + phase;
  const stride = walking ? Math.sin(gait) * 0.78 : Math.sin(gait) * 0.035;
  leftLeg.rotation.x = stride;
  rightLeg.rotation.x = -stride;
  if (walking) {
    const armSwing = Math.sin(gait) * 0.42;
    if (profile.role !== "phone") {
      leftArm.rotation.x = armSwing;
      rightArm.rotation.x = -armSwing;
    }
    body.rotation.x = Math.abs(Math.sin(gait)) * 0.035;
    mesh.position.y = 1.3 + Math.abs(Math.sin(gait * 2)) * 0.045;
  } else {
    mesh.position.y = 1.3 + Math.abs(wave(elapsed, phase, 1.65)) * (profile.role === "spectator" ? 0.018 : 0.045) * profile.energy;
    body.rotation.x = 0;
  }

  // Personality-specific gestures remain visible during idle and walking.
  const beat = wave(elapsed, phase, 1.65);
  const sway = wave(elapsed, phase + 0.7, 1.25);
  const energy = profile.energy * musicBoost;
  if (profile.role === "dancer") {
    leftArm.rotation.z = -0.12 - beat * (walking ? 0.16 : 0.62) * energy;
    rightArm.rotation.z = 0.12 + wave(elapsed, phase + 1.4, 2.5) * (walking ? 0.16 : 0.58) * energy;
    body.rotation.z = sway * (walking ? 0.045 : 0.13) * energy;
    headPivot.rotation.x = wave(elapsed, phase, 2.0) * 0.11;
  } else if (profile.role === "cheerer") {
    const lift = (0.5 + 0.5 * beat) * energy;
    leftArm.rotation.z = -0.10 - lift * (walking ? 0.42 : 1.25);
    rightArm.rotation.z = 0.10 + lift * (walking ? 0.42 : 1.25);
    body.rotation.z = sway * 0.08;
    headPivot.rotation.x = -0.10 - lift * 0.14;
  } else if (profile.role === "phone") {
    leftArm.rotation.z = -0.08 + sway * 0.12;
    rightArm.rotation.z = 0.95 + wave(elapsed, phase, 1.8) * 0.16;
    headPivot.rotation.x = 0.14 + wave(elapsed, phase, 1.35) * 0.07;
    headPivot.rotation.y = wave(elapsed, phase + 1, 0.8) * 0.12;
    body.rotation.z = sway * 0.05;
  } else {
    leftArm.rotation.z = -0.06 + sway * 0.06;
    rightArm.rotation.z = 0.06 - sway * 0.06;
    headPivot.rotation.x = wave(elapsed, phase, 1.45) * 0.15;
    headPivot.rotation.y = wave(elapsed, phase + 1, 0.75) * 0.16;
    body.rotation.z = sway * 0.035;
  }

  // A subtle, occasional look toward the nearest nearby person creates
  // social awareness without moving anyone into another character or barrier.
  const nearby = character.neighbors
    .map(other => ({ other, distance: Math.hypot(other.mesh.position.x - mesh.position.x, other.mesh.position.z - mesh.position.z) }))
    .filter(item => item.distance > 0.75 && item.distance < 2.7)
    .sort((a, b) => a.distance - b.distance)[0];
  if (nearby && Math.sin(elapsed * 0.42 + phase) > 0.78) {
    const dx = nearby.other.mesh.position.x - mesh.position.x;
    const dz = nearby.other.mesh.position.z - mesh.position.z;
    const lookYaw = Math.atan2(dx, dz);
    mesh.rotation.y = approachAngle(mesh.rotation.y, lookYaw, Math.min(1, delta * 1.6));
  }
}

export default {
  init(scene, context) {
    elapsed = 0;
    const crowd = context?.systems?.npc?.getCrowdCharacters?.() || [];
    characters = crowd.map((character, index) => {
      const profile = CROWD_PERSONAS[index % CROWD_PERSONAS.length];
      character.mesh.userData.lamboCityCharacter = {
        id: profile.id,
        name: profile.name,
        role: profile.role,
        personality: profile.personality,
        traits: [...profile.traits]
      };
      if (character.phone) character.phone.visible = profile.role === "phone";
      return {
        ...character,
        profile,
        phase: index * 0.83,
        homeX: character.homeX ?? character.mesh.position.x,
        homeZ: character.homeZ ?? character.mesh.position.z,
        state: "idle",
        stateTimer: 0.8 + (index % 5) * 0.72,
        target: null,
        neighbors: []
      };
    });
    characters.forEach(character => {
      character.neighbors = characters.filter(other => other !== character);
    });
    console.info("[LAMBO CITY] Character system initialized:", characters.length, "personalized stage characters with local walking behavior");
  },

  update(delta, context) {
    const safeDelta = Math.min(Math.max(delta || 0, 0), 0.05);
    elapsed += safeDelta;
    const musicPlaying = !!context?.systems?.stageMusic?.isPlaying?.();
    const musicBoost = musicPlaying ? 1.12 : 1;
    characters.forEach(character => updateWalking(character, safeDelta, context, musicBoost));
  },

  getCharacters() {
    return characters.map(character => ({
      id: character.profile.id,
      name: character.profile.name,
      role: character.profile.role,
      personality: character.profile.personality,
      traits: [...character.profile.traits],
      behavior: character.state
    }));
  }
};

export { CROWD_PERSONAS };
