import assert from "node:assert/strict";
import StudioRecordingEngine from "../studioRecordingEngine.js";

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

  console.log("Studio recording cancellation and resource cleanup checks passed.");
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
