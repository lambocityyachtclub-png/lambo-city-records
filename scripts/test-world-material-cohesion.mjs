import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");
const [palette, dock, pier, dockPath, estates, sidewalks, marina, district, stage, architecture] = await Promise.all([
  read("dockMaterialPalette.js"),
  read("dock.js"),
  read("grandStagePier.js"),
  read("dockPath.js"),
  read("dockLuxuryOverhaul.js"),
  read("sidewalkSurface.js"),
  read("marina.js"),
  read("conferenceCenterDistrict.js"),
  read("festivalStageUpgrade.js"),
  read("festivalStageArchitecture.js")
]);

assert.match(palette, /color: 0x8b5e3c/, "Structural timber tone must be centralized");
assert.match(palette, /color: 0x6d4327/, "Walking-surface plank tone must be centralized");
for (const [name, source] of [["dock", dock], ["roundabout", pier], ["HQ dock path", dockPath], ["private estate entries", estates]]) {
  assert.match(source, /dockMaterialPalette\.js/, name + " must use the shared dock material palette");
}
assert.match(dock, /DOCK_MATERIALS\.plankWood/);
assert.match(pier, /DOCK_MATERIALS\.plankWood/, "Roundabout walking surface must match the main dock");
assert.doesNotMatch(pier, /0xa0693a/, "The previous lighter roundabout plank material must not return");
assert.match(dockPath, /DOCK_MATERIALS\.plankWood/, "HQ dock spur must share the walking-surface material");
assert.match(estates, /premiumWood: DOCK_MATERIALS\.plankWood/, "Private estate/cabin entrances must share the same plank material");

assert.match(sidewalks, /InstancedMesh/, "Sidewalk pavers must be instanced for performance");
assert.match(sidewalks, /_foundation/, "Sidewalk must retain a continuous foundation");
assert.match(sidewalks, /_paverPanels/, "Sidewalk must have individually jointed paver panels");
assert.match(sidewalks, /_roadsideCurb/, "Road-facing sidewalk edges must receive curb detail");
assert.doesNotMatch(sidewalks, /new THREE\.PointLight/, "Sidewalk details must not add dynamic lights");
assert.match(marina, /width: STREET_LEN,[\s\S]*depth: 5,[\s\S]*position: \[STREET_X_MID, 0\.55, STREET_Z \+ side \* 6\.5\]/,
  "Boardwalk sidewalk footprint and centerline must remain unchanged");
assert.match(district, /width: ROAD\.sidewalkWidth,[\s\S]*depth: verticalLength,[\s\S]*position: \[originX - innerSidewalkOffsetX, 0\.76, originZ\]/,
  "Convention Center inner sidewalk footprint and centerline must remain unchanged");
assert.match(district, /position: \[originX, 0\.74, originZ \+ halfRoadZ \+ 1\.5\]/,
  "Convention Center outer sidewalk location must remain unchanged");
assert.match(district, /arenaDistrictBoardwalkPromenade", \[42, 0\.14, 15\]/,
  "The Convention Center pedestrian approach must stay narrow and must not cover the boardwalk street");
assert.match(district, /arenaSideLawnWest[\s\S]*arenaSideLawnEast[\s\S]*arenaRearLawn/,
  "The arena must have landscaped side and rear lawns while keeping its entrance paved");
assert.doesNotMatch(district, /arenaBoulevardCornerCurb_/,
  "Decorative corner blocks must not protrude into the boulevard lanes");
assert.match(district, /outerWidth: 110|ROAD\.outerWidth/, "The square boulevard geometry must remain driven by the approved map");

assert.match(stage, /color: 0x3a3f46/, "Speaker cabinets must have a visible graphite finish");
assert.match(stage, /color: 0x1b1e23/, "Speaker grilles must retain dark contrast");
assert.match(architecture, /color: 0x15181d/, "Speaker drivers must remain charcoal");
assert.match(architecture, /color: 0x858b94/, "Speaker surrounds must have visible steel contrast");

console.log("LAMBO CITY visual cohesion checks passed: shared dock timber, segmented sidewalks, and two-tone stage speakers.");
