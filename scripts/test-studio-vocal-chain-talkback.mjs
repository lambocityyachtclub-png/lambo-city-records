import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = async path => readFile(new URL("../" + path, import.meta.url), "utf8");
const [app, booth, recording, pitch, talkback, audio] = await Promise.all([
  read("floor2StudioApp.js"),
  read("floor2VocalBooth3D.js"),
  read("studioRecordingEngine.js"),
  read("studioPitchCorrection.js"),
  read("studioTalkback.js"),
  read("studioAudioEngine.js")
]);

assert.match(app, /createStudioPitchCorrectionNode/);
assert.match(app, /pitchCorrectionSettings\s*=\s*\{/);
assert.match(app, /if\s*\(this\.pitchCorrectionSettings\?\.enabled\)/);
assert.match(app, /pitchCorrectionNode\s*\n\s*\}/);
assert.match(booth, /data-vocal-pitch="enabled"/);
assert.match(booth, /data-vocal-pitch="root"/);
assert.match(booth, /data-vocal-pitch="scale"/);
assert.match(booth, /data-vocal-pitch="amount"/);
assert.match(booth, /data-vocal-pitch="speedMs"/);
assert.match(recording, /async startTake\(\{ audio, beatOutput, vocalEffects, pitchCorrectionNode \}/);
assert.match(recording, /microphoneSource\.connect\(pitchCorrectionNode\)/);
assert.match(recording, /vocalSource\.connect\(vocalEffects\.input\)/);
assert.match(recording, /pitchCorrectionNode\?\.disconnect\(\)/);
assert.match(pitch, /AudioWorkletNode/);

assert.match(booth, /data-vocal-talkback/);
assert.match(booth, /data-talkback-setting="volume"/);
assert.match(booth, /data-talkback-setting="sidetone"/);
assert.match(booth, /data-talkback-setting="duckAmount"/);
assert.match(talkback, /getUserMedia/);
assert.match(talkback, /StudioVocalEffects\.create/);
assert.match(talkback, /createStudioPitchCorrectionNode/);
assert.match(talkback, /outputGain\.connect\(audio\.destination\)/);
assert.doesNotMatch(talkback, /StudioRecordingEngine|startTrackRecording|startTake/,
  "Talkback must never connect to the recording engine.");
assert.match(talkback, /setTalkbackDuck/);
assert.match(audio, /setTalkbackDuck\(multiplier = 1\)/);
assert.match(audio, /normalized \* duck/);

console.log("Live vocal pitch-correction routing and isolated Talkback controls passed.");
