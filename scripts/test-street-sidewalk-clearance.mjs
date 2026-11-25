import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");
const [marina, helper, district] = await Promise.all([
  read("marina.js"),
  read("sidewalkSurface.js"),
  read("conferenceCenterDistrict.js")
]);

assert.match(helper, /const curbRoadClearance = 0\.04/,
  "Road-facing curbs must be inset fully onto the sidewalk");
assert.match(helper, /crossLength \/ 2 - curbWidth \/ 2 - curbRoadClearance/,
  "Curb placement must account for its complete width plus road clearance");

const roadCenter = 46;
const roadDepth = 8;
const sidewalkDepth = 5;
const sidewalkOffset = 6.5;
const curbWidth = 0.18;
const inset = 0.04;
const roadMin = roadCenter - roadDepth / 2;
const roadMax = roadCenter + roadDepth / 2;
const southMin = roadCenter - sidewalkOffset - sidewalkDepth / 2;
const southMax = roadCenter - sidewalkOffset + sidewalkDepth / 2;
const northMin = roadCenter + sidewalkOffset - sidewalkDepth / 2;
const northMax = roadCenter + sidewalkOffset + sidewalkDepth / 2;
const curbReach = sidewalkDepth / 2 - curbWidth / 2 - inset;
const southCurbCenter = roadCenter - sidewalkOffset + curbReach;
const northCurbCenter = roadCenter + sidewalkOffset - curbReach;

assert.equal(southMax, roadMin, "South sidewalk must meet, not overlap, the road edge");
assert.equal(northMin, roadMax, "North sidewalk must meet, not overlap, the road edge");
assert.ok(southCurbCenter + curbWidth / 2 < roadMin,
  "South curb's full width must remain outside the roadway");
assert.ok(northCurbCenter - curbWidth / 2 > roadMax,
  "North curb's full width must remain outside the roadway");
assert.match(marina, /depth: 8/);
assert.match(marina, /depth: 5/);
assert.match(district, /addSegmentedSidewalk/,
  "Convention Center sidewalks must use the same roadway clearance helper");
console.log("Both-side street sidewalk clearance checks passed.");
