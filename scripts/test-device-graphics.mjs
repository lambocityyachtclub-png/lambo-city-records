import assert from "node:assert/strict";
import { chooseTier, PROFILES } from "../deviceGraphics.js";
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

const renderer = await readFile(new URL("../renderer.js", import.meta.url), "utf8");
const monitor = await readFile(new URL("../performanceMonitor.js", import.meta.url), "utf8");
assert.match(renderer, /DeviceGraphics\.getProfile\(\)/);
assert.match(renderer, /DeviceGraphics\.applyRendererProfile\(renderer\)/);
assert.match(renderer, /removeEventListener\("resize", resizeHandler\)/);
assert.match(monitor, /QUALITY\s+\s*\+ snapshot\.graphicsTier\.toUpperCase\(\)/);
assert.match(monitor, /params\.get\("perf"\) === "1"/);

console.log("Adaptive device graphics profile tests passed.");
