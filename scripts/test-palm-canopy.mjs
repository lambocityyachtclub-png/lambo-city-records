import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../palms.js", import.meta.url), "utf8");
const expectedPositions = [
  "{x:-16,z:5,h:10,lean:0.08}", "{x:-20,z:-10,h:12,lean:0.12}",
  "{x:-17,z:-25,h:9,lean:0.06}", "{x:-22,z:-42,h:13,lean:0.10}",
  "{x:16,z:5,h:10,lean:-0.08}", "{x:20,z:-10,h:12,lean:-0.12}",
  "{x:17,z:-25,h:9,lean:-0.06}", "{x:22,z:-42,h:13,lean:-0.10}"
];

for (const position of expectedPositions) {
  assert.ok(source.includes(position), `Approved palm placement changed: ${position}`);
}
assert.equal((source.match(/makeFrondGeometry\(length, angle, droop\)/g) || []).length, 1);
assert.match(source, /const frondCount = 11;/);
assert.match(source, /palm\.position\.set\(p\.x, 0\.5, p\.z\)/);
assert.match(source, /trunk\.rotation\.z = p\.lean/);
assert.doesNotMatch(source, /PointLight|SpotLight/);

console.log("Palm canopy regression checks passed: all 8 approved placements, lean, layered fronds, and no added lights.");
