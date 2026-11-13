import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { createStudioPitchCorrectionNode, normalizePitchCorrectionSettings } from "../studioPitchCorrection.js";

const source = readFileSync(new URL("../studioPitchCorrectionWorklet.js", import.meta.url), "utf8");
let Processor;
const messages = [];
class AudioWorkletProcessor {
  constructor() {
    this.port = {
      onmessage: null,
      postMessage(message) { messages.push(message); }
    };
  }
}
const sandbox = {
  AudioWorkletProcessor,
  sampleRate: 44100,
  registerProcessor(name, processor) {
    assert.equal(name, "lambo-city-pitch-correction");
    Processor = processor;
  },
  Math,
  Float32Array,
  Number,
  Infinity
};
vm.runInNewContext(source, sandbox, { timeout: 15000 });
assert.equal(typeof Processor, "function", "The vocal pitch processor should register.");

const processor = new Processor({
  processorOptions: {
    enabled: true,
    root: 0,
    scale: "major",
    amount: 100,
    speedMs: 0
  }
});
const input = [new Float32Array(128)];
const output = [new Float32Array(128), new Float32Array(128)];
let peak = 0;
const renderedTail = [];
for (let block = 0; block < 500; block += 1) {
  for (let index = 0; index < 128; index += 1) {
    const sampleIndex = block * 128 + index;
    input[0][index] = Math.sin((2 * Math.PI * 369.994 * sampleIndex) / 44100) * 0.5;
  }
  processor.process([input], [output]);
  for (const channel of output) {
    for (const sample of channel) peak = Math.max(peak, Math.abs(sample));
  }
  if (block >= 300) renderedTail.push(...output[0]);
}
const detected = messages.filter(message => Number.isFinite(message.detectedMidi));
assert.ok(detected.length > 0, "A sustained sung note should be detected.");
const last = detected.at(-1);
assert.ok(Math.abs(last.detectedMidi - 66) < 0.35, "The detector should identify F-sharp 4.");
assert.equal(last.correctedMidi, 65, "F-sharp should correct to F in C major.");
assert.ok(last.confidence > 0.75, "The sustained tone should have strong pitch confidence.");
assert.ok(peak > 0.1, "The processor should pass audible signal output.");
let positiveCrossings = 0;
for (let index = 1; index < renderedTail.length; index += 1) {
  if (renderedTail[index - 1] <= 0 && renderedTail[index] > 0) positiveCrossings += 1;
}
const renderedDuration = renderedTail.length / 44100;
const correctedFrequency = positiveCrossings / renderedDuration;
assert.ok(correctedFrequency > 330 && correctedFrequency < 365,
  "Corrected output should move the sustained F-sharp toward F; measured " + correctedFrequency.toFixed(1) + " Hz.");

processor.port.onmessage({ data: { enabled: false } });
assert.equal(processor.settings.enabled, false, "The effect should support bypass updates.");
processor.port.onmessage({ data: { root: 9, scale: "minor", amount: 70, speedMs: 40 } });
assert.equal(processor.settings.root, 9);
assert.equal(processor.settings.scale, "minor");
assert.equal(processor.settings.amount, 70);
assert.equal(processor.settings.speedMs, 40);

console.log("Vocal pitch detection, scale targeting, signal pass-through, and live controls tests passed.");


const normalized = normalizePitchCorrectionSettings({
  enabled: true,
  root: 13,
  scale: "minor",
  amount: 140,
  speedMs: -10
});
assert.deepEqual(normalized, {
  enabled: true,
  root: 11,
  scale: "minor",
  amount: 100,
  speedMs: 0
});
assert.deepEqual(normalizePitchCorrectionSettings({
  enabled: 1,
  root: Infinity,
  scale: "unsupported",
  amount: NaN,
  speedMs: "fast"
}), {
  enabled: false,
  root: 0,
  scale: "major",
  amount: 100,
  speedMs: 25
});

const originalAudioWorkletNode = globalThis.AudioWorkletNode;
class MockAudioWorkletNode {
  constructor(context, processorName, options) {
    this.context = context;
    this.processorName = processorName;
    this.options = options;
    this.messages = [];
    this.port = { postMessage: message => this.messages.push(message) };
  }
}
globalThis.AudioWorkletNode = MockAudioWorkletNode;
try {
  const moduleLoads = [];
  const context = {
    audioWorklet: {
      addModule(url) {
        moduleLoads.push(url);
        return Promise.resolve();
      }
    }
  };
  const [nodeA, nodeB] = await Promise.all([
    createStudioPitchCorrectionNode(context, { enabled: true, root: 2, scale: "major", amount: 85, speedMs: 18 }),
    createStudioPitchCorrectionNode(context, { enabled: true, root: 2, scale: "major", amount: 85, speedMs: 18 })
  ]);
  assert.equal(moduleLoads.length, 1, "The worklet module should load once per audio context.");
  assert.equal(nodeA.processorName, "lambo-city-pitch-correction");
  assert.equal(nodeB.processorName, "lambo-city-pitch-correction");
  assert.deepEqual(nodeA.options.processorOptions, {
    enabled: true, root: 2, scale: "major", amount: 85, speedMs: 18
  });
  assert.deepEqual(nodeA.messages[0], nodeA.options.processorOptions);
} finally {
  if (originalAudioWorkletNode === undefined) delete globalThis.AudioWorkletNode;
  else globalThis.AudioWorkletNode = originalAudioWorkletNode;
}

console.log("Pitch settings normalization and per-context AudioWorklet loading tests passed.");
