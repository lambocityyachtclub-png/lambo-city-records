import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");
const [marina, helper, district] = await Promise.all([
  read("marina.js"),
  read("sidewalkSurface.js"),
  read("conferenceCenterDistrict.js")
]);

assert.match(helper, /const edgeOffset = crossLength \/ 2 - curbWidth \/ 2/,
  "Road-facing curb outer face must align exactly with the sidewalk boundary");
assert.doesNotMatch(helper, /curbRoadClearance/,
  "No inset gap should separate the curb from the roadway edge");

const roadCenter = 46;
const roadDepth = 8;
const sidewalkDepth = 5;
const sidewalkOffset = 6.5;
const curbWidth = 0.18;
const roadMin = roadCenter - roadDepth / 2;
const roadMax = roadCenter + roadDepth / 2;
const southMin = roadCenter - sidewalkOffset - sidewalkDepth / 2;
const southMax = roadCenter - sidewalkOffset + sidewalkDepth / 2;
const northMin = roadCenter + sidewalkOffset - sidewalkDepth / 2;
const northMax = roadCenter + sidewalkOffset + sidewalkDepth / 2;
const curbReach = sidewalkDepth / 2 - curbWidth / 2;
const southCurbCenter = roadCenter - sidewalkOffset + curbReach;
const northCurbCenter = roadCenter + sidewalkOffset - curbReach;
const southCurbRoadFace = southCurbCenter + curbWidth / 2;
const northCurbRoadFace = northCurbCenter - curbWidth / 2;

assert.equal(southMax, roadMin, "South sidewalk must meet the south road edge");
assert.equal(northMin, roadMax, "North sidewalk must meet the north road edge");
assert.equal(southCurbRoadFace, roadMin,
  "South curb must meet the road edge without extending into traffic");
assert.equal(northCurbRoadFace, roadMax,
  "North curb must meet the road edge without extending into traffic");
assert.ok(southCurbCenter - curbWidth / 2 >= southMin,
  "South curb must remain within the sidewalk footprint");
assert.ok(northCurbCenter + curbWidth / 2 <= northMax,
  "North curb must remain within the sidewalk footprint");

assert.match(marina, /new THREE\.BoxGeometry\(STREET_LEN, 0\.3, 8\)/);
assert.match(marina, /depth: 5/);
assert.match(marina, /curbSide: side < 0 \? "positive-z" : "negative-z"/,
  "Both sides must orient their curb toward the road");
assert.match(district, /addSegmentedSidewalk/,
  "Convention Center sidewalks must use the same continuous curb alignment helper");
console.log("Both-side sidewalk and flush curb alignment checks passed.");
