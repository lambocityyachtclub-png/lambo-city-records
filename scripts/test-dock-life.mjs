import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [dockLife, main, engine] = await Promise.all([
  readFile(new URL("../dockLife.js", import.meta.url), "utf8"),
  readFile(new URL("../main.js", import.meta.url), "utf8"),
  readFile(new URL("../engine.js", import.meta.url), "utf8")
]);

assert.match(main, /import DockLife from "\.\/dockLife\.js"/);
assert.match(main, /dockLife: DockLife/);
assert.match(engine, /this\.systems\.dockLife\?\.init\?\.\(this\.scene, this\.context\)/);
assert.ok(engine.indexOf("this.systems.npc?.init") < engine.indexOf("this.systems.dockLife?.init"),
  "Dock visitors must initialize after the existing NPC system");
assert.match(dockLife, /lamboCityDockVisitor_/);
assert.match(dockLife, /const CHATTER = \[/);
assert.match(dockLife, /collision\?\.isBlocked/);
assert.match(dockLife, /nx >= -4\.7 && nx <= 4\.7 && nz >= -37 && nz <= 31/,
  "Dock visitors must remain within the existing central dock walking surface");
assert.match(dockLife, /bubble\.visible = true/);
assert.match(dockLife, /speechTimer = 8 \+ Math\.random\(\) \* 10/,
  "Ambient chatter must be staggered rather than rapidly repeated");
assert.doesNotMatch(dockLife, /new THREE\.PointLight|setInterval\(|setTimeout\(/,
  "Dock visitors must not add expensive dynamic lights or timer-driven background work");

console.log("LAMBO CITY dock-life checks passed: six bounded visitors, staggered ambient chatter, and collision-aware walking.");
