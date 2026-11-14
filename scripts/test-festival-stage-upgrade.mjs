import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(new URL("../" + path, import.meta.url), "utf8");
const world = read("world.js");
const collision = read("collision.js");
const stage = read("festivalStageUpgrade.js");
const performance = read("heroPerformance.js");
const postPerformance = read("heroPostPerformance.js");
const npc = read("npc.js");
const music = read("stageMusic.js");
const main = read("main.js");
const engine = read("engine.js");

assert.match(world, /BoxGeometry\(44,\s*1\.4,\s*18\)/, "Main stage deck must be widened to 44 units");
assert.match(world, /BoxGeometry\(44,\s*22,\s*1\.2\)/, "Main stage back wall must match the wider stage");
assert.match(collision, /"stagePlatform"[\s\S]*width:\s*44/, "Stage collision footprint must match visual deck");
assert.match(stage, /addStaircase\(root, "left"\)/, "Left staircase geometry must be created");
assert.match(stage, /addStaircase\(root, "right"\)/, "Right staircase geometry must be created");
assert.match(stage, /PRESENTING PARTNER/, "Sponsor-ready front banners must be present");
assert.match(stage, /setSponsorBranding/, "Sponsor artwork must be replaceable without rebuilding geometry");
assert.match(stage, /festivalSideScreen_/, "Festival side LED screens must be created");
assert.match(stage, /festivalMainTruss/, "Main overhead production truss must be created");
assert.match(performance, /StageMusic\.hasEnded\(\)/, "HERO exit must follow the actual song-ended event");
assert.match(performance, /STAIR_BOTTOM_X/, "HERO exit must route down the right staircase");
assert.match(performance, /STAIR_TOP_Y = 1\.68/, "HERO exit must begin at the top stair elevation");
assert.match(performance, /STAIR_BOTTOM_Y = 0\.67/, "HERO exit must reach the stair landing elevation");
assert.match(performance, /hero\.position\.y = THREE\.MathUtils\.lerp\(STAIR_TOP_Y, STAIR_BOTTOM_Y, eased\)/, "HERO must descend vertically with the staircase");
assert.match(postPerformance, /walkStartY = hero\.position\.y/, "Post-performance walk must preserve the actual stair-landing height");
assert.match(postPerformance, /GROUND_TRANSITION_DURATION/, "HERO must transition smoothly from the stair landing to the boardwalk");
assert.doesNotMatch(npc, /setTimeout\(\(\) => showHeroDialogue\(\),\s*1500\)/, "HERO welcome must not interrupt the opening experience");
assert.match(npc, /showWelcome\(\)/, "HERO welcome must remain available to later progression");
assert.match(music, /hasEnded\(\)/, "StageMusic must expose its real ended state");
assert.match(main, /FestivalStageUpgrade/, "Main must register the festival stage module");
assert.match(engine, /festivalStageUpgrade\?\.init/, "Engine must initialize the stage module");

console.log("Festival stage geometry, sponsor slots, registration, and HERO exit-route checks passed.");
