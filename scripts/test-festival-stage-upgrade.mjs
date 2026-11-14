import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(new URL("../" + path, import.meta.url), "utf8");
const world = read("world.js");
const collision = read("collision.js");
const stage = read("festivalStageUpgrade.js");
const performance = read("heroPerformance.js");
const music = read("stageMusic.js");
const main = read("main.js");
const engine = read("engine.js");

assert.match(world, /BoxGeometry\(44,\s*1\.4,\s*18\)/, "Main stage deck must be widened to 44 units");
assert.match(world, /BoxGeometry\(44,\s*22,\s*1\.2\)/, "Main stage back wall must match the wider stage");
assert.match(collision, /"stagePlatform"[\s\S]*width:\s*44/, "Stage collision footprint must match visual deck");
assert.match(stage, /festivalStairTread_left_/, "Left staircase geometry must be created");
assert.match(stage, /festivalStairTread_right_/, "Right staircase geometry must be created");
assert.match(stage, /PRESENTING PARTNER/, "Sponsor-ready front banners must be present");
assert.match(stage, /setSponsorBranding/, "Sponsor artwork must be replaceable without rebuilding geometry");
assert.match(stage, /festivalSideScreen_/, "Festival side LED screens must be created");
assert.match(stage, /festivalMainTruss/, "Main overhead production truss must be created");
assert.match(performance, /StageMusic\.hasEnded\(\)/, "HERO exit must follow the actual song-ended event");
assert.match(performance, /STAIR_BOTTOM_X/, "HERO exit must route down the right staircase");
assert.match(music, /hasEnded\(\)/, "StageMusic must expose its real ended state");
assert.match(main, /FestivalStageUpgrade/, "Main must register the festival stage module");
assert.match(engine, /festivalStageUpgrade\?\.init/, "Engine must initialize the stage module");

console.log("Festival stage geometry, sponsor slots, registration, and HERO exit-route checks passed.");
