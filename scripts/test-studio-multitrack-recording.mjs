import assert from "node:assert/strict";
import StudioMultitrackWorkspace from "../studioMultitrackWorkspace.js";
import StudioRecordingEngine from "../studioRecordingEngine.js";
import StudioAudioEngine from "../studioAudioEngine.js";
import StudioAudioExport from "../studioAudioExport.js";

const originalResume = StudioAudioEngine.resume;
const originalGetOutput = StudioAudioExport.getOutput;
const originalStart = StudioRecordingEngine.startTrackRecording;
const originalStop = StudioRecordingEngine.stopTrackRecording;
const starts = [];
const fakeAudio = { state: "running", currentTime: 0, decodeAudioData: async () => ({ duration: 2 }), createOscillator() { throw new Error("unexpected click"); } };
StudioAudioEngine.resume = async () => fakeAudio;
StudioAudioExport.getOutput = () => ({ name: "Beat Lab output" });
StudioRecordingEngine.startTrackRecording = async options => {
  starts.push(options);
  const take = { trackId: options.trackId };
  StudioRecordingEngine.activeTrackTakes.push(take);
  StudioRecordingEngine.activeTrackTake ||= take;
  return { trackId: options.trackId };
};
StudioRecordingEngine.stopTrackRecording = async trackId => {
  const take = StudioRecordingEngine.activeTrackTakes.find(item => item.trackId === trackId);
  StudioRecordingEngine.activeTrackTakes = StudioRecordingEngine.activeTrackTakes.filter(item => item !== take);
  StudioRecordingEngine.activeTrackTake = StudioRecordingEngine.activeTrackTakes[0] || null;
  return { trackId, blob: new Blob([new Uint8Array([1, 2, 3])], { type: "audio/wav" }), startedAt: new Date().toISOString(), recordingFormat: "24-bit PCM WAV" };
};

function workspace(tracks) {
  return {
    tracks, playheadBar: 1, pendingRecording: false, recordingStartBar: 1,
    metronomeSettings: { enabled: false }, arrangementPlayback: null,
    recordingMetronomeSources: [], inputDeviceId: "default-mic",
    inputLatencyByDevice: {}, inputLatencyMs: 0,
    isTrackRecording() { return false; },
    getSecondsAtBar(bar) { return (bar - 1) * 2.4; },
    getBarAtSeconds(seconds) { return 1 + seconds / 2.4; },
    getTimeSignatureAtBar() { return { numerator: 4, denominator: 4 }; },
    getTempoAtBar() { return 100; },
    status(message) { this.lastStatus = message; },
    render() {}, scheduleProjectAutosave() {}
  };
}

try {
  StudioRecordingEngine.activeTrackTakes = [];
  StudioRecordingEngine.activeTrackTake = null;
  starts.length = 0;
  const mixed = workspace([
    { id: "vocal-1", name: "Lead Vocal", type: "audio", armed: true, inputSource: "mic", inputDeviceId: "mic-a", clips: [] },
    { id: "beat-1", name: "Beat Print", type: "audio", armed: true, inputSource: "beatlab", clips: [] }
  ]);
  const started = await StudioMultitrackWorkspace.startArmedRecording.call(mixed);
  assert.equal(started, true);
  assert.deepEqual(starts.map(item => item.trackId), ["vocal-1", "beat-1"]);
  assert.ok(starts.every(item => item.allowConcurrent === true));
  assert.equal(starts[0].inputDeviceId, "mic-a");
  assert.ok(mixed.lastStatus.includes("Lead Vocal") && mixed.lastStatus.includes("Beat Print"));
  assert.equal(await StudioMultitrackWorkspace.stopArmedRecording.call(mixed), true);
  assert.equal(mixed.tracks[0].clips.length, 1);
  assert.equal(mixed.tracks[1].clips.length, 1);

  StudioRecordingEngine.activeTrackTakes = [];
  StudioRecordingEngine.activeTrackTake = null;
  starts.length = 0;
  const duplicateMic = workspace([
    { id: "mic-a", name: "Vocal", type: "audio", armed: true, inputSource: "mic", clips: [] },
    { id: "mic-b", name: "Room Mic", type: "audio", armed: true, inputSource: "mic", clips: [] }
  ]);
  const rejected = await StudioMultitrackWorkspace.startArmedRecording.call(duplicateMic);
  assert.equal(rejected, false);
  assert.equal(starts.length, 0);
  assert.ok(duplicateMic.lastStatus.includes("different input source"));

  StudioRecordingEngine.activeTrackTakes = [];
  StudioRecordingEngine.activeTrackTake = null;
  starts.length = 0;
  const twoInputs = workspace([
    { id: "mic-a", name: "Lead Vocal", type: "audio", armed: true, inputSource: "mic", inputDeviceId: "mic-a", clips: [] },
    { id: "mic-b", name: "Room Mic", type: "audio", armed: true, inputSource: "mic", inputDeviceId: "mic-b", clips: [] }
  ]);
  assert.equal(await StudioMultitrackWorkspace.startArmedRecording.call(twoInputs), true);
  assert.equal(starts.length, 2);
  assert.equal(starts[0].inputChannel, null);
} finally {
  StudioAudioEngine.resume = originalResume;
  StudioAudioExport.getOutput = originalGetOutput;
  StudioRecordingEngine.startTrackRecording = originalStart;
  StudioRecordingEngine.stopTrackRecording = originalStop;
  StudioRecordingEngine.activeTrackTakes = [];
  StudioRecordingEngine.activeTrackTake = null;
}
console.log("Studio simultaneous armed-track recording tests passed.");
