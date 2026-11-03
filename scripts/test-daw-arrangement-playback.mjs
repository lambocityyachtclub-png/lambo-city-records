import assert from "node:assert/strict";
import { createStudioDAWArrangementPlayback } from "../studioDAWArrangementPlayback.js";

class Param {
  constructor(value = 0) { this.value = value; this.events = []; }
  setTargetAtTime(value, time, constant) { this.value = value; this.events.push(["target", value, time, constant]); }
  setValueAtTime(value, time) { this.value = value; this.events.push(["set", value, time]); }
  linearRampToValueAtTime(value, time) { this.value = value; this.events.push(["ramp", value, time]); }
  cancelScheduledValues(time) { this.events.push(["cancel", time]); }
}
class AudioNode {
  constructor(context, kind) {
    this.context = context; this.kind = kind; this.connections = [];
    this.gain = new Param(1); this.pan = new Param(0);
    this.frequency = new Param(440); this.Q = new Param(1);
    this.threshold = new Param(-18); this.knee = new Param(18);
    this.ratio = new Param(1); this.attack = new Param(0.003);
    this.release = new Param(0.25); this.delayTime = new Param(0.28);
    this.type = kind; this.disconnectCount = 0;
  }
  connect(node) { this.connections.push(node); return node; }
  disconnect() { this.disconnectCount += 1; this.connections = []; }
  start(time) { this.startedAt = time; }
  stop() { this.stopped = true; }
}
class AudioMock {
  constructor() {
    this.state = "running"; this.currentTime = 2; this.sampleRate = 44100;
    this.destination = new AudioNode(this, "destination"); this.nodes = [];
  }
  make(kind) { const node = new AudioNode(this, kind); this.nodes.push(node); return node; }
  createGain() { return this.make("gain"); }
  createBiquadFilter() { return this.make("filter"); }
  createDynamicsCompressor() { return this.make("compressor"); }
  createStereoPanner() { return this.make("panner"); }
  createDelay() { return this.make("delay"); }
  createConvolver() { return this.make("convolver"); }
  createBuffer(channels, length) {
    const data = Array.from({ length: channels }, () => new Float32Array(length));
    return { getChannelData: index => data[index] };
  }
  createBufferSource() { return this.make("source"); }
  async decodeAudioData() { return { duration: 4, numberOfChannels: 2 }; }
}

const audio = new AudioMock();
const messages = [];
const playback = createStudioDAWArrangementPlayback({
  getAudioContext: async () => audio,
  getTempo: () => 120,
  onStatus: message => messages.push(message)
});
const clip = new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" });
const tracks = [{
  id: "track-1",
  name: "Vocals",
  volume: 80,
  pan: -0.5,
  muted: false,
  solo: false,
  eq: { low: -2, mid: 1.5, high: 3 },
  compression: { threshold: -20, ratio: 3 },
  effects: { delayTime: 0.4, delayFeedback: 0.35, delayMix: 0.2, reverbMix: 0.3, reverbDecay: 2.8 },
  automation: { volume: [{ bar: 1, value: 75 }, { bar: 5, value: 50 }] },
  clips: [{ blob: clip, startBar: 3 }]
}];

assert.equal(await playback.play(tracks), true);
assert.equal(playback.sources.length, 1);
const channel = playback.trackChannels.get("track-1");
assert.ok(channel, "one channel strip is created for the audio track");
assert.equal(channel.panner.pan.value, -0.5);
assert.equal(channel.low.gain.value, -2);
assert.equal(channel.mid.gain.value, 1.5);
assert.equal(channel.high.gain.value, 3);
assert.equal(channel.compressor.ratio.value, 3);
assert.equal(channel.effects.delay.delayTime.value, 0.4);
assert.equal(channel.effects.delayWet.gain.value, 0.2);
assert.equal(channel.effects.reverbWet.gain.value, 0.3);
assert.deepEqual(channel.automationGain.gain.events.filter(event => event[0] === "set" || event[0] === "ramp").map(event => event[1]), [1, 0.75, 0.5]);
assert.equal(playback.sources[0].source.startedAt, 2 + 0.12 + 4);
assert.ok(messages.some(message => message.includes("Arrangement playing")));

playback.stop();
assert.equal(playback.playing, false);
assert.equal(playback.sources.length, 0);
assert.equal(playback.trackChannels.size, 0);
console.log("DAW arrangement playback, mixer, effects, and automation tests passed.");
