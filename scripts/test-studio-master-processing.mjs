import assert from "node:assert/strict";
import StudioAudioEngine from "../studioAudioEngine.js";
import { readFile } from "node:fs/promises";

const mixMasterApp = await readFile(new URL("../studioMixMasterApp.js", import.meta.url), "utf8");
assert.match(mixMasterApp, /data-master-limiter-toggle/);
assert.match(mixMasterApp, /data-master-limiter-ceiling/);
assert.match(mixMasterApp, /StudioAudioEngine\.setMasterLimiter/);
assert.match(mixMasterApp, /limiterEnabled/);
assert.match(mixMasterApp, /limiterCeilingDb/);
assert.match(mixMasterApp, /LIMITER BYPASSED/);

function param() {
  return {
    value: 0,
    events: [],
    setTargetAtTime(value, time, constant) {
      this.value = value;
      this.events.push({ value, time, constant });
    }
  };
}

StudioAudioEngine.context = { currentTime: 3.5 };
StudioAudioEngine.limiter = { threshold: param() };
StudioAudioEngine.limiterOutput = { gain: param() };
StudioAudioEngine.limiterBypass = { gain: param() };

const disabled = StudioAudioEngine.setMasterLimiter(false, -2.5);
assert.deepEqual(disabled, { enabled: false, ceilingDb: -2.5 });
assert.equal(StudioAudioEngine.limiter.threshold.value, -2.5);
assert.equal(StudioAudioEngine.limiterOutput.gain.value, 0);
assert.equal(StudioAudioEngine.limiterBypass.gain.value, 1);

const enabled = StudioAudioEngine.setMasterLimiter(true, -1);
assert.deepEqual(enabled, { enabled: true, ceilingDb: -1 });
assert.equal(StudioAudioEngine.limiterOutput.gain.value, 1);
assert.equal(StudioAudioEngine.limiterBypass.gain.value, 0);
assert.throws(() => StudioAudioEngine.setMasterLimiter(true, -8), /between -6 and 0/);

StudioAudioEngine.masterAnalyser = {
  getFloatTimeDomainData(buffer) {
    buffer.fill(0);
    buffer[0] = 0.5;
    buffer[1] = -0.5;
    buffer[2] = 1;
  }
};
const meter = StudioAudioEngine.getMasterMeter();
assert.equal(meter.peak, 1);
assert.equal(meter.peakDb, 0);
assert.equal(meter.clipping, true);
assert.ok(meter.rms > 0);

console.log("Studio master limiter and output meter tests passed.");
