import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [npc, characters, main, engine] = await Promise.all([
  readFile(new URL("../npc.js", import.meta.url), "utf8"),
  readFile(new URL("../characterSystem.js", import.meta.url), "utf8"),
  readFile(new URL("../main.js", import.meta.url), "utf8"),
  readFile(new URL("../engine.js", import.meta.url), "utf8")
]);

const personaIds = [...characters.matchAll(/\{ id: "(crowd-\d{2})"/g)].map(match => match[1]);
const personaNames = [...characters.matchAll(/name: "([A-Za-z]+)", role:/g)].map(match => match[1]);
const roles = [...characters.matchAll(/role: "(dancer|phone|cheerer|spectator)"/g)].map(match => match[1]);

assert.equal(personaIds.length, 16, "The first crowd roster must define all 16 existing stage characters");
assert.equal(new Set(personaIds).size, 16, "Every crowd character must have a stable unique ID");
assert.equal(personaNames.length, 16, "Every crowd character must have a display name");
assert.equal(new Set(personaNames).size, 16, "Every crowd character must have a distinct name");
assert.equal(roles.length, 16, "Every crowd character must have a defined behavior role");
const expectedRoleCounts = { dancer: 5, phone: 4, cheerer: 4, spectator: 3 };
for (const [role, expected] of Object.entries(expectedRoleCounts)) {
  assert.equal(roles.filter(value => value === role).length, expected, "Expected " + expected + " " + role + " personas");
}

assert.match(npc, /getCrowdCharacters\(\)/, "NPC module must expose existing crowd rigs to the reusable character system");
assert.match(npc, /createCrowdArm\(-0\.52, 2\.02/, "Crowd characters must have a left gesture pivot");
assert.match(npc, /createCrowdArm\(0\.52, 2\.02/, "Crowd characters must have a right gesture pivot");
assert.match(npc, /createCrowdLeg\(-0\.23, 0\.84/, "Crowd characters must have an articulated left leg");
assert.match(npc, /createCrowdLeg\(0\.23, 0\.84/, "Crowd characters must have an articulated right leg");
assert.match(npc, /homeX: x/, "Every character must retain its approved home position");
assert.match(npc, /const x = Math\.cos\(angle\) \* 10/, "Approved crowd x positions must remain unchanged");
assert.match(npc, /const z = -55 - Math\.sin\(angle\) \* 8/, "Approved crowd z positions must remain unchanged");
assert.match(npc, /showWelcome\(\)/, "HERO's deferred welcome progression hook must remain available");
assert.match(npc, /setPerformanceMode\(active\)/, "HERO performance control must remain available");

assert.match(characters, /character\.mesh\.userData\.lamboCityCharacter/, "Character identity must be attached to each existing scene character");
assert.match(characters, /getCharacters\(\)/, "Character system must expose identity data for future world systems");
assert.match(characters, /profile\.role === "phone"/, "Only phone-recording personas should display phone props");
assert.match(characters, /musicPlaying = !!context\?\.systems\?\.stageMusic\?\.isPlaying\?\.\(\)/, "Crowd energy must follow the existing stage music playback state");
assert.match(characters, /mesh\.position\.y = 1\.3/, "Movement must use bounded vertical animation rather than accumulating drift");
assert.match(characters, /chooseWanderTarget/, "Personality profiles must drive local walking destinations");
assert.match(characters, /mesh\.position\.x = nextX/, "Characters must actually move through the world, not only animate in place");
assert.match(characters, /leftLeg\.rotation\.x = stride/, "Walking must animate articulated legs");
assert.match(characters, /isWalkBlocked\(nextX, nextZ, context\)/, "Every walking step must respect existing world collision");
assert.match(characters, /sideOfBarrier === "audience"/, "Wander areas must remain on the character's original side of the audience barrier");
assert.match(characters, /neighbors = characters\.filter/, "Characters must have nearby-person awareness for natural social glances");
assert.doesNotMatch(characters, /new THREE\.PointLight|setInterval\(|setTimeout\(/, "Character behavior must not add lights or timer-driven background work");

assert.match(main, /import CharacterSystem from "\.\/characterSystem\.js"/, "Main must import the modular character system");
assert.match(main, /characterSystem: CharacterSystem/, "Main must register the modular character system");
assert.ok(engine.indexOf("this.systems.npc?.init") < engine.indexOf("this.systems.characterSystem?.init"),
  "Character system must initialize after the NPC rigs it controls");
assert.match(engine, /characterSystem\?\.init\?\.\(this\.scene, this\.context\)/, "Engine must pass initialized systems context to the character system");

console.log("LAMBO CITY Character System checks passed: 16 stable personas, four behavior styles, preserved crowd positions, bounded animation, and ordered integration.");
