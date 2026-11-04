/*
 * LAMBO CITY RECORDS
 * ORIGINAL DAW SESSION STARTER TEMPLATES — V1
 *
 * Artist-workflow concepts translated into editable LAMBO CITY sessions.
 * These are original starting points, not copies of private artist presets.
 */

const cleanEffects = {
  delayTime: 0.28,
  delayFeedback: 0.25,
  delayMix: 0,
  reverbMix: 0,
  reverbDecay: 2.2,
  pitchCorrection: {
    enabled: false,
    root: 0,
    scale: "major",
    amount: 100,
    speedMs: 25
  }
};

function vocalSettings({
  volume = 82,
  pan = 0,
  eq = {},
  threshold = -20,
  ratio = 3,
  delayMix = 0,
  delayTime = 0.28,
  delayFeedback = 0.25,
  reverbMix = 0,
  reverbDecay = 2.8,
  pitchCorrection = {}
} = {}) {
  return {
    volume,
    pan,
    inputSource: "mic",
    eq: { low: -1.5, mid: 0.5, high: 1.5, ...eq },
    compression: { threshold, ratio },
    effects: {
      ...cleanEffects,
      delayTime,
      delayFeedback,
      delayMix,
      reverbMix,
      reverbDecay,
      pitchCorrection: { ...cleanEffects.pitchCorrection, ...pitchCorrection }
    }
  };
}

const sharedTrackLayout = [
  {
    name: "INSTRUMENTAL — IMPORT BEAT",
    volume: 92,
    pan: 0,
    inputSource: "mic",
    eq: { low: 0, mid: 0, high: 0 },
    compression: { threshold: -18, ratio: 1 },
    effects: { ...cleanEffects, pitchCorrection: { ...cleanEffects.pitchCorrection } }
  },
  { name: "LEAD VOCAL — VERSE 1" },
  { name: "LEAD VOCAL — VERSE 2" },
  { name: "LEAD VOCAL — VERSE 3" },
  { name: "LEAD VOCAL — HOOK" },
  { name: "VOCAL DOUBLE — LEFT", pan: -0.3 },
  { name: "VOCAL DOUBLE — RIGHT", pan: 0.3 },
  { name: "AD-LIBS" },
  { name: "HARMONIES" }
];

