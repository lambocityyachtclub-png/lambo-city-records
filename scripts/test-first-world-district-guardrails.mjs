import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import CITY_MAP from "../cityMap.js";

const apartmentArchitecture = await readFile(
  new URL("../APARTMENT_SYSTEM_ARCHITECTURE.md", import.meta.url),
  "utf8"
);
for (const requirement of [
  "at least 300",
  "atomic server-side transaction",
  "idempotent",
  "verified server session",
  "cannot read, or overwrite Account B",
  "optimistic concurrency",
  "load only the assigned unit",
  "300 simulated account claims produce 300 unique assignments",
  "Leaving and re-entering an apartment restores the saved design"
]) {
  assert.ok(
    apartmentArchitecture.includes(requirement),
    "The apartment architecture contract is missing: " + requirement
  );
}

const blueprint = await readFile(
  new URL("../LAMBO_CITY_MASTER_BLUEPRINT.md", import.meta.url),
  "utf8"
);

const arena = CITY_MAP.districts.arenaDistrict;
const route = CITY_MAP.districts.arenaDistrict.routeIntent;
assert.equal(
  route.status,
  "directional-intent-confirmed-exact-junction-coordinates-unassigned",
  "The route direction must be recorded without implying that coordinates are certified"
);
assert.match(route.approach, /westbound/);
assert.match(route.firstTurn, /left.*\+Z/);
assert.match(route.secondTurn, /left.*\+X/);
assert.match(route.return, /HQ-side return connection/);

assert.equal(
  arena.status,
  "historical-provisional-coordinates-superseded-not-for-construction",
  "Historical arena dimensions must never be mistaken for approved construction coordinates"
);
assert.ok(
  arena.constraints.some(item => item.includes("not approved for construction")),
  "The legacy coordinate block must carry an explicit no-construction warning"
);
assert.equal(
  CITY_MAP.districts.conferenceCenter.status,
  "interim-existing-structure",
  "The existing Conference Center implementation must remain clearly identified as interim"
);

const requiredBlueprintStatements = [
  "one continuous square loop",
  "front / boardwalk-facing portion",
  "farther back",
  "outside the outer sidewalks",
  "at least 300 separately assignable private apartments",
  "opposite / Jumbotron-facing side",
  "Exact first-left and second-left junction nodes",
  "No new world coordinates are approved by this audit"
];

for (const statement of requiredBlueprintStatements) {
  assert.ok(
    blueprint.includes(statement),
    "The controlling first-world blueprint is missing: " + statement
  );
}

assert.ok(
  blueprint.includes("**Design brief: complete and owner-approved.**"),
  "The blueprint must distinguish approved design scope from unfinished construction coordinates"
);
assert.ok(
  blueprint.includes("**Construction coordinate plan: not yet certified.**"),
  "The blueprint must not claim construction coordinates are complete"
);

console.log(
  "First-world guardrails passed: approved layout and 300-home requirements are documented; legacy provisional coordinates remain blocked from construction."
);
