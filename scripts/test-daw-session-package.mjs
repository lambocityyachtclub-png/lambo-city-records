import assert from "node:assert/strict";
import {
  exportSongProjectPackage,
  importSongProjectPackage
} from "../studioProjectPackage.js";

const emptySteps = () => Array.from({ length: 16 }, () => false);
const baseProject = () => ({
  schemaVersion: 1,
  id: "daw-session-test",
  metadata: { title: "DAW Session Package Test" },
  settings: { bpm: 100, soundProfile: "beatLab" },
  patterns: [{
    id: "pattern-main",
    name: "Main",
    bpm: 100,
    steps: { kick: emptySteps(), snare: emptySteps(), hat: emptySteps() }
  }],
  arrangement: {
    sections: [{ id: "section-intro", name: "Intro", order: 0, bars: 4, clips: [] }]
  }
});

const session = {
  format: "lambo-city-daw-session",
  version: 1,
  tempo: 112,
  metronomeSettings: { enabled: true, volume: 0.12, accent: false },
  masterSettings: { volume: 90, stereoWidth: 110, compressionRatio: 3.5, limiterEnabled: true, limiterCeilingDb: -1.2 },
  templateId: "hard-tuned-melodic",
  templateName: "Hard-Tuned Melodic",
  tracks: [{
    id: "lc-track-1",
    name: "Vocals",
    type: "audio",
    volume: 84,
    pan: -0.25,
    inputSource: "mic",
    eq: { low: -1.5, mid: 2, high: 1 },
    compression: { threshold: -18, ratio: 2.5 },
    effects: { delayTime: 0.42, delayFeedback: 0.3, delayMix: 0.25, reverbMix: 0.4, reverbDecay: 3.2, pitchCorrection: { enabled: true, root: 9, scale: "minor", amount: 85, speedMs: 18 } },
    automation: { volume: [{ bar: 1, value: 80 }, { bar: 9, value: 55 }] },
    muted: false,
    solo: true,
    armed: false,
    clips: [{
      id: "vocal-clip-1",
      name: "Lead Vocal Take",
      startBar: 3,
      lengthBars: 8,
      duration: 16.7,
      mimeType: "audio/webm",
      data: "AQIDBA==",
      takeId: "take-1",
      createdAt: "2026-11-03T12:00:00.000Z"
    }]
  }]
};

const project = { ...baseProject(), dawSession: session };
const imported = importSongProjectPackage(exportSongProjectPackage(project));
assert.deepEqual(imported.dawSession, session);
assert.equal(imported.dawSession.tracks[0].clips[0].data, "AQIDBA==");
assert.deepEqual(imported.dawSession.metronomeSettings, { enabled: true, volume: 0.12, accent: false });
assert.deepEqual(imported.dawSession.masterSettings, { volume: 90, stereoWidth: 110, compressionRatio: 3.5, limiterEnabled: true, limiterCeilingDb: -1.2 });
assert.equal(imported.dawSession.templateId, "hard-tuned-melodic");
assert.equal(imported.dawSession.templateName, "Hard-Tuned Melodic");
assert.equal(imported.dawSession.tracks[0].inputSource, "mic");
assert.equal(imported.dawSession.tracks[0].eq.mid, 2);
assert.equal(imported.dawSession.tracks[0].compression.ratio, 2.5);
assert.equal(imported.dawSession.tracks[0].effects.delayMix, 0.25);
assert.equal(imported.dawSession.tracks[0].effects.reverbDecay, 3.2);
assert.deepEqual(imported.dawSession.tracks[0].effects, {
  delayTime: 0.42, delayFeedback: 0.3, delayMix: 0.25, reverbMix: 0.4, reverbDecay: 3.2,
  pitchCorrection: { enabled: true, root: 9, scale: "minor", amount: 85, speedMs: 18 }
});
assert.deepEqual(imported.dawSession.tracks[0].automation.volume, [
  { bar: 1, value: 80 },
  { bar: 9, value: 55 }
]);

const legacy = importSongProjectPackage(exportSongProjectPackage(baseProject()));
assert.equal(legacy.dawSession, undefined);

const invalidInput = structuredClone(project);
invalidInput.dawSession.tracks[0].inputSource = "unknown";
assert.throws(() => exportSongProjectPackage(invalidInput), /track settings are invalid/);

const invalidMetronome = structuredClone(project);
invalidMetronome.dawSession.metronomeSettings.volume = 0.8;
assert.throws(() => exportSongProjectPackage(invalidMetronome), /metronome settings are invalid/);

const invalidLimiter = structuredClone(project);
invalidLimiter.dawSession.masterSettings.limiterCeilingDb = -9;
assert.throws(() => exportSongProjectPackage(invalidLimiter), /master limiter settings are invalid/);

const invalidPan = structuredClone(project);
invalidPan.dawSession.tracks[0].pan = 2;
assert.throws(() => exportSongProjectPackage(invalidPan), /track settings are invalid/);

const invalidEffects = structuredClone(project);
invalidEffects.dawSession.tracks[0].effects.reverbMix = 1.5;
assert.throws(() => exportSongProjectPackage(invalidEffects), /track settings are invalid/);

const invalidPitchCorrection = structuredClone(project);
invalidPitchCorrection.dawSession.tracks[0].effects.pitchCorrection.scale = "unknown";
assert.throws(() => exportSongProjectPackage(invalidPitchCorrection), /track settings are invalid/);

const invalidAutomation = structuredClone(project);
invalidAutomation.dawSession.tracks[0].automation.volume[0].bar = 129;
assert.throws(() => exportSongProjectPackage(invalidAutomation), /automation point is invalid/);

const missingAudio = structuredClone(project);
missingAudio.dawSession.tracks[0].clips[0].data = null;
assert.throws(() => exportSongProjectPackage(missingAudio), /DAW audio clip data is invalid/);

console.log("DAW session package tests passed.");
