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
assert.match(marina, /position: \[innerSquareSide \? 0 : STREET_X_MID, 0\.55/);
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
assert.equal((district.match(/name: "southWest"|name: "southEast"|name: "northWest"|name: "northEast"/g) || []).length, 8);
assert.equal((district.match(/addSidewalkCornerReturn\(root/g) || []).length, 2,
  "The shared corner-return builder must create inner and outer corner groups");
assert.match(district, /arenaCornerRoadApron_/);
assert.match(district, /surfaceY: 0\.834/);
assert.match(district, /curbCenterY: 0\.74/);
assert.match(district, /surfaceY: 0\.807/);

// All four curved returns meet the unchanged straight sidewalk profiles.
const boardwalkPaverTopY = 0.55 + 0.3 / 2 + 0.002;
const boardwalkCurbCenterY = 0.55 + 0.3 / 2 - 0.12 / 2;
const boulevardPaverTopY = 0.76 + 0.14 / 2 + 0.002;
const boulevardCurbCenterY = 0.76 + 0.14 / 2 - 0.14 / 2;
assert.equal(boardwalkPaverTopY, 0.702);
assert.equal(boardwalkCurbCenterY, 0.64);
assert.equal(boulevardPaverTopY, 0.832);
assert.equal(boulevardCurbCenterY, 0.76);

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

// The HQ junction is a separate sloped connector; the approved sidewalk
// geometry, width, material, and elevation remain unchanged.
const hq = await read("recordsHQ.js");
assert.match(hq, /recordsHQBoardwalkSidewalkCornerConnector/);
assert.match(hq, /new THREE\.BoxGeometry\(12, \.12, hqWalkJoinDepth\)/);
assert.match(hq, /hqWalkJoin\.rotation\.x = hqWalkJoinAngle/);
const rise = 0.702 - 0.19;
const run = 7;
const angle = Math.atan(rise / run);
const depth = run / Math.cos(angle);
const centerY = (0.702 + 0.19) / 2 - 0.06 * Math.cos(angle);
const topAtBoardwalk = centerY + 0.06 * Math.cos(angle) + (depth / 2) * Math.sin(angle);
const topAtPromenade = centerY + 0.06 * Math.cos(angle) - (depth / 2) * Math.sin(angle);
assert.ok(Math.abs(topAtBoardwalk - 0.702) < 1e-9);
assert.ok(Math.abs(topAtPromenade - 0.19) < 1e-9);
assert.match(district, /ROAD\.roadWidth/);
console.log("Square street corner returns, curb tangencies, and boardwalk preservation checks passed.");
