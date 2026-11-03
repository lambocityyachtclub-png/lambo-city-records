import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../vendor/lamejs/lame.min.js", import.meta.url), "utf8");
const sandbox = { console };
vm.runInNewContext(source, sandbox, { timeout: 15000 });

assert.equal(typeof sandbox.lamejs, "function", "LAME library should expose its global encoder.");
assert.equal(typeof sandbox.lamejs.Mp3Encoder, "function", "LAME should expose Mp3Encoder.");

const encoder = new sandbox.lamejs.Mp3Encoder(2, 44100, 192);
const left = new Int16Array(1152);
const right = new Int16Array(1152);
for (let index = 0; index < left.length; index += 1) {
  const sample = Math.sin((2 * Math.PI * 440 * index) / 44100) * 12000;
  left[index] = sample;
  right[index] = sample;
}
const frame = encoder.encodeBuffer(left, right);
const tail = encoder.flush();
assert.ok(frame.length + tail.length > 0, "MP3 encoder should produce encoded frame data.");
assert.equal(frame[0] & 0xff, 0xff, "MP3 stream should begin with an MPEG frame sync byte.");

console.log("DAW MP3 encoder smoke test passed.");
