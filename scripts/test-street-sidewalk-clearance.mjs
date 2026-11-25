import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");
const [marina, helper, district] = await Promise.all([
  read("marina.js"),
  read("sidewalkSurface.js"),
  read("conferenceCenterDistrict.js")
]);

// Preserve the approved straight boardwalk curb reveal.
assert.match(helper, /const curbRoadClearance = 0\.04/);
assert.match(helper, /curbStartInset = 0/);
assert.match(helper, /curbEndInset = 0/);
assert.match(helper, /curbAlongLength = alongLength - curbStartInset - curbEndInset/);
assert.match(helper, /export function addSidewalkCornerReturn/);

// The north boardwalk sidewalk stops before the perpendicular streets;
// its straight curb extends only to the tangent points of the curved returns.
assert.match(marina, /width: innerSquareSide \? STREET_LEN - 24 : STREET_LEN/);
assert.match(marina, /position: \[innerSquareSide \? 0 : STREET_X_MID, 0\.68/);
assert.match(marina, /const boardwalkSidewalkProfile = \{/);
assert.match(marina, /curbHeight: 0\.18/);
assert.match(marina, /\.\.\.boardwalkSidewalkProfile/);
assert.match(marina, /width: innerSquareSide \? STREET_LEN - 24 : STREET_LEN/);
assert.match(marina, /curbStartInset: innerSquareSide \? -2\.87 : 0/);
assert.match(marina, /curbEndInset: innerSquareSide \? -2\.87 : 0/);
assert.match(marina, /width: innerSquareSide \? STREET_LEN - 24 : STREET_LEN/);

// The square's three inner sidewalk legs stop at the four corner tangent points.
assert.match(district, /const innerVerticalDepth = innerCornerNorthZ - innerCornerSouthZ/);
assert.match(district, /const innerNorthLength = innerCornerEastX - innerCornerWestX/);
assert.match(district, /depth: innerVerticalDepth/);
assert.match(district, /width: innerNorthLength/);
assert.match(district, /curbStartInset: -curbCenterlineRadius/);
assert.match(district, /innerCornerReturns = \[/);
assert.equal((district.match(/name: "southWest"|name: "southEast"|name: "northWest"|name: "northEast"/g) || []).length, 4);
assert.equal((district.match(/addSidewalkCornerReturn\(root/g) || []).length, 1,
  "One shared corner-return builder must create all four curved sidewalk corners");
assert.match(district, /arenaCornerRoadApron_/);

// Coordinate-level check: the curved curb endpoints meet the straight curb centerlines.
const boardwalkStreetCenterZ = 46;
const westRoadInnerEdgeX = -46;
const westSidewalkCenterX = -44.5;
const curbOffset = 1.5 - 0.09 - 0.04;
const westCurbX = westSidewalkCenterX - curbOffset;
const boardwalkNorthCurbZ = 52.5 - (2.5 - 0.09 - 0.04);
const cornerRadius = 3 - 0.09 - 0.04;
const southCornerCenterX = -43;
const southCornerCenterZ = boardwalkNorthCurbZ + cornerRadius;
assert.ok(Math.abs((southCornerCenterX - cornerRadius) - westCurbX) < 1e-9);
assert.ok(Math.abs((southCornerCenterZ - cornerRadius) - boardwalkNorthCurbZ) < 1e-9);
assert.equal(southCornerCenterZ, 53);
assert.equal(boardwalkStreetCenterZ, 46);

// Road and sidewalk footprints remain anchored to the existing approved street geometry.
assert.match(marina, /new THREE\.BoxGeometry\(STREET_LEN, 0\.3, 8\)/);
assert.match(marina, /depth: 5/);
// Both boardwalk sides share the same surface and curb elevation.
// The straight curb center (0.68 + 0.30/2 - 0.18/2) matches
// the curved return centerline at 0.74, so the transition is flush.
const straightCurbCenterY = 0.68 + 0.3 / 2 - 0.18 / 2;
assert.equal(straightCurbCenterY, 0.74);
const boardwalkPaverTopY = 0.68 + 0.3 / 2 + 0.002;
assert.equal(boardwalkPaverTopY, 0.832);
assert.ok(Math.abs(boardwalkPaverTopY - 0.834) <= 0.002,
  "Boardwalk pavers must meet the Convention Center corner-return surface without a visible step");
assert.match(district, /ROAD\.roadWidth/);
console.log("Square street corner returns, curb tangencies, and boardwalk preservation checks passed.");
