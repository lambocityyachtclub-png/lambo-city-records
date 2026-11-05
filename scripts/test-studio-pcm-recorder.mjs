import assert from "node:assert/strict";
import { createStudioPCMRecorder } from "../studioPCMRecorder.js";

class FakeGain {
  gain = { value: 1 };
  connected = false;
  connect() { this.connected = true; }
  disconnect() { this.connected = false; }
}
class FakeWorkletNode {
  constructor(context, processorName, options) {
    this.context = context;
    this.processorName = processorName;
    this.options = options;
    this.connected = false;
    this.disconnected = false;
    this.port = {
      onmessage: null,
      closed: false,
      postMessage: message => {
        if (message.type !== "flush") return;
        const channels = [
          new Float32Array([0, 1]),
          new Float32Array([-1, 0])
        ];
        this.port.onmessage?.({ data: { type: "chunk", channels } });
        this.port.onmessage?.({ data: { type: "flush-complete" } });
      },
      close() { this.closed = true; }
    };
  }
  connect() { this.connected = true; }
  disconnect() { this.disconnected = true; }
}

globalThis.AudioWorkletNode = FakeWorkletNode;
const audio = {
  state: "running",
  sampleRate: 48000,
  destination: {},
  audioWorklet: { async addModule(url) { this.loadedUrl = url; } },
  createGain() { return new FakeGain(); }
};

const recorder = await createStudioPCMRecorder(audio);
assert.ok(recorder, "AudioWorklet-capable browsers should use the PCM recorder.");
assert.equal(recorder.recordingFormat, "24-bit PCM WAV");
assert.equal(recorder.node.processorName, "lambo-city-pcm-recorder");
assert.ok(audio.audioWorklet.loadedUrl.endsWith("/studioPCMRecorderWorklet.js"));

const blob = await recorder.finish();
const bytes = new Uint8Array(await blob.arrayBuffer());
const view = new DataView(bytes.buffer);
assert.equal(blob.type, "audio/wav");
assert.equal(view.getUint16(34, true), 24);
assert.equal(view.getUint32(24, true), 48000);
assert.equal(view.getUint32(40, true), 12);
assert.deepEqual(Array.from(bytes.slice(47, 50)), [0, 0, 128], "Mono/stereo PCM samples should be interleaved in signed 24-bit little-endian order.");
recorder.dispose();
assert.ok(recorder.node.disconnected);
assert.ok(recorder.node.port.closed);

const fallback = await createStudioPCMRecorder({ state: "running" });
assert.equal(fallback, null, "Unsupported browsers should retain the MediaRecorder fallback.");

console.log("Studio PCM recorder adapter tests passed.");
