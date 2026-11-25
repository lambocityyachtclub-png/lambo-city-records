import assert from "node:assert/strict";

class FakeAudio {
  constructor() {
    this.paused = true;
    this.ended = false;
    this.loop = false;
    this.currentTime = 0;
    this.volume = 1;
    this.listeners = {};
    this.src = "";
    FakeAudio.lastInstance = this;
  }
  addEventListener(name, callback) {
    (this.listeners[name] ||= []).push(callback);
  }
  play() {
    this.paused = false;
    this.ended = false;
    return Promise.resolve();
  }
  pause() { this.paused = true; }
  emit(name) {
    for (const callback of this.listeners[name] || []) callback();
  }
}

globalThis.Audio = FakeAudio;
globalThis.window = { addEventListener() {} };

const { default: StageMusic } = await import("../stageMusic.js?lifecycle-test");
StageMusic.init();
StageMusic.playFromStart();
await Promise.resolve();

const audio = StageMusic.getCurrentTrack();
assert.equal(audio.title, "HERO - Lets Rage");
assert.equal(StageMusic.isPlaying(), true,
  "The one-shot performance track should start");
const instance = (() => {
  // The fake media element is exposed by the test constructor below.
  return FakeAudio.lastInstance;
})();
assert.ok(instance, "StageMusic should create one media element");
assert.equal(instance.loop, false,
  "The HERO performance track must not loop or restart automatically");

instance.currentTime = 123;
instance.ended = true;
instance.paused = true;
instance.emit("ended");

assert.equal(StageMusic.hasEnded(), true,
  "The ended event must set the terminal signal for HERO's exit controller");
assert.equal(StageMusic.isPlaying(), false,
  "The ended media element must no longer report as playing");
assert.equal(instance.currentTime, 0,
  "The ended handler should reset the playhead only after recording the terminal signal");

StageMusic.playFromStart();
await Promise.resolve();
assert.equal(StageMusic.hasEnded(), false,
  "An intentional new performance should clear the previous ended signal");
assert.equal(instance.loop, false,
  "A new performance must remain one-shot");

// Confirms the one-shot track lifecycle without requiring a browser audio device.
console.log("Stage music lifecycle checks passed: one-shot playback, ended signal, and explicit restart only.");
