import assert from "node:assert/strict";
import { scheduleStudioMetronome, stopStudioMetronome } from "../studioMetronome.js";

class FakeParam {
  events = [];
  setValueAtTime(value, time) { this.events.push(["set", value, time]); }
  exponentialRampToValueAtTime(value, time) { this.events.push(["ramp", value, time]); }
}
class FakeGain {
  gain = new FakeParam();
  connect() {}
  disconnect() { this.disconnected = true; }
}
class FakeOscillator {
  frequency = { value: 0 };
  connect() {}
  start(time) { this.startedAt = time; }
  stop(time) { this.stopCalls = (this.stopCalls || 0) + 1; if (Number.isFinite(time)) this.stoppedAt = time; }
  disconnect() { this.disconnected = true; }
}
const context = {
  state: "running",
  currentTime: 9.9,
  destination: {},
  oscillators: [],
  createOscillator() {
    const node = new FakeOscillator();
    this.oscillators.push(node);
    return node;
  },
  createGain() { return new FakeGain(); }
};
const getSecondsAtBar = bar => bar <= 2 ? (bar - 1) * 2 : 2 + (bar - 2) * 1.5;
const getTimeSignatureAtBar = bar => bar >= 2
  ? { numerator: 3, denominator: 4 }
  : { numerator: 4, denominator: 4 };

const scheduled = scheduleStudioMetronome(context, {
  startBar: 1,
  endBar: 3,
  startTime: 10,
  getSecondsAtBar,
  getTimeSignatureAtBar,
  volume: 0.16,
  accent: true
});
assert.equal(scheduled.length, 7, "4/4 followed by 3/4 should schedule seven quarter-note clicks.");
assert.deepEqual(
  scheduled.map(click => Number(click.source.startedAt.toFixed(3))),
  [10, 10.5, 11, 11.5, 12, 12.5, 13],
  "Click timing should follow the session bar clock and meter changes."
);
assert.equal(scheduled[0].source.frequency.value, 1480, "The first beat should be accented.");
assert.equal(scheduled[1].source.frequency.value, 980, "Non-downbeats should use the regular click.");
assert.equal(scheduled[4].source.frequency.value, 1480, "The next bar downbeat should be accented.");

stopStudioMetronome(scheduled);
assert.equal(scheduled.length, 0, "Stopping should clear the scheduled click list.");
assert.ok(context.oscillators.every(node => node.stopCalls > 0), "Stopping should stop all scheduled oscillators.");

console.log("Studio metronome scheduling checks passed.");
