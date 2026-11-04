import assert from "node:assert/strict";
import {
  listStudioDAWSessionTemplates,
  applyStudioDAWSessionTemplate
} from "../studioDAWSessionTemplates.js";

const templates = listStudioDAWSessionTemplates();
assert.deepEqual(templates.map(item => item.id), [
  "hard-tuned-melodic",
  "natural-polished-lead",
  "dry-upfront-rap",
  "experimental-trap-layers"
]);
assert.equal(templates.length, 4);

function createWorkspace() {
  return {
    tracks: [{ id: "old-track", clips: [{ blob: new Blob(["old"]) }] }],
    nextTrackId: 2,
    sessionTemplateId: null,
    sessionTemplateName: null,
    stopped: false,
    rendered: false,
    lastStatus: "",
    recording: false,
    stopAll() { this.stopped = true; },
    isTrackRecording() { return this.recording; },
    createTrack(type, name) {
      const track = {
        id: `lc-track-${this.nextTrackId++}`,
        name,
        type,
        volume: 80,
        pan: 0,
        inputSource: "mic",
        eq: { low: 0, mid: 0, high: 0 },
        compression: { threshold: -18, ratio: 1 },
        effects: {},
        automation: { volume: [] },
        muted: false,
        solo: false,
        armed: false,
        clips: []
      };
      this.tracks.push(track);
      return track;
    },
    render() { this.rendered = true; },
    status(message) { this.lastStatus = message; }
  };
}

for (const template of templates) {
  const workspace = createWorkspace();
  const result = applyStudioDAWSessionTemplate(workspace, template.id);
  assert.equal(result.id, template.id);
  assert.equal(result.trackCount, 9);
  assert.equal(workspace.tracks.length, 9);
  assert.equal(workspace.sessionTemplateId, template.id);
  assert.equal(workspace.sessionTemplateName, template.name);
  assert.equal(workspace.stopped, true);
  assert.equal(workspace.rendered, true);
  assert.equal(workspace.tracks[0].name, "INSTRUMENTAL — IMPORT BEAT");
  assert.equal(workspace.tracks[0].clips.length, 0);
  assert.deepEqual(workspace.tracks.slice(1, 4).map(track => track.name), [
    "LEAD VOCAL — VERSE 1",
    "LEAD VOCAL — VERSE 2",
    "LEAD VOCAL — VERSE 3"
  ]);
  assert.equal(workspace.tracks[4].name, "LEAD VOCAL — HOOK");
  assert.equal(workspace.tracks[5].pan, -0.3);
  assert.equal(workspace.tracks[6].pan, 0.3);
  assert.ok(workspace.tracks.slice(1).every(track => track.inputSource === "mic"));
  assert.ok(workspace.tracks.slice(1).every(track => track.compression.ratio > 1));
  assert.ok(workspace.tracks.slice(1).every(track => Number.isFinite(track.effects.delayMix)));
  assert.ok(workspace.tracks.slice(1).every(track => Number.isFinite(track.effects.reverbMix)));
  assert.ok(workspace.tracks.every(track => track.armed === false));
}

const hardTune = createWorkspace();
applyStudioDAWSessionTemplate(hardTune, "hard-tuned-melodic");
assert.equal(hardTune.tracks[1].effects.pitchCorrection.enabled, true);
assert.equal(hardTune.tracks[1].effects.pitchCorrection.speedMs, 0);

const natural = createWorkspace();
applyStudioDAWSessionTemplate(natural, "natural-polished-lead");
assert.equal(natural.tracks[1].effects.pitchCorrection.enabled, false);
assert.ok(natural.tracks[1].effects.reverbMix > natural.tracks[1].effects.delayMix);

const dry = createWorkspace();
applyStudioDAWSessionTemplate(dry, "dry-upfront-rap");
assert.ok(dry.tracks[1].effects.reverbMix < 0.05);
assert.ok(dry.tracks[1].effects.delayMix < 0.05);

const experimental = createWorkspace();
applyStudioDAWSessionTemplate(experimental, "experimental-trap-layers");
assert.equal(experimental.tracks[1].effects.pitchCorrection.enabled, true);
assert.ok(experimental.tracks[7].effects.delayMix > experimental.tracks[1].effects.delayMix);

const recording = createWorkspace();
recording.recording = true;
assert.throws(() => applyStudioDAWSessionTemplate(recording, "dry-upfront-rap"), /Stop the active recording/);
assert.throws(() => applyStudioDAWSessionTemplate(createWorkspace(), "unknown"), /template was not found/);

console.log("DAW session template tests passed.");
