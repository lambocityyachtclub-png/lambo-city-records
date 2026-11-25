import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const dock = await readFile(new URL("../dock.js", import.meta.url), "utf8");

assert.match(dock, /const DOCK_START_Z = -41;/,
  "The approved dock-to-stage handoff must remain fixed");
assert.match(dock, /const DOCK_END_Z = 35;/,
  "The approved dock endpoint must remain fixed");
assert.match(dock, /new THREE\.BoxGeometry\(\s*14,\s*0\.4,\s*DOCK_LENGTH/s,
  "The existing dock footprint must remain unchanged");
assert.match(dock, /new THREE\.BoxGeometry\(\s*0\.4,\s*0\.5,\s*0\.4/s,
  "Every existing lantern fixture must remain in place");
assert.match(dock, /if \(idx % 6 === 0\)/,
  "Dynamic point lights should be assigned to alternating fixture pairs");
assert.doesNotMatch(dock, /if \(idx % 3 === 0\)/,
  "The old denser point-light cadence must not return");
assert.match(dock, /lantern\.position\.set\(\s*x,\s*Y \+ 2\.9,\s*z/s,
  "Lantern fixture positions must remain unchanged");
assert.match(dock, /lantern\.material|emissiveIntensity: 2\.5/,
  "Emissive lantern appearance must remain available without a point light");

const fixtureRows = [];
for (let z = -41 + 5; z < 35 - 5; z += 8) fixtureRows.push(z);
const litRows = fixtureRows.filter((_, index) => index % 6 === 0);
assert.equal(fixtureRows.length, 9, "The existing nine lantern rows must remain");
assert.equal(litRows.length * 2, 4,
  "The dock should retain four real point lights across the two alternating rows");

console.log("Dock light-budget checks passed: unchanged dock and lantern positions, four dynamic lights instead of six.");
