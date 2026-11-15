import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [security, paparazzi, main, engine, performance, postPerformance, audience, workflow] = await Promise.all([
  readFile(new URL("../heroSecurityDetail.js", import.meta.url), "utf8"),
  readFile(new URL("../festivalPaparazzi.js", import.meta.url), "utf8"),
  readFile(new URL("../main.js", import.meta.url), "utf8"),
  readFile(new URL("../engine.js", import.meta.url), "utf8"),
  readFile(new URL("../heroPerformance.js", import.meta.url), "utf8"),
  readFile(new URL("../heroPostPerformance.js", import.meta.url), "utf8"),
  readFile(new URL("../festivalAudienceZone.js", import.meta.url), "utf8"),
  readFile(new URL("../.github/workflows/world-system-checks.yml", import.meta.url), "utf8")
]);

assert.match(security, /heroSecurityGuardLeft/, "The first security guard must have a stable scene identity");
assert.match(security, /heroSecurityGuardRight/, "The second security guard must have a stable scene identity");
assert.match(security, /LEFT_STAGE_POST/, "The left guard must have a dedicated stage-side post");
assert.match(security, /RIGHT_STAIR_POST/, "The right guard must protect the bottom of HERO's right staircase");
assert.match(security, /state === "ENTERING" \|\| state === "PERFORMING"/, "Both guards must take their performance positions when HERO enters");
assert.match(security, /left\.mode = "STAGE_POST"/, "The left guard must hold his stage-side post during the performance");
assert.match(security, /right\.mode = "STAIR_POST"/, "The right guard must hold the stair post during the performance and exit");
assert.match(security, /state === "EXITING"/, "The security detail must coordinate with HERO's existing exit state");
assert.match(security, /left\.mode = "ESCORTING"/, "The left guard must escort HERO behind him on the exit");
assert.match(security, /hero\.position\.x >= 33\.2/, "The stair guard must wait until HERO clears the bottom landing before rejoining");
assert.match(security, /followTarget\(hero, guard\)/, "Both guards must follow HERO outside the performance sequence");
assert.match(security, /collision\?\.isBlocked\?\.\(x, z, 0\.42/, "Following guards must respect safe waterfront surfaces and world obstacles");
assert.match(security, /const xOnly = \{ x: fullX, z: root\.position\.z \}/, "Guards must slide along blocked obstacles instead of freezing");
assert.match(security, /onNarrowHQSpur/, "Guards must form a single-file escort on the narrow HQ dock spur");
assert.match(security, /sideOffset = onNarrowHQSpur \? 0/, "The narrow HQ spur must keep the escort centered on the walkway");
assert.match(security, /homeOffset: guards\.length === 0/, "One guard must stay closer while the other maintains more distance");
assert.doesNotMatch(security, /new THREE\.PointLight|setInterval\(|setTimeout\(/, "Security must not add expensive lights or timer-driven work");

assert.equal([...paparazzi.matchAll(/-?\d+\.\d+/g)].length > 0, true);
assert.match(paparazzi, /const POSITIONS = \[-11, -3\.7, 3\.7, 11\]/, "Four photographers must fit within the existing media pit");
assert.match(paparazzi, /festivalPaparazzi_/, "Photographers must have stable scene identities");
assert.match(paparazzi, /state === "ENTERING" \|\| state === "PERFORMING" \|\| state === "EXITING"/, "Photographers must react to HERO's entrance, performance, and exit");
assert.match(paparazzi, /emissiveIntensity = pulse/, "Camera flashes must be visual emissive pulses rather than new lights");
assert.doesNotMatch(paparazzi, /new THREE\.PointLight|setInterval\(|setTimeout\(/, "Paparazzi must not add expensive lights or timer-driven work");

assert.match(audience, /grandStagePhotographerMediaPit/, "Photographers must use the already-built media pit");
assert.match(main, /import HeroSecurityDetail from "\.\/heroSecurityDetail\.js"/);
assert.match(main, /import FestivalPaparazzi from "\.\/festivalPaparazzi\.js"/);
assert.match(main, /heroSecurityDetail: HeroSecurityDetail/);
assert.match(main, /festivalPaparazzi: FestivalPaparazzi/);
assert.ok(main.indexOf("heroPostPerformance,") < main.indexOf("heroSecurityDetail: HeroSecurityDetail"));
assert.ok(engine.indexOf("this.systems.heroPostPerformance?.init") < engine.indexOf("this.systems.heroSecurityDetail?.init"));
assert.ok(engine.indexOf("this.systems.heroSecurityDetail?.init") < engine.indexOf("this.systems.festivalPaparazzi?.init"));

assert.match(performance, /const STAIR_BOTTOM_X = 29\.55/, "The approved HERO staircase landing must remain unchanged");
assert.match(performance, /state = "COMPLETE"/, "The existing performance completion state must remain intact");
assert.match(postPerformance, /new THREE\.Vector3\(35, 1\.3, -74\)/, "The approved HERO exit route must remain intact");
assert.match(postPerformance, /new THREE\.Vector3\(23, 1\.3, 14\.15\)/, "The approved HQ destination must remain intact");

for (const path of ["heroSecurityDetail.js", "festivalPaparazzi.js", "scripts/test-hero-security-and-paparazzi.mjs"]) {
  assert.ok(workflow.includes(path), "World workflow must watch " + path);
}
assert.match(workflow, /Test HERO security detail and festival paparazzi/);
console.log("LAMBO CITY HERO security and festival paparazzi checks passed.");
