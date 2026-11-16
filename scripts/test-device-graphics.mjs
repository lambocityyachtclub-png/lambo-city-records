import assert from "node:assert/strict";
import { chooseTier, PROFILES } from "../deviceGraphics.js";
import DeviceGraphics from "../deviceGraphics.js";
import { readFile } from "node:fs/promises";

assert.equal(chooseTier({ mobile: true, memory: 3, cores: 8 }), "low");
assert.equal(chooseTier({ mobile: true, memory: 8, cores: 8 }), "balanced");
assert.equal(chooseTier({ mobile: false, memory: 16, cores: 10 }), "ultra");
assert.equal(chooseTier({ mobile: false, memory: 8, cores: 8 }), "high");
assert.equal(chooseTier({ mobile: false, memory: null, cores: 4 }), "low");
assert.equal(chooseTier({ mobile: false, memory: null, cores: null }), "balanced");

assert.deepEqual(
  Object.keys(PROFILES).sort(),
  ["balanced", "high", "low", "ultra"]
);
assert.equal(PROFILES.low.antialias, false);
assert.equal(PROFILES.high.antialias, true);
assert.equal(PROFILES.ultra.maxPixelRatio, 2);

// Verify the profile applies its cap and preserves an adaptive ratio across resize.
globalThis.window = {
  innerWidth: 1024,
  innerHeight: 768,
  devicePixelRatio: 2,
  location: { search: "?quality=high" }
};
const fakeRenderer = {
  ratio: 1,
  sizes: [],
  setPixelRatio(value) { this.ratio = value; },
  getPixelRatio() { return this.ratio; },
  setSize(width, height) { this.sizes.push([width, height]); }
};
const initial = DeviceGraphics.applyRendererProfile(fakeRenderer);
assert.equal(initial.tier, "high");
assert.equal(initial.effectiveMaxPixelRatio, 1.5);
assert.equal(fakeRenderer.getPixelRatio(), 1.5);

fakeRenderer.setPixelRatio(1.2);
window.devicePixelRatio = 1.25;
const resized = DeviceGraphics.applyRendererProfile(fakeRenderer, { preserveCurrent: true });
assert.equal(resized.effectiveMaxPixelRatio, 1.25);
assert.equal(fakeRenderer.getPixelRatio(), 1.2);

window.devicePixelRatio = 1;
const constrained = DeviceGraphics.applyRendererProfile(fakeRenderer, { preserveCurrent: true });
assert.equal(constrained.effectiveMaxPixelRatio, 1);
assert.equal(fakeRenderer.getPixelRatio(), 1);
assert.deepEqual(fakeRenderer.sizes, [[1024, 768], [1024, 768], [1024, 768]]);

const renderer = await readFile(new URL("../renderer.js", import.meta.url), "utf8");
const monitor = await readFile(new URL("../performanceMonitor.js", import.meta.url), "utf8");
assert.match(renderer, /DeviceGraphics\.getProfile\(\)/);
assert.match(renderer, /DeviceGraphics\.applyRendererProfile\(renderer/);
assert.match(renderer, /removeEventListener\("resize", resizeHandler\)/);
assert.match(renderer, /update\(delta\)/);
assert.match(renderer, /averageFrameMs > 22/);
assert.match(renderer, /averageFrameMs < 17\.5/);
assert.match(renderer, /lastQualityChange >= 4000/);
assert.ok(monitor.includes('"QUALITY      " + snapshot.graphicsTier.toUpperCase()'));
assert.match(monitor, /params\.get\("perf"\) === "1"/);

console.log("Adaptive device graphics profile and runtime adaptation tests passed.");
