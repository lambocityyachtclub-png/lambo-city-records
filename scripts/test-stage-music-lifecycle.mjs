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
    this.loadCount = 0;
    FakeAudio.lastInstance = this;
  }
  addEventListener(name, callback) {
    (this.listeners[name] ||= []).push(callback);
  }
  play() {
    if (FakeAudio.blockPlayback) return Promise.reject(new Error("NotAllowedError"));
    this.paused = false;
    this.ended = false;
    return Promise.resolve();
  }
  load() { this.loadCount++; }
  pause() { this.paused = true; }
  emit(name) {
    for (const callback of this.listeners[name] || []) callback();
  }
}

globalThis.Audio = FakeAudio;
const windowListeners = {};
globalThis.window = {
  addEventListener(name, callback, capture) {
    (windowListeners[name] ||= []).push({ callback, capture });
  }
};

const { default: StageMusic } = await import("../stageMusic.js?lifecycle-test");
StageMusic.init();
const instance = FakeAudio.lastInstance;
assert.ok(instance, "StageMusic should create one media element");
assert.ok((windowListeners.pointerdown || []).some(item => item.capture === true),
  "Stage music must observe the first iPad pointer gesture in capture phase");
assert.ok((windowListeners.touchend || []).some(item => item.capture === true),
  "Stage music must support iPad touch-end gesture unlocking");

FakeAudio.blockPlayback = true;
StageMusic.playFromStart();
await Promise.resolve();
assert.equal(StageMusic.isPlaying(), false,
  "A browser playback-policy rejection must not be reported as playing");

FakeAudio.blockPlayback = false;
windowListeners.pointerdown[0].callback();
await Promise.resolve();
assert.equal(StageMusic.isPlaying(), true,
  "A later user gesture must retry the queued performance track");
assert.ok(instance.loadCount > 0,
  "The selected media source must be loaded before playback retry");

const audio = StageMusic.getCurrentTrack();
assert.equal(audio.title, "HERO - Lets Rage");
assert.equal(StageMusic.isPlaying(), true,
  "The one-shot performance track should start");
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
