import assert from "node:assert/strict";
import { encodeStudioWav } from "../studioDAWExport.js";

const channels = [
  new Float32Array([0, -1, 0.5]),
  new Float32Array([1, 0, -0.5])
];
const audioBuffer = {
  numberOfChannels: 2,
  length: 3,
  sampleRate: 48000,
  getChannelData(channel) { return channels[channel]; }
};

for (const bitDepth of [16, 24, 32]) {
  const blob = encodeStudioWav(audioBuffer, { bitDepth });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer);
  const bytesPerSample = bitDepth / 8;
  assert.equal(blob.type, "audio/wav");
  assert.equal(view.getUint32(24, true), 48000, "WAV should preserve the render sample rate.");
  assert.equal(view.getUint16(34, true), bitDepth, "WAV header should declare the requested PCM depth.");
  assert.equal(view.getUint16(22, true), 2, "WAV should preserve stereo channels.");
  assert.equal(view.getUint32(40, true), 3 * 2 * bytesPerSample, "WAV data size should match frames, channels, and bit depth.");
  assert.equal(bytes.length, 44 + 3 * 2 * bytesPerSample, "WAV should contain a standard 44-byte PCM header.");
}

const wav24 = new Uint8Array(await encodeStudioWav(audioBuffer, { bitDepth: 24 }).arrayBuffer());
assert.deepEqual(Array.from(wav24.slice(47, 50)), [255, 255, 127], "Positive full scale should encode as signed 24-bit PCM.");
assert.throws(() => encodeStudioWav(audioBuffer, { bitDepth: 20 }), /16, 24, or 32-bit/);

console.log("Studio WAV PCM depth and header tests passed.");