const definitions = [
  {
    id: "hard-tuned-melodic",
    name: "Hard-Tuned Melodic",
    concept: "Bold, locked-in melodic vocals with deliberate pitch effect and rhythmic vocal repeats.",
    guidance: "Pitch correction starts enabled in C major. Set the key and scale to match your instrumental before recording.",
    tracks: {
      lead: vocalSettings({
        threshold: -22, ratio: 5.5, eq: { low: -2, mid: 1, high: 2 },
        delayTime: 0.32, delayFeedback: 0.3, delayMix: 0.2,
        reverbMix: 0.18, reverbDecay: 2.8,
        pitchCorrection: { enabled: true, amount: 100, speedMs: 0 }
      }),
      hook: vocalSettings({
        threshold: -22, ratio: 5.5, eq: { low: -2, mid: 1.5, high: 2.5 },
        delayTime: 0.32, delayFeedback: 0.34, delayMix: 0.27,
        reverbMix: 0.24, reverbDecay: 3.1,
        pitchCorrection: { enabled: true, amount: 100, speedMs: 0 }
      }),
      double: vocalSettings({
        volume: 70, threshold: -20, ratio: 4.5, eq: { low: -3, mid: 0, high: 2 },
        delayMix: 0.16, reverbMix: 0.24, reverbDecay: 3
      }),
      adlib: vocalSettings({
        volume: 74, threshold: -21, ratio: 4.5, eq: { low: -3, mid: 1, high: 3 },
        delayTime: 0.38, delayFeedback: 0.38, delayMix: 0.3,
        reverbMix: 0.3, reverbDecay: 3.4
      }),
      harmony: vocalSettings({
        volume: 68, threshold: -20, ratio: 3.5, eq: { low: -3, mid: 0, high: 2 },
        delayMix: 0.12, reverbMix: 0.3, reverbDecay: 3.4
      })
    }
  },
  {
    id: "natural-polished-lead",
    name: "Natural Polished Lead",
    concept: "A natural lead vocal kept forward and expressive, with gentle dynamics and spacious reverb.",
    guidance: "Pitch correction is bypassed by default to preserve the original take. Detailed note editing can be added as a separate workflow later.",
    tracks: {
      lead: vocalSettings({
        threshold: -20, ratio: 3.2, eq: { low: -2, mid: 0.8, high: 2 },
        delayMix: 0.06, reverbMix: 0.28, reverbDecay: 3.8
      }),
      hook: vocalSettings({
        threshold: -20, ratio: 3.2, eq: { low: -2, mid: 1, high: 2.2 },
        delayMix: 0.1, reverbMix: 0.34, reverbDecay: 4.1
      }),
      double: vocalSettings({
        volume: 68, threshold: -19, ratio: 2.8, eq: { low: -3, mid: 0, high: 1.5 },
        delayMix: 0.08, reverbMix: 0.3, reverbDecay: 3.8
      }),
      adlib: vocalSettings({
        volume: 72, threshold: -19, ratio: 2.8, eq: { low: -3, mid: 0.5, high: 2 },
        delayMix: 0.16, reverbMix: 0.38, reverbDecay: 4.2
      }),
      harmony: vocalSettings({
        volume: 70, threshold: -19, ratio: 2.8, eq: { low: -3, mid: 0, high: 1.5 },
        delayMix: 0.08, reverbMix: 0.4, reverbDecay: 4.4
      })
    }
  },
  {
    id: "dry-upfront-rap",
    name: "Dry Upfront Rap",
    concept: "A clean, close, intelligible rap vocal with controlled compression and restrained ambience.",
    guidance: "The lead starts nearly dry so the words stay up front. Add delay or reverb only where a section needs space.",
    tracks: {
      lead: vocalSettings({
        threshold: -23, ratio: 4.5, eq: { low: -2.5, mid: 1.5, high: 1.2 },
        delayMix: 0.02, reverbMix: 0.035, reverbDecay: 1.8
      }),
      hook: vocalSettings({
        threshold: -22, ratio: 4.2, eq: { low: -2, mid: 1.2, high: 1.5 },
        delayMix: 0.06, reverbMix: 0.08, reverbDecay: 2
      }),
      double: vocalSettings({
        volume: 68, threshold: -21, ratio: 4, eq: { low: -3, mid: 0.5, high: 1 },
        delayMix: 0.04, reverbMix: 0.06, reverbDecay: 1.8
      }),
      adlib: vocalSettings({
        volume: 72, threshold: -21, ratio: 4, eq: { low: -3, mid: 0.5, high: 2 },
        delayMix: 0.1, reverbMix: 0.12, reverbDecay: 2.2
      }),
      harmony: vocalSettings({
        volume: 66, threshold: -20, ratio: 3.5, eq: { low: -3, mid: 0, high: 1.5 },
        delayMix: 0.06, reverbMix: 0.12, reverbDecay: 2.4
      })
    }
  },
  {
    id: "experimental-trap-layers",
    name: "Experimental Trap Layers",
    concept: "Expressive tuned leads, wide doubles, and creative delay/reverb textures for layered performances.",
    guidance: "Pitch correction starts enabled in C major on the lead and hook. Set the song key first; use the doubles and ad-libs for wider effects.",
    tracks: {
      lead: vocalSettings({
        threshold: -22, ratio: 5, eq: { low: -2.5, mid: 0.8, high: 2.5 },
        delayTime: 0.3, delayFeedback: 0.36, delayMix: 0.18,
        reverbMix: 0.2, reverbDecay: 3.2,
        pitchCorrection: { enabled: true, amount: 100, speedMs: 18 }
      }),
      hook: vocalSettings({
        threshold: -22, ratio: 5.2, eq: { low: -2.5, mid: 1, high: 2.8 },
        delayTime: 0.34, delayFeedback: 0.4, delayMix: 0.25,
        reverbMix: 0.28, reverbDecay: 3.8,
        pitchCorrection: { enabled: true, amount: 100, speedMs: 18 }
      }),
      double: vocalSettings({
        volume: 66, threshold: -21, ratio: 4.5, eq: { low: -3, mid: 0, high: 2.5 },
        delayTime: 0.34, delayFeedback: 0.35, delayMix: 0.22,
        reverbMix: 0.28, reverbDecay: 3.8
      }),
      adlib: vocalSettings({
        volume: 72, threshold: -21, ratio: 4.5, eq: { low: -3, mid: 0.5, high: 3 },
        delayTime: 0.42, delayFeedback: 0.48, delayMix: 0.34,
        reverbMix: 0.38, reverbDecay: 4.4
      }),
      harmony: vocalSettings({
        volume: 68, threshold: -20, ratio: 4, eq: { low: -3, mid: 0, high: 2.5 },
        delayTime: 0.36, delayFeedback: 0.34, delayMix: 0.2,
        reverbMix: 0.36, reverbDecay: 4.2
      })
    }
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function listStudioDAWSessionTemplates() {
  return definitions.map(({ id, name, concept, guidance }) => ({
    id, name, concept, guidance
  }));
}

export function applyStudioDAWSessionTemplate(workspace, templateId) {
  if (!workspace || !Array.isArray(workspace.tracks) ||
      typeof workspace.createTrack !== "function" ||
      typeof workspace.stopAll !== "function") {
    throw new Error("A valid LAMBO CITY DAW workspace is required.");
  }
  if (typeof workspace.isTrackRecording === "function" && workspace.isTrackRecording()) {
    throw new Error("Stop the active recording before loading a session template.");
  }
  const template = definitions.find(item => item.id === templateId);
  if (!template) throw new Error("The selected LAMBO CITY session template was not found.");

  workspace.stopAll();
  workspace.tracks = [];
  workspace.nextTrackId = 1;

  sharedTrackLayout.forEach((layout, index) => {
    const track = workspace.createTrack("audio", layout.name);
    const settings = index === 0
      ? layout
      : layout.name.includes("VERSE")
        ? template.tracks.lead
        : layout.name.includes("HOOK")
          ? template.tracks.hook
          : layout.name.includes("DOUBLE")
            ? template.tracks.double
            : layout.name === "AD-LIBS"
              ? template.tracks.adlib
              : template.tracks.harmony;
    Object.assign(track, clone(settings));
    track.id = `lc-track-${index + 1}`;
    track.type = "audio";
    track.clips = [];
    track.automation = { volume: [] };
    track.muted = false;
    track.solo = false;
    track.armed = false;
  });

  workspace.nextTrackId = workspace.tracks.length + 1;
  workspace.sessionTemplateId = template.id;
  workspace.sessionTemplateName = template.name;
  workspace.render?.();
  workspace.status?.(`${template.name} session loaded · Import your instrumental to begin.`);
  return {
    id: template.id,
    name: template.name,
    concept: template.concept,
    guidance: template.guidance,
    trackCount: workspace.tracks.length
  };
}

export default {
  list: listStudioDAWSessionTemplates,
  apply: applyStudioDAWSessionTemplate
};
