import assert from "node:assert/strict";
import StudioRecordingEngine from "../studioRecordingEngine.js";
import StudioMultitrackWorkspace from "../studioMultitrackWorkspace.js";
import { disposeVocalBoothPanel } from "../floor2VocalBooth3D.js";

const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
let permissionRequests = 0;
let stoppedTracks = 0;
let disconnectedPitchNodes = 0;

const microphoneStream = {
  getTracks() {
    return [{ stop() { stoppedTracks += 1; } }];
  }
};

Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: {
    mediaDevices: {
      async getUserMedia() {
        permissionRequests += 1;
        return microphoneStream;
      }
    }
  }
});

try {
  StudioRecordingEngine.activeTake = null;
  StudioRecordingEngine.activeTrackTake = null;

  await assert.rejects(
    StudioRecordingEngine.startTake({
      audio: { state: "running" },
      beatOutput: {},
      pitchCorrectionNode: { disconnect() { disconnectedPitchNodes += 1; } },
      shouldCancel: (() => {
        let checks = 0;
        return () => ++checks > 1;
      })()
    }),
    /Recording start was cancelled/
  );

  assert.equal(permissionRequests, 1, "microphone permission should resolve before this cancellation case");
  assert.equal(stoppedTracks, 1, "a stream granted after cancellation must be stopped");
  assert.equal(disconnectedPitchNodes, 1, "the uncommitted pitch-correction node must be disconnected");
  assert.equal(StudioRecordingEngine.activeTake, null, "a cancelled initialization must not publish an active take");

  const permissionRequestsBeforeTrackCancel = permissionRequests;
  const stoppedTracksBeforeTrackCancel = stoppedTracks;
  let trackCancelChecks = 0;
  await assert.rejects(
    StudioRecordingEngine.startTrackRecording({
      audio: { state: "running" },
      trackId: "voice-notes-cancel-test",
      shouldCancel: () => ++trackCancelChecks > 1
    }),
    /Track recording start was cancelled/
  );
  assert.equal(permissionRequests, permissionRequestsBeforeTrackCancel + 1);
  assert.equal(stoppedTracks, stoppedTracksBeforeTrackCancel + 1, "a Voice Notes stream granted after Booth disposal must be stopped");
  assert.equal(StudioRecordingEngine.activeTrackTake, null, "cancelled Voice Notes startup must not publish an active track take");

  let unexpectedPermissionRequest = false;
  await assert.rejects(
    StudioRecordingEngine.startTake({
      audio: { state: "running" },
      beatOutput: {},
      shouldCancel: () => true
    }),
    /Recording start was cancelled/
  );
  unexpectedPermissionRequest = permissionRequests !== 1;
  assert.equal(unexpectedPermissionRequest, false, "an already-cancelled request must not open the microphone");

  let boothCancelCalls = 0;
  let boothCleanupCalls = 0;
  await disposeVocalBoothPanel({
    recordingStartPending: true,
    cancelRecordingStart() { boothCancelCalls += 1; }
  }, () => { boothCleanupCalls += 1; });
  assert.equal(boothCancelCalls, 1, "disposing a booth must cancel a pending count-in");
  assert.equal(boothCleanupCalls, 1, "booth event listeners must be cleaned up");

  await disposeVocalBoothPanel({
    recordingStartPending: false,
    cancelRecordingStart() { boothCancelCalls += 1; }
  }, () => { boothCleanupCalls += 1; });
  assert.equal(boothCancelCalls, 1, "disposing an idle booth must not cancel a new recording");
  assert.equal(boothCleanupCalls, 2);

  let stopActiveTakeCalls = 0;
  StudioRecordingEngine.activeTake = { id: "active-booth-take" };
  await disposeVocalBoothPanel({
    async stopRecording() {
      stopActiveTakeCalls += 1;
      StudioRecordingEngine.activeTake = null;
    }
  }, () => {}, { dataset: {} });
  assert.equal(stopActiveTakeCalls, 1, "disposing a Booth with an active vocal take must stop and save it");
  assert.equal(StudioRecordingEngine.activeTake, null);

  const originalStopTrackRecording = StudioRecordingEngine.stopTrackRecording;
  const originalTracks = StudioMultitrackWorkspace.tracks;
  const originalPlayheadBar = StudioMultitrackWorkspace.playheadBar;
  const originalGetTempoAtBar = StudioMultitrackWorkspace.getTempoAtBar;
  const originalRender = StudioMultitrackWorkspace.render;
  const originalAutosave = StudioMultitrackWorkspace.scheduleProjectAutosave;
  const voiceTrack = { id: "voice-note-dispose-test", clips: [] };
  const voiceRoot = { dataset: { voiceNoteTrackId: voiceTrack.id } };
  StudioRecordingEngine.activeTrackTake = { trackId: voiceTrack.id };
  StudioRecordingEngine.stopTrackRecording = async trackId => {
    assert.equal(trackId, voiceTrack.id);
    StudioRecordingEngine.activeTrackTake = null;
    return {
      id: "voice-note-dispose-take",
      blob: new Blob([new Uint8Array([1, 2, 3])]),
      recordingFormat: "Browser MediaRecorder",
      durationMs: 1000
    };
  };
  StudioMultitrackWorkspace.tracks = [voiceTrack];
  StudioMultitrackWorkspace.playheadBar = 1;
  StudioMultitrackWorkspace.getTempoAtBar = () => 100;
  StudioMultitrackWorkspace.render = () => {};
  StudioMultitrackWorkspace.scheduleProjectAutosave = () => {};
  await disposeVocalBoothPanel({}, () => {}, voiceRoot);
  assert.equal(voiceTrack.clips.length, 1, "disposing during Voice Notes must save the active note to the song timeline");
  assert.equal(voiceRoot.dataset.voiceNoteTrackId, undefined);
  assert.equal(StudioRecordingEngine.activeTrackTake, null);
  StudioRecordingEngine.stopTrackRecording = originalStopTrackRecording;
  StudioMultitrackWorkspace.tracks = originalTracks;
  StudioMultitrackWorkspace.playheadBar = originalPlayheadBar;
  StudioMultitrackWorkspace.getTempoAtBar = originalGetTempoAtBar;
  StudioMultitrackWorkspace.render = originalRender;
  StudioMultitrackWorkspace.scheduleProjectAutosave = originalAutosave;

  console.log("Studio recording cancellation, Voice Notes startup cancellation, Booth take finalization, and resource cleanup checks passed.");
} finally {
  StudioRecordingEngine.activeTake = null;
  StudioRecordingEngine.activeTrackTake = null;
  StudioRecordingEngine.activeTrackTakes = [];
  if (originalNavigator) {
    Object.defineProperty(globalThis, "navigator", originalNavigator);
  } else {
    delete globalThis.navigator;
  }
}
