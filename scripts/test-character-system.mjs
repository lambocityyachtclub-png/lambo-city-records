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
for (const role of ["dancer", "phone", "cheerer", "spectator"]) {
  assert.equal(roles.filter(value => value === role).length, 4, "Expected four " + role + " personas");
}

assert.match(npc, /getCrowdCharacters\(\)/, "NPC module must expose existing crowd rigs to the reusable character system");
assert.match(npc, /createCrowdArm\(-0\.52, 2\.02/, "Crowd characters must have a left gesture pivot");
assert.match(npc, /createCrowdArm\(0\.52, 2\.02/, "Crowd characters must have a right gesture pivot");
assert.match(npc, /const x = Math\.cos\(angle\) \* 10/, "Approved crowd x positions must remain unchanged");
assert.match(npc, /const z = -55 - Math\.sin\(angle\) \* 8/, "Approved crowd z positions must remain unchanged");
assert.match(npc, /showWelcome\(\)/, "HERO's deferred welcome progression hook must remain available");
assert.match(npc, /setPerformanceMode\(active\)/, "HERO performance control must remain available");

assert.match(characters, /character\.mesh\.userData\.lamboCityCharacter/, "Character identity must be attached to each existing scene character");
assert.match(characters, /getCharacters\(\)/, "Character system must expose identity data for future world systems");
assert.match(characters, /profile\.role === "phone"/, "Only phone-recording personas should display phone props");
assert.match(characters, /musicPlaying = !!context\?\.systems\?\.stageMusic\?\.isPlaying\?\.\(\)/, "Crowd energy must follow the existing stage music playback state");
assert.match(characters, /mesh\.position\.y = 1\.3/, "Music response must use bounded animation rather than accumulating position drift");
assert.doesNotMatch(characters, /new THREE\.PointLight|setInterval\(|setTimeout\(/, "Character behavior must not add lights or timer-driven background work");

assert.match(main, /import CharacterSystem from "\.\/characterSystem\.js"/, "Main must import the modular character system");
assert.match(main, /characterSystem: CharacterSystem/, "Main must register the modular character system");
assert.ok(engine.indexOf("this.systems.npc?.init") < engine.indexOf("this.systems.characterSystem?.init"),
  "Character system must initialize after the NPC rigs it controls");
assert.match(engine, /characterSystem\?\.init\?\.\(this\.scene, this\.context\)/, "Engine must pass initialized systems context to the character system");

console.log("LAMBO CITY Character System checks passed: 16 stable personas, four behavior styles, preserved crowd positions, bounded animation, and ordered integration.");
